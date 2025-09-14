// Librerías necesarias para el lector RFID, WiFi y manejo de datos.
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN REQUERIDA ---
// Reemplaza con tus credenciales de WiFi.
const char* ssid = "TU_SSID_WIFI";
const char* password = "TU_CONTRASENA_WIFI";

// El ID único de este punto de acceso. Debe coincidir con uno registrado en el sistema.
const char* accessPointId = "PUERTA-01";

// La URL completa del servidor donde se aloja el flow de Genkit.
const char* serverName = "https://studio--stem-v2-4y6a0.us-central1.hosted.app/api/flow/processAccessAttemptFlow";

// Tu clave de API secreta. Debe ser la misma que está en el archivo .env del servidor.
const char* apiKey = "tu-super-secreto-api-key";
// ---------------------------------


// Definición de pines para el hardware.
#define RST_PIN   22  // Pin de Reset para el MFRC522
#define SS_PIN    21  // Pin SDA (Slave Select) para el MFRC522

#define GREEN_LED_PIN 2   // Pin para el LED verde (Acceso Permitido)
#define RED_LED_PIN   4   // Pin para el LED rojo (Acceso Denegado)
#define BUZZER_PIN    15  // Pin para el buzzer

// Creación de la instancia del lector RFID.
MFRC522 rfid(SS_PIN, RST_PIN);

// Función para inicializar y conectar el WiFi.
void setupWiFi() {
  Serial.print("Conectando a ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado.");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

// Función para manejar las señales visuales y sonoras.
void signalAccessGranted() {
  Serial.println("Acceso Permitido. Abriendo puerta...");
  digitalWrite(GREEN_LED_PIN, HIGH);
  tone(BUZZER_PIN, 1000, 200); // Tono agudo y corto
  delay(100);
  tone(BUZZER_PIN, 1000, 200);
  delay(3000);
  digitalWrite(GREEN_LED_PIN, LOW);
}

void signalAccessDenied() {
  Serial.println("Acceso Denegado.");
  digital_write_red_led(HIGH);
  tone(BUZZER_PIN, 300, 1000); // Tono grave y largo
  delay(3000);
  digital_write_red_led(LOW);
}

// Función para manejar el LED rojo (abstracción para posible parpadeo futuro).
void digital_write_red_led(int state) {
    digitalWrite(RED_LED_PIN, state);
}

// Configuración inicial del ESP32.
void setup() {
  Serial.begin(115200);
  SPI.begin();       // Inicia el bus SPI.
  rfid.PCD_Init();   // Inicia el lector MFRC522.
  
  // Configura los pines de los LEDs y el buzzer como salida.
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Asegurarse de que los LEDs estén apagados al inicio.
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  
  setupWiFi(); // Conecta a la red WiFi.
  
  Serial.println("\n[SISTEMA] Sistema listo y esperando tarjetas...");
}

// Bucle principal.
void loop() {
  // Bucle de "señal de vida"
  for (int i = 0; i < 50; ++i) {
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      processCard();
      return; // Salir para procesar la tarjeta y luego volver a entrar al bucle.
    }
    delay(100);
  }
  Serial.print("."); // Imprime un punto cada 5 segundos para indicar que está vivo.
}


// Procesa la tarjeta una vez detectada.
void processCard() {
    String cardId = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      cardId += (rfid.uid.uidByte[i] < 0x10 ? "0" : "") + String(rfid.uid.uidByte[i], HEX);
    }
    cardId.toUpperCase();
    Serial.println("\nTarjeta detectada. ID: " + cardId);

    // Detiene la lectura de la tarjeta para evitar lecturas múltiples.
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    // Llama a la función que contacta al servidor.
    sendAccessAttempt(cardId);
}

// Envía la solicitud HTTP al servidor.
void sendAccessAttempt(String cardId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + String(apiKey));

    // Crea el cuerpo del JSON para la solicitud.
    StaticJsonDocument<200> doc;
    JsonObject input = doc.createNestedObject("input");
    input["accessPointId"] = accessPointId;
    input["rfidCardId"] = cardId;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("Enviando solicitud al servidor...");
    Serial.println(requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.println("Código de respuesta: " + String(httpResponseCode));
      Serial.println("Respuesta: " + payload);

      // Parsea la respuesta JSON del servidor.
      StaticJsonDocument<200> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, payload);

      if (error) {
        Serial.print("Error al parsear JSON: ");
        Serial.println(error.c_str());
        signalAccessDenied(); // Asumir denegado si la respuesta es inválida.
      } else {
        const char* action = responseDoc["output"]["action"];
        if (strcmp(action, "open") == 0) {
          signalAccessGranted();
        } else {
          signalAccessDenied();
        }
      }
    } else {
      Serial.print("Error en la solicitud HTTP: ");
      Serial.println(httpResponseCode);
      signalAccessDenied(); // Asumir denegado si hay un error de comunicación.
    }

    http.end();
  } else {
    Serial.println("Error: WiFi no conectado.");
    signalAccessDenied(); // No hay conexión, se deniega el acceso.
  }
  
  Serial.println("\n[SISTEMA] Esperando siguiente tarjeta...");
}
