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
  - [Uso de Docker](#uso-de-docker)
    - [Requisitos Previos](#requisitos-previos)
    - [Estructura Docker](#estructura-docker)
    - [Cómo Iniciar el Entorno Docker](#cómo-iniciar-el-entorno-docker)
    - [Verificar el Funcionamiento](#verificar-el-funcionamiento)
    - [Aplicar Migraciones en la Base de Datos](#aplicar-migraciones-en-la-base-de-datos)
    - [Detener y Eliminar Contenedores](#detener-y-eliminar-contenedores)
  - [Despliegue en Producción](#despliegue-en-producción)

---

## Uso de Docker

Este proyecto utiliza Docker y Docker Compose para facilitar la configuración del entorno de desarrollo y producción. Con Docker, cualquier persona que clone el repositorio podrá levantar la base de datos, el backend y el frontend de forma rápida y consistente sin preocuparse por las dependencias locales.

### Requisitos Previos

Antes de iniciar, asegúrate de cumplir con los siguientes requisitos:

- **Docker Desktop:** Instala la última versión de Docker en tu sistema. Puedes descargarlo desde [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- **Docker Compose:** Se incluye con Docker Desktop, pero si usas una versión independiente, asegúrate de tenerlo instalado.
- **Archivo .env:** El repositorio incluye un archivo `.env.example` que debes renombrar a `.env` y completar con las variables de entorno necesarias.

### Estructura Docker

El entorno Docker se compone de los siguientes servicios definidos en `docker-compose.yml`:

1. **Base de Datos (MySQL)**:
   - Utiliza MySQL 8.
   - Crea la base de datos especificada en el `.env`.
   - Expone el puerto 3306.

2. **Backend (NestJS + Prisma)**:
   - Construido sobre Node.js 18 Alpine.
   - Se conecta a MySQL a través de la variable `DATABASE_URL`.
   - Expone el puerto 3000.

3. **Frontend (Next.js + React)**:
   - Construido sobre Node.js.
   - Expone el puerto 3001.

### Cómo Iniciar el Entorno Docker

1. Clona el repositorio y accede al directorio del proyecto:

   git clone https://github.com/JuliMolinaZ/wms-run.git
   cd wms-run

2. Crea un archivo `.env` en la raíz del proyecto y en `apps/backend` siguiendo el ejemplo de `.env.example`.

3. Construye y levanta los contenedores:

   docker-compose up --build

4. Los servicios estarán disponibles en:
   - **Backend:** `http://localhost:3000`
   - **Frontend:** `http://localhost:3001`
   - **MySQL:** `localhost:3306` (se recomienda usar un cliente como MySQL Workbench para conectarse)

### Verificar el Funcionamiento

- **Backend:** Verifica los logs en la terminal para asegurarte de que las rutas han sido mapeadas correctamente.
- **Frontend:** Abre en el navegador `http://localhost:3001` y verifica que la interfaz se cargue correctamente.

### Aplicar Migraciones en la Base de Datos

Si es la primera vez que levantas el entorno, debes aplicar las migraciones en la base de datos ejecutando:

docker-compose run backend npx prisma migrate deploy


Este comando aplicará todas las migraciones definidas en Prisma y creará las tablas necesarias.

### Detener y Eliminar Contenedores

Si deseas detener los contenedores sin eliminarlos:


docker-compose stop


Para eliminarlos junto con los volúmenes de datos:


docker-compose down -v


---

## Despliegue en Producción

Para desplegar en producción con Docker, sigue estos pasos:

1. Construye las imágenes:

   
   docker-compose -f docker-compose.prod.yml build
   

2. Levanta los contenedores en modo desacoplado:

   
   docker-compose -f docker-compose.prod.yml up -d
   

3. Verifica los logs:

   docker-compose logs -f