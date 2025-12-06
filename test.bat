@echo off
chcp 65001 >nul
curl -v -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"admin"}'