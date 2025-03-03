FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && npm rebuild bcrypt --update-binary

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]




