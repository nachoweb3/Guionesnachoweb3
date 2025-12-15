# 🤖 Solana Memecoin Trading Bot

Bot automático para comprar y vender memecoins en Solana basado en llamadas del canal Telegram `cryptoyeezuscalls`.

## ⚙️ Características

- 🚀 **Detección automática**: Escucha el canal de Telegram y detecta nuevas direcciones de contrato
- 🔄 **Compra automática**: Realiza compras automáticas de tokens detectados
- 💰 **Estrategia de venta inteligente**:
  - Vende 60% cuando el token duplique su valor
  - Venta progresiva del restante según subidas
  - Stop loss automático por caídas bruscas
- 📊 **Monitoreo en tiempo real**: Seguimiento constante de precios
- 🔒 **Seguridad**: Configurable con stop loss y slippage

## 📋 Requisitos

1. **Node.js** (v16 o superior)
2. **Solana CLI** instalado
3. **Wallet de Solana** con fondos
4. **Bot de Telegram** (crear en @BotFather)
5. **API Key de Helius RPC** o similar

## 🚀 Instalación

1. Clonar el repositorio:
```bash
git clone <repositorio>
cd solana-memecoin-trading-bot
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables:

### Crear archivo de configuración
Crea un archivo `config.js` con tu configuración:

```javascript
module.exports = {
    botToken: 'TU_BOT_TOKEN_DE_TELEGRAM',
    solanaRpc: 'https://mainnet.helius-rpc.com/?api-key=TU_API_KEY',
    walletPrivateKey: 'TU_CLAVE_PRIVADA_EN_FORMATO_BASE58',
    slippage: 10, // Porcentaje de slippage
    buyAmount: 0.01, // Cantidad de SOL por compra
};
```

4. Asegurarte de tener la clave privada de tu wallet:
   - Si usas Solana CLI, tu clave está en `~/.config/solana/id.json`
   - O exporta tu clave privada en formato base58

## ⚠️ ADVERTENCIA IMPORTANTE

**ESTE BOT ES PARA USO EDUCATIVO. EL TRADING DE MEMECOINS ES EXTREMADAMENTE ARRIESGADO.**

- Nunca inviertas más de lo que puedes permitirte perder
- Empieza con cantidades muy pequeñas (0.01 SOL o menos)
- Las memecoins pueden caer a 0 en segundos
- Haz tus propias investigaciones (DYOR)

## 🎯 Estrategia de Trading

1. **Detección**: El bot monitorea el canal de Telegram en busca de direcciones de contrato
2. **Análisis**: Verifica liquidez y volumen antes de comprar
3. **Compra**: Compra automáticamente si cumple los criterios
4. **Ventas**:
   - Vende 60% cuando el token duplica (2x)
   - Vende 20% más en 3x
   - Vende el resto en 5x
   - Vende todo si cae 30% (stop loss)

## 📝 Comandos del Bot

- `/start` - Iniciar el bot
- `/status` - Ver posiciones activas
- `/balance` - Ver balance de la wallet
- `/manual <direccion>` - Comprar manualmente un token

## 🔧 Configuración Avanzada

Puedes ajustar estos parámetros en el código:

```javascript
{
    buyAmount: 0.01,           // SOL por compra
    slippage: 10,              // Slippage %
    sellPercentageOn2x: 0.6,   // % a vender al duplicar
    stopLossPercentage: -0.3,  // Stop loss (-30%)
    checkInterval: 5000        // Intervalo de monitoreo (ms)
}
```

## 🚀 Ejecución

```bash
npm start
```

O para desarrollo:
```bash
npm run dev
```

## 📞 Soporte

- Canal monitoreado: https://t.me/cryptoyeezuscalls
- Documentación Solana: https://docs.solana.com/
- Jupiter API: https://station.jup.ag/api/docs

## 📄 Licencia

MIT - Usa bajo tu propio riesgo

---

**RECUERDA: Este bot opera en mainnet. Revisa toda configuración antes de ejecutar con fondos reales.**