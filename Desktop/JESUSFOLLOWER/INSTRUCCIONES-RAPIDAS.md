# 🚀 Bot de Trading REAL - Guía Rápida

## ✅ Estado Actual
- **Bot ACTIVO** en mainnet
- **Balance:** 0.1100 SOL detectado
- **Trading:** ACTIVADO por defecto
- **Canal monitoreado:** @cryptoyeezuscalls

## 🎯 COMANDOS PRINCIPALES

### 💰 Ver Balance
```
/balance
```
Muestra tu SOL y todos los tokens

### 📊 Ver Posiciones
```
/posiciones
```
Muestra todas tus posiciones abiertas con PnL

### 💸 Comprar Manualmente
```
/comprar So11111111111111111111111111111111111111112 0.05
```
Compra 0.05 SOL de un token

### 🔄 Vender Tokens
```
/vender So11111111111111111111111111111111111111112 50
```
Vende el 50% de los tokens (si no pones porcentaje, vende todo)

### 📡 Gestionar Canales
```
/canales                    # Ver canales
/canales agregar @nombre     # Agregar canal
/canales quitar @nombre      # Quitar canal
```

### 🔄 Pausar/Activar Trading
```
/estado
```
Cambia entre ACTIVADO y PAUSADO

## ⚡ FUNCIONES AUTOMÁTICAS

1. **Monitorea** los canales configurados
2. **Detecta** direcciones de tokens automáticamente
3. **Analiza** liquidez (mínimo $10,000)
4. **Compra** automáticamente si cumple criterios
5. **Ejecuta** swaps via Jupiter API
6. **Confirma** transacciones en mainnet

## 💸 CONFIGURACIÓN

- **Monto de compra:** 0.01 SOL por defecto
- **Slippage:** 10%
- **Liquidez mínima:** $10,000 USD
- **RPC:** Helius (configurado)

## 🔗 LINKS ÚTILES

- **Solscan:** https://solscan.io/
- **Jupiter:** https://jup.ag/
- **DexScreener:** https://dexscreener.com/

## ⚠️ ADVERTENCIAS

1. **ESTO ES DINERO REAL** - El bot opera con fondos reales
2. **Las comisiones son aproximadas 0.2-0.3%** por trade
3. **Siempre hay riesgo en trading de memecoins**
4. **Empieza con cantidades pequeñas**

## 🔄 SI EL BOT FALLA

1. Cierra el terminal (Ctrl+C)
2. Vuelve a iniciar: `node bot-trading-real.js`
3. Revisa tu conexión a internet
4. Verifica que tienes SOL para fees

## 📱 El bot está corriendo ahora mismo!
Ve a Telegram y prueba los comandos.