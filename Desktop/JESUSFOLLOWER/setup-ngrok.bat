@echo off
echo 🚀 Configurando Ngrok para el Bot de Trading
echo.

echo 1️⃣ Iniciando Ngrok en el puerto 8080...
echo.
ngrok http 8080

echo.
echo ✅ Ngrok detenido
echo.
echo URL del webhook (copiala en .env):
echo https://TU_URL_NGROK.ngrok.io/webhook/8225421319:AAEaOuOZcm3Qw1CtwcxWaq-aFaboHAkCd8U
echo.
pause