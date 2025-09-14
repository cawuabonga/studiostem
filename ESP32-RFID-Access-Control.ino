
/**
 * @file ESP32-RFID-Access-Control.ino
 * @brief Firmware para un dispositivo de control de acceso RFID con ESP32.
 * 
 * Este código se conecta a una red WiFi, lee el UID de tarjetas RFID,
 * envía el UID a un servidor backend para validación y controla LEDs y un buzzer
 * para indicar si el acceso es permitido o denegado.
 * 
 * Dependencias de Librerías (Instalar desde el Gestor de Librerías del IDE de Arduino):
 * - "MFRC522" by Community (o by GithubCommunity)
 * - "ArduinoJson" by Benoit Blanchon
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN REQUERIDA ---
const char* ssid = "TU_SSID_DE_WIFI";                  // Reemplaza con el nombre de tu red WiFi
const char* password = "TU_CONTRASENA_DE_WIFI";     // Reemplaza con tu contraseña de WiFi

// URL del endpoint del flow en tu aplicación (ajústalo si es necesario)
// Si ejecutas localmente, puede ser una IP local. Si está desplegado, la URL de producción.
const char* serverName = "https://tu-app-en-firebase-app-hosting.web.app/api/flow/processAccessAttemptFlow";

// API Key para autenticar el dispositivo (debe coincidir con la del .env)
const char* apiKey = "TU_DEVICE_API_KEY";           // Reemplaza con la clave que pusiste en .env

// Identificador único para este dispositivo lector
const char* accessPointId = "PUERTA-01";            // Ej: PUERTA-01, LAB-COMP-02, etc.
// --- FIN DE LA CONFIGURACIÓN ---


// --- Definición de Pines (basado en el diagrama) ---
// Lector RFID MFRC522
#define RST_PIN   22  // Pin de Reset
#define SS_PIN    21  // Pin SDA (Slave Select)

// LEDs y Buzzer
#define GREEN_LED_PIN 2   // LED Verde para acceso permitido
#define RED_LED_PIN   4   // LED Rojo para acceso denegado
#define BUZZER_PIN    15  // Buzzer para feedback sonoro

// Instancias de objetos
MFRC522 mfrc522(SS_PIN, RST_PIN);
WiFiClient client;
HTTPClient http;

// --- Funciones de Feedback Visual y Sonoro ---

void signalSuccess() {
    Serial.println("Acceso Permitido.");
    digitalWrite(GREEN_LED_PIN, HIGH);
    tone(BUZZER_PIN, 1000, 200); // Tono agudo y corto
    delay(200);
    noTone(BUZZER_PIN);
    delay(2000); // Mantiene el LED verde encendido por 2 segundos
    digitalWrite(GREEN_LED_PIN, LOW);
}

void signalFailure() {
    Serial.println("Acceso Denegado.");
    digitalWrite(RED_LED_PIN, HIGH);
    tone(BUZZER_PIN, 250, 500); // Tono grave y largo
    delay(500);
    noTone(BUZZER_PIN);
    delay(1500); // Mantiene el LED rojo encendido por 2 segundos
    digitalWrite(RED_LED_PIN, LOW);
}

void signalError() {
    Serial.println("Error de comunicación o del sistema.");
    for (int i = 0; i < 3; i++) {
        digitalWrite(RED_LED_PIN, HIGH);
        tone(BUZZER_PIN, 100, 100);
        delay(100);
        digitalWrite(RED_LED_PIN, LOW);
        noTone(BUZZER_PIN);
        delay(100);
    }
}

// --- SETUP: Inicialización del dispositivo ---
void setup() {
    Serial.begin(115200);
    while (!Serial); // Espera a que el monitor serie esté listo

    // Inicializar pines de LEDs y Buzzer
    pinMode(GREEN_LED_PIN, OUTPUT);
    pinMode(RED_LED_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);

    // Apagar todos los indicadores al inicio
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(RED_LED_PIN, LOW);
    noTone(BUZZER_PIN);

    Serial.println("\n[SISTEMA] Iniciando...");

    // Conectar a WiFi
    Serial.print("[WIFI] Conectando a ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        attempts++;
        if (attempts > 20) {
            Serial.println("\n[WIFI] No se pudo conectar. Reiniciando en 5 segundos...");
            delay(5000);
            ESP.restart();
        }
    }
    Serial.println("\n[WIFI] Conectado!");
    Serial.print("[WIFI] Dirección IP: ");
    Serial.println(WiFi.localIP());

    // Inicializar el lector RFID
    SPI.begin();          // Inicia el bus SPI
    mfrc522.PCD_Init();   // Inicia el lector MFRC522
    mfrc522.PCD_DumpVersionToSerial(); // Muestra la versión del firmware del lector
    Serial.println("[RFID] Lector listo. Por favor, escanee una tarjeta.");
    signalSuccess(); // Señal de que todo está listo
}

// --- LOOP: Ciclo principal del programa ---
void loop() {
    // Buscar si hay una nueva tarjeta presente
    if ( ! mfrc522.PICC_IsNewCardPresent()) {
        delay(50);
        return;
    }

    // Seleccionar una de las tarjetas
    if ( ! mfrc522.PICC_ReadCardSerial()) {
        delay(50);
        return;
    }

    Serial.println("\n[RFID] Tarjeta detectada!");

    // Obtener el UID de la tarjeta
    String rfidUid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        rfidUid += (mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        rfidUid += String(mfrc522.uid.uidByte[i], HEX);
    }
    rfidUid.toUpperCase();
    Serial.print("[RFID] UID: ");
    Serial.println(rfidUid);

    // Enviar UID al servidor
    if (WiFi.status() == WL_CONNECTED) {
        http.begin(serverName);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "Bearer " + String(apiKey));

        // Crear el cuerpo del JSON para la petición
        String jsonPayload = "{\"accessPointId\":\"" + String(accessPointId) + "\",\"rfidCardId\":\"" + rfidUid + "\"}";
        Serial.print("[HTTP] Enviando payload: ");
        Serial.println(jsonPayload);

        int httpResponseCode = http.POST(jsonPayload);

        if (httpResponseCode > 0) {
            Serial.print("[HTTP] Código de respuesta: ");
            Serial.println(httpResponseCode);
            String responsePayload = http.getString();
            Serial.print("[HTTP] Respuesta: ");
            Serial.println(responsePayload);

            // Parsear la respuesta JSON
            JsonDocument doc;
            DeserializationError error = deserializeJson(doc, responsePayload);

            if (error) {
                Serial.print("[JSON] Error al parsear JSON: ");
                Serial.println(error.c_str());
                signalError();
            } else {
                const char* action = doc["action"]; // "open" o "deny"
                if (strcmp(action, "open") == 0) {
                    signalSuccess();
                } else {
                    signalFailure();
                }
            }
        } else {
            Serial.print("[HTTP] Error en la petición POST, código: ");
            Serial.println(httpResponseCode);
            signalError();
        }

        http.end();
    } else {
        Serial.println("[WIFI] Conexión perdida. No se puede enviar la petición.");
        signalError();
        // Opcional: intentar reconectar o reiniciar
        // WiFi.begin(ssid, password);
    }

    // Detener la lectura de la misma tarjeta y esperar un momento
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(3000); // Espera 3 segundos antes de permitir otro escaneo
    Serial.println("\n[SISTEMA] Esperando siguiente tarjeta...");
}
