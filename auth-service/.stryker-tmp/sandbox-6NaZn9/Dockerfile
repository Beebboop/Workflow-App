FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Проверка структуры к main
RUN ls -la dist/ && \
    echo "=== Looking for main file ===" && \
    find dist/ -name "main.js" -type f

EXPOSE 3001

# Путь к main.js
CMD ["node", "dist/src/main"]