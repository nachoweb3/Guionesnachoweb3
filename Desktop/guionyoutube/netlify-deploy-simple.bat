@echo off
echo.
echo ==========================================
echo   DEPLOY EN NETLIFY - AUTOMATICO
echo ==========================================
echo.

cd /d "%~dp0"

echo Paso 1: Instalando Netlify CLI...
call npm install -g netlify-cli 2>nul

echo.
echo Paso 2: Login en Netlify...
echo (Se abrirá tu navegador)
timeout /t 2 /nobreak >nul
call netlify login

echo.
echo Paso 3: Configurando sitio...
call netlify init --manual

echo.
echo ==========================================
echo   CONFIGURACION RECOMENDADA:
echo ==========================================
echo.
echo Build command: npm install
echo Directory to deploy: public
echo.

echo.
echo Paso 4: Deployando...
call netlify deploy --prod

echo.
echo ==========================================
echo   ✅ COMPLETADO!
echo ==========================================
echo.
echo Tu aplicación está online en Netlify!
echo.
echo Para configurar variables de entorno:
echo 1. Ve a tu dashboard de Netlify
echo 2. Site settings → Environment variables
echo 3. Agrega: GROQ_API_KEY = tu_api_key_de_groq_aqui
echo 4. Redeploy el sitio
echo.
pause
