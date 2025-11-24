@echo off
echo.
echo ========================================
echo   DEPLOY AUTOMATICO A GITHUB Y NETLIFY
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando GitHub Desktop...
where github >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ GitHub Desktop encontrado
    echo Abriendo GitHub Desktop...
    start "" "C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
    echo.
    echo INSTRUCCIONES:
    echo 1. En GitHub Desktop, selecciona este repositorio
    echo 2. Click en "Push origin" arriba a la derecha
    echo 3. Espera a que termine
    echo 4. Vuelve aquí y presiona cualquier tecla
    pause >nul
) else (
    echo ⚠️ GitHub Desktop no encontrado
    echo.
    echo OPCION 1: Instala GitHub Desktop
    echo https://desktop.github.com
    echo.
    echo OPCION 2: Usa token personal
    echo Lee: PUSH_INSTRUCTIONS.md
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando push...
git log origin/main..HEAD >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ Aún hay commits pendientes de push
    echo Por favor completa el push en GitHub Desktop
    pause
    exit /b 1
) else (
    echo ✅ Push completado
)

echo.
echo [3/4] Preparando deploy en Netlify...
echo.
echo Visita: https://app.netlify.com
echo.
echo PASOS:
echo 1. Login con GitHub
echo 2. "Add new site" → "Import an existing project"
echo 3. Selecciona: Guionesnachoweb3
echo 4. Build command: echo "Build complete"
echo 5. Publish directory: public
echo 6. Environment variables:
echo    GROQ_API_KEY = tu_api_key_de_groq_aqui
echo 7. Click "Deploy site"
echo.

pause

echo.
echo [4/4] Verificando Netlify CLI...
where netlify >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Netlify CLI encontrado
    echo.
    choice /c YN /m "¿Quieres deployar con Netlify CLI ahora?"
    if %errorlevel% equ 1 (
        echo.
        echo Deployando...
        netlify deploy --prod
    )
) else (
    echo ⚠️ Netlify CLI no instalado
    echo.
    choice /c YN /m "¿Quieres instalar Netlify CLI?"
    if %errorlevel% equ 1 (
        echo.
        echo Instalando...
        npm install -g netlify-cli
        echo.
        echo Iniciando login...
        netlify login
        echo.
        echo Deployando...
        netlify deploy --prod
    )
)

echo.
echo ========================================
echo   ✅ DEPLOY COMPLETADO
echo ========================================
echo.
echo Tu app está online en:
echo https://TU-SITIO.netlify.app
echo.
echo Cambia el nombre en Netlify dashboard:
echo Site settings → Site details → Change site name
echo.
pause
