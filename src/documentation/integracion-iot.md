---
title: 'Integración IoT y Electrónica'
description: 'Detalles técnicos de la comunicación entre los lectores RFID y la plataforma web.'
tags: ['iot', 'arduino', 'rfid', 'api']
---

# Integración con Hardware (IoT)

STEM no es solo una plataforma web; incluye una capa física de hardware para automatizar el control de asistencia y la seguridad perimetral de los institutos.

### 1. El Hardware: Lector RFID Inteligente
El dispositivo está basado en el microcontrolador **ESP32**, elegido por su conectividad Wi-Fi nativa y potencia de procesamiento.

*   **Sensor**: Módulo RC522 (RFID de 13.56 MHz).
*   **Actuadores**: Relés para apertura de cerraduras electromagnéticas y Buzzers para feedback sonoro.

### 2. Protocolo de Comunicación
La comunicación se realiza mediante una **API REST Segura** alojada en la plataforma STEM.

**Flujo de la petición:**
1.  El lector captura el UID de la tarjeta.
2.  El ESP32 construye un JSON: `{"rfidCardId": "XXXX", "accessPointId": "PUERTA_01"}`.
3.  Envía una petición `POST` a `/api/flow/processAccessAttemptFlow` vía HTTPS.
4.  **Seguridad**: La petición incluye un `Header` de autorización con una `API Key` única del instituto.

### 3. Lógica de Decisión (Server-Side)
El servidor es quien decide si la puerta se abre o no, basándose en:
*   ¿La tarjeta está registrada a nombre de alguien?
*   ¿Esa persona tiene el rol permitido para ese punto de acceso específico?
*   ¿El instituto está al día en sus configuraciones?

### 4. Beneficios de la Integración
*   **Asistencia Automatizada**: El docente ya no tiene que llamar lista; el ingreso por la puerta registra la asistencia en el sistema de manera invisible.
*   **Auditoría en Tiempo Real**: Los administradores pueden ver quién está en el campus en cualquier momento desde el Dashboard de Control de Acceso.
*   **Sin Software Intermedio**: El hardware habla directamente con la nube, eliminando la necesidad de servidores locales en el instituto.
