---
title: 'Eficiencia de Datos y Agregaciones'
description: 'Lógica técnica detrás del monitoreo de consumo masivo con bajo costo operativo.'
tags: ['firebase', 'optimización', 'costos']
---

# Eficiencia de Datos: Cheap Aggregations

Para que la plataforma STEM sea económicamente viable en un entorno SaaS, hemos implementado una estrategia de "Agregaciones Baratas" utilizando la función `getCountFromServer` de Firebase Firestore.

### 1. El Desafío de la Observabilidad
En un sistema con múltiples institutos, el SuperAdmin necesita conocer el volumen de datos de cada uno para auditar el uso. Realizar consultas tradicionales (`getDocs`) para contar miles de registros en tiempo real dispararía los costos de facturación y saturaría la memoria del navegador.

### 2. Solución: Conteo en el Servidor
Utilizamos `getCountFromServer` para realizar agregaciones directamente en la infraestructura de Google:

*   **Minimización de Latencia**: No se transmiten los documentos al cliente; solo se recibe un valor entero.
*   **Optimización de Costos**: Firestore factura las agregaciones de forma masiva. Mientras una consulta normal cobra 1 lectura por documento, el conteo en servidor cobra **1 lectura por cada 1,000 documentos indexados**.
*   **Uso en STEM**: Esta tecnología impulsa los KPIs de la matriz de consumo del panel de SuperAdmin, permitiendo monitorear miles de estudiantes y pagos sin impactar la performance.

### 3. Aplicación en el Código
La implementación se encuentra centralizada en `src/config/firebase.ts` dentro de la función `getInstituteMetrics`. Esta función se ejecuta de forma paralela para todos los institutos, logrando una visión global del ecosistema en menos de 2 segundos.

### 4. Limitaciones y Buenas Prácticas
*   **Índices**: Los conteos aprovechan los índices existentes. Si se añade un filtro complejo (ej: contar solo alumnos aprobados en 2023), Firebase requerirá un índice compuesto para mantener la eficiencia.
*   **Consistencia**: El conteo es "eventualmente consistente", lo que lo hace perfecto para reportes y dashboards administrativos, pero no para lógica crítica de transacciones bancarias.
