@echo off
echo ========================================
echo   QUANTUM TRADING BOT - LAUNCHER
echo ========================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado
    echo Por favor, instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

:: Verificar .env
if not exist .env.quantum (
    echo ERROR: Archivo .env.quantum no encontrado
    echo Copia .env.quantum.example a .env.quantum y configura los valores
    pause
    exit /b 1
)

:: Detener procesos anteriores
echo Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

:: Instalar dependencias
echo.
echo Instalando dependencias...
npm install express telegraf @solana/web3.js @solana/spl-token axios stripe dotenv

:: Iniciar el bot
echo.
echo ========================================
echo INICIANDO QUANTUM TRADING BOT
echo ========================================
echo.
echo El bot se iniciará con:
echo - Webhook en puerto 3000
echo - Estado persistente
echo - Copy Trading activo
echo.

:: Usar el archivo .env.quantum
set ENV_FILE=.env.quantum

:: Iniciar el bot definitivo
node quantum-bot-definitivo.js

pause