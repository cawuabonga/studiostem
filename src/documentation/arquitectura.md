---
title: 'Arquitectura de Software y Datos'
description: 'Visión técnica de la estructura multi-instituto, seguridad y modelo de datos NoSQL.'
tags: ['arquitectura', 'firebase', 'saas']
---

# Arquitectura General del Sistema STEM

El proyecto STEM está diseñado bajo un modelo **SaaS (Software as a Service) Multi-Tenant**. Esto significa que una única instancia de la aplicación es capaz de servir a múltiples instituciones de manera aislada y segura.

### 1. Modelo de Datos Multi-Instituto (Multitenancy)
A diferencia de sistemas tradicionales, STEM utiliza un identificador de instituto (`instituteId`) como raíz en la jerarquía de la base de datos Firestore.

*   **Aislamiento**: Cada consulta de datos está filtrada por el `instituteId` activo en el contexto del usuario.
*   **Reglas de Seguridad**: Las `Firestore Security Rules` validan en cada lectura/escritura que el usuario autenticado pertenezca realmente al instituto que intenta consultar.

### 2. Flujo de Datos y Capas
El sistema se divide en tres capas principales:

1.  **Capa de Presentación (Frontend)**: Construida con Next.js 15, utilizando React Server Components para velocidad y Client Components para interactividad.
2.  **Capa de Lógica (Server Actions & Flows)**: Los procesos complejos y las llamadas a la IA (Genkit) se ejecutan en el servidor para proteger las llaves de API y mejorar el rendimiento.
3.  **Capa de Persistencia (BaaS)**: Firebase gestiona la base de datos (Firestore), autenticación (Auth) y archivos (Storage).

### 3. Estructura Jerárquica de Datos (Mapa del Sistema)

Para entender cómo fluye la información, el sistema se organiza de la siguiente manera:

**🏢 NODO RAÍZ: INSTITUTO**
*   ↳ **📍 INFRAESTRUCTURA**: Pabellones, Ambientes (Aulas, Laboratorios).
*   ↳ **📚 ACADEMIA**: Programas de Estudio (Carreras).
    *   ↳ **📖 UNIDADES DIDÁCTICAS**: Cursos y materias.
        *   ↳ **📅 PLANIFICACIÓN**: Syllabus, Sesiones semanales, Materiales.
*   ↳ **👥 COMUNIDAD**: Perfiles oficiales de Estudiantes y Personal.
    *   ↳ **📊 SEGUIMIENTO**: Matrículas, Calificaciones, Asistencias.
*   ↳ **📟 SEGURIDAD**: Puntos de Acceso, Dispositivos RFID, Logs de Entrada/Salida.

### 4. Escalabilidad
Gracias al uso de tecnologías "Serverless", la plataforma puede escalar de 10 a 10,000 usuarios sin necesidad de reconfigurar servidores, ajustando los costos al consumo real.
