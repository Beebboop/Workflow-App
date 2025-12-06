FROM node:20-alpine

WORKDIR /app

# Сначала копируем package.json
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Проверка структуры к main
RUN ls -la dist/ && \
    echo "=== Looking for main file ===" && \
    find dist/ -name "main.js" -type f

EXPOSE 3000

# Путь к main.js
CMD ["node", "dist/src/main"]