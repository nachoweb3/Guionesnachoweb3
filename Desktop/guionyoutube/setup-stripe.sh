#!/bin/bash

# ============================================
# SCRIPT DE CONFIGURACIÓN AUTOMÁTICA DE STRIPE
# ============================================
# Este script te guía paso a paso para configurar Stripe

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  💳 CONFIGURACIÓN AUTOMÁTICA DE STRIPE                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar si Stripe CLI está instalado
if ! command -v stripe &> /dev/null; then
    echo "⚠️  Stripe CLI no está instalado."
    echo ""
    echo "📥 Instalar Stripe CLI:"
    echo "   Windows: scoop install stripe"
    echo "   Mac: brew install stripe/stripe-cli/stripe"
    echo "   Linux: https://stripe.com/docs/stripe-cli#install"
    echo ""
    read -p "Presiona ENTER cuando hayas instalado Stripe CLI..."
fi

echo "🔐 Paso 1: Login en Stripe"
echo "   Esto abrirá tu navegador para autenticarte"
echo ""
stripe login

echo ""
echo "✅ Login completado!"
echo ""

# Modo de operación
echo "🎯 Paso 2: Selecciona el modo"
echo "   1) Test mode (recomendado para empezar)"
echo "   2) Live mode (producción)"
read -p "Selecciona (1 o 2): " mode

if [ "$mode" = "1" ]; then
    MODE_FLAG="--test-mode"
    MODE_NAME="TEST"
    PRICE_PRO_MONTHLY=100  # $1.00 para testing
    PRICE_PRO_YEARLY=500   # $5.00 para testing
    PRICE_ENTERPRISE_MONTHLY=200  # $2.00 para testing
    PRICE_ENTERPRISE_YEARLY=1000  # $10.00 para testing
else
    MODE_FLAG=""
    MODE_NAME="LIVE"
    PRICE_PRO_MONTHLY=1900  # $19.00
    PRICE_PRO_YEARLY=19000  # $190.00
    PRICE_ENTERPRISE_MONTHLY=9900  # $99.00
    PRICE_ENTERPRISE_YEARLY=99000  # $990.00
fi

echo ""
echo "🏗️  Paso 3: Creando productos en modo $MODE_NAME..."
echo ""

# Crear producto Pro
echo "📦 Creando producto: GuionIA Pro"
PRODUCT_PRO=$(stripe products create \
  --name="GuionIA Pro" \
  --description="50 generaciones/día, guiones hasta 120 min, todos los formatos, sin marca de agua" \
  $MODE_FLAG \
  --format=json | jq -r '.id')

echo "   ✅ Producto creado: $PRODUCT_PRO"

# Crear precio mensual Pro
echo "   💵 Creando precio mensual..."
PRICE_PRO_MONTHLY_ID=$(stripe prices create \
  --product="$PRODUCT_PRO" \
  --unit-amount=$PRICE_PRO_MONTHLY \
  --currency=usd \
  --recurring[interval]=month \
  $MODE_FLAG \
  --format=json | jq -r '.id')

echo "   ✅ Precio mensual: $PRICE_PRO_MONTHLY_ID"

# Crear precio anual Pro
echo "   💵 Creando precio anual..."
PRICE_PRO_YEARLY_ID=$(stripe prices create \
  --product="$PRODUCT_PRO" \
  --unit-amount=$PRICE_PRO_YEARLY \
  --currency=usd \
  --recurring[interval]=year \
  $MODE_FLAG \
  --format=json | jq -r '.id')

echo "   ✅ Precio anual: $PRICE_PRO_YEARLY_ID"

# Crear producto Enterprise
echo ""
echo "📦 Creando producto: GuionIA Enterprise"
PRODUCT_ENTERPRISE=$(stripe products create \
  --name="GuionIA Enterprise" \
  --description="Generaciones ilimitadas, API access, whitelabel, soporte prioritario" \
  $MODE_FLAG \
  --format=json | jq -r '.id')

echo "   ✅ Producto creado: $PRODUCT_ENTERPRISE"

# Crear precio mensual Enterprise
echo "   💵 Creando precio mensual..."
PRICE_ENTERPRISE_MONTHLY_ID=$(stripe prices create \
  --product="$PRODUCT_ENTERPRISE" \
  --unit-amount=$PRICE_ENTERPRISE_MONTHLY \
  --currency=usd \
  --recurring[interval]=month \
  $MODE_FLAG \
  --format=json | jq -r '.id')

echo "   ✅ Precio mensual: $PRICE_ENTERPRISE_MONTHLY_ID"

# Crear precio anual Enterprise
echo "   💵 Creando precio anual..."
PRICE_ENTERPRISE_YEARLY_ID=$(stripe prices create \
  --product="$PRODUCT_ENTERPRISE" \
  --unit-amount=$PRICE_ENTERPRISE_YEARLY \
  --currency=usd \
  --recurring[interval]=year \
  $MODE_FLAG \
  --format=json | jq -r '.id')

echo "   ✅ Precio anual: $PRICE_ENTERPRISE_YEARLY_ID"

# Generar archivo .env
echo ""
echo "📝 Paso 4: Generando archivo .env..."

if [ "$mode" = "1" ]; then
    ENV_FILE=".env.test"
    SECRET_KEY=$(stripe keys list $MODE_FLAG --format=json | jq -r '.[] | select(.type=="secret") | .secret' | head -1)
    PUBLISHABLE_KEY=$(stripe keys list $MODE_FLAG --format=json | jq -r '.[] | select(.type=="publishable") | .secret' | head -1)
else
    ENV_FILE=".env.production"
    echo ""
    echo "⚠️  Para obtener las claves LIVE, ve a:"
    echo "    https://dashboard.stripe.com/apikeys"
    echo ""
    read -p "Pega tu SECRET KEY (sk_live_...): " SECRET_KEY
    read -p "Pega tu PUBLISHABLE KEY (pk_live_...): " PUBLISHABLE_KEY
fi

cat > "$ENV_FILE" << EOF
# Stripe Keys ($MODE_NAME mode)
STRIPE_SECRET_KEY=$SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$PUBLISHABLE_KEY

# Price IDs
STRIPE_PRICE_PRO_MONTHLY=$PRICE_PRO_MONTHLY_ID
STRIPE_PRICE_PRO_YEARLY=$PRICE_PRO_YEARLY_ID
STRIPE_PRICE_ENTERPRISE_MONTHLY=$PRICE_ENTERPRISE_MONTHLY_ID
STRIPE_PRICE_ENTERPRISE_YEARLY=$PRICE_ENTERPRISE_YEARLY_ID

# Webhook Secret (configurar después)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX

# App URL
APP_URL=http://localhost:3000
EOF

echo "   ✅ Archivo $ENV_FILE creado"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🎉 CONFIGURACIÓN COMPLETADA                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 RESUMEN:"
echo ""
echo "   Productos creados:"
echo "   ✅ GuionIA Pro ($PRODUCT_PRO)"
echo "   ✅ GuionIA Enterprise ($PRODUCT_ENTERPRISE)"
echo ""
echo "   Price IDs guardados en: $ENV_FILE"
echo ""
echo "🔗 Próximos pasos:"
echo ""
echo "   1. Configurar webhook:"
echo "      stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "   2. Copiar el webhook secret que aparece (whsec_...)"
echo "      y agregarlo a $ENV_FILE como STRIPE_WEBHOOK_SECRET"
echo ""
echo "   3. Iniciar servidor:"
echo "      npm start"
echo ""
echo "   4. Probar pagos en:"
echo "      http://localhost:3000/pricing.html"
echo ""

if [ "$mode" = "1" ]; then
    echo "💳 Tarjetas de prueba:"
    echo "   ✅ Éxito: 4242 4242 4242 4242"
    echo "   ❌ Fallo: 4000 0000 0000 0002"
    echo ""
fi

echo "📚 Ver productos en dashboard:"
if [ "$mode" = "1" ]; then
    echo "   https://dashboard.stripe.com/test/products"
else
    echo "   https://dashboard.stripe.com/products"
fi
echo ""
