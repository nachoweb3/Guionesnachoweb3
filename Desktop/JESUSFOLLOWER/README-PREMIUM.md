# 🤖 JESUS FOLLOWER BOT - Sistema Premium

## 💎 Descripción

Bot de trading en Solana con sistema de suscripción por tiers. Cada usuario tiene su propia wallet y acceso según su plan de pago.

## 🚀 Características

### Sistema Multi-Wallet
- ✅ Cada usuario tiene su wallet individual
- 🔐 Claves privadas generadas únicamente para cada usuario
- 💳 Soporte para múltiples wallets según el tier
- 🔄 Sistema de depósitos y retiros

### Sistema de Pagos
- ⭐ **FREE** - 1 wallet, 3 posiciones, señales básicas
- 🟢 **BASIC** - 0.1 SOL/mes - 1 wallet, 10 posiciones, auto-trading básico
- 🔵 **PRO** - 0.5 SOL/mes - 3 wallets, posiciones ilimitadas, auto-trading avanzado
- 👑 **ELITE** - 1 SOL/mes - 10 wallets, todas las funciones, API access, soporte 24/7

### Funciones del Bot
- 📊 Trading de memecoins en Solana
- 🎯 Monitoreo de señales de canales
- 📈 Gestión de posiciones con PnL
- ⚙️ Configuración personalizada
- 🔄 Auto-trading configurable

## 📋 Requisitos

- Node.js 16+
- Bot Token de Telegram
- RPC de Solana (Helius recomendado)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repositorio>
cd JESUSFOLLOWER
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Variables de entorno necesarias**
```
BOT_TOKEN=Tu_token_de_telegram
SOLANA_RPC_URL=Tu_RPC_de_Solana
PAYMENT_WALLET_PUBLIC_KEY=Tu_wallet_para_pagos
GITHUB_PAGES_URL=Tu_URL_de_GitHub_Pages
```

## 🚀 Ejecución

### Bot Principal (con sistema de pagos)
```bash
npm run premium-vendedor
```

### Servidor de Pagos (API)
```bash
npm run server
```

### Usando PM2 (recomendado para producción)
```bash
# Iniciar bot con PM2
pm2 start ecosystem.config.json

# Ver logs
pm2 logs jesus-follower-bot

# Reiniciar
pm2 restart jesus-follower-bot

# Guardar configuración
pm2 save
```

## 📡 API Endpoints

### Verificar pago de usuario
```
GET /api/check-payment/:userId
```

### Iniciar pago
```
POST /api/initiate-payment
Body: { userId, tier, telegramId }
```

### Confirmar pago
```
POST /api/confirm-payment
Body: { paymentId, signature }
```

### Estadísticas
```
GET /api/stats
```

## 🎯 Comandos del Bot

### Generales
- `/start` - Iniciar y crear wallet
- `/plan` - Ver plan actual y límites
- `/upgrade` - Actualizar plan
- `/depositar` - Depositar SOL
- `/balance` - Ver balance
- `/posiciones` - Ver posiciones activas

### Trading
- `/buy <token> [monto]` - Comprar token
- `/sell <token> [porcentaje]` - Vender token
- `/pnl` - Ver ganancias/pérdidas

### Configuración
- `/stoploss <porcentaje>` - Configurar stop loss
- `/wallet` - Gestionar wallets

## 💰 Flujo de Pagos

1. **Usuario quiere upgrade**
   - Usa `/upgrade` o menú ⭐ Actualizar Plan

2. **Sistema genera pago**
   - Crea payment ID único
   - Muestra wallet para pago
   - Incluye memo/reference

3. **Usuario realiza pago**
   - Envía SOL a la wallet indicada
   - Incluye el payment ID en memo

4. **Sistema verifica**
   - Revisa blockchain por la transacción
   - Valida monto y destinatario
   - Confirma y activa tier

5. **Acceso inmediato**
   - Usuario obtiene acceso al nuevo tier
   - Funciones se desbloquean automáticamente

## 🔧 Configuración de GitHub Pages

1. **Subir frontend a GitHub Pages**
2. **Configurar variables de entorno**
3. **Conectar API del bot**
4. **Activar GitHub Pages**

## 📊 Estructura de Datos

### Usuario
```json
{
  "userId": "123456789",
  "tier": "pro",
  "paidUntil": "2024-01-15T00:00:00.000Z",
  "wallets": [
    {
      "publicKey": "ABC123...",
      "secretKey": [1,2,3...],
      "label": "Principal"
    }
  ],
  "positions": {
    "PEPE": {
      "tokenMint": "...",
      "cantidadTokens": 1000,
      "precioEntrada": 0.0001,
      "invertido": 0.1
    }
  }
}
```

### Pago
```json
{
  "paymentId": "payment_123_456",
  "userId": "456",
  "telegramId": "123456789",
  "tier": "pro",
  "amount": 0.5,
  "status": "confirmed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "confirmedAt": "2024-01-01T00:05:00.000Z",
  "signature": "abc123..."
}
```

## 🔒 Seguridad

- ✅ Claves privadas encriptadas
- ✅ Verificación de transacciones en blockchain
- ✅ Validación de montos y destinatarios
- ✅ Sistema de pagos sin intermediarios
- ✅ Logs de todas las transacciones

## 🚨 Consideraciones

1. **Persistencia**: Datos guardados en JSON (producción: MongoDB)
2. **Escalabilidad**: PM2 para múltiples instancias
3. **Monitoring**: Logs en archivos separados
4. **Backups**: Automático cada 5 minutos

## 📞 Soporte

- 👑 Elite: Soporte 24/7 via chat privado
- 🔵 Pro: Respuesta en < 2 horas
- 🟢 Basic: Respuesta en < 24 horas
- ⚪ Free: Comunidad

## 🔄 Actualizaciones

El bot verifica pagos cada 5 minutos y actualiza los tiers automáticamente. Los usuarios pueden verificar su estado con `/plan`.

---

⚠️ **Importante**: Guarda las claves privadas de forma segura. No compartas el archivo .env ni las claves de los usuarios.

💡 **Tip**: Para producción, considera usar una base de datos como MongoDB y Redis para caché.