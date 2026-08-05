
# Guía de Programación ESP32 para Point Print (EDA)

Este documento contiene el código optimizado para el hardware que gestiona la identificación de alumnos en los terminales de impresión automática, respetando el esquema de conexiones estándar de la plataforma STEM.

## 1. Funcionamiento
El dispositivo lee el carnet RFID y notifica a la nube. El Kiosko (Tablet/PC) reacciona instantáneamente cargando el perfil del alumno. El hardware proporciona feedback visual y sonoro según el éxito de la identificación.

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

// Endpoint oficial para el Sistema EDA
const char* serverUrl = "https://studiostem--stem-v2-4y6a0.us-east4.hosted.app/api/eda/scan";

// El ID único de este punto de impresión (Configurado en el panel administrativo)
const char* POINT_ID = "EDA-001"; 

// ============================================================
// DEFINICIÓN DE PINES (Respetando esquema de Control de Acceso)
// ============================================================
#define RST_PIN   22  // Reset para MFRC522
#define SS_PIN    21  // SDA (Slave Select) para MFRC522

#define GREEN_LED_PIN 2   // LED Verde: Login Correcto
#define RED_LED_PIN   4   // LED Rojo: Error / No Vinculada
#define BUZZER_PIN    15  // Feedback Sonoro

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Iniciar apagados
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nSTEM Point Print Conectado");
}

// Feedback de Identificación Exitosa
void signalSuccess() {
  Serial.println("Login exitoso en Kiosko");
  digitalWrite(GREEN_LED_PIN, HIGH);
  tone(BUZZER_PIN, 2000, 100);
  delay(150);
  tone(BUZZER_PIN, 2000, 100);
  delay(500);
  digitalWrite(GREEN_LED_PIN, LOW);
}

// Feedback de Error (Tarjeta no válida o error de red)
void signalError() {
  Serial.println("Error en identificación");
  digitalWrite(RED_LED_PIN, HIGH);
  tone(BUZZER_PIN, 300, 1000); // Tono grave y largo
  delay(1000);
  digitalWrite(RED_LED_PIN, LOW);
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

    Serial.println("Enviando UID al servidor...");
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode == 200) {
      signalSuccess();
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);
      signalError();
    }
    http.end();
  } else {
    Serial.println("WiFi Perdido");
    signalError();
  }
}

void loop() {
  // Verificación de tarjeta
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
  
  // Limpiar para siguiente lectura
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
```

## 3. Verificación
1. Abre la pantalla del Kiosko en tu tablet: `/kiosk/EDA-001`.
2. Pasa una tarjeta vinculada a un alumno por el lector físico.
3. El ESP32 pitará dos veces y el LED verde encenderá.
4. La pantalla de la tablet debe cambiar automáticamente al menú de documentos en menos de 1 segundo.
