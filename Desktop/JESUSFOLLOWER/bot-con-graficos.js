require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram, AccountMeta } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, createCloseAccountInstruction } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot con Tarjetas PnL Visuales...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.1,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    apis: {
        dexscreener: 'https://api.dexscreener.com/latest',
        coingecko: 'https://api.coingecko.com/api/v3'
    }
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection, wallet;
let modoTrading = true;
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();
const configuracionUsuario = new Map();

// Inicializar conexión
async function inicializar() {
    try {
        connection = new Connection(config.rpcUrl, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });
        wallet = Keypair.fromSecretKey(bs58.decode(config.walletPrivateKey));

        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`✅ Conectado a Solana`);
        console.log(`💰 Wallet: ${wallet.publicKey.toString()}`);
        console.log(`🔵 Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        return true;
    } catch (error) {
        console.error('❌ Error conexión:', error.message);
        return false;
    }
}

// Generar tarjeta PnL con arte ASCII
function generarTarjetaPnL(posicion, info) {
    const pnlPorcentaje = ((posicion.invertido * 150 / (posicion.cantidadTokens * (info.price || posicion.precioEntrada)) - 1) * 100);
    const esGanancia = pnlPorcentaje > 0;
    const color = esGanancia ? '🟢' : '🔴';

    // Gráfico ASCII simple
    const grafico = esGanancia
        ? '📈   /\\\n     /  \\\n    /____\\\n   /      \\'
        : '📉   \\  /\n     \\/\n     /\\\n    /  \\\n   /____\\';

    // Tarjeta con bordes
    const tarjeta = `
┌────────────────────────────────────────┐
│ 💰 ${posicion.tokenInput.padEnd(10)} │ ${color} ${pnlPorcentaje > 0 ? '+' : ''}${pnlPorcentaje.toFixed(2)}% │
├────────────────────────────────────────┤
│ Precio Entrada: $${posicion.precioEntrada.toFixed(8)}    │
│ Precio Actual: $${(info.price || posicion.precioEntrada).toFixed(8)}    │
│ Cantidad: ${posicion.cantidadTokens.toFixed(0).padEnd(20)} │
│ Invertido: ${posicion.invertido.toFixed(4)} SOL        │
│ Valor: $${(posicion.cantidadTokens * (info.price || posicion.precioEntrada)).toFixed(2)}  │
├────────────────────────────────────────┤
${grafico.padEnd(37)}│
│ ${esGanancia ? '¡GANANDO! 🚀' : 'PERDIENDO 📉'.padEnd(35)} │
└────────────────────────────────────────┘`;

    return tarjeta;
}

// Generar mini-gráfico de barras para PnL general
function generarGraficoPnLGeneral(totalPnL, totalInvertido) {
    const porcentajeGanancia = (totalPnL / totalInvertido) * 100;
    const barras = Math.max(0, Math.min(20, Math.round((porcentajeGanancia + 100) / 10)));
    const barra = '█'.repeat(barras) + '░'.repeat(20 - barras);

    return `
📊 **Portfolio PnL** 📊
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Invertido: ${totalInvertido.toFixed(2)} SOL
${totalPnL >= 0 ? '🟢' : '🔴'} PnL Total: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} SOL (${porcentajeGanancia > 0 ? '+' : ''}${porcentajeGanancia.toFixed(1)}%)

${barra} ${porcentajeGanancia.toFixed(1)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// Obtener información del token
async function getTokenInfo(tokenMint) {
    try {
        const response = await axios.get(`${config.apis.dexscreener}/dex/tokens/${tokenMint}`);
        if (response.data.pairs && response.data.pairs.length > 0) {
            const pair = response.data.pairs[0];
            return {
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown',
                price: parseFloat(pair.priceUsd) || 0,
                liquidity: pair.liquidity?.usd || 0,
                volume24h: pair.volume?.h24 || 0,
                priceChange24h: pair.priceChange?.h24 || 0
            };
        }
    } catch (error) {
        console.log(`Error obteniendo info de ${tokenMint}`);
    }

    return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        price: 0,
        liquidity: 0,
        volume24h: 0,
        priceChange24h: 0
    };
}

// Teclado interactivo mejorado
const mainKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💰 Comprar', 'menu_comprar'), Markup.button.callback('💸 Vender', 'menu_vender')],
    [Markup.button.callback('📊 Ver PnL', 'menu_pnl'), Markup.button.callback('💎 Ver Tokens', 'menu_tokens')],
    [Markup.button.callback('⚙️ Config', 'menu_config'), Markup.button.callback('🔍 Analizar', 'menu_analizar')],
    [Markup.button.callback('🎯 Trading Auto', 'toggle_auto')]
]);

const buyKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL 💎', 'buy_0.01'), Markup.button.callback('0.05 SOL 💎', 'buy_0.05')],
    [Markup.button.callback('0.1 SOL 💎', 'buy_0.1'), Markup.button.callback('0.5 SOL 💎', 'buy_0.5')],
    [Markup.button.callback('1 SOL 💎', 'buy_1'), Markup.button.callback('Personalizar 🎯', 'buy_custom')],
    [Markup.button.callback('❌ Cancelar', 'cancel')]
]);

const sellKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('25% 💸', 'sell_25'), Markup.button.callback('50% 💸', 'sell_50')],
    [Markup.button.callback('75% 💸', 'sell_75'), Markup.button.callback('100% 🔥', 'sell_100')],
    [Markup.button.callback('Todo en 2x 🚀', 'sell_2x'), Markup.button.callback('❌ Cancelar', 'cancel')]
]);

// Comando start con gráfico
bot.start(async (ctx) => {
    const balance = await getBalance();

    let mensaje = `🤖 **Bot Trading con PnL Visual** 🎨\n\n`;
    mensaje += `💰 *Balance:* ${balance.toFixed(4)} SOL\n`;
    mensaje += `📊 *Posiciones:* ${posiciones.size} activas\n`;
    mensaje += `🔥 *Estado:* ${modoTrading ? '✅ ACTIVO' : '❌ PAUSADO'}\n\n`;

    if (posiciones.size > 0) {
        let totalPnL = 0;
        let totalInvertido = 0;

        for (const pos of posiciones.values()) {
            const info = await getTokenInfo(pos.tokenMint);
            const pnl = (pos.cantidadTokens * (info.price || pos.precioEntrada) * 150 / LAMPORTS_PER_SOL) - pos.invertido;
            totalPnL += pnl;
            totalInvertido += pos.invertido;
        }

        mensaje += generarGraficoPnLGeneral(totalPnL, totalInvertido);
    }

    await ctx.replyWithMarkdown(mensaje, mainKeyboard);
});

// Comando para ver PnL con tarjetas
bot.command('pnl', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones abiertas para mostrar PnL');
    }

    let mensaje = '📊 **Tus Posiciones con PnL Visual** 📊\n\n';

    for (const [tokenInput, pos] of posiciones.values()) {
        const info = await getTokenInfo(pos.tokenMint);
        mensaje += '```' + generarTarjetaPnL(pos, info) + '```\n\n';

        // Si hay muchas posiciones, enviar en partes
        if (mensaje.length > 3500) {
            await ctx.replyWithMarkdown(mensaje);
            mensaje = '';
        }
    }

    if (mensaje) {
        await ctx.replyWithMarkdown(mensaje);
    }

    // Resumen del portfolio
    let totalPnL = 0;
    let totalInvertido = 0;

    for (const pos of posiciones.values()) {
        const info = await getTokenInfo(pos.tokenMint);
        const pnl = (pos.cantidadTokens * (info.price || pos.precioEntrada) * 150 / LAMPORTS_PER_SOL) - pos.invertido;
        totalPnL += pnl;
        totalInvertido += pos.invertido;
    }

    await ctx.replyWithMarkdown(generarGraficoPnLGeneral(totalPnL, totalInvertido));
});

// Comando para ver tokens con tarjetas
bot.command('tokens', async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    let mensaje = `💎 **Tu Cartera Completa** 💎\n\n`;
    mensaje += `┌────────────────────────────┐\n`;
    mensaje += `│ 🔵 SOL: ${balance.toFixed(4).padEnd(15)} │\n`;
    mensaje += `│ 💵 USD: $${(balance * 150).toFixed(2).padEnd(14)} │\n`;
    mensaje += `└────────────────────────────┘\n\n`;

    if (tokens.length > 0) {
        mensaje += `🪙 **Tokens (${tokens.length}):**\n\n`;

        for (const token of tokens.slice(0, 5)) {
            const info = await getTokenInfo(token.mint);
            const valorUSD = token.amount * (info.price || 0);

            mensaje += `┌─ ${info.symbol} ───────────────────┐\n`;
            mensaje += `│ Cantidad: ${token.amount.toFixed(4).padEnd(18)} │\n`;
            mensaje += `│ Valor USD: $${valorUSD.toFixed(2).padEnd(15)} │\n`;
            mensaje += `│ 24h: ${info.priceChange24h >= 0 ? '🟢' : '🔴'} ${(info.priceChange24h || 0).toFixed(2)}%`.padEnd(30) + '│\n';
            mensaje += `└───────────────────────────────┘\n\n`;
        }
    }

    await ctx.replyWithMarkdown(mensaje);
});

// Manejador de menús
bot.action('menu_pnl', async (ctx) => {
    await ctx.command('pnl');
    ctx.answerCbQuery();
});

bot.action('menu_tokens', async (ctx) => {
    await ctx.command('tokens');
    ctx.answerCbQuery();
});

bot.action('menu_comprar', async (ctx) => {
    await ctx.replyWithMarkdown(
        '💰 **Selecciona monto para comprar:**\n\n' +
        '💸 *Monto actual:* 0.1 SOL\n' +
        '⚙️ *Slippage:* 10%\n',
        buyKeyboard
    );
    ctx.answerCbQuery();
});

bot.action('menu_vender', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('❌ No tienes posiciones para vender');
    }

    let mensaje = '💸 **Selecciona posición para vender:**\n\n';
    posiciones.forEach((pos, token) => {
        mensaje += `• ${pos.tokenInput} - ${pos.cantidadTokens.toFixed(0)} tokens\n`;
    });

    await ctx.reply(mensaje, sellKeyboard);
    ctx.answerCbQuery();
});

// Simular compra
async function simularCompra(tokenInput, cantidadSOL) {
    const info = await getTokenInfo(tokenInput);
    const tokensRecibidos = cantidadSOL / (info.price || 0.000001);

    posiciones.set(tokenInput, {
        tokenMint: tokenInput,
        tokenInput: tokenInput,
        cantidadTokens: tokensRecibidos,
        precioEntrada: info.price || 0.000001,
        invertido: cantidadSOL,
        timestamp: new Date(),
        ventas: [],
        estado: 'activa',
        exchange: 'Simulada'
    });

    return { success: true, tokens: tokensRecibidos, info };
}

// Comando buy mejorado
bot.command('buy', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/buy PEPE` o `/buy 0x...`');
    }

    await ctx.replyWithMarkdown(
        `💰 **Comprar ${tokenInput}**\n\n` +
        `💸 *Monto por defecto:* 0.1 SOL\n` +
        `⚙️ *Slippage:* 10%\n\n` +
        `*Selecciona el monto:*\n`,
        buyKeyboard
    );

    ctx.session = { action: 'buy', token: tokenInput };
});

// Función para obtener balance
async function getBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        return balanceLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        return 0;
    }
}

// Función para obtener tokens
async function getTokens() {
    try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            wallet.publicKey,
            { programId: TOKEN_PROGRAM_ID }
        );

        let tokens = [];
        for (const account of tokenAccounts.value) {
            const info = account.account.data.parsed.info;
            if (info.tokenAmount.uiAmount > 0) {
                tokens.push({
                    mint: info.mint,
                    amount: info.tokenAmount.uiAmount,
                    decimals: info.tokenAmount.decimals
                });
            }
        }
        return tokens;
    } catch (error) {
        return [];
    }
}

// Detectar tokens en mensajes
function extraerTokens(texto) {
    const resultados = [];

    // Direcciones de Solana
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    const matches = texto.match(solanaAddressRegex);
    if (matches) {
        for (const match of matches) {
            try {
                new PublicKey(match);
                resultados.push({ tipo: 'direccion', valor: match });
            } catch (e) {}
        }
    }

    // Tickers
    const tickerRegex = /\b[A-Z]{3,10}\b/g;
    const tickers = texto.match(tickerRegex);
    if (tickers) {
        const exclude = ['BTC', 'ETH', 'USD', 'SOL', 'USDT', 'USDC', 'BUSD', 'CAKE', 'BSC'];
        for (const ticker of tickers) {
            if (!exclude.includes(ticker)) {
                resultados.push({ tipo: 'ticker', valor: ticker });
            }
        }
    }

    return resultados;
}

// Monitoreo de canales
bot.on('text', async (ctx) => {
    if (!modoTrading) return;

    const username = ctx.chat.username;
    if (!username || !canales.has(username)) return;

    const texto = ctx.message.text;
    const tokens = extraerTokens(texto);

    if (tokens.length > 0) {
        console.log(`🎯 Detectados ${tokens.length} tokens en @${username}`);

        for (const token of tokens) {
            if (!posiciones.has(token.valor)) {
                try {
                    const info = await getTokenInfo(token.valor);

                    // Tarjeta de detección
                    const tarjetaDetectado = `
┌───────────────────────────────────┐
│ 🚀 TOKEN DETECTADO! 🚀         │
├───────────────────────────────────┤
│ Tipo: ${token.tipo.padEnd(24)} │
│ Token: ${token.valor.padEnd(23)} │
│ Precio: $${(info.price || 0).toFixed(8).padEnd(18)} │
│ Liquidez: $${(info.liquidity || 0).toLocaleString().padEnd(14)} │
└───────────────────────────────────┘`;

                    await ctx.reply('```' + tarjetaDetectado + '```');

                    // Simular compra
                    const resultado = await simularCompra(token.valor, config.buyAmount);

                    if (resultado.success) {
                        const tarjetaCompra = `
┌───────────────────────────────────┐
│ ✅ COMPRA EXITOSA! ✅           │
├───────────────────────────────────┤
│ Tokens: ${resultado.tokens.toFixed(0).padEnd(22)} │
│ ${resultado.info.symbol.padEnd(7)}: ${resultado.tokens.toFixed(4)}     │
│ Valor: $${(resultado.tokens * (resultado.info.price || 0)).toFixed(2).padEnd(16)} │
│ Exchange: Simulada               │
└───────────────────────────────────┘`;

                        await ctx.reply('```' + tarjetaCompra + '```');
                    }
                } catch (error) {
                    console.error(`Error con ${token.valor}:`, error.message);
                }
            }
        }
    }
});

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot con gráficos PnL iniciado');
    console.log('🎨 Tarjetas visuales activadas');
    console.log('📊 Gráficos ASCII generados');

    bot.launch()
        .then(() => console.log('🎉 Bot activo con PnL visual!'))
        .catch(err => console.error('❌ Error:', err));
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('\n🛑 Deteniendo bot...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('\n🛑 Deteniendo bot...');
    bot.stop('SIGTERM');
});

// Iniciar
iniciar();