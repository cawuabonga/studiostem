
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Configuración de Hardware ---
#define SS_PIN    21  // SDA/SS en el lector RFID
#define RST_PIN   22  // RST en el lector RFID
#define LED_G     2   // LED Verde
#define LED_R     4   // LED Rojo
#define BUZZER    15  // Buzzer

MFRC522 rfid(SS_PIN, RST_PIN);

// --- Configuración de Red y API ---
// Reemplaza con tus credenciales de WiFi
const char* ssid = "TU_SSID_DE_WIFI";
const char* password = "TU_CONTRASENA_DE_WIFI";

// Reemplaza con la URL de tu backend y el ID de este dispositivo
const char* serverName = "https://stem-v2-4y6a0.web.app/api/flow/processAccessAttemptFlow";
const char* accessPointId = "PUERTA-01"; // ID único para este lector

// Reemplaza con tu clave de API secreta del archivo .env
const char* apiKey = "tu-super-secreto-api-key";


void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(LED_G, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  digitalWrite(LED_G, LOW);
  digitalWrite(LED_R, LOW);
  
  Serial.println("\nInicializando sistema de control de acceso...");

  // --- Conexión WiFi ---
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi..");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado.");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());

  Serial.println("\n-----------------------------------------");
  Serial.println(" Sistema listo y esperando tarjetas... ");
  Serial.println("-----------------------------------------");
}

void loop() {
  // Bucle principal: busca una nueva tarjeta
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    
    // Obtener el ID de la tarjeta
    String rfidCardId = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      rfidCardId += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      rfidCardId += String(rfid.uid.uidByte[i], HEX);
    }
    rfidCardId.toUpperCase();
    
    Serial.printf("\nTarjeta detectada con ID: %s\n", rfidCardId.c_str());

    // Enviar el ID de la tarjeta al backend
    sendAccessAttempt(rfidCardId);
    
    rfid.PICC_HaltA(); // Detener la lectura de esta tarjeta
    rfid.PCD_StopCrypto1(); // Detener la encriptación
  }

  // Imprime un punto cada 5 segundos como "señal de vida"
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 5000) {
      Serial.print(".");
      lastHeartbeat = millis();
  }
}

void sendAccessAttempt(String rfidCardId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + String(apiKey));

    // Crear el cuerpo del JSON
    JsonDocument doc;
    doc["accessPointId"] = accessPointId;
    doc["rfidCardId"] = rfidCardId;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("Enviando petición al servidor...");
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.printf("Respuesta del servidor (%d): %s\n", httpResponseCode, payload.c_str());
      
      // Parsear la respuesta
      JsonDocument responseDoc;
      deserializeJson(responseDoc, payload);
      const char* action = responseDoc["action"];

      if (strcmp(action, "open") == 0) {
        signalSuccess();
      } else {
        signalDenial();
      }
    } else {
      Serial.printf("Error en la petición HTTP: %d\n", httpResponseCode);
      signalError();
    }
    http.end();
  } else {
    Serial.println("Error: WiFi desconectado.");
    signalError();
  }
}

void signalSuccess() {
  Serial.println("Acción: ACCESO PERMITIDO");
  digitalWrite(LED_G, HIGH);
  tone(BUZZER, 1000, 150); // Tono agudo y corto
  delay(150);
  noTone(BUZZER);
  delay(2000);
  digitalWrite(LED_G, LOW);
}

void signalDenial() {
  Serial.println("Acción: ACCESO DENEGADO");
  digitalWrite(LED_R, HIGH);
  tone(BUZZER, 300, 500); // Tono grave y largo
  delay(500);
  noTone(BUZZER);
  delay(2000);
  digitalWrite(LED_R, LOW);
}

void signalError() {
  Serial.println("Acción: ERROR DE COMUNICACIÓN");
  digitalWrite(LED_R, HIGH);
  // Tres pitidos cortos para indicar error
  for (int i=0; i<3; i++) {
    tone(BUZZER, 200, 100);
    delay(150);
    noTone(BUZZER);
  }
  delay(2000);
  digitalWrite(LED_R, LOW);
}

