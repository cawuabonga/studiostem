/*
 * STEM V2 - Control de Acceso con Validación en el Borde (Edge Validation)
 * Hardware: ESP32 + RC522 RFID + Relé
 * 
 * Este código descarga la lista de usuarios autorizados periódicamente
 * para permitir el acceso instantáneo sin depender de la latencia del servidor.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// --- CONFIGURACIÓN DE RED ---
const char* ssid = "TU_SSID_WIFI";
const char* password = "TU_PASSWORD_WIFI";

// --- CONFIGURACIÓN DEL SERVIDOR ---
// Reemplaza con tu URL de despliegue (ej: https://tu-app.vercel.app)
const char* serverUrl = "https://tu-plataforma-stem.com";
const char* accessPointId = "PUERTA_01"; // El ID registrado en el dashboard

// --- CONFIGURACIÓN DE PINES (Ver docs/GUIA_CONEXIONES_ELECTRONICA.md) ---
#define SS_PIN 5
#define RST_PIN 22
#define RELAY_PIN 2
#define LED_GREEN 12
#define LED_RED 13
#define BUZZER_PIN 14

MFRC522 rfid(SS_PIN, RST_PIN);

// --- MEMORIA LOCAL DE ACCESO ---
const int MAX_CARDS = 250; // Capacidad para 250 tarjetas en RAM
String authorizedCards[MAX_CARDS];
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
  // 1. Sincronización periódica automática
  if (millis() - lastSyncTime > syncInterval) {
    syncAuthorizedCards();
  }

  // 2. Detección de tarjeta física
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String cardId = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    cardId += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    cardId += String(rfid.uid.uidByte[i], HEX);
  }
  cardId.toUpperCase();
  
  Serial.print("Tarjeta detectada: ");
  Serial.println(cardId);

  // 3. VALIDACIÓN INSTANTÁNEA (Edge Validation)
  // Buscamos en la lista descargada previamente
  bool isAuthorized = false;
  for (int i = 0; i < cardsCount; i++) {
    if (authorizedCards[i] == cardId) {
      isAuthorized = true;
      break;
    }
  }

  // 4. Ejecutar acción de hardware
  if (isAuthorized) {
    grantAccess(cardId);
  } else {
    denyAccess(cardId);
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// --- FUNCIONES DE HARDWARE ---

void grantAccess(String cardId) {
  Serial.println("ACCESO CONCEDIDO (Local)");
  digitalWrite(RELAY_PIN, HIGH);
  digitalWrite(LED_GREEN, HIGH);
  tone(BUZZER_PIN, 2000, 200);
  delay(1500); // Puerta abierta 1.5 segundos
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);

  // Reportar el log al servidor en segundo plano (no bloquea al usuario)
  reportAccess(cardId);
}

void denyAccess(String cardId) {
  Serial.println("ACCESO DENEGADO (Local)");
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER_PIN, 500, 500);
  delay(1000);
  digitalWrite(LED_RED, LOW);
  
  // Reportar intento fallido para auditoría
  reportAccess(cardId);
}

// --- COMUNICACIÓN CON LA NUBE ---

void syncAuthorizedCards() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  // Llamamos al nuevo endpoint de sincronización
  String url = String(serverUrl) + "/api/access-point/sync?accessPointId=" + accessPointId;
  
  Serial.println("Sincronizando lista de acceso...");
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    
    // Reservamos memoria para el JSON (AJUSTAR SEGÚN CANTIDAD DE ALUMNOS)
    DynamicJsonDocument doc(16384); 
    deserializeJson(doc, payload);

    JsonArray cards = doc["authorizedCards"];
    cardsCount = 0;
    
    for (String card : cards) {
      if (cardsCount < MAX_CARDS) {
        authorizedCards[cardsCount++] = card;
      }
    }
    
    lastSyncTime = millis();
    Serial.print("Sincronización OK. Usuarios cargados: ");
    Serial.println(cardsCount);
  } else {
    Serial.print("Fallo de sincronización. HTTP: ");
    Serial.println(httpCode);
  }
  http.end();
}

void reportAccess(String cardId) {
  if (WiFi.status() != WL_CONNECTED) return;

  // Usamos el flujo de procesamiento para registrar el log y cambiar estado E/S
  HTTPClient http;
  String url = String(serverUrl) + "/api/flow/processAccessAttemptFlow";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["accessPointId"] = accessPointId;
  doc["rfidCardId"] = cardId;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpCode = http.POST(requestBody);
  http.end();
}

void connectToWiFi() {
  Serial.print("Conectando WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConexión Establecida.");
}
