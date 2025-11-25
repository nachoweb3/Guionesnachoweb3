# ============================================
# SCRIPT DE CONFIGURACIÓN DE STRIPE (Windows)
# ============================================

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  💳 CONFIGURACIÓN DE STRIPE PARA WINDOWS                  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si Stripe CLI está instalado
$stripePath = Get-Command stripe -ErrorAction SilentlyContinue

if (-not $stripePath) {
    Write-Host "⚠️  Stripe CLI no está instalado." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📥 Para instalar Stripe CLI en Windows:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Opción 1: Con Scoop" -ForegroundColor White
    Write-Host "   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git"
    Write-Host "   scoop install stripe"
    Write-Host ""
    Write-Host "   Opción 2: Descarga directa" -ForegroundColor White
    Write-Host "   https://github.com/stripe/stripe-cli/releases/latest"
    Write-Host ""

    $install = Read-Host "¿Quieres abrir la página de descarga? (s/n)"
    if ($install -eq "s") {
        Start-Process "https://github.com/stripe/stripe-cli/releases/latest"
    }

    Write-Host ""
    Write-Host "Después de instalar, ejecuta este script nuevamente." -ForegroundColor Yellow
    exit
}

Write-Host "✅ Stripe CLI encontrado" -ForegroundColor Green
Write-Host ""

# Login
Write-Host "🔐 Paso 1: Login en Stripe" -ForegroundColor Cyan
Write-Host "   Esto abrirá tu navegador para autenticarte" -ForegroundColor Gray
Write-Host ""

stripe login

Write-Host ""
Write-Host "✅ Login completado!" -ForegroundColor Green
Write-Host ""

# Seleccionar modo
Write-Host "🎯 Paso 2: Selecciona el modo" -ForegroundColor Cyan
Write-Host "   1) Test mode (recomendado para empezar)" -ForegroundColor White
Write-Host "   2) Live mode (producción)" -ForegroundColor White
Write-Host ""

$mode = Read-Host "Selecciona (1 o 2)"

if ($mode -eq "1") {
    $modeFlag = "--test-mode"
    $modeName = "TEST"
    $pricePro = 100    # $1.00
    $priceProYear = 500    # $5.00
    $priceEnt = 200    # $2.00
    $priceEntYear = 1000   # $10.00
    $envFile = ".env.test"
} else {
    $modeFlag = ""
    $modeName = "LIVE"
    $pricePro = 1900   # $19.00
    $priceProYear = 19000  # $190.00
    $priceEnt = 9900   # $99.00
    $priceEntYear = 99000  # $990.00
    $envFile = ".env.production"
}

Write-Host ""
Write-Host "🏗️  Paso 3: Creando productos en modo $modeName..." -ForegroundColor Cyan
Write-Host ""

# Crear producto Pro
Write-Host "📦 Creando producto: GuionIA Pro" -ForegroundColor Yellow
$cmdPro = "stripe products create --name=`"GuionIA Pro`" --description=`"50 generaciones/día, guiones hasta 120 min, todos los formatos, sin marca de agua`" $modeFlag --format=json"
$productPro = Invoke-Expression $cmdPro | ConvertFrom-Json
$productProId = $productPro.id
Write-Host "   ✅ Producto creado: $productProId" -ForegroundColor Green

# Precio mensual Pro
Write-Host "   💵 Creando precio mensual..." -ForegroundColor Gray
$cmdPriceProMonthly = "stripe prices create --product=`"$productProId`" --unit-amount=$pricePro --currency=usd --recurring[interval]=month $modeFlag --format=json"
$priceProMonthly = Invoke-Expression $cmdPriceProMonthly | ConvertFrom-Json
$priceProMonthlyId = $priceProMonthly.id
Write-Host "   ✅ Precio mensual: $priceProMonthlyId" -ForegroundColor Green

# Precio anual Pro
Write-Host "   💵 Creando precio anual..." -ForegroundColor Gray
$cmdPriceProYearly = "stripe prices create --product=`"$productProId`" --unit-amount=$priceProYear --currency=usd --recurring[interval]=year $modeFlag --format=json"
$priceProYearly = Invoke-Expression $cmdPriceProYearly | ConvertFrom-Json
$priceProYearlyId = $priceProYearly.id
Write-Host "   ✅ Precio anual: $priceProYearlyId" -ForegroundColor Green

# Crear producto Enterprise
Write-Host ""
Write-Host "📦 Creando producto: GuionIA Enterprise" -ForegroundColor Yellow
$cmdEnt = "stripe products create --name=`"GuionIA Enterprise`" --description=`"Generaciones ilimitadas, API access, whitelabel, soporte prioritario`" $modeFlag --format=json"
$productEnt = Invoke-Expression $cmdEnt | ConvertFrom-Json
$productEntId = $productEnt.id
Write-Host "   ✅ Producto creado: $productEntId" -ForegroundColor Green

# Precio mensual Enterprise
Write-Host "   💵 Creando precio mensual..." -ForegroundColor Gray
$cmdPriceEntMonthly = "stripe prices create --product=`"$productEntId`" --unit-amount=$priceEnt --currency=usd --recurring[interval]=month $modeFlag --format=json"
$priceEntMonthly = Invoke-Expression $cmdPriceEntMonthly | ConvertFrom-Json
$priceEntMonthlyId = $priceEntMonthly.id
Write-Host "   ✅ Precio mensual: $priceEntMonthlyId" -ForegroundColor Green

# Precio anual Enterprise
Write-Host "   💵 Creando precio anual..." -ForegroundColor Gray
$cmdPriceEntYearly = "stripe prices create --product=`"$productEntId`" --unit-amount=$priceEntYear --currency=usd --recurring[interval]=year $modeFlag --format=json"
$priceEntYearly = Invoke-Expression $cmdPriceEntYearly | ConvertFrom-Json
$priceEntYearlyId = $priceEntYearly.id
Write-Host "   ✅ Precio anual: $priceEntYearlyId" -ForegroundColor Green

# Obtener claves
Write-Host ""
Write-Host "🔑 Paso 4: Obteniendo claves de API..." -ForegroundColor Cyan

if ($mode -eq "1") {
    $keysJson = stripe keys list $modeFlag --format=json | ConvertFrom-Json
    $secretKey = ($keysJson | Where-Object { $_.type -eq "secret" }).secret
    $publishableKey = ($keysJson | Where-Object { $_.type -eq "publishable" }).secret
} else {
    Write-Host ""
    Write-Host "⚠️  Para obtener las claves LIVE, ve a:" -ForegroundColor Yellow
    Write-Host "    https://dashboard.stripe.com/apikeys" -ForegroundColor White
    Write-Host ""
    $secretKey = Read-Host "Pega tu SECRET KEY (sk_live_...)"
    $publishableKey = Read-Host "Pega tu PUBLISHABLE KEY (pk_live_...)"
}

# Crear archivo .env
Write-Host ""
Write-Host "📝 Paso 5: Creando archivo $envFile..." -ForegroundColor Cyan

$envContent = @"
# Stripe Keys ($modeName mode)
STRIPE_SECRET_KEY=$secretKey
STRIPE_PUBLISHABLE_KEY=$publishableKey

# Price IDs
STRIPE_PRICE_PRO_MONTHLY=$priceProMonthlyId
STRIPE_PRICE_PRO_YEARLY=$priceProYearlyId
STRIPE_PRICE_ENTERPRISE_MONTHLY=$priceEntMonthlyId
STRIPE_PRICE_ENTERPRISE_YEARLY=$priceEntYearlyId

# Webhook Secret (configurar después)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX

# App URL
APP_URL=http://localhost:3000

NODE_ENV=development
PORT=3000
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "   ✅ Archivo $envFile creado" -ForegroundColor Green

# Resumen
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 CONFIGURACIÓN COMPLETADA                              ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 RESUMEN:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Productos creados:" -ForegroundColor White
Write-Host "   ✅ GuionIA Pro ($productProId)" -ForegroundColor Green
Write-Host "   ✅ GuionIA Enterprise ($productEntId)" -ForegroundColor Green
Write-Host ""
Write-Host "   Price IDs guardados en: $envFile" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. En una terminal PowerShell, ejecuta:" -ForegroundColor White
Write-Host "      stripe listen --forward-to localhost:3000/api/stripe/webhook" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Copia el webhook secret que aparece (whsec_...)" -ForegroundColor White
Write-Host "      y agrégalo a $envFile como STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "   3. En otra terminal, inicia el servidor:" -ForegroundColor White
Write-Host "      npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "   4. Abre tu navegador en:" -ForegroundColor White
Write-Host "      http://localhost:3000/pricing.html" -ForegroundColor Yellow
Write-Host ""

if ($mode -eq "1") {
    Write-Host "💳 Tarjetas de prueba:" -ForegroundColor Cyan
    Write-Host "   ✅ Éxito: 4242 4242 4242 4242" -ForegroundColor Green
    Write-Host "   ❌ Fallo: 4000 0000 0000 0002" -ForegroundColor Red
    Write-Host ""
    Write-Host "📚 Ver productos en dashboard:" -ForegroundColor Cyan
    Write-Host "   https://dashboard.stripe.com/test/products" -ForegroundColor Yellow
} else {
    Write-Host "📚 Ver productos en dashboard:" -ForegroundColor Cyan
    Write-Host "   https://dashboard.stripe.com/products" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona ENTER para salir..."
Read-Host
