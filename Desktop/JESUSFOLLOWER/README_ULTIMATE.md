# JESUS FOLLOWER BOT ULTIMATE 🚀

## 📋 Descripción

La versión definitiva y más completa del bot de trading para Solana que combina las mejores características de las 3 versiones anteriores:

- **UX superior** de `bot-final-con-canales.js`
- **Sistema de pagos** de `bot-premium-vendedor.js`
- **Integración DEX real** de `bot-definitivo.js`

## ✨ Características Principales

### 🎯 Trading Automático
- **Copy Trading** desde señales de @cryptoyeezuscalls
- **Integración real** con Pump.fun y Raydium
- **Multi-wallet** por usuario (hasta 10 en plan Elite)
- **Estrategias de salida** configurables
- **Stop Loss** automático

### 💳 Sistema de Premium
- **4 Tiers disponibles**: FREE, BASIC, PRO, ELITE
- **Pagos en SOL** con confirmación automática
- **Características progresivas** por nivel
- **Sistema de referidos** con comisiones

### 🛡️ Seguridad
- **Validación de direcciones** Solana
- **Gestión segura de claves** privadas
- **Persistencia de datos** en archivos JSON
- **Backup automático** de wallets

### 📊 Dashboard y Analytics
- **Posiciones en tiempo real**
- **PnL tracking**
- **Historial de trades**
- **Estadísticas para admin**

## 🚀 Instalación

### Prerrequisitos
```bash
Node.js 16+
NPM 7+
```

### 1. Clonar e instalar dependencias
```bash
cd JESUSFOLLOWER
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env`:
```env
# Bot Token de Telegram
BOT_TOKEN= TU_BOT_TOKEN

# RPC URL de Solana
RPC_URL=https://api.mainnet-beta.solana.com

# Admin Chat ID
ADMIN_CHAT_ID=TU_ID_DE_TELEGRAM

# Wallet para pagos
PAYMENT_WALLET=TU_WALLET_SOL
```

### 3. Iniciar el bot
```bash
node JESUS_FOLLOWER_BOT_ULTIMATE.js
```

## 📖 Comandos del Bot

### 🔥 Principales
- `/start` - Iniciar y ver menú principal
- `/premium` - Ver planes disponibles
- `/createwallet` - Crear nueva wallet
- `/buy <TOKEN> <CANTIDAD>` - Comprar token
- `/sell <POSICION> <PORCENTAJE>` - Vender posición
- `/positions` - Ver posiciones activas

### 💳 Pagos
- `/payment <MONTO>` - Iniciar pago
- `/admin` - Panel de administrador

### ⚙️ Configuración
- `/settings` - Ver configuración
- `/setamount <MONTO>` - Cambiar monto default
- `/copytrade <on/off>` - Activar copy trade
- `/autocopy <on/off>` - Auto copiar señales

### 👥 Referidos
- `/referrals` - Ver referidos y ganancias

## 💡 Planes y Precios

| Plan | Precio | Wallets | Límite Trading | Features |
|------|--------|---------|---------------|----------|
| FREE | $0 | 1 | $50 | Señales básicas |
| BASIC | 0.01 SOL | 3 | $250 | Copy trade |
| PRO | 0.05 SOL | 5 | $1,000 | Auto-venta |
| ELITE | 0.1 SOL | 10 | $5,000 | IA, Soporte VIP |

## 🔧 Arquitectura Técnica

### Componentes
- **Bot Framework**: Telegraf.js
- **Blockchain**: Solana Web3.js
- **APIs**: Pump.fun, DexScreener
- **Persistencia**: JSON Files
- **RPC**: Helius

### Flujo de Trading
1. Monitorea señales del canal
2. Valida token y liquidez
3. Ejecuta trade según configuración
4. Gestiona posiciones y ventas
5. Actualiza portafolio

## 📝 Mejoras Clave vs Versiones Anteriores

### vs bot-final-con-canales.js
- ✅ Trading real (no simulado)
- ✅ Mejor sistema de pagos
- ✅ Integración con DEXs

### vs bot-premium-vendedor.js
- ✅ Código más limpio y modular
- ✅ Sin errores en getSettings()
- ✅ Mejor gestión de estado

### vs bot-definitivo.js
- ✅ Sistema de usuarios completo
- ✅ UI/UX superior con botones
- ✅ Sistema de monetización

## 🚨 Advertencias

1. **Trading con fondos reales** - Empiece con cantidades pequeñas
2. **Riesgo de pérdida** - Nunca invierta más de lo que puede perder
3. **Volatilidad** - Las memecoins son extremadamente volátiles
4. **APIs externas** - Pueden fallar o tener límites

## 🛠️ Mantenimiento

### Backup automático
- Cada 5 minutos se guardan los datos
- Archivos de logs en carpeta `/logs`
- Wallets con backup en `wallets_backup.json`

### Monitoreo
```bash
# Ver logs
tail -f logs/bot.log

# Ver procesos PM2
pm2 list

# Reiniciar bot
pm2 restart JF-BOT
```

## 📞 Soporte

Para soporte o reportar bugs:
- Telegram: @admin_username
- Email: support@jesusfollower.com
- Issues: GitHub Issues

## 📄 Licencia

MIT License - Ver archivo LICENSE

---

**⚠️ ADVERTENCIA**: Este bot es para propósitos educativos. El trading de criptomonedas conlleva un alto riesgo de pérdida. Use bajo su propio riesgo.