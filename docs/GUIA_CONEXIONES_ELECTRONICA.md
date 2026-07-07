# Guía de Conexiones STEM V2 (ESP32 + RFID)

Este documento detalla el esquema de pines para el hardware de control de acceso.

## 1. Lector RFID RC522 (Alimentación 3.3V)
| RC522 | ESP32 | Función |
| :--- | :--- | :--- |
| VCC | 3.3V | Energía (¡No usar 5V!) |
| RST | GPIO 22 | Reset |
| GND | GND | Tierra |
| MISO | GPIO 19 | Datos |
| MOSI | GPIO 23 | Datos |
| SCK | GPIO 18 | Reloj |
| SDA | GPIO 5 | Selector |

## 2. Bloque de Potencia (Relé y Cerradura 12V)
| Componente | Pin ESP32 | Conexión |
| :--- | :--- | :--- |
| VCC Relé | VIN | 5V desde el ESP32 |
| GND Relé | GND | Tierra |
| IN Relé | GPIO 2 | Señal de apertura |

### Circuito del Picaporte:
1. (+) Fuente 12V -> Cable 1 Picaporte.
2. Cable 2 Picaporte -> Pin NO del Relé.
3. Pin COM del Relé -> (-) Fuente 12V.
4. **Diodo 1N4007**: Poner en paralelo con el picaporte (Cátodo/Raya al +12V).

## 3. Feedback Visual y Sonoro
| Componente | Pin ESP32 | Notas |
| :--- | :--- | :--- |
| LED Verde | GPIO 12 | Usar resistencia 220/330 ohm |
| LED Rojo | GPIO 13 | Usar resistencia 220/330 ohm |
| Buzzer | GPIO 14 | Usar resistencia 100 ohm |

## 4. Importante: Tierra Común
El **GND del ESP32** debe estar unido al **(-) de la fuente de 12V**. Sin esta conexión, el relé no se activará.
