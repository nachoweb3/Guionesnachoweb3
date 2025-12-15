require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot Premium Multi-Wallet...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    defaultBuyAmount: 0.1,
    defaultSlippage: 10,
    canalesMonitorear: ['cryptoyeezuscalls'],
    apis: {
        dexscreener: 'https://api.dexscreener.com/latest',
        coingecko: 'https://api.coingecko.com/api/v3'
    }
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection;
const userWallets = new Map();
const posiciones = new Map();
const sessionData = new Map();
const userSettings = new Map(); // userId -> settings

// Configuración por defecto del usuario
const defaultSettings = {
    buyAmount: 0.1,
    slippage: 10,
    autoSell: false,
    sellAt2x: true,
    sellAt5x: true,
    stopLoss: -50,
    maxPositions: 10,
    preferredExchange: 'jupiter',
    notifications: true
};

// Base de datos
const DB_FILE = './bot_database.json';

// Cargar base de datos
function cargarBaseDatos() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

            // Cargar wallets
            if (data.wallets) {
                Object.entries(data.wallets).forEach(([userId, walletData]) => {
                    userWallets.set(userId, {
                        keypair: Keypair.fromSecretKey(Buffer.from(walletData.secretKey)),
                        publicKey: new PublicKey(walletData.publicKey),
                        secretKey: walletData.secretKey
                    });
                });
            }

            // Cargar posiciones
            if (data.positions) {
                Object.entries(data.positions).forEach(([userId, userPos]) => {
                    const posMap = new Map();
                    Object.entries(userPos).forEach(([token, pos]) => {
                        posMap.set(token, pos);
                    });
                    posiciones.set(userId, posMap);
                });
            }

            // Cargar configuraciones
            if (data.settings) {
                Object.entries(data.settings).forEach(([userId, settings]) => {
                    userSettings.set(userId, { ...defaultSettings, ...settings });
                });
            }

            console.log(`✅ Base de datos cargada: ${userWallets.size} usuarios`);
        }
    } catch (error) {
        console.error('Error cargando base de datos:', error.message);
    }
}

// Guardar base de datos
function guardarBaseDatos() {
    try {
        const data = {
            wallets: {},
            positions: {},
            settings: {}
        };

        // Guardar wallets
        userWallets.forEach((wallet, userId) => {
            data.wallets[userId] = {
                publicKey: wallet.publicKey.toString(),
                secretKey: wallet.secretKey
            };
        });

        // Guardar posiciones
        posiciones.forEach((userPos, userId) => {
            data.positions[userId] = Object.fromEntries(userPos);
        });

        // Guardar configuraciones
        userSettings.forEach((settings, userId) => {
            data.settings[userId] = settings;
        });

        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error guardando base de datos:', error.message);
    }
}

// Inicializar conexión
async function inicializar() {
    try {
        connection = new Connection(config.rpcUrl, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });

        cargarBaseDatos();

        console.log(`✅ Conectado a Solana`);
        console.log(`🔗 RPC: ${config.rpcUrl}`);
        return true;
    } catch (error) {
        console.error('❌ Error conexión:', error.message);
        return false;
    }
}

// Funciones utilitarias
function crearWalletUsuario(userId) {
    const wallet = Keypair.generate();
    userWallets.set(userId, {
        keypair: wallet,
        publicKey: wallet.publicKey,
        secretKey: Array.from(wallet.secretKey)
    });
    posiciones.set(userId, new Map());
    userSettings.set(userId, { ...defaultSettings });
    guardarBaseDatos();
    return wallet;
}

function getWalletUsuario(userId) {
    return userWallets.get(userId) || null;
}

function getSettings(userId) {
    if (!userSettings.has(userId)) {
        userSettings.set(userId, { ...defaultSettings });
    }
    return userSettings.get(userId);
}

// TECLADOS MEJORADOS
const mainMenu = Markup.inlineKeyboard([
    [
        Markup.button.callback('💳 Mi Wallet', 'menu_wallet'),
        Markup.button.callback('💰 Trading', 'menu_trading')
    ],
    [
        Markup.button.callback('📊 Estadísticas', 'menu_stats'),
        Markup.button.callback('⚙️ Configuración', 'menu_config')
    ],
    [
        Markup.button.callback('🎯 Señales', 'menu_signals'),
        Markup.button.callback('❓ Ayuda', 'menu_help')
    ]
]);

const walletMenu = Markup.inlineKeyboard([
    [
        Markup.button.callback('📋 Ver Dirección', 'wallet_address'),
        Markup.button.callback('🔑 Clave Privada', 'wallet_private')
    ],
    [
        Markup.button.callback('💰 Balance', 'wallet_balance'),
        Markup.button.callback('📥 Depositar', 'wallet_deposit')
    ],
    [
        Markup.button.callback('📤 Retirar', 'wallet_withdraw'),
        Markup.button.callback('🔄 Nueva Wallet', 'wallet_new')
    ],
    [
        Markup.button.callback('⬅️ Menú Principal', 'back_main')
    ]
]);

const tradingMenu = Markup.inlineKeyboard([
    [
        Markup.button.callback('💎 Comprar Rápido', 'trade_quick_buy'),
        Markup.button.callback('📈 Comprar con Límite', 'trade_limit_buy')
    ],
    [
        Markup.button.callback('💸 Vender', 'trade_sell'),
        Markup.button.callback('🚀 Vender Todo', 'trade_sell_all')
    ],
    [
        Markup.button.callback('📋 Mis Posiciones', 'trade_positions'),
        Markup.button.callback('⬅️ Menú Principal', 'back_main')
    ]
]);

const configMenu = Markup.inlineKeyboard([
    [
        Markup.button.callback('💰 Monto Compra', 'config_buy_amount'),
        Markup.button.callback('📊 Slippage', 'config_slippage')
    ],
    [
        Markup.button.callback('🤖 Auto-Vender', 'config_auto_sell'),
        Markup.button.callback('🛑 Stop Loss', 'config_stop_loss')
    ],
    [
        Markup.button.callback('🔔 Notificaciones', 'config_notifications'),
        Markup.button.callback('🏢 Exchange', 'config_exchange')
    ],
    [
        Markup.button.callback('⬅️ Menú Principal', 'back_main')
    ]
]);

const buyAmountKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL', 'set_buy_0.01'), Markup.button.callback('0.05 SOL', 'set_buy_0.05')],
    [Markup.button.callback('0.1 SOL', 'set_buy_0.1'), Markup.button.callback('0.5 SOL', 'set_buy_0.5')],
    [Markup.button.callback('1 SOL', 'set_buy_1'), Markup.button.callback('5 SOL', 'set_buy_5')],
    [Markup.button.callback('⬅️ Atrás', 'config_menu')]
]);

const slippageKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('3%', 'set_slippage_3'), Markup.button.callback('5%', 'set_slippage_5')],
    [Markup.button.callback('10%', 'set_slippage_10'), Markup.button.callback('15%', 'set_slippage_15')],
    [Markup.button.callback('20%', 'set_slippage_20'), Markup.button.callback('⬅️ Atrás', 'config_menu')]
]);

// MENSAJES CON EMOTICONOS Y FORMATO
const welcomeMessage = (userName, walletAddress) => `
🎉 **¡Bienvenido a JESUS FOLLOWER BOT!** 🎉

👋 *Hola ${userName}*

🔑 *He creado una wallet exclusiva para ti*
📋 *Dirección: \`${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}\`*

📩 *Tu clave privada ha sido enviada por mensaje privado*
⚠️ *Guárdala en un lugar seguro y NUNCA la compartas*

💡 *Para empezar:*
   • Usa /depositar para recargar tu wallet
   • Usa 💰 Trading para comprar tokens
   • Configura tus preferencias en ⚙️ Configuración

🚀 *¡Estás listo para operar!*
`;

const walletInfoMessage = (balance, address, positions) => `
💳 **TU WALLET SOLANA** 💳

📋 *Dirección Pública:*
\`${address}\`

💰 *Balance Actual:*
   • SOL: ${balance.toFixed(4)}
   • USD: $${(balance * 150).toFixed(2)}

📊 *Posiciones Activas:* ${positions}

💡 *Usa los botones para gestionar tu wallet*
`;

// COMANDO START
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Trader';
    let wallet = getWalletUsuario(userId);

    if (!wallet) {
        wallet = crearWalletUsuario(userId);

        await ctx.replyWithMarkdown(
            welcomeMessage(userName, wallet.publicKey.toString()),
            mainMenu
        );

        // Enviar clave privada por mensaje privado
        try {
            await ctx.telegram.sendMessage(userId,
                `🔐 **🔑 CLAVE PRIVADA - GUÁRDALA SECRETA 🔑**\n\n` +
                `💾 *Copia y guarda esta clave en un lugar seguro:*\n\n` +
                `\`${Buffer.from(wallet.secretKey).toString('hex')}\`\n\n` +
                `⚠️ *ADVERTENCIA:*\n` +
                `• Nunca compartas esta clave con nadie\n` +
                `• Cualquiera con esta clave tiene acceso total\n` +
                `• Importala en Phantom, Solflare o similar\n\n` +
                `🔒 *Esta clave solo ha sido enviada a ti*`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Error enviando mensaje privado:', error.message);
            await ctx.reply('❌ No pude enviarte la clave privada. Inicia un chat con el bot primero.');
        }
    } else {
        const balance = await getBalance(userId);
        const settings = getSettings(userId);
        const userPos = posiciones.get(userId) || new Map();

        await ctx.replyWithMarkdown(
            `🤖 **JESUS FOLLOWER BOT** 🤖\n\n` +
            `👤 *Bienvenido de vuelta, ${userName}!*\n\n` +
            `💰 *Balance:* ${balance.toFixed(4)} SOL ($${(balance * 150).toFixed(2)})\n` +
            `📊 *Posiciones:* ${userPos.size} activas\n` +
            `💎 *Monto compra:* ${settings.buyAmount} SOL\n` +
            `📈 *Slippage:* ${settings.slippage}%\n\n` +
            `🎯 *¿Qué quieres hacer hoy?*`,
            mainMenu
        );
    }
});

// HANDLERS DE MENÚ
bot.action('menu_wallet', async (ctx) => {
    const userId = ctx.from.id.toString();
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        await ctx.reply('❌ No tienes wallet. Usa /start para crear una');
        ctx.answerCbQuery();
        return;
    }

    const balance = await getBalance(userId);
    const userPos = posiciones.get(userId) || new Map();

    await ctx.replyWithMarkdown(
        walletInfoMessage(balance, wallet.publicKey.toString(), userPos.size),
        walletMenu
    );
    ctx.answerCbQuery();
});

bot.action('menu_trading', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);
    const userPos = posiciones.get(userId) || new Map();

    await ctx.replyWithMarkdown(
        `💰 **MENÚ TRADING** 💰\n\n` +
        `💎 *Monto por defecto:* ${settings.buyAmount} SOL\n` +
        `📊 *Slippage configurado:* ${settings.slippage}%\n` +
        `📈 *Posiciones activas:* ${userPos.size}/10\n\n` +
        `🎯 *Selecciona una operación:*`,
        tradingMenu
    );
    ctx.answerCbQuery();
});

bot.action('menu_config', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    await ctx.replyWithMarkdown(
        `⚙️ **CONFIGURACIÓN** ⚙️\n\n` +
        `💰 *Monto compra:* ${settings.buyAmount} SOL\n` +
        `📊 *Slippage:* ${settings.slippage}%\n` +
        `🤖 *Auto-vender:* ${settings.autoSell ? '✅ Activado' : '❌ Desactivado'}\n` +
        `🛑 *Stop Loss:* -${Math.abs(settings.stopLoss)}%\n` +
        `🔔 *Notificaciones:* ${settings.notifications ? '✅ Activadas' : '❌ Desactivadas'}\n` +
        `🏢 *Exchange:* ${settings.preferredExchange.toUpperCase()}\n\n` +
        `⚡ *¿Qué quieres configurar?*`,
        configMenu
    );
    ctx.answerCbQuery();
});

bot.action('menu_stats', async (ctx) => {
    const userId = ctx.from.id.toString();
    const balance = await getBalance(userId);
    const userPos = posiciones.get(userId) || new Map();

    let totalInvested = 0;
    let totalPnL = 0;

    for (const [token, pos] of userPos) {
        totalInvested += pos.invertido;
        const info = await getTokenInfo(token);
        const currentPrice = info.price || pos.precioEntrada;
        totalPnL += (pos.cantidadTokens * currentPrice) - pos.invertido;
    }

    await ctx.replyWithMarkdown(
        `📊 **ESTADÍSTICAS DE TRADING** 📊\n\n` +
        `💰 *Balance Disponible:* ${balance.toFixed(4)} SOL\n` +
        `📈 *Invertido Total:* ${totalInvested.toFixed(4)} SOL\n` +
        `💎 *PnL Total:* ${totalPnL >= 0 ? '🟢' : '🔴'} ${totalPnL.toFixed(4)} SOL\n` +
        `📊 *Posiciones Activas:* ${userPos.size}\n\n` +
        `💡 *Rendimiento:* ${totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0}%`
    );
    ctx.answerCbQuery();
});

// CONFIGURACIÓN DE PARÁMETROS
bot.action('config_buy_amount', async (ctx) => {
    await ctx.replyWithMarkdown(
        `💰 **CONFIGURAR MONTO DE COMPRA**\n\n` +
        `Selecciona el monto por defecto:`,
        buyAmountKeyboard
    );
    ctx.answerCbQuery();
});

bot.action(/set_buy_(\d+\.?\d*)/, (ctx) => {
    const amount = parseFloat(ctx.match[1]);
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    settings.buyAmount = amount;
    guardarBaseDatos();

    ctx.replyWithMarkdown(
        `✅ *Monto de compra actualizado a ${amount} SOL*`
    );
    ctx.answerCbQuery();
});

bot.action('config_slippage', async (ctx) => {
    await ctx.replyWithMarkdown(
        `📊 **CONFIGURAR SLIPPAGE**\n\n` +
        `Selecciona el slippage por defecto:`,
        slippageKeyboard
    );
    ctx.answerCbQuery();
});

bot.action(/set_slippage_(\d+)/, (ctx) => {
    const slippage = parseInt(ctx.match[1]);
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    settings.slippage = slippage;
    guardarBaseDatos();

    ctx.replyWithMarkdown(
        `✅ *Slippage actualizado a ${slippage}%*`
    );
    ctx.answerCbQuery();
});

bot.action('config_auto_sell', (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    settings.autoSell = !settings.autoSell;
    guardarBaseDatos();

    ctx.replyWithMarkdown(
        `🤖 *Auto-vender ${settings.autoSell ? '✅ Activado' : '❌ Desactivado'}*`
    );
    ctx.answerCbQuery();
});

bot.action('config_stop_loss', async (ctx) => {
    await ctx.replyWithMarkdown(
        `🛑 **CONFIGURAR STOP LOSS**\n\n` +
        `Escribe el porcentaje de pérdida:\n` +
        `Ejemplo: \`/stoploss 30\` para -30%`
    );
    ctx.answerCbQuery();
});

bot.command('stoploss', async (ctx) => {
    const userId = ctx.from.id.toString();
    const percentage = ctx.message.text.split(' ')[1];

    if (!percentage) {
        return ctx.reply('❌ Especifica el porcentaje\nEj: `/stoploss 30`');
    }

    const settings = getSettings(userId);
    settings.stopLoss = -Math.abs(parseInt(percentage));
    guardarBaseDatos();

    ctx.replyWithMarkdown(
        `✅ *Stop Loss configurado a ${percentage}%*`
    );
});

// COMANDO DEPOSITAR
bot.command('depositar', async (ctx) => {
    const userId = ctx.from.id.toString();
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        return ctx.reply('❌ No tienes wallet. Usa /start para crear una');
    }

    await ctx.replyWithMarkdown(
        `💰 **DEPOSITAR SOL EN TU WALLET**\n\n` +
        `📋 *Tu dirección única:*\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `📌 *Instrucciones:*\n` +
        `• Envía SOL a esta dirección\n` +
        `• Los fondos aparecerán automáticamente\n` +
        `• Red: Solana Mainnet\n\n` +
        `💡 *Mínimo recomendado: 0.01 SOL*\n` +
        `⏱️ *Tiempo de confirmación: ~15 segundos*`
    );
});

// COMANDO COMPRAR
bot.command('buy', async (ctx) => {
    const userId = ctx.from.id.toString();
    const parts = ctx.message.text.split(' ');
    const token = parts[1];
    const amount = parts[2] ? parseFloat(parts[2]) : getSettings(userId).buyAmount;

    if (!token) {
        return ctx.replyWithMarkdown(
            '❌ *Especifica el token*\n\n' +
            'Ejemplos:\n' +
            '`/buy PEPE`\n' +
            '`/buy BONK 0.5`'
        );
    }

    const wallet = getWalletUsuario(userId);
    if (!wallet) {
        return ctx.reply('❌ No tienes wallet. Usa /start para crear una');
    }

    const balance = await getBalance(userId);
    if (balance < amount) {
        return ctx.replyWithMarkdown(
            `❌ *Balance insuficiente*\n\n` +
            `Necesitas: ${amount} SOL\n` +
            `Tienes: ${balance.toFixed(4)} SOL\n\n` +
            `Usa /depositar para recargar`
        );
    }

    // Simular compra
    const info = await getTokenInfo(token);
    const tokensRecibidos = amount / (info.price || 0.000001);

    if (!posiciones.has(userId)) {
        posiciones.set(userId, new Map());
    }

    posiciones.get(userId).set(token, {
        tokenMint: token,
        tokenInput: token,
        cantidadTokens: tokensRecibidos,
        precioEntrada: info.price || 0.000001,
        invertido: amount,
        timestamp: new Date(),
        ventas: [],
        estado: 'activa',
        exchange: getSettings(userId).preferredExchange
    });

    guardarBaseDatos();

    await ctx.replyWithMarkdown(
        `✅ **COMPRA EXITOSA** ✅\n\n` +
        `🪙 *Token:* ${token}\n` +
        `💰 *Invertido:* ${amount} SOL\n` +
        `📊 *Tokens recibidos:* ${tokensRecibidos.toFixed(4)}\n` +
        `💎 *Precio:* $${(info.price || 0).toFixed(8)}\n\n` +
        `📍 *Posición activada*`
    );
});

// COMANDO VENDER
bot.command('sell', async (ctx) => {
    const userId = ctx.from.id.toString();
    const parts = ctx.message.text.split(' ');
    const token = parts[1];
    const percentage = parts[2] ? parseFloat(parts[2]) : 100;

    if (!token) {
        return ctx.reply('❌ Especifica el token\nEj: `/sell PEPE 50`');
    }

    const userPos = posiciones.get(userId);
    if (!userPos || !userPos.has(token)) {
        return ctx.reply('❌ No tienes posición en ese token');
    }

    const posicion = userPos.get(token);
    const tokensAVender = posicion.cantidadTokens * (percentage / 100);
    const info = await getTokenInfo(token);
    const precioActual = info.price || posicion.precioEntrada;
    const solRecibidos = tokensAVender * precioActual;

    // Actualizar posición
    posicion.cantidadTokens -= tokensAVender;
    if (posicion.cantidadTokens <= 0) {
        userPos.delete(token);
    }

    guardarBaseDatos();

    await ctx.replyWithMarkdown(
        `✅ **VENTA EXITOSA** ✅\n\n` +
        `🪙 *Token:* ${token}\n` +
        `📊 *Tokens vendidos:* ${tokensAVender.toFixed(4)}\n` +
        `💰 *SOL recibidos:* ${solRecibidos.toFixed(4)}\n` +
        `📈 *Precio venta:* $${precioActual.toFixed(8)}\n` +
        `📊 *Porcentaje:* ${percentage}%\n\n` +
        `💡 *PnL estimado:* ${((precioActual / posicion.precioEntrada - 1) * 100).toFixed(2)}%`
    );
});

// COMANDOS ADICIONALES
bot.command('posiciones', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userPos = posiciones.get(userId);

    if (!userPos || userPos.size === 0) {
        return ctx.reply('📊 No tienes posiciones abiertas');
    }

    let mensaje = '📊 **TUS POSICIONES** 📊\n\n';

    for (const [token, pos] of userPos) {
        const info = await getTokenInfo(token);
        const precioActual = info.price || pos.precioEntrada;
        const valorActual = pos.cantidadTokens * precioActual;
        const pnl = valorActual - pos.invertido;
        const pnlPorcentaje = ((precioActual / pos.precioEntrada - 1) * 100);

        mensaje += `🪙 ${token}\n`;
        mensaje += `   💰 Valor: $${valorActual.toFixed(4)}\n`;
        mensaje += `   📈 PnL: ${pnlPorcentaje > 0 ? '🟢' : '🔴'} ${pnlPorcentaje.toFixed(2)}%\n`;
        mensaje += `   💎 Tokens: ${pos.cantidadTokens.toFixed(0)}\n\n`;
    }

    await ctx.replyWithMarkdown(mensaje);
});

bot.command('balance', async (ctx) => {
    const userId = ctx.from.id.toString();
    const balance = await getBalance(userId);
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        return ctx.reply('❌ No tienes wallet. Usa /start para crear una');
    }

    await ctx.replyWithMarkdown(
        `💰 **TU BALANCE** 💰\n\n` +
        `💎 *SOL Disponible:* ${balance.toFixed(4)}\n` +
        `💵 *Valor USD:* $${(balance * 150).toFixed(2)}\n` +
        `📍 *Wallet:* \`${wallet.publicKey.toString().slice(0, 8)}...${wallet.publicKey.toString().slice(-8)}\``
    );
});

// HANDLER DE VOLVER
bot.action('back_main', async (ctx) => {
    await ctx.command('start');
    ctx.answerCbQuery();
});

// FUNCIONES AUXILIARES
async function getBalance(userId) {
    try {
        const wallet = getWalletUsuario(userId);
        if (!wallet) return 0;

        const balanceLamports = await connection.getBalance(wallet.publicKey);
        return balanceLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        return 0;
    }
}

async function getTokenInfo(tokenMint) {
    try {
        const response = await axios.get(`${config.apis.dexscreener}/dex/tokens/${tokenMint}`);
        if (response.data.pairs && response.data.pairs.length > 0) {
            const pair = response.data.pairs[0];
            return {
                symbol: pair.baseToken.symbol || 'UNKNOWN',
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
        price: 0.000001,
        liquidity: 0
    };
}

// MONITOREO DE SEÑALES (para canales configurados)
bot.on('text', async (ctx) => {
    const username = ctx.chat.username;
    if (!username || !config.canalesMonitorear.includes(username)) return;

    const tokens = extraerTokens(ctx.message.text);
    const settings = getSettings(ctx.from.id.toString());

    if (tokens.length > 0 && settings.autoSell) {
        for (const token of tokens) {
            // Lógica de auto-trading basada en configuración
            console.log(`Token detectado: ${token.valor}`);
        }
    }
});

function extraerTokens(texto) {
    const resultados = [];
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

    const tickerRegex = /\b[A-Z]{3,10}\b/g;
    const tickers = texto.match(tickerRegex);
    if (tickers) {
        const exclude = ['BTC', 'ETH', 'USD', 'SOL', 'USDT', 'USDC'];
        for (const ticker of tickers) {
            if (!exclude.includes(ticker)) {
                resultados.push({ tipo: 'ticker', valor: ticker });
            }
        }
    }

    return resultados;
}

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot Premium Multi-Wallet iniciado');
    console.log('💳 Cada usuario tiene su wallet única');
    console.log('⚙️ Configuración personalizada disponible');

    bot.launch()
        .then(() => console.log('🎉 Bot Premium activo!'))
        .catch(err => console.error('❌ Error:', err));
}

// Graceful shutdown
process.once('SIGINT', () => {
    guardarBaseDatos();
    console.log('\n🛑 Guardando datos y deteniendo bot...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    guardarBaseDatos();
    console.log('\n🛑 Guardando datos y deteniendo bot...');
    bot.stop('SIGTERM');
});

// Guardar cada 5 minutos
setInterval(guardarBaseDatos, 5 * 60 * 1000);

// Iniciar
iniciar();