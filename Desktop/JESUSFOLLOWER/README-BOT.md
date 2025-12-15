# 🤖 Bot de Trading de Memecoins en Solana

## ✅ Estado del Bot
- **Bot funcionando** ✅
- Todos los comandos activados
- Modo trading configurable

## 🚀 Iniciar el Bot

### Opción 1: Directo
```bash
node bot-completo.js
```

### Opción 2: Con npm
```bash
npm start
```

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `/start` | Menú principal y estado |
| `/balance` | Ver balance real de la wallet |
| `/status` | Estado del bot y posiciones |
| `/manual <direccion>` | Comprar manualmente un token |
| `/toggle` | Activar/Desactivar modo trading |
| `/help` | Ayuda detallada |

## ⚙️ Configuración

El bot está configurado con:
- **Wallet:** `AGe4bMNRKSmN4cpLuQCtYZZ3kQFTr2Txtox5EfLBR2tK`
- **RPC:** Helius (configurado en .env)
- **Monto por compra:** 0.01 SOL
- **Slippage:** 10%
- **Canal monitoreado:** @cryptoyeezuscalls

## 🔄 Para Activar Trading Real

1. El bot inicia en **modo DEMO** por seguridad
2. Ejecuta `/toggle` en Telegram para activar trading real
3. El bot comenzará a monitorear el canal @cryptoyeezuscalls
4. Detectará automáticamente las direcciones de contrato

## 📊 Características

- ✅ Conexión a wallet de Solana
- ✅ Obtención de balance real en SOL
- ✅ Detección de tokens en DexScreener
- ✅ Análisis de liquidez y volumen
- ✅ Monitoreo de canal de Telegram
- ✅ Modo DEMO/Trading real
- ✅ Manejo de errores

## ⚠️ Advertencia

El trading de criptomonedas conlleva riesgos financieros. Este bot es una herramienta experimental. Usa siempre con precaución y nunca inviertas más de lo que estás dispuesto a perder.

## 🐛 Solución de Problemas

Si el bot no responde:
1. Verifica que el token en .env es correcto
2. Asegúrate de tener conexión a internet
3. Revisa que no haya otra instancia del bot corriendo

## 📝 Archivos Importantes

- `bot-completo.js` - Bot principal con todas las funciones
- `.env` - Configuración (BOT_TOKEN, SOLANA_RPC_URL, etc.)
- `keypair.json` - Clave privada de la wallet
- `package.json` - Dependencias del proyecto