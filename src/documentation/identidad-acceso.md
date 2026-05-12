---
title: 'Gestión de Identidad y Roles'
description: 'Explicación del proceso de vinculación de perfiles y jerarquía de permisos.'
tags: ['seguridad', 'roles', 'identidad']
---

# Gestión de Identidad y Validación

Una de las características más potentes de STEM es su sistema de **Validación de Identidad**, diseñado para que la administración del instituto mantenga el control total sobre quién accede a qué información.

### 1. El Proceso de Registro (3 Pasos)

Para garantizar la seguridad, el acceso no es abierto. Sigue este flujo:

1.  **Pre-Registro (Admin)**: El administrador del instituto carga la lista de estudiantes y personal (DNI, Nombre, Email) mediante formularios o carga masiva de Excel. En este punto, los perfiles existen en la base de datos pero no tienen un "usuario de sistema" asociado.
2.  **Creación de Cuenta (Usuario)**: El estudiante o trabajador crea una cuenta en la plataforma usando su correo personal o Google. Al entrar, el sistema detecta que es un "Usuario No Vinculado".
3.  **Vinculación (Claiming)**: El usuario debe ingresar su DNI y el correo con el que fue registrado por el instituto. El sistema busca una coincidencia exacta y, si la encuentra, vincula el ID de autenticación con el perfil oficial.

### 2. Jerarquía de Roles y Permisos
El sistema utiliza **RBAC (Role-Based Access Control)** dinámico:

*   **SuperAdmin**: Gestiona la infraestructura global, crea institutos y configura la IA.
*   **Admin de Instituto**: Tiene control total sobre su propia institución.
*   **Coordinador**: Gestiona programas específicos y asignaciones docentes.
*   **Docente**: Accede a sus unidades, registra notas, asistencias y clases virtuales.
*   **Estudiante**: Consulta su progreso, realiza pagos y accede a materiales.

### 3. Seguridad de Sesión
Las sesiones son gestionadas por Firebase Auth, utilizando tokens JWT que se refrescan automáticamente, garantizando que el acceso sea revocado instantáneamente si el usuario es desactivado en el panel administrativo.
