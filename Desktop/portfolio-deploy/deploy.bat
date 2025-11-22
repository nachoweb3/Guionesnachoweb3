@echo off
echo 🚀 Starting Portfolio Deployment...
echo ==================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if Netlify CLI is installed
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Netlify CLI...
    npm install -g netlify-cli
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build the project
echo 🔨 Building the project...
call npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build successful!
) else (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Deploy to Netlify
echo 🌐 Deploying to Netlify...
call netlify deploy --prod

REM Check if deployment was successful
if %errorlevel% equ 0 (
    echo.
    echo 🎉 Deployment successful!
    echo 📊 Build stats:
    for %%I in (dist\style.min.css) do echo    CSS: %%~zI bytes
    for %%I in (dist\script.min.js) do echo    JS:  %%~zI bytes
    echo.
    echo ✨ Your portfolio is now live!
) else (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

pause