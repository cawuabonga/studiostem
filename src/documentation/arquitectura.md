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

### 2. Capas del Sistema
El sistema se divide en tres capas principales:

1.  **Capa de Presentación (Frontend)**: Next.js 15, utilizando React Server Components para velocidad y Client Components para interactividad en tiempo real.
2.  **Capa de Lógica (Servidor)**: Server Actions para procesos de negocio y Genkit para orquestación de Inteligencia Artificial.
3.  **Capa de Persistencia (BaaS)**: Firebase gestiona la base de datos (Firestore), autenticación (Auth) y archivos (Storage).

### 3. Estructura de la Base de Datos (Esquema NoSQL)

Para garantizar la velocidad y el aislamiento, la información se organiza en una estructura de colecciones raíz y subcolecciones profundas. A continuación se detalla el diseño de datos:

**🗄️ COLECCIONES RAÍZ (Globales)**
*   ↳ **`/users`**: Repositorio global de usuarios del sistema (UID, Email, Rol, InstituteId).
*   ↳ **`/config`**: Configuraciones globales de la plataforma (Login, Logo, Proveedores de IA).

**🏢 COLECCIONES POR INSTITUTO (`/institutes/{instituteId}/...`)**
Cada instituto posee su propio árbol de datos independiente:

*   ↳ **`buildings`**: Infraestructura física (Pabellones).
    *   ↳ **`environments`**: Aulas, laboratorios y oficinas.
        *   ↳ **`assets`**: Inventario de activos fijos (Mobiliario, Equipos).
*   ↳ **`programs`**: Carreras profesionales y sus módulos.
*   ↳ **`unidadesDidacticas`**: Cursos individuales.
    *   ↳ **`weeklyPlanner`**: Planificación por semanas (Contenidos y Tareas).
    *   ↳ **`achievementIndicators`**: Indicadores de logro para evaluación.
*   ↳ **`staffProfiles`**: Perfiles del personal docente y administrativo (Indexados por DNI).
*   ↳ **`studentProfiles`**: Perfiles oficiales de estudiantes (Indexados por DNI).
*   ↳ **`matriculations`**: Historial de inscripciones de alumnos en cursos.
*   ↳ **`academicRecords`**: Registro auxiliar de notas y calificaciones.
*   ↳ **`attendance`**: Registro de asistencia por unidad y sesión.
*   ↳ **`payments`**: Recaudación de tasas y vouchers de estudiantes.
*   ↳ **`supplyCatalog`**: Inventario de insumos (almacén).
*   ↳ **`supplyRequests`**: Pedidos de materiales del personal (PECOSAS).
*   ↳ **`accessPoints`**: Configuración de puertas y lectores RFID.
    *   ↳ **`accessLogs`**: Historial de entradas y salidas en tiempo real.

### 4. Lógica de Relaciones
Aunque Firestore es NoSQL, STEM mantiene la integridad mediante **Referencias Cruzadas**:
*   **UID**: Vincula el usuario de autenticación con su perfil oficial.
*   **DNI**: Actúa como llave única para el seguimiento académico y administrativo.
*   **IDs Jerárquicos**: Los datos siempre fluyen hacia abajo (ej. un Activo "sabe" a qué Ambiente pertenece, y el Ambiente a qué Edificio).

### 5. Escalabilidad
Gracias al uso de tecnologías "Serverless", la plataforma puede escalar de 10 a 10,000 usuarios sin necesidad de reconfigurar servidores, ajustando los costos al consumo real de cada instituto.
