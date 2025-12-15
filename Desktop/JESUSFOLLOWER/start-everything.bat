@echo off
title Solana Trading Bot - Inicio Automático
color 0A

echo =================================
echo  🤖 SOLANA TRADING BOT
echo =================================
echo.

echo 1️⃣ Iniciando Bot del servidor...
start "Bot Server" cmd /k "node bot-webhook.js"

timeout /t 3 /nobreak

echo.
echo 2️⃣ Iniciando Ngrok...
start "Ngrok" cmd /k "ngrok http 8080"

echo.
echo ✅ Todo iniciado!
echo.
echo =================================
echo  📋 PRÓXIMOS PASOS:
echo =================================
echo.
echo 1. En la ventana de Ngrok, copia la URL que aparece
echo    (terminada en .ngrok.io)
echo.
echo 2. Edita el archivo .env y reemplaza:
echo    NGROK_URL=https://TU_URL_NGROK.ngrok.io
echo    Por:
echo    NGROK_URL=https://[URL_COPIADA].ngrok.io
echo.
echo 3. Guarda el .env y reinicia el bot:
echo    node bot-webhook.js
echo.
echo =================================
echo.
echo El bot está corriendo y listo para operar!
echo.
pause