# 🚀 GUÍA COMPLETA DE CONFIGURACIÓN DE STRIPE

## 📋 TUS OPCIONES

### ✅ OPCIÓN 1: Script Automático (MÁS FÁCIL)

Usa el script que he creado para configurar todo automáticamente:

```bash
# 1. Instalar Stripe CLI
# Windows (con Scoop):
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Mac (con Homebrew):
brew install stripe/stripe-cli/stripe

# Linux:
# Descarga desde: https://github.com/stripe/stripe-cli/releases/latest

# 2. Ejecutar script de configuración
bash setup-stripe.sh
```

El script te guiará para:
- ✅ Login en Stripe
- ✅ Crear productos automáticamente
- ✅ Crear precios (mensual y anual)
- ✅ Generar archivo .env con los Price IDs
- ✅ Configurar webhook local

**⏱️ Tiempo: 5 minutos**

---

### 🖱️ OPCIÓN 2: Configuración Manual (Dashboard)

#### PASO 1: Obtener tus claves de Stripe

**Ya tienes configuradas:**
```
✅ STRIPE_SECRET_KEY=sk_live_51RDFR...
✅ STRIPE_PUBLISHABLE_KEY=pk_live_51RDFR...
```

#### PASO 2: Crear Productos en Dashboard

1. **Ve a:** https://dashboard.stripe.com/products
2. **Asegúrate de estar en "Live mode"** (esquina superior derecha)

---

**PRODUCTO 1: GuionIA Pro**

Click en **"+ Add product"**

```
Nombre: GuionIA Pro
Descripción: 50 generaciones/día, guiones hasta 120 min, todos los formatos, sin marca de agua
```

**Agregar Precios:**

1. **Precio Mensual:**
   - Amount: `19` USD
   - Billing period: `Monthly`
   - Click "Add another price" para añadir el anual
   - **Copia el Price ID** (price_XXXXX)

2. **Precio Anual:**
   - Amount: `190` USD
   - Billing period: `Yearly`
   - **Copia el Price ID** (price_YYYYY)

Click **"Save product"**

---

**PRODUCTO 2: GuionIA Enterprise**

Click en **"+ Add product"**

```
Nombre: GuionIA Enterprise
Descripción: Generaciones ilimitadas, API access, whitelabel, soporte prioritario
```

**Agregar Precios:**

1. **Precio Mensual:**
   - Amount: `99` USD
   - Billing period: `Monthly`
   - **Copia el Price ID** (price_ZZZZZ)

2. **Precio Anual:**
   - Amount: `990` USD
   - Billing period: `Yearly`
   - **Copia el Price ID** (price_WWWWW)

Click **"Save product"**

---

#### PASO 3: Actualizar .env.production

Edita el archivo `.env.production` y reemplaza los placeholders:

```bash
STRIPE_PRICE_PRO_MONTHLY=price_XXXXX          # ← Pega aquí el Price ID
STRIPE_PRICE_PRO_YEARLY=price_YYYYY           # ← Pega aquí el Price ID
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_ZZZZZ   # ← Pega aquí el Price ID
STRIPE_PRICE_ENTERPRISE_YEARLY=price_WWWWW    # ← Pega aquí el Price ID
```

---

#### PASO 4: Configurar Webhook

1. **Ve a:** https://dashboard.stripe.com/webhooks
2. Click en **"+ Add endpoint"**

```
Endpoint URL: https://guion-youtube-ia.netlify.app/api/stripe/webhook
Description: GuionIA Production Webhook
```

3. **Selecciona estos eventos:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

4. Click **"Add endpoint"**

5. **Copia el Signing Secret** (empieza con `whsec_`)

6. Agrégalo a `.env.production`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX
```

---

#### PASO 5: Configurar Variables en Netlify

```bash
# Opción A: CLI
netlify env:set STRIPE_SECRET_KEY "sk_live_51RDFR..."
netlify env:set STRIPE_PUBLISHABLE_KEY "pk_live_51RDFR..."
netlify env:set STRIPE_PRICE_PRO_MONTHLY "price_XXXXX"
netlify env:set STRIPE_PRICE_PRO_YEARLY "price_YYYYY"
netlify env:set STRIPE_PRICE_ENTERPRISE_MONTHLY "price_ZZZZZ"
netlify env:set STRIPE_PRICE_ENTERPRISE_YEARLY "price_WWWWW"
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_XXXXXXXXX"
netlify env:set APP_URL "https://guion-youtube-ia.netlify.app"

# Opción B: Dashboard
# 1. Ve a tu sitio en Netlify
# 2. Site settings → Environment variables
# 3. Agrega cada variable manualmente
```

---

#### PASO 6: Activar Customer Portal

1. **Ve a:** https://dashboard.stripe.com/settings/billing/portal
2. Click en **"Activate"**
3. Configura qué pueden hacer los clientes:
   - ✅ Cancel subscriptions
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Switch plans

---

#### PASO 7: Deploy y Testing

```bash
# 1. Deploy a Netlify
git add .
git commit -m "🔧 Configurar Stripe con claves live"
git push origin main

# 2. Esperar deploy automático

# 3. Probar flujo de pago
# Ve a: https://guion-youtube-ia.netlify.app/pricing.html

# 4. Usa una tarjeta de prueba (si estás en test mode)
# Número: 4242 4242 4242 4242
# Fecha: Cualquier fecha futura
# CVC: Cualquier 3 dígitos
```

---

### 🧪 OPCIÓN 3: Modo TEST primero (Recomendado)

**Ventajas:**
- ✅ No arriesgas cobros reales
- ✅ Pruebas ilimitadas gratis
- ✅ Fácil de configurar
- ✅ Puedes cambiar a Live después

**Ya creé el archivo `.env.test` con la configuración**

1. **Ve a:** https://dashboard.stripe.com/test/apikeys
2. Copia las **test keys** (sk_test_... y pk_test_...)
3. Pégalas en `.env.test`
4. Sigue los mismos pasos que OPCIÓN 2 pero en **test mode**
5. Usa precios bajos ($1, $5) para testing

---

## 📊 VERIFICAR CONFIGURACIÓN

### ✅ Checklist

Marca cada item cuando lo completes:

- [ ] Productos creados en Stripe
- [ ] 4 Price IDs copiados
- [ ] `.env.production` actualizado con Price IDs
- [ ] Webhook configurado en Stripe
- [ ] Webhook Secret copiado a `.env.production`
- [ ] Variables configuradas en Netlify
- [ ] Customer Portal activado
- [ ] Deploy realizado
- [ ] Pago de prueba exitoso
- [ ] Webhook recibido correctamente

### 🧪 Testing Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables locales
cp .env.test .env

# 3. En una terminal, escuchar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. Copiar el webhook secret que aparece (whsec_...)
# y agregarlo a .env como STRIPE_WEBHOOK_SECRET

# 5. En otra terminal, iniciar servidor
npm start

# 6. Abrir navegador
# http://localhost:3000/pricing.html

# 7. Probar checkout con tarjeta de prueba
# 4242 4242 4242 4242
```

---

## 🆘 PROBLEMAS COMUNES

### Error: "No such price"
**Solución:** Verifica que los Price IDs sean correctos y que coincidan con el modo (test/live)

### Webhook no funciona
**Solución:**
1. Verifica que la URL sea accesible públicamente
2. Chequea que el Webhook Secret sea correcto
3. Revisa los logs en: https://dashboard.stripe.com/webhooks

### Pago exitoso pero tier no se actualiza
**Solución:**
1. Revisa los logs del webhook en Stripe Dashboard
2. Verifica que el evento `checkout.session.completed` se esté recibiendo
3. Por ahora usa la memoria (sin DB), en producción implementa el schema SQL

---

## 📞 SOPORTE

- **Docs Stripe:** https://stripe.com/docs
- **Dashboard:** https://dashboard.stripe.com
- **Logs webhooks:** https://dashboard.stripe.com/webhooks
- **Status Stripe:** https://status.stripe.com

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE CONFIGURAR

1. **Probar el flujo completo** end-to-end
2. **Monitorear los primeros pagos** en Stripe Dashboard
3. **Configurar emails transaccionales** (opcional)
4. **Implementar base de datos** (schema-monetization.sql)
5. **Agregar analytics** para trackear conversiones

---

## 📈 MEJORAS FUTURAS

- [ ] Integrar base de datos para persistencia real
- [ ] Sistema de facturación automática
- [ ] Emails personalizados post-compra
- [ ] Panel de usuario para gestionar suscripción
- [ ] Analytics de conversión
- [ ] A/B testing de precios
- [ ] Programa de referidos
- [ ] Descuentos y cupones

---

¡Listo! Elige la opción que prefieras y empieza 🚀
