# 💳 Configuración de Stripe para GuionIA

## Pasos para configurar Stripe completamente

### 1️⃣ Crear Productos en Stripe Dashboard

Ve a https://dashboard.stripe.com/products y crea 2 productos:

#### Producto 1: GuionIA Pro
- **Nombre:** GuionIA Pro
- **Descripción:** 50 generaciones/día, guiones hasta 120 min, sin marca de agua

**Precios:**
- **Mensual:** $19 USD/mes (recurrente)
  - Guarda el Price ID: `price_XXXXXXXXX`

- **Anual:** $190 USD/año (recurrente)
  - Guarda el Price ID: `price_YYYYYYYYY`

#### Producto 2: GuionIA Enterprise
- **Nombre:** GuionIA Enterprise
- **Descripción:** Generaciones ilimitadas, API access, soporte prioritario

**Precios:**
- **Mensual:** $99 USD/mes (recurrente)
  - Guarda el Price ID: `price_ZZZZZZZZZ`

- **Anual:** $990 USD/año (recurrente)
  - Guarda el Price ID: `price_WWWWWWWWW`

---

### 2️⃣ Configurar Variables de Entorno

Agrega los Price IDs a tu archivo `.env`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXX

# Price IDs (reemplaza con los tuyos)
STRIPE_PRICE_PRO_MONTHLY=price_XXXXXXXXX
STRIPE_PRICE_PRO_YEARLY=price_YYYYYYYYY
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_ZZZZZZZZZ
STRIPE_PRICE_ENTERPRISE_YEARLY=price_WWWWWWWWW

# Webhook Secret (lo obtendrás en el paso 3)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXX
```

**Agregar a Netlify:**
```bash
netlify env:set STRIPE_PRICE_PRO_MONTHLY price_XXXXXXXXX
netlify env:set STRIPE_PRICE_PRO_YEARLY price_YYYYYYYYY
netlify env:set STRIPE_PRICE_ENTERPRISE_MONTHLY price_ZZZZZZZZZ
netlify env:set STRIPE_PRICE_ENTERPRISE_YEARLY price_WWWWWWWWW
netlify env:set STRIPE_WEBHOOK_SECRET whsec_XXXXXXXXXXXXXXXXX
```

---

### 3️⃣ Configurar Webhooks

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en **"Add endpoint"**
3. **URL del endpoint:**
   ```
   https://guion-youtube-ia.netlify.app/api/stripe/webhook
   ```
4. **Eventos a escuchar:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. **Guardar Webhook Secret:**
   - Copia el "Signing secret" (empieza con `whsec_`)
   - Agrégalo como `STRIPE_WEBHOOK_SECRET` en `.env` y Netlify

---

### 4️⃣ Modo de Prueba (Test Mode)

**IMPORTANTE:** Por defecto, Stripe está en modo test. Para probarlo:

1. Usa las **test keys** en lugar de las live keys:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. Usa tarjetas de prueba de Stripe:
   - **Éxito:** `4242 4242 4242 4242`
   - **Declined:** `4000 0000 0000 0002`
   - **3D Secure:** `4000 0027 6000 3184`
   - Cualquier fecha futura, cualquier CVC

3. Crea productos de prueba con precios bajos ($1, $5, etc.)

---

### 5️⃣ Activar Modo Producción

Cuando estés listo para producción:

1. Completa la activación de tu cuenta Stripe
2. Cambia las keys de `test` a `live`
3. Crea los productos con precios reales
4. Actualiza las variables de entorno
5. Re-deploy la aplicación

---

### 6️⃣ Portal del Cliente (Customer Portal)

Stripe permite a los usuarios gestionar su suscripción:

1. Ve a https://dashboard.stripe.com/settings/billing/portal
2. Activa el Customer Portal
3. Configura qué pueden hacer los usuarios:
   - ✅ Cancelar suscripción
   - ✅ Ver historial de facturas
   - ✅ Actualizar método de pago
   - ✅ Cambiar plan

---

## 🧪 Testing Checklist

- [ ] Productos creados en Stripe Dashboard
- [ ] Price IDs agregados a variables de entorno
- [ ] Webhook configurado y funcionando
- [ ] Test de pago con tarjeta de prueba exitoso
- [ ] Verificar que el tier se actualiza después del pago
- [ ] Probar cancelación de suscripción
- [ ] Verificar emails de confirmación de Stripe

---

## 📝 Notas Importantes

1. **URLs de Producción:**
   - App: https://guion-youtube-ia.netlify.app
   - Success: https://guion-youtube-ia.netlify.app/success
   - Webhook: https://guion-youtube-ia.netlify.app/api/stripe/webhook

2. **Seguridad:**
   - NUNCA commitas las secret keys al repositorio
   - Usa variables de entorno siempre
   - Verifica signatures de webhooks

3. **Base de Datos:**
   - Actualmente usa almacenamiento en memoria
   - Para producción, implementa `schema-monetization.sql`
   - Conecta MySQL/PostgreSQL para persistencia real

---

## ❓ Troubleshooting

**Error: "No such price"**
- Verifica que los Price IDs sean correctos
- Asegúrate de usar test prices en test mode

**Webhook no funciona:**
- Verifica que la URL sea accesible públicamente
- Chequea que el webhook secret sea correcto
- Revisa los logs en Stripe Dashboard

**Pago exitoso pero tier no se actualiza:**
- Revisa los logs del webhook
- Verifica que el evento `checkout.session.completed` se esté recibiendo
- Implementa persistencia en base de datos

---

## 📞 Soporte

- Documentación Stripe: https://stripe.com/docs
- Dashboard Stripe: https://dashboard.stripe.com
- Logs de webhooks: https://dashboard.stripe.com/webhooks
