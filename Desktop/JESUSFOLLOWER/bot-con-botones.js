require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram, AccountMeta } = require('@solana/web3.js');
const { session } = require('telegraf');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, createCloseAccountInstruction } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot con Botones Funcionales...');

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

// Middleware de sesión
bot.use(session());

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
    const precioActual = info.price || posicion.precioEntrada;
    const valorActual = posicion.cantidadTokens * precioActual * 150 / LAMPORTS_PER_SOL;
    const pnl = valorActual - posicion.invertido;
    const pnlPorcentaje = (pnl / posicion.invertido) * 100;
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
│ Precio Entrada: $${(posicion.precioEntrada * 150 / LAMPORTS_PER_SOL).toFixed(8)}    │
│ Precio Actual: $${(precioActual * 150 / LAMPORTS_PER_SOL).toFixed(8)}    │
│ Cantidad: ${posicion.cantidadTokens.toFixed(0).padEnd(20)} │
│ Invertido: ${posicion.invertido.toFixed(4)} SOL        │
│ Valor: $${valorActual.toFixed(2)}  │
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
        price: 0.000001,
        liquidity: 0,
        volume24h: 0,
        priceChange24h: 0
    };
}

// Teclados interactivos
const mainKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💰 Comprar', 'menu_comprar'), Markup.button.callback('💸 Vender', 'menu_vender')],
    [Markup.button.callback('📊 Ver PnL', 'menu_pnl'), Markup.button.callback('💎 Ver Tokens', 'menu_tokens')],
    [Markup.button.callback('⚙️ Config', 'menu_config'), Markup.button.callback('🔍 Analizar', 'menu_analizar')]
]);

const buyKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL 💎', 'buy_0.01'), Markup.button.callback('0.05 SOL 💎', 'buy_0.05')],
    [Markup.button.callback('0.1 SOL 💎', 'buy_0.1'), Markup.button.callback('0.5 SOL 💎', 'buy_0.5')],
    [Markup.button.callback('1 SOL 💎', 'buy_1'), Markup.button.callback('🎯 Personalizar', 'buy_custom')],
    [Markup.button.callback('❌ Cancelar', 'cancel')]
]);

const sellKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('25% 💸', 'sell_25'), Markup.button.callback('50% 💸', 'sell_50')],
    [Markup.button.callback('75% 💸', 'sell_75'), Markup.button.callback('100% 🔥', 'sell_100')],
    [Markup.button.callback('❌ Cancelar', 'cancel')]
]);

// COMANDOS

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
            const valorActual = pos.cantidadTokens * (info.price || pos.precioEntrada) * 150 / LAMPORTS_PER_SOL;
            const pnl = valorActual - pos.invertido;
            totalPnL += pnl;
            totalInvertido += pos.invertido;
        }

        mensaje += generarGraficoPnLGeneral(totalPnL, totalInvertido);
    }

    await ctx.replyWithMarkdown(mensaje, mainKeyboard);
});

bot.command('pnl', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones abiertas para mostrar PnL');
    }

    let mensaje = '📊 **Tus Posiciones con PnL Visual** 📊\n\n';

    for (const [tokenInput, pos] of posiciones) {
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
        const valorActual = pos.cantidadTokens * (info.price || pos.precioEntrada) * 150 / LAMPORTS_PER_SOL;
        const pnl = valorActual - pos.invertido;
        totalPnL += pnl;
        totalInvertido += pos.invertido;
    }

    await ctx.replyWithMarkdown(generarGraficoPnLGeneral(totalPnL, totalInvertido));
});

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

bot.command('buy', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/buy PEPE` o `/buy 0x...`');
    }

    ctx.session = { action: 'buy', token: tokenInput };

    await ctx.replyWithMarkdown(
        `💰 **Comprar ${tokenInput}**\n\n` +
        `💸 *Monto por defecto:* ${config.buyAmount} SOL\n` +
        `⚙️ *Slippage:* ${config.slippage}%\n\n` +
        `*Selecciona el monto:*\n`,
        buyKeyboard
    );
});

bot.command('help', (ctx) => {
    ctx.replyWithMarkdown(
        `🆘 **Ayuda del Bot con PnL Visual**\n\n` +
        `📋 **Comandos principales:**\n` +
        `/start - Menú principal con gráfico PnL\n` +
        `/pnl - Tarjetas PnL de posiciones\n` +
        `/tokens - Cartera visual completa\n` +
        `/buy <token> - Comprar con menú\n` +
        `/sell <token> - Vender posición\n\n` +
        `🎯 **Funciones visuales:**\n` +
        `• Tarjetas PnL con gráficos ASCII\n` +
        `• Cartera con diseño visual\n` +
        `• Menús interactivos con botones\n` +
        `• Detección automática con tarjetas\n\n` +
        `💡 **Uso:**\n` +
        `1. Usa /start para ver PnL general\n` +
        `2. /pnl para ver tarjetas individuales\n` +
        `3. Los botones del menú funcionan al tocarlos`
    );
});

// MANEJADORES DE BOTONES (CALLBACKS)

// Menú principal
bot.action('menu_comprar', (ctx) => {
    ctx.replyWithMarkdown(
        '💰 **Selecciona monto para comprar:**\n\n' +
        `💸 *Monto actual:* ${config.buyAmount} SOL\n` +
        `⚙️ *Slippage:* ${config.slippage}%\n\n` +
        `*Escribe el token primero:* /buy PEPE`,
        buyKeyboard
    );
    ctx.answerCbQuery();
});

bot.action('menu_vender', (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('❌ No tienes posiciones para vender');
    }

    let mensaje = '💸 **Selecciona token para vender:**\n\n';
    posiciones.forEach((pos, token) => {
        mensaje += `• ${pos.tokenInput} - ${pos.cantidadTokens.toFixed(0)} tokens\n`;
    });
    mensaje += '\n Usa: /sell <token> <porcentaje>';

    ctx.reply(mensaje, sellKeyboard);
    ctx.answerCbQuery();
});

bot.action('menu_pnl', async (ctx) => {
    await ctx.command('pnl');
    ctx.answerCbQuery();
});

bot.action('menu_tokens', async (ctx) => {
    await ctx.command('tokens');
    ctx.answerCbQuery();
});

bot.action('menu_config', (ctx) => {
    ctx.replyWithMarkdown(
        '⚙️ **Configuración del Bot**\n\n' +
        `💰 *Monto de compra:* ${config.buyAmount} SOL\n` +
        `⚙️ *Slippage:* ${config.slippage}%\n` +
        `🔥 *Trading:* ${modoTrading ? 'Activo' : 'Pausado'}\n\n` +
        `*Para cambiar valores, edita el archivo .env*`
    );
    ctx.answerCbQuery();
});

bot.action('menu_analizar', (ctx) => {
    ctx.replyWithMarkdown(
        '🔍 **Analizar Token**\n\n' +
        'Para analizar un token:\n' +
        '`/info <token>`\n\n' +
        'Ejemplos:\n' +
        '`/info PEPE`\n' +
        '`/info So11111111111111111111111111111111111111112`'
    );
    ctx.answerCbQuery();
});

// Botones de cantidad
bot.action(/buy_(.+)$/, (ctx) => {
    const amount = ctx.match[1];
    const session = ctx.session;

    if (amount === 'custom') {
        ctx.replyWithMarkdown(
            '💰 **Monto Personalizado**\n\n' +
            'Escribe la cantidad de SOL:\n' +
            'Ej: `0.25`'
        );
        ctx.session = { ...session, waitingAmount: true };
    } else {
        const cantidad = parseFloat(amount);
        const token = session?.token;

        if (!token) {
            ctx.reply('❌ Primero especifica el token con /buy <token>');
            return ctx.answerCbQuery();
        }

        // Simular compra
        simularCompra(token, cantidad);

        ctx.replyWithMarkdown(
            `✅ **Compra Simulada**\n\n` +
            `🪙 Token: ${token}\n` +
            `💰 Cantidad: ${cantidad} SOL\n` +
            `💸 Estado: Simulado (sin gasto real)`
        );
        delete ctx.session;
    }
    ctx.answerCbQuery();
});

// Botones de venta
bot.action(/sell_(\d+)$/, (ctx) => {
    const percentage = parseInt(ctx.match[1]);

    ctx.replyWithMarkdown(
        `💸 **Vender ${percentage}%**\n\n` +
        'Para vender usa:\n' +
        '`/sell <token> <porcentaje>`\n\n' +
        'Ej: `/sell PEPE 50`'
    );
    ctx.answerCbQuery();
});

bot.action('cancel', (ctx) => {
    ctx.reply('❌ Operación cancelada');
    delete ctx.session;
    ctx.answerCbQuery();
});

// Comando info
bot.command('info', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/info PEPE`');
    }

    await ctx.reply('🔍 Buscando información...');

    const info = await getTokenInfo(tokenInput);

    let mensaje = `📊 **Información del Token**\n\n`;
    mensaje += `🪙 **Símbolo:** ${info.symbol}\n`;
    mensaje += `📝 **Nombre:** ${info.name}\n`;
    mensaje += `💰 **Precio:** $${info.price.toFixed(8)}\n`;
    mensaje += `💧 **Liquidez:** $${info.liquidity.toLocaleString()}\n`;
    mensaje += `🔄 **Volumen 24h:** $${info.volume24h.toLocaleString()}\n`;
    mensaje += `📈 **Cambio 24h:** ${info.priceChange24h >= 0 ? '🟢' : '🔴'} ${(info.priceChange24h || 0).toFixed(2)}%\n`;

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.callback('💰 Comprar', `buy_token_${tokenInput}`)]
    ]));
});

// Botón de compra desde info
bot.action(/buy_token_(.+)/, (ctx) => {
    const token = ctx.match[1];
    ctx.session = { action: 'buy', token: token };

    ctx.replyWithMarkdown(
        `💰 **Comprar ${token}**\n\n` +
        `*Selecciona el monto:*\n`,
        buyKeyboard
    );
    ctx.answerCbQuery();
});

// Funciones auxiliares
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

async function getBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        return balanceLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        return 0;
    }
}

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

// Escuchar texto para montos personalizados
bot.on('text', (ctx) => {
    if (ctx.session?.waitingAmount) {
        const amount = parseFloat(ctx.message.text);
        if (amount && amount >= 0.001 && amount <= 10) {
            const session = ctx.session;
            const token = session?.token;

            if (token) {
                simularCompra(token, amount);
                ctx.replyWithMarkdown(
                    `✅ **Compra Simulada**\n\n` +
                    `🪙 Token: ${token}\n` +
                    `💰 Cantidad: ${amount} SOL\n` +
                    `💸 Estado: Simulado`
                );
            }

            delete ctx.session;
        } else {
            ctx.reply('❌ Monto inválido. Debe estar entre 0.001 y 10 SOL');
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

    console.log('✅ Bot con botones funcionales iniciado');
    console.log('🎨 Tarjetas PnL activadas');
    console.log('🎮 Botones interactivos listos');

    bot.launch()
        .then(() => console.log('🎉 Bot activo con botones funcionales!'))
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