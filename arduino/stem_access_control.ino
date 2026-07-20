/**
 * @fileOverview Firmware para Control de Acceso STEM V2 (ESP32 + RFID)
 * Implementa la lógica de "Edge Validation" para acceso instantáneo.
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN DE RED ---
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";
const char* serverUrl = "https://tu-dominio-nextjs.vercel.app"; // URL de tu servidor Next.js
const char* accessPointId = "PUERTA_PRINCIPAL"; // Debe coincidir con el ID en la plataforma

// --- PINES DE HARDWARE (ESP32) ---
#define SS_PIN 5
#define RST_PIN 22
#define RELAY_PIN 2
#define LED_GREEN 12
#define LED_RED 13
#define BUZZER_PIN 14

MFRC522 rfid(SS_PIN, RST_PIN);

// --- MEMORIA LOCAL (EDGE VALIDATION) ---
String authorizedCards[250]; // Espacio para 250 usuarios autorizados
int cardsCount = 0;
unsigned long lastSyncTime = 0;
const unsigned long syncInterval = 300000; // Sincronizar cada 5 minutos (300,000 ms)

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);

  connectToWiFi();
  syncAuthorizedCards();
}

void loop() {
  // Sincronización periódica en segundo plano
  if (millis() - lastSyncTime > syncInterval) {
    syncAuthorizedCards();
  }

  // Detectar nueva tarjeta
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // Obtener UID de la tarjeta
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.print("Tarjeta detectada: ");
  Serial.println(uid);

  // VALIDACIÓN INSTANTÁNEA (En Memoria Local)
  if (isAuthorizedLocal(uid)) {
    grantAccess(uid);
  } else {
    denyAccess(uid);
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// Verifica si el UID está en la caché local del ESP32
bool isAuthorizedLocal(String uid) {
  for (int i = 0; i < cardsCount; i++) {
    if (authorizedCards[i] == uid) return true;
  }
  return false;
}

// Acción de apertura inmediata
void grantAccess(String uid) {
  Serial.println("ACCESO CONCEDIDO (Local)");
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(RELAY_PIN, HIGH);
  tone(BUZZER_PIN, 2000, 100);
  delay(2000); // Mantener abierto 2 segundos
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);

  // Reportar log de forma asíncrona a la web
  sendLogToServer(uid, "success");
}

// Acción de rechazo inmediato
void denyAccess(String uid) {
  Serial.println("ACCESO DENEGADO (Local)");
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER_PIN, 500, 500);
  delay(1000);
  digitalWrite(LED_RED, LOW);

  // Reportar log de forma asíncrona a la web
  sendLogToServer(uid, "error");
}

// Descarga la lista de usuarios autorizados desde Next.js
void syncAuthorizedCards() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(serverUrl) + "/api/access-point/sync?accessPointId=" + accessPointId;
  
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    DynamicJsonDocument doc(8192); // Ajustar según cantidad de usuarios
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      JsonArray cards = doc["authorizedCards"];
      cardsCount = cards.size();
      for (int i = 0; i < cardsCount && i < 250; i++) {
        authorizedCards[i] = cards[i].as<String>();
      }
      lastSyncTime = millis();
      Serial.print("Sincronización exitosa. Usuarios: ");
      Serial.println(cardsCount);
    }
  }
  http.end();
}

// Registra el evento en la base de datos (después de abrir la puerta)
void sendLogToServer(String uid, String status) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(serverUrl) + "/api/flow/processAccessAttemptFlow";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["accessPointId"] = accessPointId;
  doc["rfidCardId"] = uid;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  http.end();
}

void connectToWiFi() {
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConexión Establecida.");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}
