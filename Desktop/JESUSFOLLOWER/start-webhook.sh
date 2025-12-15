@echo off
echo 🚀 Iniciando Bot con Webhook...
echo.
echo 1️⃣ Iniciando ngrok...
start cmd /k "ngrok http 3000"

timeout /t 5

echo.
echo 2️⃣ Iniciando bot...
node bot-webhook.js

pause