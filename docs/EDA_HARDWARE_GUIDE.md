
# Guía de Programación ESP32 para Point Print (EDA)

Este documento contiene el código base para el hardware que gestiona la identificación de alumnos en los terminales de impresión automática.

## 1. Funcionamiento
El dispositivo no controla relés de apertura. Su función es leer el carnet y notificar a la nube para que el Kiosko (Tablet/PC) reaccione instantáneamente cargando el perfil del alumno.

## 2. Código Arduino (Sketch)

```cpp
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================
// CONFIGURACIÓN DE RED Y SERVIDOR
// ============================================================
const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";

// IMPORTANTE: Usa tu dominio oficial de producción
const char* serverUrl = "https://studiostem--stem-v2-4y6a0.us-east4.hosted.app/api/eda/scan";
const char* POINT_ID = "EDA-001"; // El Hard-ID configurado en el panel administrativo

// Pines RFID (ESP32)
#define SS_PIN 5
#define RST_PIN 22
#define LED_VERDE 12
#define LED_ROJO 13
#define BUZZER 14

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nSTEM Point Print Conectado");
}

void notifyScan(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["rfidCardId"] = uid;
    doc["accessPointId"] = POINT_ID;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode == 200) {
      Serial.println("Acceso correcto en Kiosko");
      digitalWrite(LED_VERDE, HIGH);
      tone(BUZZER, 2000, 100);
      delay(500);
      digitalWrite(LED_VERDE, LOW);
    } else {
      Serial.print("Error: ");
      Serial.println(httpResponseCode);
      digitalWrite(LED_ROJO, HIGH);
      tone(BUZZER, 500, 500); // Tono de error
      delay(1000);
      digitalWrite(LED_ROJO, LOW);
    }
    http.end();
  }
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  
  Serial.print("Tarjeta detectada: ");
  Serial.println(uid);
  
  notifyScan(uid);
  
  mfrc522.PICC_HaltA();
}
```

## 3. Verificación
1. Abre la pantalla del Kiosko en una tablet: `/kiosk/EDA-001`.
2. Pasa una tarjeta vinculada a un alumno por el lector físico.
3. La pantalla de la tablet debe cambiar automáticamente al menú de documentos en menos de 1 segundo.
