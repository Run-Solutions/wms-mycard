# myorg\apps\frontend-web\Dockerfile

# Usa una imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install --legacy-peer-deps

# Copia el resto del código
COPY . .

# Construye la aplicación Next.js
RUN npm run build

# Expone el puerto en el que se ejecutará Next.js (por defecto 3000)
EXPOSE 3000

# Inicia la aplicación en modo producción
CMD ["npm", "start"]
