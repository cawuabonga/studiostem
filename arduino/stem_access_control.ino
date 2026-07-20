/**
 * STEM V2 - SISTEMA DE CONTROL DE ACCESO IOT (VERSIÓN ONLINE OPTIMIZADA)
 * Hardware: ESP32 + MFRC522 + Relé + Buzzer + LEDs
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN DE RED ---
const char* ssid = "GABRIEL";
const char* password = "GABRIEL01";

// --- CONFIGURACIÓN DE API ---
const char* serverUrl = "https://studio--stem-v2-4y6a0.us-central1.hosted.app/api/flow/processAccessAttemptFlow";
const char* accessPointId = "00003";

// --- MAPEADO DE PINES ---
#define RST_PIN         22    // RFID Reset
#define SS_PIN          5     // RFID SDA
#define RELAY_PIN       2     // Señal de apertura (Relé)
#define LED_GREEN       12    // LED Acceso Permitido
#define LED_RED         13    // LED Acceso Denegado
#define BUZZER          14    // Sonido

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();

  // Configuración de pines
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Estado inicial
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  noTone(BUZZER);

  // Conexión Wi-Fi
  connectWiFi();
  
  Serial.println(">>> Sistema STEM Online Listo. Esperando tarjeta...");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Buscar nuevas tarjetas
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  // Obtener el ID de la tarjeta
  String rfidId = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    rfidId += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    rfidId += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfidId.toUpperCase();
  
  Serial.print("ID detectado: ");
  Serial.println(rfidId);

  // Sonido corto de lectura (feedback inmediato)
  tone(BUZZER, 2000, 50);

  // Validar con el servidor
  processAccess(rfidId);

  mfrc522.PICC_HaltA();
}

void connectWiFi() {
  Serial.print("Conectando a ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Conectado");
}

void processAccess(String rfid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["rfidCardId"] = rfid;
    doc["accessPointId"] = accessPointId;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(response);

      StaticJsonDocument<200> resDoc;
      deserializeJson(resDoc, response);
      const char* action = resDoc["action"]; // "open" o "deny"

      if (String(action) == "open") {
        grantAccess();
      } else {
        denyAccess();
      }
    } else {
      Serial.print("Error en petición HTTP: ");
      Serial.println(httpResponseCode);
      errorFeedback();
    }
    http.end();
  }
}

// --- EFECTOS DE HARDWARE OPTIMIZADOS PARA VOLUMEN ---

void grantAccess() {
  Serial.println(">>> ACCESO PERMITIDO");
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(RELAY_PIN, HIGH); 
  
  // Tono de éxito: 2.5kHz es muy audible para estos buzzers
  tone(BUZZER, 2500); 
  delay(300);
  noTone(BUZZER);
  
  delay(2700); // Mantener 3 segundos el relé
  digitalWrite(RELAY_PIN, LOW); 
  digitalWrite(LED_GREEN, LOW);
}

void denyAccess() {
  Serial.println(">>> ACCESO DENEGADO");
  // Tono de error: Pulsos graves y fuertes
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, HIGH);
    tone(BUZZER, 800); // Tono más bajo para indicar error
    delay(150);
    digitalWrite(LED_RED, LOW);
    noTone(BUZZER);
    delay(100);
  }
}

void errorFeedback() {
  // Tono de sistema (Error de red)
  digitalWrite(LED_RED, HIGH);
  tone(BUZZER, 400, 1000); // Tono largo de advertencia
  delay(1000);
  digitalWrite(LED_RED, LOW);
}
