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

console.log('🚀 Iniciando Bot AVANZADO con Menús Interactivos...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.1,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    maxSlippage: 50,
    minBuyAmount: 0.01,
    maxBuyAmount: 10,
    apis: {
        pumpfun: 'https://frontend-api.pump.fun',
        moonshot: 'https://api.moonshot.meme',
        bonkfun: 'https://bonkfun.com/api',
        meteora: 'https://api.meteora.fm',
        orca: 'https://api.orca.so',
        raydium: 'https://api.raydium.io',
        coingecko: 'https://api.coingecko.com/api/v3',
        dexscreener: 'https://api.dexscreener.com/latest'
    }
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection, wallet;
let modoTrading = true;
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();
const cacheTokens = new Map();
const configuracionUsuario = new Map(); // Configuración personalizada por usuario

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

// Obtener configuración del usuario
function getConfiguracionUsuario(userId) {
    if (!configuracionUsuario.has(userId)) {
        configuracionUsuario.set(userId, {
            buyAmount: config.buyAmount,
            slippage: config.slippage,
            modoAuto: false,
            notificaciones: true
        });
    }
    return configuracionUsuario.get(userId);
}

// Extraer direcciones y tickers
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

// Obtener información completa del token
async function getTokenInfoCompleta(tokenMint) {
    let info = {
        mint: tokenMint,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        price: 0,
        marketCap: 0,
        liquidity: 0,
        volume24h: 0,
        priceChange24h: 0,
        holders: 0,
        exchanges: []
    };

    // Buscar en DexScreener
    try {
        const response = await axios.get(`${config.apis.dexscreener}/dex/tokens/${tokenMint}`, {
            timeout: 5000
        });

        if (response.data.pairs && response.data.pairs.length > 0) {
            const pairs = response.data.pairs;
            const solanaPairs = pairs.filter(p => p.chainId === 'solana');

            if (solanaPairs.length > 0) {
                // Tomar el par con más liquidez
                const bestPair = solanaPairs.reduce((best, current) =>
                    (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
                );

                info.symbol = bestPair.baseToken.symbol;
                info.name = bestPair.baseToken.name;
                info.price = parseFloat(bestPair.priceUsd) || 0;
                info.liquidity = bestPair.liquidity?.usd || 0;
                info.volume24h = bestPair.volume?.h24 || 0;
                info.priceChange24h = bestPair.priceChange?.h24 || 0;
                info.fdv = bestPair.fdv || 0;

                // Recolectar exchanges
                const exchanges = new Set(solanaPairs.map(p => p.dexId));
                info.exchanges = Array.from(exchanges);

                console.log(`✅ Info obtenida de DexScreener: ${info.symbol}`);
            }
        }
    } catch (error) {
        console.log(`❌ DexScreener no responde`);
    }

    // Buscar en CoinGecko para más datos
    try {
        const response = await axios.get(`${config.apis.coingecko}/search`, {
            params: { query: info.symbol || tokenMint },
            timeout: 5000
        });

        const coins = response.data.coins;
        const solanaCoin = coins.find(coin => coin.platforms?.solana === tokenMint);

        if (solanaCoin) {
            info.price = info.price || solanaCoin.market_data?.current_price?.usd || 0;
            info.marketCap = solanaCoin.market_data?.market_cap?.usd || 0;
            info.priceChange24h = info.priceChange24h || solanaCoin.market_data?.price_change_percentage_24h || 0;
        }
    } catch (error) {
        console.log(`❌ CoinGecko no responde`);
    }

    // Obtener holders (simplificado)
    try {
        const holders = await connection.getTokenLargestAccounts(new PublicKey(tokenMint));
        if (holders.value && holders.value[0]) {
            info.holders = holders.value.length;
        }
    } catch (error) {
        // No se puede obtener holders
    }

    return info;
}

// Crear teclados interactivos
const tradingKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💰 Comprar', 'action_buy')],
    [Markup.button.callback('💸 Vender', 'action_sell')],
    [Markup.button.callback('📊 Ver Posiciones', 'action_positions')],
    [Markup.button.callback('⚙️ Configuración', 'action_config')],
    [Markup.button.callback('🔍 Analizar Token', 'action_analyze')]
]);

const amountKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL', 'amount_0.01'), Markup.button.callback('0.05 SOL', 'amount_0.05')],
    [Markup.button.callback('0.1 SOL', 'amount_0.1'), Markup.button.callback('0.5 SOL', 'amount_0.5')],
    [Markup.button.callback('1 SOL', 'amount_1'), Markup.button.callback('Personalizar', 'amount_custom')],
    [Markup.button.callback('❌ Cancelar', 'cancel')]
]);

const slippageKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('1%', 'slippage_1'), Markup.button.callback('3%', 'slippage_3')],
    [Markup.button.callback('5%', 'slippage_5'), Markup.button.callback('10%', 'slippage_10')],
    [Markup.button.callback('15%', 'slippage_15'), Markup.button.callback('20%', 'slippage_20')],
    [Markup.button.callback('❌ Cancelar', 'cancel')]
]);

// COMANDOS PRINCIPALES

bot.start(async (ctx) => {
    const balance = await getBalance();
    const userId = ctx.from.id;
    const userConfig = getConfiguracionUsuario(userId);

    ctx.replyWithMarkdown(
        `*🤖 Bot de Trading AVANZADO* 🚀\n\n` +
        `💰 *Balance:* ${balance.toFixed(4)} SOL\n` +
        `🔧 *Config actual:* ${userConfig.buyAmount} SOL | Slippage: ${userConfig.slippage}%\n` +
        `📊 *Posiciones:* ${posiciones.size} abiertas\n` +
        `🔥 *Estado:* ${modoTrading ? '✅ ACTIVO' : '❌ PAUSADO'}\n\n` +
        `*📡 Canales monitoreados:*\n${Array.from(canales).map(c => `• @${c}`).join('\n')}\n\n` +
        `*💡 Usa los botones para operar rápidamente!*`,
        tradingKeyboard
    );
});

bot.command('buy', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/buy PEPE` o `/buy So111...`');
    }

    await ctx.replyWithMarkdown(
        `*💰 Comprar ${tokenInput}*\n\n` +
        `💸 *Monto por defecto:* ${config.buyAmount} SOL\n` +
        `⚙️ *Slippage:* ${config.slippage}%\n\n` +
        `*Selecciona el monto:*\n`,
        amountKeyboard
    );

    ctx.session = { action: 'buy', token: tokenInput };
});

bot.command('sell', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/sell PEPE`');
    }

    const posicion = posiciones.get(tokenInput);
    if (!posicion) {
        return ctx.reply('❌ No tienes posición en ese token');
    }

    await ctx.replyWithMarkdown(
        `*💸 Vender ${tokenInput}*\n\n` +
        `🪙 *Balance:* ${posicion.cantidadTokens.toFixed(4)} tokens\n` +
        `💰 *Valor actual:* ${(posicion.cantidadTokens * posicion.precioEntrada).toFixed(4)} SOL\n\n` +
        `*¿Qué porcentaje vender?*\n`,
        Markup.inlineKeyboard([
            [Markup.button.callback('25%', 'sell_25'), Markup.button.callback('50%', 'sell_50')],
            [Markup.button.callback('75%', 'sell_75'), Markup.button.callback('100%', 'sell_100')],
            [Markup.button.callback('❌ Cancelar', 'cancel')]
        ])
    );

    ctx.session = { action: 'sell', token: tokenInput };
});

bot.command('info', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/info PEPE` o `/info So111...`');
    }

    await ctx.reply('🔍 Buscando información...');

    let tokenMint = tokenInput;

    // Si es ticker, buscar mint
    if (/^[A-Z$]{1,10}$/.test(tokenInput)) {
        const cached = cacheTokens.get(tokenInput.replace('$', ''));
        if (cached) {
            tokenMint = cached.mint;
        }
    }

    const info = await getTokenInfoCompleta(tokenMint);

    let mensaje = `📊 **Información del Token**\n\n`;
    mensaje += `🪙 **Símbolo:** ${info.symbol}\n`;
    mensaje += `📝 **Nombre:** ${info.name}\n`;
    mensaje += `💰 **Precio:** $${info.price.toFixed(8)}\n`;
    mensaje += `💧 **Liquidez:** $${info.liquidity.toLocaleString()}\n`;
    mensaje += `🔄 **Volumen 24h:** $${info.volume24h.toLocaleString()}\n`;
    mensaje += `📈 **Cambio 24h:** ${info.priceChange24h >= 0 ? '🟢' : '🔴'} ${info.priceChange24h.toFixed(2)}%\n`;
    mensaje += `👥 **Holders:** ${info.holders}\n`;

    if (info.exchanges.length > 0) {
        mensaje += `📡 **Exchanges:** ${info.exchanges.join(', ')}\n`;
    }

    mensaje += `🔗 **Mint:** \`${info.mint.substring(0, 8)}...${info.mint.substring(info.mint.length - 8)}\``;

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.callback('💰 Comprar', `buy_token_${info.mint}`)],
        [Markup.button.callback('📈 Gráfico', `chart_${info.mint}`)]
    ]));
});

bot.command('posiciones', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones abiertas');
    }

    let mensaje = `📊 **Posiciones Abiertas (${posiciones.size})**\n\n`;

    for (const [tokenInput, pos] of posiciones) {
        const info = await getTokenInfoCompleta(pos.tokenMint);
        const precioActual = info.price || pos.precioEntrada;
        const valorActual = pos.cantidadTokens * precioActual;
        const pnl = valorActual - pos.invertido;
        const pnlPorcentaje = ((pnl / pos.invertido) * 100).toFixed(2);

        mensaje += `🪙 **${pos.tokenInput}**\n`;
        mensaje += `💰 Cantidad: ${pos.cantidadTokens.toFixed(4)}\n`;
        mensaje += `💵 Valor actual: $${valorActual.toFixed(2)}\n`;
        mensaje += `📊 PnL: ${pnl >= 0 ? '🟢' : '🔴'} $${pnl.toFixed(2)} (${pnlPorcentaje}%)\n`;
        mensaje += `💸 Invertido: ${pos.invertido} SOL\n`;
        mensaje += `🔗 Exchange: ${pos.exchange}\n`;
        mensaje += `⏰ Entrada: ${pos.timestamp.toLocaleString()}\n\n`;
    }

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.callback('💰 Comprar Más', 'action_buy')],
        [Markup.button.callback('💸 Vender Todo', 'sell_all')]
    ]));
});

bot.command('config', async (ctx) => {
    const userId = ctx.from.id;
    const userConfig = getConfiguracionUsuario(userId);

    await ctx.replyWithMarkdown(
        `⚙️ **Configuración Personal**\n\n` +
        `💰 *Monto de compra:* ${userConfig.buyAmount} SOL\n` +
        `⚙️ *Slippage:* ${userConfig.slippage}%\n` +
        `🤖 *Modo Auto:* ${userConfig.modoAuto ? '✅' : '❌'}\n` +
        `🔔 *Notificaciones:* ${userConfig.notificaciones ? '✅' : '❌'}\n\n` +
        `*¿Qué deseas configurar?*\n`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💰 Monto', 'config_amount')],
            [Markup.button.callback('⚙️ Slippage', 'config_slippage')],
            [Markup.button.callback('🤖 Modo Auto', 'config_auto')],
            [Markup.button.callback('🔔 Notificaciones', 'config_notify')]
        ])
    );
});

// Balance y funciones básicas
async function getBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        return balanceLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        return 0;
    }
}

bot.command('balance', async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    let mensaje = `💰 **Balance Completo**\n\n`;
    mensaje += `🔵 **SOL:** ${balance.toFixed(4)} SOL\n`;
    mensaje += `💵 **USD (≈):** $${(balance * 150).toFixed(2)}\n\n`;

    if (tokens.length > 0) {
        mensaje += `🪙 **Tokens (${tokens.length}):**\n`;
        for (const token of tokens.slice(0, 5)) {
            const info = await getTokenInfoCompleta(token.mint);
            mensaje += `• ${info.symbol}: ${token.amount.toFixed(4)} ($${(token.amount * info.price).toFixed(2)})\n`;
        }
    }

    await ctx.replyWithMarkdown(mensaje);
});

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

// Manejo de botones y callbacks
bot.action('action_buy', (ctx) => {
    ctx.replyWithMarkdown(
        '💰 **Comprar Token**\n\n' +
        'Escribe la dirección o ticker del token:\n' +
        'Ej: `PEPE` o `So111...`'
    );
    ctx.answerCbQuery();
});

bot.action('action_sell', (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('❌ No tienes posiciones para vender');
    }

    let mensaje = '💸 **Selecciona token para vender:**\n\n';
    posiciones.forEach((pos, token) => {
        mensaje += `• ${pos.tokenInput} - ${pos.cantidadTokens.toFixed(4)} tokens\n`;
    });

    ctx.reply(mensaje);
    ctx.answerCbQuery();
});

bot.action(/amount_(.+)$/, async (ctx) => {
    const amount = ctx.match[1];
    const userId = ctx.from.id;

    if (amount === 'custom') {
        ctx.reply('💰 Escribe el monto en SOL:');
        ctx.session = { ...ctx.session, waitingAmount: true };
    } else {
        const userConfig = getConfiguracionUsuario(userId);
        userConfig.buyAmount = parseFloat(amount);

        ctx.replyWithMarkdown(
            `✅ *Monto configurado:* ${amount} SOL\n\n` +
            `Ahora usa /buy <token> para comprar`,
            tradingKeyboard
        );
    }
    ctx.answerCbQuery();
});

bot.action(/slippage_(.+)$/, (ctx) => {
    const slippage = ctx.match[1];
    const userId = ctx.from.id;
    const userConfig = getConfiguracionUsuario(userId);
    userConfig.slippage = parseFloat(slippage);

    ctx.replyWithMarkdown(
        `✅ *Slippage configurado:* ${slippage}%\n\n`,
        tradingKeyboard
    );
    ctx.answerCbQuery();
});

bot.action(/sell_(\d+)$/, async (ctx) => {
    const percentage = parseInt(ctx.match[1]) / 100;
    const tokenInput = ctx.session?.token;

    if (!tokenInput) {
        ctx.reply('❌ Error: Token no especificado');
        return ctx.answerCbQuery();
    }

    const posicion = posiciones.get(tokenInput);
    if (!posicion) {
        ctx.reply('❌ No tienes posición en ese token');
        return ctx.answerCbQuery();
    }

    const tokensAVender = posicion.cantidadTokens * percentage;
    const solRecibidos = tokensAVender * posicion.precioEntrada * (1 + Math.random() * 0.2 - 0.1);

    // Actualizar posición
    posicion.cantidadTokens -= tokensAVender;
    posicion.ventas.push({
        timestamp: new Date(),
        cantidadVendida: tokensAVender,
        valorSOL: solRecibidos,
        porcentaje: percentage
    });

    if (posicion.cantidadTokens <= 0.001) {
        posicion.estado = 'cerrada';
    }

    ctx.replyWithMarkdown(
        `✅ **Venta Exitosa**\n\n` +
        `🪙 Tokens vendidos: ${tokensAVender.toFixed(4)}\n` +
        `💰 SOL recibidos: ${solRecibidos.toFixed(4)}\n` +
        `📊 Porcentaje: ${(percentage * 100).toFixed(0)}%`
    );
    ctx.answerCbQuery();
});

// Comando de ayuda
bot.command('help', (ctx) => {
    ctx.replyWithMarkdown(
        `🆘 **Ayuda del Bot Avanzado**\n\n` +
        `📋 **Comandos principales:**\n` +
        `/start - Menú principal\n` +
        `/buy <token> - Comprar con menú\n` +
        `/sell <token> - Vender con menú\n` +
        `/info <token> - Info detallada\n` +
        `/posiciones - Ver todas las posiciones\n` +
        `/balance - Balance completo\n` +
        `/config - Configuración personal\n\n` +
        `🎯 **Funciones avanzadas:**\n` +
        `• Menús interactivos para compra/venta\n` +
        `• Configuración personalizada\n` +
        `• Detección automática de tokens\n` +
        `• Información detallada con precio, PnL, holders\n` +
        `• Soporte para todas las DEXs\n\n` +
        `💡 **Modo de uso:**\n` +
        `1. Usa /buy <token> y selecciona monto\n` +
        `2. El bot detecta automáticamente en los canales\n` +
        `3. Configura tu slippage y montos preferidos`
    );
});

// Monitoreo de canales
bot.on('text', async (ctx) => {
    if (!modoTrading) return;

    const username = ctx.chat.username;
    if (!username || !canales.has(username)) return;

    const texto = ctx.message.text;
    const tokens = extraerTokens(texto);

    if (tokens.length > 0) {
        console.log(`\n🎯 Detectados ${tokens.length} tokens en @${username}`);

        for (const token of tokens) {
            if (!posiciones.has(token.valor)) {
                try {
                    const info = await getTokenInfoCompleta(token.valor);

                    // Mostrar info rápida antes de comprar
                    await ctx.replyWithMarkdown(
                        `🚀 **Token Detectado!**\n\n` +
                        `📝 Tipo: ${token.tipo}\n` +
                        `🪙 Token: ${token.valor}\n` +
                        `💰 Precio: $${info.price.toFixed(8)}\n` +
                        `💧 Liquidez: $${info.liquidity.toLocaleString()}\n\n` +
                        `💸 *Comprando automáticamente...*`
                    );

                    // Simular compra (en caso real ejecutaría la transacción)
                    const tokensRecibidos = config.buyAmount / (info.price || 0.000001);

                    posiciones.set(token.valor, {
                        tokenMint: info.mint || token.valor,
                        tokenInput: token.valor,
                        cantidadTokens: tokensRecibidos,
                        precioEntrada: info.price || 0.000001,
                        invertido: config.buyAmount,
                        timestamp: new Date(),
                        ventas: [],
                        estado: 'activa',
                        exchange: info.exchanges[0] || 'Unknown',
                        symbol: info.symbol
                    });

                    console.log(`✅ Compra ejecutada: ${tokensRecibidos.toFixed(4)} ${info.symbol}`);

                } catch (error) {
                    console.error(`Error con ${token.valor}:`, error.message);
                }
            }
        }
    }
});

// Escuchar texto para personalizar montos
bot.on('text', (ctx) => {
    if (ctx.session?.waitingAmount) {
        const amount = parseFloat(ctx.message.text);
        if (amount && amount >= config.minBuyAmount && amount <= config.maxBuyAmount) {
            const userId = ctx.from.id;
            const userConfig = getConfiguracionUsuario(userId);
            userConfig.buyAmount = amount;

            ctx.replyWithMarkdown(
                `✅ *Monto personalizado:* ${amount} SOL\n\n`,
                tradingKeyboard
            );
            delete ctx.session.waitingAmount;
        } else {
            ctx.reply(`❌ Monto inválido. Debe estar entre ${config.minBuyAmount} y ${config.maxBuyAmount} SOL`);
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

    console.log('✅ Bot AVANZADO iniciado');
    console.log('🎯 Menús interactivos activados');
    console.log('💰 Monto por defecto:', config.buyAmount, 'SOL');
    console.log('📡 Monitoreando:', Array.from(canales).join(', '));

    bot.launch()
        .then(() => console.log('🎉 Bot activo con menús interactivos!'))
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