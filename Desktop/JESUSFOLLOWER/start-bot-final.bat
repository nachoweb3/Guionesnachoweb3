@echo off
title Bot Trading con IA - Inicio Rápido

echo ===============================
echo  🤖 BOT TRADING CON IA
echo ===============================
echo.

echo [1/4] Eliminando webhook anterior...
curl -s -X POST https://api.telegram.org/bot8225421319:AAEaOuOZcm3Qw1CtwcxWaq-aFaboHAkCd8U/deleteWebhook >nul
echo ✅ Webhook eliminado

echo.
echo [2/4] Verificando ngrok...
ngrok http 8080 --log=stdout > ngrok.log &
echo ✅ Ngrok iniciado

echo.
echo [3/4] Esperando ngrok...
timeout /t 5 >nul

echo.
echo [4/4] Iniciando bot interactivo...
echo    • Menú con botones
echo    • 4 skins personalizables
echo    • Análisis con IA
echo    • Portfolio tracker
echo.

node bot-interactive.js

echo.
echo ===============================
echo Bot detenido. Presiona cualquier tecla para salir...
pause >nul