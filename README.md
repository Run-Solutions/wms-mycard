# RCM06

RCM06 es un sistema full stack modular desarrollado en un monorepo administrado con Nx. Está compuesto por múltiples aplicaciones y librerías compartidas, lo que permite escalar y mantener funcionalidades de forma independiente.

## 📌 Características principales

### Backend
- API REST y WebSocket desarrollada con NestJS y Prisma.
- Módulos principales:  
  - inconformities  
  - accept-auditory-work-order  
  - close-auditory-work-order  
  - free-reviews  
  - accept-reviews  
  - free-work-order  
  - accept-work-order  
  - work-order  
  - permissions  
  - users  
  - dashboards
- Soporte para autenticación, roles y gestión de datos.

### Frontend Web
- Aplicación moderna con Next.js, React, Material-UI y styled-components.
- Componentes principales:  
  - Auth  
  - Sidebar  
  - Header  
  - Notification  
  - Loading  
  - Card  
  - ButtonIA  
  - LiberarProducto  
  - CerrarOrdenDeTrabajo  
  - Inconformidades  
  - AceptarProducto  
  - ConfiguracionVistosBuenos  
  - SeguimientoDeOts  
  - AceptarAuditoria  
  - RecepcionCqm
- Manejo de rutas públicas y protegidas.
- Manejo de estado global (Redux, AuthContext, ThemeContext).

### Frontend Mobile
- (Actualmente en desarrollo o alcance parcial según la versión actual).

### Librerías Compartidas
- Conjunto de utilidades, interfaces, validaciones y funciones reutilizables entre aplicaciones.

---

## 📂 Estructura del Proyecto

### apps/backend
- Código fuente del API (NestJS), organizado en módulos como los listados arriba.

### apps/frontend-web
- Aplicación web en Next.js, organizada en:
  - **Páginas públicas** (Login, Registro).
  - **Páginas protegidas** (Dashboard, Usuarios, Módulos operativos).
  - **Componentes comunes** (Header, Sidebar, Notification, etc.).
  - **Manejo de estado** (Redux, AuthContext, ThemeContext).

### apps/frontend-mobile
- (Implementación en desarrollo con React Native).

### libs/shared
- Librerías compartidas con funciones, validaciones y utilidades para backend y frontend.

---

## 🛠️ Tecnologías Utilizadas

### Backend
- NestJS
- TypeScript
- Prisma (MySQL)
- JWT
- bcryptjs
- WebSockets
- Docker

### Frontend Web
- Next.js + React
- Material-UI (MUI)
- styled-components
- Redux
- react-toastify
- Next.js Routing

### Herramientas Adicionales
- Nx
- Docker Compose
- ESLint, Prettier, Jest

---

## Instalación & Entorno

### Prerrequisitos

- Node.js >=18.x
- Docker y Docker Compose
- Git
- Nx CLI (opcional)

### Clonación del Repositorio

```bash
git clone https://github.com/JuliMolinaZ/wms-run.git
cd wms-run
```

### Variables de Entorno

- Revisa los archivos `.env.example` o instrucciones en `docker-compose.yml.example`.
- Copia y edita los archivos `.env` según tu entorno.

### Instalación Local

```bash
yarn install  # O npm install
```

---

## Uso de Docker

```bash
docker-compose up --build
```

- **Backend:** http://localhost:3000  
- **Frontend:** http://localhost:3001  
- **Base de Datos:** localhost:3306

### Migraciones de Base de Datos

```bash
docker-compose run backend npx prisma migrate deploy
```

---

## Despliegue en Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Recursos y Enlaces de Interés

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Material-UI](https://mui.com/)
- [Docker Docs](https://docs.docker.com/)
- [Nx Docs](https://nx.dev/)
