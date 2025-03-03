APOLO

Este repositorio contiene el código fuente de un sistema full stack modular, organizado en un monorepo administrado con Nx. El proyecto incluye aplicaciones para el Backend, Frontend Web y Frontend Mobile, además de librerías compartidas para reutilizar código entre las aplicaciones.

Tabla de Contenidos
Visión General
Características
Tecnologías Utilizadas
Estructura del Proyecto
Instalación y Configuración
Scripts y Comandos Útiles
Desarrollo y Testing
Despliegue en Producción
Contribución
Licencia
Contacto
Visión General
MyOrg es un sistema modular desarrollado para gestionar procesos empresariales. La solución se compone de los siguientes módulos:

Backend: API REST y WebSocket desarrollada con NestJS y Prisma para la gestión de datos (incluye autenticación, notificaciones, roles, y módulos específicos como arrivals, dashboards, picking, slotting, putaway, etc.).
Frontend Web: Aplicación web moderna desarrollada con Next.js, React y Material UI para la visualización de datos, administración de usuarios y manejo de la interfaz de usuario.
Frontend Mobile: Aplicación móvil (basada en React Native o similar, según configuración) para acceder a funcionalidades clave desde dispositivos móviles.
Librerías Compartidas: Conjunto de utilidades, interfaces y validaciones reutilizables entre las distintas aplicaciones.
Este monorepo está diseñado para facilitar el mantenimiento y escalabilidad del sistema, permitiendo trabajar de forma centralizada en múltiples aplicaciones y compartir código entre ellas.

Características
Arquitectura modular: Separación clara entre backend, frontend web y móvil.
Autenticación y Autorización: Implementación de login, registro, recuperación de contraseña y control de roles.
Notificaciones en tiempo real: Uso de WebSockets para enviar notificaciones a clientes conectados.
Interfaz moderna: UI responsiva con Next.js, Material UI y Styled Components.
Optimización y rendimiento: Uso de Next.js con TurboPack para acelerar el desarrollo y compilación.
Testing: Configuración de pruebas unitarias y end-to-end con Jest y herramientas relacionadas.
Integración con bases de datos: Uso de Prisma y MySQL (o compatible) para el manejo de datos.
Configuración robusta: Uso de ESLint, Prettier, TypeScript y variables de entorno para garantizar la calidad y seguridad del código.
Tecnologías Utilizadas
Backend
NestJS: Framework progresivo para Node.js.
Prisma: ORM moderno para interactuar con bases de datos.
TypeScript: Lenguaje de tipado estático que mejora la escalabilidad y mantenibilidad.
JWT & bcrypt: Para autenticación y seguridad.
WebSockets (Socket.io): Comunicación en tiempo real.
Frontend Web
Next.js: Framework para React que permite renderizado del lado del servidor y generación de sitios estáticos.
React: Biblioteca para construir interfaces de usuario.
Material UI: Componentes de interfaz modernos y personalizables.
Styled Components: Estilos basados en componentes.
Redux Toolkit: Manejo de estado global.
Axios & Socket.io-client: Para consumo de APIs y comunicación en tiempo real.
Frontend Mobile
React Native (u otra tecnología móvil): Desarrollo de aplicaciones móviles con un único código base.
Navegación, Contextos y Store: Para la gestión de estado y navegación en la aplicación.
Herramientas y Utilidades
Nx: Herramienta de monorepo para gestionar múltiples proyectos.
ESLint & Prettier: Para mantener la calidad del código.
Jest & ts-jest: Framework de testing para TypeScript.
Tailwind CSS (opcional): Para estilos utilitarios (en el frontend web, si se requiere).
Estructura del Proyecto
La estructura principal del monorepo es la siguiente:

myorg/
├── apps
│   ├── backend         # API construida con NestJS y Prisma
│   │   ├── src         # Código fuente
│   │   ├── dist        # Archivos compilados (generados)
│   │   ├── prisma      # Migraciones y esquema de la base de datos
│   │   └── package.json # Dependencias y scripts del backend
│   ├── frontend-web    # Aplicación web con Next.js, React y MUI
│   │   ├── src         # Código fuente (componentes, páginas, etc.)
│   │   ├── public      # Recursos estáticos (imágenes, logos, etc.)
│   │   └── package.json # Dependencias y scripts del frontend web
│   └── frontend-mobile # Aplicación móvil
│       ├── src         # Código fuente
│       └── package.json
├── libs
│   └── shared          # Código compartido (interfaces, utils, validaciones)
│       └── package.json
├── nx.json             # Configuración de Nx
├── package.json        # Configuración global del monorepo y workspaces
├── tsconfig.base.json  # Configuración global de TypeScript
├── tsconfig.json       # Configuración TypeScript raíz
└── .gitignore          # Archivos y directorios a ignorar en Git
Cada aplicación tiene su propio package.json y configuración, lo que permite trabajar de forma independiente y aprovechar los beneficios de un monorepo.

Instalación y Configuración
Requisitos Previos
Node.js: Versión LTS recomendada (v16 o superior).
Yarn o npm: Gestor de paquetes.
Nx CLI (opcional): Para ejecutar comandos globales de Nx.
Instalación
Clonar el repositorio:

git clone https://github.com/tu-usuario/myorg.git
cd myorg
Instalar dependencias en el monorepo:

Si utilizas workspaces (ya configurados en el package.json raíz):

npm install
# o, si usas yarn:
yarn install
Esto instalará las dependencias tanto en la raíz como en cada uno de los proyectos (apps y libs).

Configurar Variables de Entorno:

Crea un archivo .env en cada proyecto (por ejemplo, en apps/backend) y define las variables necesarias (por ejemplo, cadena de conexión a la base de datos, JWT_SECRET, etc.):

dotenv

DATABASE_URL="mysql://usuario:contraseña@localhost:3306/mi_basedatos"
JWT_SECRET="mi_secreto_super_seguro"
PORT=3000
Scripts y Comandos Útiles
Backend (apps/backend)
Iniciar en modo desarrollo:

npm run start:dev
Compilar el proyecto:

npm run build
Ejecutar pruebas unitarias:

npm run test
Ejecutar pruebas end-to-end:

npm run test:e2e
Frontend-Web (apps/frontend-web)
Iniciar la aplicación en modo desarrollo:

npm run dev
Construir la aplicación:

npm run build
Iniciar la aplicación en producción:

npm run start
Ejecutar linter:

npm run lint
Ejecutar pruebas:

npm run test
Monorepo General
Si utilizas Nx, puedes ejecutar comandos globales como:

Listar proyectos:

npx nx show projects
Construir todos los proyectos:

npx nx run-many --target=build --all
Ejecutar pruebas de todos los proyectos:

npx nx run-many --target=test --all
Desarrollo y Testing
Desarrollo:
Cada aplicación puede desarrollarse de forma independiente utilizando los scripts propios definidos en su package.json. Nx facilita la gestión de dependencias y la ejecución de comandos en paralelo en todo el monorepo.

Testing:
Se utiliza Jest para pruebas unitarias y end-to-end. Asegúrate de que tus pruebas estén ubicadas en los directorios adecuados (por ejemplo, src/**/*.spec.ts para el backend).

Linting y Formateo:
El proyecto utiliza ESLint y Prettier para mantener la calidad y consistencia del código. Ejecuta:

npm run lint
npm run format
Despliegue en Producción
Antes de desplegar, asegúrate de:

Compilar los proyectos:

npm run build
Configurar las variables de entorno en el servidor de producción.
Para el backend, utiliza un proceso de gestión (por ejemplo, PM2 o Docker) para ejecutar la aplicación con el comando:

npm run start:prod
Para el frontend web, despliega la aplicación Next.js utilizando soluciones como Vercel, Netlify o configurando un servidor Node.js para servir la aplicación.
Contribución
¡Las contribuciones son bienvenidas! Si deseas colaborar en este proyecto:

Fork: Realiza un fork del repositorio.
Crea una rama: Usa una rama temática (feature/bugfix).
Realiza tus cambios: Asegúrate de incluir pruebas y de seguir las guías de estilo.
Envía un Pull Request: Describe claramente los cambios y el motivo de la actualización.
Para cambios importantes, abre primero un Issue para discutirlos.

Licencia
Este proyecto se distribuye bajo la licencia UNLICENSED (o ajusta la licencia según corresponda). Consulta el archivo LICENSE para más detalles.

Contacto
Correo: julianmolina.ing@gmail.com
GitHub: https://github.com/tu-usuario
Documentación Adicional: Puedes encontrar más detalles y documentación interna en la carpeta docs (si la agregas en el futuro).