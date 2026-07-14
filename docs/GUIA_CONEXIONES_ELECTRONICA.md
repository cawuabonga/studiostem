# Guía de Conexiones STEM V2 (ESP32 + RFID)

Este documento detalla el esquema de pines para el hardware de control de acceso.

## 1. Lector RFID RC522 (Alimentación 3.3V)
| RC522 | ESP32 | Función | Color Sugerido |
| :--- | :--- | :--- | :--- |
| **VCC** | **3.3V** | Energía (¡No usar 5V!) | Rojo |
| **RST** | **GPIO 22** | Reset | Naranja |
| **GND** | **GND** | Tierra | Negro |
| **MISO** | **GPIO 19** | Datos | Azul |
| **MOSI** | **GPIO 23** | Datos | Verde |
| **SCK** | **GPIO 18** | Reloj | Amarillo |
| **SDA (SS)** | **GPIO 5** | Selector | Blanco |

## 2. Bloque de Potencia (Relé y Cerradura 12V)
| Componente | Pin ESP32 | Conexión |
| :--- | :--- | :--- |
| **VCC Relé** | **VIN** | 5V desde el ESP32 |
| **GND Relé** | **GND** | Tierra |
| **IN Relé** | **GPIO 2** | Señal de apertura |

### Circuito del Picaporte (Circuito 12V):
1. (+) Fuente 12V -> Cable 1 Picaporte.
2. Cable 2 Picaporte -> Pin **NO** (Normalmente Abierto) del Relé.
3. Pin **COM** (Común) del Relé -> (-) Fuente 12V.
4. **Diodo 1N4007**: Poner en paralelo con el picaporte (Cátodo/Raya al +12V).

## 3. Feedback Visual y Sonoro
| Componente | Pin ESP32 | Notas |
| :--- | :--- | :--- |
| **LED Verde** | **GPIO 12** | Usar resistencia 220 ohm |
| **LED Rojo** | **GPIO 13** | Usar resistencia 220 ohm |
| **Buzzer** | **GPIO 14** | Usar resistencia 100 ohm |

## 4. Importante: Tierra Común
El **GND del ESP32** debe estar unido al **(-) de la fuente de 12V**. Sin esta conexión, el relé no podrá interpretar la señal de disparo del microcontrolador.

---

## 5. Software (Arduino IDE)
1. Instalar la librería `MFRC522` desde el Gestor de Librerías.
2. Instalar la librería `ArduinoJson`.
3. Cargar el código ubicado en `arduino/stem_access_control.ino`.
4. Configurar el `ssid`, `password` y la URL de tu servidor en el código antes de subirlo.
