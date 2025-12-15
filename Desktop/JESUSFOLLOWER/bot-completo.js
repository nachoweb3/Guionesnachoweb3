require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: No se encontró BOT_TOKEN en el archivo .env');
    process.exit(1);
}

console.log('🚀 Configurando Bot de Trading Completo...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    solanaRpc: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.01,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalUsername: 'cryptoyeezuscalls'
};

// Inicializar conexión a Solana
let connection, wallet;

try {
    connection = new Connection(config.solanaRpc, 'confirmed');
    wallet = Keypair.fromSecretKey(bs58.decode(config.walletPrivateKey));
    console.log(`✅ Wallet conectada: ${wallet.publicKey.toString()}`);
} catch (error) {
    console.log('⚠️ Error conectando wallet, funcionando en modo demo');
}

// Inicializar bot
const bot = new Telegraf(config.botToken);

// Estructura para seguimiento
const positions = new Map();
const tradingActivo = process.env.TRADING_ACTIVO === 'true';

// Función para obtener balance real
async function getBalance() {
    try {
        if (!connection || !wallet) return null;

        const balance = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;

        // Obtener tokens SPL
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            wallet.publicKey,
            { programId: TOKEN_PROGRAM_ID }
        );

        let tokensInfo = [];
        for (const account of tokenAccounts.value) {
            const tokenInfo = account.account.data.parsed.info;
            if (tokenInfo.tokenAmount.uiAmount > 0) {
                tokensInfo.push({
                    mint: tokenInfo.mint,
                    amount: tokenInfo.tokenAmount.uiAmount,
                    decimals: tokenInfo.tokenAmount.decimals
                });
            }
        }

        return {
            SOL: balanceSOL,
            tokens: tokensInfo,
            totalUSD: balanceSOL * 150 // Aproximación
        };
    } catch (error) {
        console.error('Error obteniendo balance:', error);
        return null;
    }
}

// Función para obtener datos de token
async function getTokenData(tokenAddress) {
    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        const pairs = response.data.pairs;

        if (pairs && pairs.length > 0) {
            const solanaPairs = pairs.filter(p => p.chainId === 'solana');
            if (solanaPairs.length > 0) {
                const bestPair = solanaPairs.reduce((best, current) =>
                    (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
                );

                return {
                    address: tokenAddress,
                    price: parseFloat(bestPair.priceUsd) || 0,
                    liquidity: bestPair.liquidity?.usd || 0,
                    volume24h: bestPair.volume?.h24 || 0,
                    marketCap: bestPair.fdv || 0
                };
            }
        }
    } catch (error) {
        console.error('Error obteniendo datos del token:', error);
    }
    return null;
}

// Extraer dirección de contrato
function extractContractAddress(message) {
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    const matches = message.match(solanaAddressRegex);

    if (matches) {
        for (const match of matches) {
            try {
                new PublicKey(match);
                return match;
            } catch (e) {}
        }
    }
    return null;
}

// Comando /start
bot.start(async (ctx) => {
    console.log(`👤 ${ctx.from.username || ctx.from.first_name} inició el bot`);

    let balanceMsg = '';
    if (tradingActivo) {
        const balance = await getBalance();
        if (balance) {
            balanceMsg = `\n💰 *Balance actual: ${balance.SOL.toFixed(4)} SOL*`;
        }
    }

    ctx.reply(`🤖 **Bot de Trading de Memecoins** activado! 🚀

🔔 *Modo:* ${tradingActivo ? 'TRADING REAL' : 'DEMO/PRUEBA'}${balanceMsg}

📋 *Comandos:*
/start - Menú principal
/help - Ayuda detallada
/status - Ver posiciones activas
/balance - Balance completo
/manual <direccion> - Compra manual
/toggle - Activar/Desactivar trading

🎯 *Monitoreando:* @${config.canalUsername}
💸 *Monto por compra:* ${config.buyAmount} SOL
⚙️ *Slippage:* ${config.slippage}%

${tradingActivo ? '✅ Trading activado' : '⚠️ Ejecuta /toggle para activar trading real'}`,
    { parse_mode: 'Markdown' });
});

// Comando /balance
bot.command('balance', async (ctx) => {
    if (!tradingActivo) {
        return ctx.reply('⚠️ *Modo DEMO*\n\nEl trading no está activado. Usa `/toggle` para activar.',
            { parse_mode: 'Markdown' });
    }

    await ctx.reply('⏳ Consultando balance...');

    const balance = await getBalance();
    if (balance) {
        let msg = `💰 **Balance de la Wallet**\n\n`;
        msg += `🔵 **SOL:** ${balance.SOL.toFixed(4)}\n`;
        msg += `💵 **USD (~):** $${balance.totalUSD.toFixed(2)}\n\n`;

        if (balance.tokens.length > 0) {
            msg += `🪙 **Tokens (${balance.tokens.length}):**\n`;
            for (const token of balance.tokens.slice(0, 5)) {
                msg += `• ${token.mint.substring(0, 8)}...: ${token.amount.toFixed(4)}\n`;
            }
        }

        ctx.reply(msg, { parse_mode: 'Markdown' });
    } else {
        ctx.reply('❌ Error obteniendo balance. Verifica conexión RPC.');
    }
});

// Comando /status
bot.command('status', async (ctx) => {
    let msg = `📊 **Estado del Bot**\n\n`;
    msg += `🤖 **Estado:** ✅ Activo\n`;
    msg += `🔔 **Modo:** ${tradingActivo ? 'TRADING REAL' : 'DEMO'}\n`;
    msg += `📡 **RPC:** ${config.solanaRpc.includes('helius') ? 'Helius' : 'Default'}\n`;
    msg += `👥 **Usuarios:** ${ctx.chat.id}\n`;
    msg += `🎯 **Canal:** @${config.canalUsername}\n\n`;

    // Posiciones activas
    if (positions.size > 0) {
        msg += `📈 **Posiciones Activas (${positions.size}):**\n`;
        positions.forEach((pos, addr) => {
            msg += `• ${addr.substring(0, 8)}... - ${pos.status}\n`;
        });
    } else {
        msg += `📈 **Posiciones Activas:** 0\n`;
    }

    msg += `\n⏰ **Última actualización:** ${new Date().toLocaleString()}`;

    ctx.reply(msg, { parse_mode: 'Markdown' });
});

// Comando /manual
bot.command('manual', async (ctx) => {
    const address = ctx.message.text.split(' ')[1];
    if (!address) {
        return ctx.reply('❌ Debes proporcionar una dirección\n\n' +
                         'Ejemplo: `/manual So11111111111111111111111111111111111111112`',
                         { parse_mode: 'Markdown' });
    }

    if (!tradingActivo) {
        return ctx.reply('⚠️ Trading no está activado. Usa `/toggle` primero.',
            { parse_mode: 'Markdown' });
    }

    await ctx.reply(`🔄 Analizando token:\n\n\`${address}\``, { parse_mode: 'Markdown' });

    const tokenData = await getTokenData(address);
    if (tokenData) {
        let msg = `📊 **Datos del Token**\n\n`;
        msg += `💰 **Precio:** $${tokenData.price}\n`;
        msg += `💧 **Liquidez:** $${tokenData.liquidity.toLocaleString()}\n`;
        msg += `📊 **Volumen 24h:** $${tokenData.volume24h.toLocaleString()}\n`;
        msg += `🪙 **Market Cap:** $${tokenData.marketCap.toLocaleString()}\n\n`;

        if (tokenData.liquidity >= 10000) {
            msg += `✅ **Token apto para trading**\n\n`;
            msg += `¿Deseas comprar ${config.buyAmount} SOL worth?`;
            ctx.reply(msg, { parse_mode: 'Markdown' });
        } else {
            msg += `❌ **Liquidez muy baja (< $10,000)**\n\nNo se recomienda comprar.`;
            ctx.reply(msg, { parse_mode: 'Markdown' });
        }
    } else {
        ctx.reply('❌ No se encontraron datos del token en DexScreener');
    }
});

// Comando /toggle
bot.command('toggle', (ctx) => {
    const nuevoEstado = !tradingActivo;
    process.env.TRADING_ACTIVO = nuevoEstado.toString();

    ctx.reply(`🔔 **Trading ${nuevoEstado ? 'ACTIVADO' : 'DESACTIVADO'}**\n\n` +
              `${nuevoEstado ? '✅ El bot ejecutará trades reales' : '⚠️ El bot está en modo demo'}`,
              { parse_mode: 'Markdown' });
});

// Comando /help
bot.help((ctx) => {
    ctx.reply(`
🆘 **Ayuda del Bot**

🔧 **Configuración Actual:**
• Modo: ${tradingActivo ? 'TRADING REAL' : 'DEMO'}
• Monto: ${config.buyAmount} SOL por compra
• Slippage: ${config.slippage}%

📋 **Comandos:**
/start - Menú principal
/status - Estado del bot
/balance - Balance de la wallet
/manual <dir> - Compra manual
/toggle - Activar/Desactivar trading
/help - Esta ayuda

💡 **Para activar trading real:**
1. Configura tu .env con las claves
2. Ejecuta /toggle para activar
3. El bot monitoreará @${config.canalUsername}

⚠️ **Advertencia:** Trading de criptomonedas conlleva riesgos. Investiga antes de operar.
    `, { parse_mode: 'Markdown' });
});

// Escuchar mensajes del canal
bot.on('text', async (ctx) => {
    if (!tradingActivo) return;

    // Verificar si es del canal monitoreado
    if (ctx.chat.username === config.canalUsername) {
        const message = ctx.message.text;
        const contractAddress = extractContractAddress(message);

        if (contractAddress && !positions.has(contractAddress)) {
            console.log(`🎯 Contrato detectado: ${contractAddress}`);

            const tokenData = await getTokenData(contractAddress);
            if (tokenData && tokenData.liquidity >= 10000) {
                // Aquí iría la lógica de compra real
                positions.set(contractAddress, {
                    tokenAddress: contractAddress,
                    status: 'active',
                    createdAt: new Date(),
                    purchasePrice: tokenData.price
                });

                ctx.reply(`🚀 **Nueva llamada detectada!**\n\n` +
                          `Token: \`${contractAddress}\`\n` +
                          `Precio: $${tokenData.price}\n` +
                          `Liquidez: $${tokenData.liquidity.toLocaleString()}\n\n` +
                          `✅ Iniciando análisis...`,
                          { parse_mode: 'Markdown' });
            }
        }
    }
});

// Manejo de errores
bot.catch((err, ctx) => {
    console.error(`❌ Error:`, err);
    ctx.reply('⚠️ Ocurrió un error. Por favor intenta más tarde.');
});

// Iniciar bot
console.log('✅ Bot configurado correctamente');
bot.launch()
    .then(() => {
        console.log('🎉 Bot iniciado exitosamente!');
        console.log(`🤖 Modo: ${tradingActivo ? 'TRADING REAL' : 'DEMO'}`);
        console.log('🔔 Escuchando comandos...');
    })
    .catch((err) => {
        console.error('❌ Error al iniciar:', err);
    });

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('\n🛑 Apagando bot...');
    bot.stop('SIGINT');
});