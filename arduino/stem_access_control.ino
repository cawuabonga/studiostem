/**
 * STEM V2 - SISTEMA DE CONTROL DE ACCESO IOT
 * Hardware: ESP32 + MFRC522 + Relé + Buzzer + LEDs
 * 
 * Dependencias (Instalar desde el Gestor de Librerías):
 * - MFRC522 by GithubCommunity
 * - ArduinoJson by Benoit Blanchon
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN DE RED ---
const char* ssid = "NOMBRE_DE_TU_WIFI";
const char* password = "PASSWORD_DE_TU_WIFI";

// --- CONFIGURACIÓN DE API ---
// Reemplaza con la URL de tu servidor (ej. https://tu-app.web.app)
const char* serverUrl = "https://tu-app-url.com/api/flow/processAccessAttemptFlow";
const char* accessPointId = "PUERTA_PRINCIPAL";

// --- MAPEADO DE PINES (Coincide con la guía de conexiones) ---
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

  // Estado inicial (Todo apagado)
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(BUZZER, LOW);

  // Conexión Wi-Fi
  connectWiFi();
  
  Serial.println(">>> Sistema STEM Listo. Esperando tarjeta...");
}

void loop() {
  // Reconectar Wi-Fi si se pierde
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Buscar nuevas tarjetas
  if ( ! mfrc522.PICC_IsNewCardPresent()) return;
  if ( ! mfrc522.PICC_ReadCardSerial()) return;

  // Obtener el ID de la tarjeta como String
  String rfidId = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    rfidId += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    rfidId += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfidId.toUpperCase();
  
  Serial.print("ID detectado: ");
  Serial.println(rfidId);

  // Enviar a la plataforma STEM
  processAccess(rfidId);

  // Detener lectura
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

    // Construir JSON de petición
    StaticJsonDocument<200> doc;
    doc["rfidCardId"] = rfid;
    doc["accessPointId"] = accessPointId;
    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(response);

      // Parsear respuesta del servidor
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

// --- EFECTOS DE HARDWARE ---

void grantAccess() {
  Serial.println(">>> ACCESO PERMITIDO");
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(BUZZER, HIGH);
  digitalWrite(RELAY_PIN, HIGH); // Abre picaporte
  delay(200);
  digitalWrite(BUZZER, LOW);
  delay(3000); // Mantiene abierto por 3 segundos
  digitalWrite(RELAY_PIN, LOW); // Cierra picaporte
  digitalWrite(LED_GREEN, LOW);
}

void denyAccess() {
  Serial.println(">>> ACCESO DENEGADO");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(100);
    digitalWrite(LED_RED, LOW);
    digitalWrite(BUZZER, LOW);
    delay(100);
  }
}

void errorFeedback() {
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  digitalWrite(LED_RED, LOW);
}
