FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Проверка структуры dist папки
RUN ls -la dist/ && \
    echo "=== Looking for index.html ===" && \
    find dist/ -name "index.html" -type f

EXPOSE 4173

# Запускаем Vite preview сервер
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]