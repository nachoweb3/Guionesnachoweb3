# ============================================
# SCRIPT PARA CONFIGURAR VARIABLES EN NETLIFY (Windows)
# ============================================

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 CONFIGURAR VARIABLES DE ENTORNO EN NETLIFY            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar si Netlify CLI está instalado
$netlifyPath = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyPath) {
    Write-Host "⚠️  Netlify CLI no está instalado." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📥 Para instalar Netlify CLI:" -ForegroundColor Cyan
    Write-Host "   npm install -g netlify-cli" -ForegroundColor White
    Write-Host ""

    $install = Read-Host "¿Quieres instalarlo ahora? (s/n)"
    if ($install -eq "s") {
        npm install -g netlify-cli
        Write-Host ""
        Write-Host "✅ Netlify CLI instalado" -ForegroundColor Green
    } else {
        Write-Host "Instala Netlify CLI y ejecuta este script nuevamente." -ForegroundColor Yellow
        exit
    }
}

Write-Host "✅ Netlify CLI encontrado" -ForegroundColor Green
Write-Host ""

# Login en Netlify
Write-Host "📝 Paso 1: Login en Netlify" -ForegroundColor Cyan
Write-Host "   Esto abrirá tu navegador para autenticarte" -ForegroundColor Gray
Write-Host ""

netlify login

Write-Host ""
Write-Host "✅ Login completado" -ForegroundColor Green
Write-Host ""

# Link al sitio
Write-Host "🔗 Paso 2: Vinculando con tu sitio de Netlify" -ForegroundColor Cyan
netlify link

Write-Host ""
Write-Host "📤 Paso 3: Subiendo variables de entorno..." -ForegroundColor Cyan
Write-Host ""

# Configurar variables
# IMPORTANTE: Reemplaza estos valores con tus claves reales de Stripe
$variables = @{
    "STRIPE_SECRET_KEY" = "sk_live_XXXXXXXXXXXXXXXXXXXXXX"
    "STRIPE_PUBLISHABLE_KEY" = "pk_live_XXXXXXXXXXXXXXXXXXXXXX"
    "STRIPE_PRICE_PRO_MONTHLY" = "price_1SXK4XAVSDGmQNln8KZsYwlt"
    "STRIPE_PRICE_PRO_YEARLY" = "price_1SXK2oAVSDGmQNlngUuIynRz"
    "STRIPE_PRICE_ENTERPRISE_MONTHLY" = "price_1SXK67AVSDGmQNlnZEdLAqmm"
    "STRIPE_PRICE_ENTERPRISE_YEARLY" = "price_1SXK67AVSDGmQNlnZEdLAqmm"
    "STRIPE_WEBHOOK_SECRET" = "whsec_AF9EUK33V4aQaJcF1s9MPMPWPj18aGvq"
    "APP_URL" = "https://guion-youtube-ia.netlify.app"
    "NODE_ENV" = "production"
}

foreach ($key in $variables.Keys) {
    $value = $variables[$key]
    Write-Host "   Configurando $key..." -ForegroundColor Gray
    netlify env:set $key $value
    Write-Host "   ✅ $key configurada" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 VARIABLES CONFIGURADAS EN NETLIFY                     ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Todas las variables de Stripe están configuradas" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Hacer deploy:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Yellow
Write-Host "      git commit -m '🔧 Configurar Stripe'" -ForegroundColor Yellow
Write-Host "      git push origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Verificar variables en dashboard:" -ForegroundColor White
Write-Host "      netlify open:admin" -ForegroundColor Yellow
Write-Host "      → Site settings → Environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Probar pagos en:" -ForegroundColor White
Write-Host "      https://guion-youtube-ia.netlify.app/pricing.html" -ForegroundColor Yellow
Write-Host ""

Write-Host "Presiona ENTER para salir..."
Read-Host
