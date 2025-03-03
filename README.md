# APOLO

APOLO es un sistema full stack modular desarrollado en un monorepo administrado con Nx. Está compuesto por múltiples aplicaciones y librerías compartidas, lo que permite escalar y mantener funcionalidades de forma independiente.

## 📌 Características principales

### Backend
- API REST y WebSocket desarrollada con NestJS y Prisma.
- Módulos principales: auth, arrivals, dashboards, picking, slotting, putaway, packing, locations, items, users, notifications, entre otros.
- Soporte para autenticación, roles y gestión de datos.

### Frontend Web
- Aplicación moderna con Next.js, React, Material-UI y styled-components.
- Manejo de rutas públicas y protegidas.
- Componentes interactivos como flip cards, sidebar, header, y tematización dinámica.

### Frontend Mobile
- (Actualmente en desarrollo o alcance parcial según la versión actual).

### Librerías Compartidas
- Conjunto de utilidades, interfaces, validaciones y funciones reutilizables entre aplicaciones.

📢 **Nota:** En esta versión solo están disponibles los módulos del Backend y Frontend Web.

---

## 📖 Tabla de Contenidos

1️⃣ **Descripción General**  
2️⃣ **Estructura del Proyecto**  
3️⃣ **Tecnologías Utilizadas**  
4️⃣ **Instalación y Configuración**
   - Requisitos Previos
   - Configuración del Entorno Local
   - Uso de Docker
   - Migraciones con Prisma
5️⃣ **Desarrollo y Extensión del Backend**
   - Creación de Nuevos Módulos
   - Seguridad y Autenticación
   - WebSockets y Notificaciones
6️⃣ **Organización y Estructura del Frontend Web**  
7️⃣ **Despliegue en Producción**  
8️⃣ **Comandos Útiles y Tareas de Nx**  
9️⃣ **Recursos y Enlaces de Interés**  

---

## 📌 Descripción General

APOLO es un sistema integral para la gestión de almacenes y operaciones logísticas. Su arquitectura modular permite integrar nuevos módulos fácilmente. Gracias al uso de tecnologías modernas y Docker, se garantiza un entorno consistente en desarrollo, testing y producción.

---

## 📂 Estructura del Proyecto

### 📌 apps/backend
- Código fuente del API (NestJS), organizado en módulos como auth, dashboard, items, locations, packing, picking, putaway, slotting, users, notifications, entre otros.

### 📌 apps/frontend-web
- Aplicación web en Next.js, organizada en:
  - **Páginas públicas** (Login, Registro).
  - **Páginas protegidas** (Dashboard, Usuarios, Módulos operativos).
  - **Componentes comunes** (Header, Sidebar, FlipCard, Notificaciones).
  - **Manejo de estado** (Redux, AuthContext, ThemeContext).

### 📌 apps/frontend-mobile
- (Implementación en desarrollo con React Native).

### 📌 libs/shared
- Librerías compartidas con funciones, validaciones y utilidades para backend y frontend.

---

## 🛠️ Tecnologías Utilizadas

### **Backend**
✅ NestJS - Framework escalable para Node.js.  
✅ TypeScript - Tipado estático.  
✅ Prisma - ORM moderno (Base de datos MySQL).  
✅ JWT - Autenticación segura.  
✅ bcryptjs - Hashing de contraseñas.  
✅ WebSockets - Comunicación en tiempo real.  
✅ Docker - Contenerización y despliegue.  

### **Frontend Web**
✅ Next.js + React - UI escalable.  
✅ Material-UI (MUI) - Componentes preconstruidos.  
✅ styled-components - Estilos modulares.  
✅ Redux - Gestión global del estado.  
✅ react-toastify - Notificaciones emergentes.  
✅ Next.js Routing - Sistema de rutas protegidas.  

### **Herramientas Adicionales**
✅ Nx - Administración del monorepo.  
✅ Docker Compose - Orquestación de contenedores.  
✅ ESLint, Prettier, Jest - Calidad de código y pruebas.  

---

## ⚙️ Instalación y Configuración

### 🔹 Requisitos Previos
Antes de iniciar, asegúrate de tener instalados:

- Git (Para clonar el repositorio).
- Node.js (Versión 18+).
- Yarn / npm (Administrador de paquetes).
- Docker Desktop y Docker Compose.
- Configurar archivos `.env` con las credenciales necesarias.

### 🔹 Instalación Local

```
git clone https://github.com/JuliMolinaZ/wms-run.git  
cd wms-run  
yarn install  # O npm install  
```

Configurar variables de entorno (`.env` y `.env.backend`).

### 🐳 Uso de Docker

#### 📌 Servicios en docker-compose.yml
✅ Base de Datos (MySQL 8) - Puerto 3306.  
✅ Backend (NestJS + Prisma) - Puerto 3000.  
✅ Frontend (Next.js + React) - Puerto 3001.  

#### 📌 Levantar contenedores:
```
docker-compose up --build  
```

#### 📌 Acceder a los servicios:
- **Backend:** http://localhost:3000  
- **Frontend:** http://localhost:3001  
- **Base de Datos:** Conéctate a localhost:3306 con MySQL Workbench.  

#### 📌 Migraciones de Base de Datos:
```
docker-compose run backend npx prisma migrate deploy  
```

#### 📌 Detener y eliminar contenedores:
```
docker-compose down -v  
```

---

## 🚀 Despliegue en Producción

### 📌 Construir y levantar contenedores de producción:
```
docker-compose -f docker-compose.prod.yml up -d  
```

### 📌 Verificar logs:
```
docker-compose -f docker-compose.prod.yml logs -f  
```

### 📌 Migraciones de base de datos en producción:
```
docker-compose -f docker-compose.prod.yml run backend npx prisma migrate deploy  
```

---

## 📚 Recursos y Enlaces de Interés
📌 [NestJS Docs](https://docs.nestjs.com/)  
📌 [Prisma Docs](https://www.prisma.io/docs/)  
📌 [Next.js Docs](https://nextjs.org/docs)  
📌 [Material-UI](https://mui.com/)  
📌 [Docker Docs](https://docs.docker.com/)  
📌 [Nx Docs](https://nx.dev/)  

