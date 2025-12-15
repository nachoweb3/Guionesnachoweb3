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

console.log('🚀 Iniciando Bot Multi-Wallet...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.1,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    apis: {
        dexscreener: 'https://api.dexscreener.com/latest'
    }
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection;
const userWallets = new Map(); // userId -> walletData
const posiciones = new Map(); // userId -> Map(token -> posicion)
const sessionData = new Map(); // userId -> session

// Base de datos de usuarios (persistencia simple)
const USERS_FILE = './users.json';

// Cargar usuarios existentes
function cargarUsuarios() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            // Reconstruir los Map desde JSON
            Object.entries(data).forEach(([userId, userData]) => {
                if (userData.wallet) {
                    userWallets.set(userId, {
                        keypair: Keypair.fromSecretKey(Buffer.from(userData.wallet.secretKey)),
                        publicKey: new PublicKey(userData.wallet.publicKey),
                        secretKey: userData.wallet.secretKey
                    });
                }
                if (userData.posiciones) {
                    const userPos = new Map();
                    Object.entries(userData.posiciones).forEach(([token, pos]) => {
                        userPos.set(token, pos);
                    });
                    posiciones.set(userId, userPos);
                }
            });
            console.log(`✅ Cargados ${userWallets.size} usuarios`);
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error.message);
    }
}

// Guardar usuarios
function guardarUsuarios() {
    try {
        const data = {};
        userWallets.forEach((wallet, userId) => {
            data[userId] = {
                wallet: {
                    publicKey: wallet.publicKey.toString(),
                    secretKey: Array.from(wallet.secretKey)
                },
                posiciones: posiciones.has(userId) ? Object.fromEntries(posiciones.get(userId)) : {}
            };
        });
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error guardando usuarios:', error.message);
    }
}

// Inicializar conexión
async function inicializar() {
    try {
        connection = new Connection(config.rpcUrl, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });

        // Cargar usuarios existentes
        cargarUsuarios();

        console.log(`✅ Conectado a Solana`);
        return true;
    } catch (error) {
        console.error('❌ Error conexión:', error.message);
        return false;
    }
}

// Crear nueva wallet para usuario
function crearWalletUsuario(userId) {
    const wallet = Keypair.generate();
    userWallets.set(userId, {
        keypair: wallet,
        publicKey: wallet.publicKey,
        secretKey: Array.from(wallet.secretKey)
    });
    posiciones.set(userId, new Map());
    guardarUsuarios();
    return wallet;
}

// Obtener wallet de usuario
function getWalletUsuario(userId) {
    if (!userWallets.has(userId)) {
        return null;
    }
    return userWallets.get(userId);
}

// Teclados
const mainKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💳 Mi Wallet', 'wallet_menu'), Markup.button.callback('💰 Comprar', 'action_buy')],
    [Markup.button.callback('💸 Vender', 'action_sell'), Markup.button.callback('📊 PnL', 'action_pnl')],
    [Markup.button.callback('💎 Balance', 'action_balance'), Markup.button.callback('📡 Config', 'action_config')]
]);

const walletKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📋 Dirección', 'wallet_address'), Markup.button.callback('🔑 Private Key', 'wallet_private')],
    [Markup.button.callback('💸 Retirar', 'wallet_withdraw'), Markup.button.callback('🔄 Nueva Wallet', 'wallet_new')],
    [Markup.button.callback('⬅️ Volver', 'back_main')]
]);

const buyKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL 💎', 'buy_0.01'), Markup.button.callback('0.05 SOL 💎', 'buy_0.05')],
    [Markup.button.callback('0.1 SOL 💎', 'buy_0.1'), Markup.button.callback('0.5 SOL 💎', 'buy_0.5')],
    [Markup.button.callback('1 SOL 💎', 'buy_1'), Markup.button.callback('❌ Cancelar', 'cancel')]
]);

// COMANDOS
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    let wallet = getWalletUsuario(userId);

    if (!wallet) {
        wallet = crearWalletUsuario(userId);

        await ctx.replyWithMarkdown(
            `🎉 **¡Bienvenido a JESUS FOLLOWER Bot!**\n\n` +
            `🔑 *He creado una wallet única para ti*\n` +
            `📨 *Te enviaré la clave privada por mensaje privado*\n\n` +
            `⚠️ *Guarda tu clave privada en un lugar seguro*\n` +
            `🔐 *No la compartas con nadie*\n\n` +
            `Usa /wallet para ver tu información`,
            mainKeyboard
        );

        // Enviar clave privada por mensaje privado
        try {
            await ctx.telegram.sendMessage(userId,
                `🔐 **CLAVE PRIVADA - GUARDALA SECRETA**\n\n` +
                `\`${Buffer.from(wallet.secretKey).toString('hex')}\`\n\n` +
                `⚠️ *Esta es tu única clave privada*\n` +
                `🔒 *Guárdala en un lugar seguro y no la compartas*\n\n` +
                `Puedes importarla en Phantom, Solflare o cualquier wallet Solana`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Error enviando mensaje privado:', error.message);
        }
    } else {
        const balance = await getBalance(userId);
        const userPos = posiciones.get(userId) || new Map();

        await ctx.replyWithMarkdown(
            `🤖 **JESUS FOLLOWER Bot**\n\n` +
            `💰 Balance: ${balance.toFixed(4)} SOL\n` +
            `📊 Posiciones: ${userPos.size} activas\n` +
            `💳 Wallet: \`${wallet.publicKey.toString().slice(0, 8)}...${wallet.publicKey.toString().slice(-8)}\`\n\n` +
            `Selecciona una acción:`,
            mainKeyboard
        );
    }
});

// COMANDO WALLET
bot.command('wallet', async (ctx) => {
    const userId = ctx.from.id.toString();
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        await ctx.reply('❌ No tienes una wallet. Usa /start para crear una');
        return;
    }

    const balance = await getBalance(userId);

    await ctx.replyWithMarkdown(
        `💳 **Tu Wallet Solana**\n\n` +
        `📋 Dirección Pública:\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `💰 Balance: ${balance.toFixed(4)} SOL\n` +
        `💎 Valor USD: $${(balance * 150).toFixed(2)}\n\n` +
        `⚠️ *Usa los botones para gestionar tu wallet*`,
        walletKeyboard
    );
});

// COMANDO DEPOSITAR
bot.command('depositar', async (ctx) => {
    const userId = ctx.from.id.toString();
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        await ctx.reply('❌ No tienes una wallet. Usa /start para crear una');
        return;
    }

    await ctx.replyWithMarkdown(
        `💰 **Depositar SOL en tu Wallet**\n\n` +
        `📋 *Tu dirección única:*\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `📌 *Envía SOL a esta dirección*\n` +
        `⏱️ *Los fondos aparecerán automáticamente*\n\n` +
        `💡 *Mínimo recomendado: 0.01 SOL*`
    );
});

// Callback handlers
bot.action('wallet_menu', async (ctx) => {
    await ctx.command('wallet');
    ctx.answerCbQuery();
});

bot.action('wallet_address', async (ctx) => {
    const userId = ctx.from.id.toString();
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        ctx.reply('❌ No tienes wallet');
        return;
    }

    await ctx.replyWithMarkdown(
        `📋 **Tu Dirección Pública**\n\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `📸 *Puedes escanear este QR desde Phantom/Solflare*`
    );
    ctx.answerCbQuery();
});

bot.action('wallet_private', async (ctx) => {
    const userId = ctx.from.id.toString();
    const wallet = getWalletUsuario(userId);

    if (!wallet) {
        ctx.reply('❌ No tienes wallet');
        return;
    }

    try {
        await ctx.telegram.sendMessage(userId,
            `🔐 **CLAVE PRIVADA**\n\n` +
            `\`${Buffer.from(wallet.secretKey).toString('hex')}\`\n\n` +
            `⚠️ *Nunca compartas esta clave*\n` +
            `🔒 *Guárdala en un lugar seguro*`
        );
        await ctx.reply('📩 Te he enviado tu clave privada por mensaje privado');
    } catch (error) {
        await ctx.reply('❌ Error enviando mensaje privado. Asegúrate de haber chateado con el bot antes');
    }
    ctx.answerCbQuery();
});

bot.action('wallet_new', async (ctx) => {
    const userId = ctx.from.id.toString();
    const oldWallet = getWalletUsuario(userId);

    if (oldWallet && posiciones.get(userId) && posiciones.get(userId).size > 0) {
        await ctx.reply('❌ Tienes posiciones abiertas. Vendelas antes de crear una nueva wallet');
        ctx.answerCbQuery();
        return;
    }

    const newWallet = crearWalletUsuario(userId);

    await ctx.replyWithMarkdown(
        `🔄 **Nueva Wallet Creada**\n\n` +
        `💳 *Nueva dirección:*\n` +
        `\`${newWallet.publicKey.toString()}\`\n\n` +
        `📩 *Te enviaré la clave privada por mensaje privado*`
    );

    try {
        await ctx.telegram.sendMessage(userId,
            `🔐 **NUEVA CLAVE PRIVADA**\n\n` +
            `\`${Buffer.from(newWallet.secretKey).toString('hex')}\`\n\n` +
            `⚠️ *Esta es tu nueva clave privada*\n` +
            `🔒 *La anterior ya no es válida*`
        );
    } catch (error) {
        console.error('Error enviando mensaje privado:', error.message);
    }
    ctx.answerCbQuery();
});

bot.action('back_main', async (ctx) => {
    await ctx.command('start');
    ctx.answerCbQuery();
});

bot.action('action_buy', (ctx) => {
    ctx.replyWithMarkdown(
        '💰 **Comprar Token**\n\n' +
        'Escribe el token:\n' +
        '`/buy PEPE`'
    );
    ctx.answerCbQuery();
});

bot.command('buy', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tokenInput = ctx.message.text.split(' ')[1];

    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/buy PEPE`');
    }

    const wallet = getWalletUsuario(userId);
    if (!wallet) {
        return ctx.reply('❌ No tienes wallet. Usa /start para crear una');
    }

    const balance = await getBalance(userId);
    if (balance < 0.01) {
        return ctx.reply('❌ Balance insuficiente. Deposita SOL primero con /depositar');
    }

    // Guardar en sesión
    sessionData.set(userId, {
        action: 'buy',
        token: tokenInput,
        amount: config.buyAmount
    });

    await ctx.replyWithMarkdown(
        `💰 **Comprar ${tokenInput}**\n\n` +
        `Monto: ${config.buyAmount} SOL\n` +
        `Slippage: ${config.slippage}%\n\n` +
        `Selecciona monto:`,
        buyKeyboard
    );
});

bot.action(/buy_(\d+\.?\d+)/, (ctx) => {
    const amount = ctx.match[1];
    const session = sessionData.get(ctx.from.id.toString());

    if (!session) {
        ctx.reply('❌ Sesión expirada. Inicia con /buy <token>');
    } else {
        session.amount = parseFloat(amount);

        ctx.replyWithMarkdown(
            `✅ **Monto:** ${amount} SOL\n\n` +
            `Token: ${session.token}\n` +
            `Slippage: ${config.slippage}%\n\n` +
            `Confirmar compra?`,
            Markup.inlineKeyboard([
                [Markup.button.callback('✅ Comprar', 'confirm_buy'), Markup.button.callback('❌ Cancelar', 'cancel')]
            ])
        );
    }
    ctx.answerCbQuery();
});

bot.action('confirm_buy', async (ctx) => {
    const userId = ctx.from.id.toString();
    const session = sessionData.get(userId);

    if (!session) {
        ctx.reply('❌ Sesión expirada');
        ctx.answerCbQuery();
        return;
    }

    const wallet = getWalletUsuario(userId);
    const balance = await getBalance(userId);

    if (balance < session.amount) {
        ctx.reply('❌ Balance insuficiente');
        ctx.answerCbQuery();
        return;
    }

    // Simular compra
    const info = await getTokenInfo(session.token);
    const tokensRecibidos = session.amount / (info.price || 0.000001);

    if (!posiciones.has(userId)) {
        posiciones.set(userId, new Map());
    }

    posiciones.get(userId).set(session.token, {
        tokenMint: session.token,
        tokenInput: session.token,
        cantidadTokens: tokensRecibidos,
        precioEntrada: info.price || 0.000001,
        invertido: session.amount,
        timestamp: new Date(),
        ventas: [],
        estado: 'activa',
        exchange: 'Jupiter'
    });

    guardarUsuarios();

    await ctx.replyWithMarkdown(
        `✅ **Compra Exitosa!**\n\n` +
        `Token: ${session.token}\n` +
        `Cantidad: ${session.amount} SOL\n` +
        `Tokens: ${tokensRecibidos.toFixed(4)}\n` +
        `Precio: $${(info.price || 0).toFixed(8)}`
    );

    sessionData.delete(userId);
    ctx.answerCbQuery();
});

bot.action('action_sell', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userPos = posiciones.get(userId);

    if (!userPos || userPos.size === 0) {
        ctx.reply('❌ No tienes posiciones para vender');
    } else {
        let lista = '💸 **Tus Posiciones:**\n\n';
        userPos.forEach((pos, token) => {
            lista += `• ${token}: ${pos.cantidadTokens.toFixed(0)} tokens\n`;
        });
        lista += '\nUsa: /sell <token> <porcentaje>';
        ctx.reply(lista);
    }
    ctx.answerCbQuery();
});

bot.command('sell', async (ctx) => {
    const userId = ctx.from.id.toString();
    const parts = ctx.message.text.split(' ');
    const tokenInput = parts[1];
    const porcentaje = parts[2] ? parseFloat(parts[2]) : 100;

    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/sell PEPE 50`');
    }

    const userPos = posiciones.get(userId);
    if (!userPos) {
        return ctx.reply('❌ No tienes posiciones');
    }

    const posicion = userPos.get(tokenInput);
    if (!posicion) {
        return ctx.reply('❌ No tienes posición en ese token');
    }

    const tokensAVender = posicion.cantidadTokens * (porcentaje / 100);
    const solRecibidos = tokensAVender * (getTokenInfo(posicion.tokenMint).price || posicion.precioEntrada);

    // Actualizar posición
    posicion.cantidadTokens -= tokensAVender;
    if (posicion.cantidadTokens <= 0) {
        userPos.delete(tokenInput);
    }

    guardarUsuarios();

    await ctx.replyWithMarkdown(
        `✅ **Venta Exitosa**\n\n` +
        `Tokens vendidos: ${tokensAVender.toFixed(4)}\n` +
        `SOL recibidos: ${solRecibidos.toFixed(4)}\n` +
        `Porcentaje: ${porcentaje}%`
    );
});

bot.action('action_pnl', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userPos = posiciones.get(userId);

    if (!userPos || userPos.size === 0) {
        await ctx.reply('📊 No hay posiciones abiertas');
        ctx.answerCbQuery();
        return;
    }

    let mensaje = '📊 **Tus Posiciones**\n\n';
    let totalPnL = 0;

    for (const [tokenInput, pos] of userPos) {
        const info = await getTokenInfo(pos.tokenMint);
        const pnlUSD = (pos.cantidadTokens * (info.price || pos.precioEntrada) * 150 / LAMPORTS_PER_SOL) - (pos.invertido * 150);
        totalPnL += pnlUSD;
        const pnlPorcentaje = ((info.price || pos.precioEntrada) / pos.precioEntrada - 1) * 100;

        mensaje += `${tokenInput}: ${pnlPorcentaje > 0 ? '🟢' : '🔴'} ${pnlPorcentaje.toFixed(2)}%\n`;
    }

    mensaje += `\n💰 **PnL Total:** ${totalPnL >= 0 ? '🟢' : '🔴'} $${totalPnL.toFixed(2)}`;
    await ctx.reply(mensaje);
    ctx.answerCbQuery();
});

bot.action('action_balance', async (ctx) => {
    const userId = ctx.from.id.toString();
    const balance = await getBalance(userId);

    await ctx.replyWithMarkdown(
        `💰 **Tu Balance**\n\n` +
        `SOL: ${balance.toFixed(4)} SOL\n` +
        `USD: $${(balance * 150).toFixed(2)}`
    );
    ctx.answerCbQuery();
});

bot.action('action_config', (ctx) => {
    ctx.replyWithMarkdown(
        `⚙️ **Configuración**\n\n` +
        `Monto compra: ${config.buyAmount} SOL\n` +
        `Slippage: ${config.slippage}%\n` +
        `Canales monitoreados: @${Array.from(config.canalesMonitorear).join(', @')}`
    );
    ctx.answerCbQuery();
});

bot.action('cancel', (ctx) => {
    sessionData.delete(ctx.from.id.toString());
    ctx.reply('❌ Operación cancelada');
    ctx.answerCbQuery();
});

// Funciones auxiliares
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
                liquidity: pair.liquidity?.usd || 0
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

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot multi-wallet iniciado');
    console.log('💳 Cada usuario tiene su wallet única');

    bot.launch()
        .then(() => console.log('🎉 Bot activo con multi-wallet!'))
        .catch(err => console.error('❌ Error:', err));
}

// Graceful shutdown
process.once('SIGINT', () => {
    guardarUsuarios();
    console.log('\n🛑 Deteniendo bot...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    guardarUsuarios();
    console.log('\n🛑 Deteniendo bot...');
    bot.stop('SIGTERM');
});

// Iniciar
iniciar();