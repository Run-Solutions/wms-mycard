# APOLO

Este repositorio contiene el código fuente de un sistema full stack modular, organizado en un monorepo administrado con Nx. Actualmente, el proyecto incluye las siguientes aplicaciones:

- **Backend:** API REST y WebSocket desarrollada con NestJS y Prisma para la gestión de datos (incluye autenticación, notificaciones, roles y módulos específicos como arrivals, dashboards, picking, slotting, putaway, etc.).
- **Frontend Web:** Aplicación web moderna desarrollada con Next.js, React y Material UI para la visualización de datos, administración de usuarios y manejo de la interfaz de usuario.
- **Frontend Mobile:** (En desarrollo o en desuso según alcance actual)
- **Librerías Compartidas:** Conjunto de utilidades, interfaces y validaciones reutilizables entre las distintas aplicaciones.

> **Nota:** En esta actualización se incluirán únicamente los módulos de **Backend** y **Frontend Web**.

---

## Tabla de Contenidos

- [APOLO](#apolo)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Visión General](#visión-general)
  - [Características](#características)
  - [Tecnologías Utilizadas](#tecnologías-utilizadas)
    - [Backend](#backend)
    - [Frontend Web](#frontend-web)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Instalación y Configuración](#instalación-y-configuración)
    - [Requisitos Previos](#requisitos-previos)
    - [Instalación](#instalación)
    - [Configurar Variables de Entorno](#configurar-variables-de-entorno)
  - [Scripts y Comandos Útiles](#scripts-y-comandos-útiles)
    - [Backend](#backend-1)
    - [Frontend Web](#frontend-web-1)
    - [Comandos Globales](#comandos-globales)
  - [Despliegue en Producción](#despliegue-en-producción)
    - [Backend](#backend-2)
    - [Frontend Web](#frontend-web-2)
  - [Contribución](#contribución)
  - [Licencia](#licencia)
  - [Contacto](#contacto)

---

## Visión General

**APOLO** es un sistema modular desarrollado para gestionar procesos empresariales. La solución se compone de los siguientes módulos:

- **Backend:** API REST y WebSocket con NestJS y Prisma.
- **Frontend Web:** Aplicación web con Next.js, React y Material UI.
- **(Frontend Mobile y Librerías Compartidas):** (Actualmente no incluidos en esta actualización)

Este monorepo facilita el mantenimiento y la escalabilidad del sistema, permitiendo trabajar de forma centralizada en múltiples aplicaciones y compartir código entre ellas.

---

## Características

- **Arquitectura modular:** Separación clara entre Backend y Frontend Web.
- **Autenticación y Autorización:** Implementación de login, registro, recuperación de contraseña y control de roles.
- **Notificaciones en tiempo real:** Uso de WebSockets para enviar notificaciones a clientes conectados.
- **Interfaz moderna y responsiva:** Con Next.js, Material UI y Styled Components.
- **Optimización y rendimiento:** Uso de Next.js con TurboPack para acelerar el desarrollo y la compilación.
- **Testing:** Configuración de pruebas unitarias y end-to-end con Jest.
- **Integración con bases de datos:** Uso de Prisma y MySQL (u otro compatible) para el manejo de datos.
- **Configuración robusta:** Uso de ESLint, Prettier, TypeScript y variables de entorno para garantizar calidad y seguridad.

---

## Tecnologías Utilizadas

### Backend

- **NestJS:** Framework progresivo para Node.js.
- **Prisma:** ORM moderno para interactuar con bases de datos.
- **TypeScript:** Lenguaje de tipado estático.
- **JWT & bcrypt:** Para autenticación y seguridad.
- **WebSockets (Socket.io):** Comunicación en tiempo real.

### Frontend Web

- **Next.js:** Framework para React con renderizado del lado del servidor y generación de sitios estáticos.
- **React:** Biblioteca para construir interfaces de usuario.
- **Material UI:** Componentes de interfaz modernos y personalizables.
- **Styled Components:** Estilos basados en componentes.
- **Redux Toolkit:** Manejo de estado global.
- **Axios & Socket.io-client:** Para consumo de APIs y comunicación en tiempo real.

---

## Estructura del Proyecto

```
myorg/
├── apps
│   ├── backend              # API construida con NestJS y Prisma
│   │   ├── src              # Código fuente
│   │   ├── dist             # Archivos compilados (generados)
│   │   ├── prisma           # Migraciones y esquema de la base de datos
│   │   └── package.json     # Dependencias y scripts del backend
│   └── frontend-web         # Aplicación web con Next.js, React y Material UI
│       ├── src              # Código fuente (componentes, páginas, etc.)
│       ├── public           # Recursos estáticos (imágenes, logos, etc.)
│       └── package.json     # Dependencias y scripts del frontend web
├── libs
│   └── shared               # Código compartido (interfaces, utils, validaciones)
├── nx.json                  # Configuración de Nx
├── package.json             # Configuración global del monorepo y workspaces
├── tsconfig.base.json       # Configuración global de TypeScript
├── tsconfig.json            # Configuración TypeScript raíz
└── .gitignore               # Archivos y directorios a ignorar en Git
```

Cada aplicación tiene su propio `package.json` y configuración, permitiendo el trabajo independiente y aprovechando los beneficios del monorepo.

---

## Instalación y Configuración

### Requisitos Previos

- **Node.js:** Versión LTS recomendada (v16 o superior).
- **Yarn o npm:** Gestor de paquetes.
- **Nx CLI (opcional):** Para ejecutar comandos globales de Nx.

### Instalación

```bash
git clone https://github.com/JuliMolinaZ/wms-run.git
cd wms-run
npm install  # O si usas yarn:
yarn install
```

### Configurar Variables de Entorno

Crea un archivo `.env` en cada proyecto y define las variables necesarias. Ejemplo:

```dotenv
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/mi_basedatos"
JWT_SECRET="mi_secreto_super_seguro"
PORT=3000
```

---

## Scripts y Comandos Útiles

### Backend

```bash
npm run start:dev    # Iniciar en modo desarrollo
npm run build        # Compilar el proyecto
npm run test         # Ejecutar pruebas unitarias
npm run test:e2e     # Ejecutar pruebas end-to-end
```

### Frontend Web

```bash
npm run dev          # Iniciar la aplicación en modo desarrollo
npm run build        # Construir la aplicación
npm run start        # Iniciar la aplicación en producción
npm run lint         # Ejecutar linter
npm run test         # Ejecutar pruebas
```

### Comandos Globales

```bash
npx nx show projects                      # Listar proyectos
npx nx run-many --target=build --all      # Construir todos los proyectos
npx nx run-many --target=test --all       # Ejecutar pruebas en todos los proyectos
```

---

## Despliegue en Producción

### Backend

```bash
npm run build
npm run start:prod  # Usar PM2 o Docker para gestión
```

### Frontend Web

Se recomienda desplegar en **Vercel, Netlify o un servidor con Node.js**.

---

## Contribución

1. Realiza un fork.
2. Crea una rama (`feature/nueva-funcionalidad`).
3. Realiza cambios y pruebas.
4. Envía un Pull Request.

---

## Licencia

Este proyecto se distribuye bajo la licencia **UNLICENSED**.

---

## Contacto

📧 **Correo:** julianmolina.ing@gmail.com  
🔗 **GitHub:** [JuliMolinaZ](https://github.com/JuliMolinaZ)