@echo off
echo.
echo ==========================================
echo   PUSHING A GITHUB CON DESKTOP
echo ==========================================
echo.

cd /d "%~dp0"

echo Abriendo GitHub Desktop...
start "" "C:\Users\Usuario\AppData\Local\GitHubDesktop\GitHubDesktop.exe" --open-in-current-branch "%cd%"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo   INSTRUCCIONES:
echo ==========================================
echo.
echo 1. GitHub Desktop se está abriendo...
echo 2. Verás tu commit listo para hacer push
echo 3. Click en el botón "Push origin" arriba
echo 4. Espera 10-20 segundos
echo 5. ¡Listo! Tu código estará en GitHub
echo.
echo Después vuelve aquí para deployar en Netlify
echo.
pause

cls
echo.
echo ==========================================
echo   INSTALANDO NETLIFY CLI
echo ==========================================
echo.

call npm install -g netlify-cli

echo.
echo ==========================================
echo   DEPLOYANDO EN NETLIFY
echo ==========================================
echo.

echo Iniciando login en Netlify...
echo Se abrirá tu navegador para autenticarte
timeout /t 2 /nobreak >nul

call netlify login

echo.
echo Deployando tu proyecto...
call netlify deploy --prod --dir=public

echo.
echo ==========================================
echo   ✅ DEPLOY COMPLETADO!
echo ==========================================
echo.
echo Tu aplicación está online!
echo.
pause
