#!/bin/bash

# ============================================
# SCRIPT PARA CONFIGURAR VARIABLES EN NETLIFY
# ============================================

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 CONFIGURAR VARIABLES DE ENTORNO EN NETLIFY            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar si Netlify CLI está instalado
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI no está instalado."
    echo ""
    echo "📥 Instalar Netlify CLI:"
    echo "   npm install -g netlify-cli"
    echo ""
    read -p "Presiona ENTER cuando hayas instalado Netlify CLI..."
fi

echo "🔐 Configurando variables de entorno en Netlify..."
echo ""

# Login en Netlify
echo "📝 Paso 1: Login en Netlify"
netlify login

echo ""
echo "✅ Login completado"
echo ""

# Link al sitio (si no está linkeado)
echo "🔗 Paso 2: Vinculando con tu sitio de Netlify"
netlify link

echo ""
echo "📤 Paso 3: Subiendo variables de entorno..."
echo ""

# Configurar variables una por una
# IMPORTANTE: Reemplaza estos valores con tus claves reales de Stripe
netlify env:set STRIPE_SECRET_KEY "sk_live_XXXXXXXXXXXXXXXXXXXXXX"
echo "✅ STRIPE_SECRET_KEY configurada"

netlify env:set STRIPE_PUBLISHABLE_KEY "pk_live_XXXXXXXXXXXXXXXXXXXXXX"
echo "✅ STRIPE_PUBLISHABLE_KEY configurada"

netlify env:set STRIPE_PRICE_PRO_MONTHLY "price_1SXK4XAVSDGmQNln8KZsYwlt"
echo "✅ STRIPE_PRICE_PRO_MONTHLY configurada"

netlify env:set STRIPE_PRICE_PRO_YEARLY "price_1SXK2oAVSDGmQNlngUuIynRz"
echo "✅ STRIPE_PRICE_PRO_YEARLY configurada"

netlify env:set STRIPE_PRICE_ENTERPRISE_MONTHLY "price_1SXK67AVSDGmQNlnZEdLAqmm"
echo "✅ STRIPE_PRICE_ENTERPRISE_MONTHLY configurada"

netlify env:set STRIPE_PRICE_ENTERPRISE_YEARLY "price_1SXK67AVSDGmQNlnZEdLAqmm"
echo "✅ STRIPE_PRICE_ENTERPRISE_YEARLY configurada"

netlify env:set STRIPE_WEBHOOK_SECRET "whsec_AF9EUK33V4aQaJcF1s9MPMPWPj18aGvq"
echo "✅ STRIPE_WEBHOOK_SECRET configurada"

netlify env:set APP_URL "https://guion-youtube-ia.netlify.app"
echo "✅ APP_URL configurada"

netlify env:set NODE_ENV "production"
echo "✅ NODE_ENV configurada"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🎉 VARIABLES CONFIGURADAS EN NETLIFY                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Todas las variables de Stripe están configuradas"
echo ""
echo "🔗 Próximos pasos:"
echo ""
echo "   1. Hacer deploy:"
echo "      git add ."
echo "      git commit -m '🔧 Configurar Stripe'"
echo "      git push origin main"
echo ""
echo "   2. Verificar variables en dashboard:"
echo "      netlify open:admin"
echo "      → Site settings → Environment variables"
echo ""
echo "   3. Probar pagos en:"
echo "      https://guion-youtube-ia.netlify.app/pricing.html"
echo ""
