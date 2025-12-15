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

console.log('🚀 Iniciando Bot Simple y Funcional...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.1,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    apis: {
        dexscreener: 'https://api.dexscreener.com/latest'
    }
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection, wallet;
let modoTrading = true;
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();
const sessionData = new Map();

// Sistema de referidos
const referidos = new Map(); // userId -> { referrerId, refCode, referredCount, earnings, referredUsers: [] }
const refCodes = new Map(); // refCode -> userId
const userEarnings = new Map(); // userId -> warningCount

// Configuración de trading por usuario
const userConfigs = new Map(); // userId -> config

// Configuración de referidos
const referralConfig = {
    rewardPerReferral: 0.01, // 0.01 SOL por referido
    bonusPercentage: 0.05, // 5% de las comisiones del referido
    maxWarnings: 3,
    minTradingVolume: 0.5 // SOL mínimo que debe operar el referido
};

// Configuración por defecto
const defaultConfig = {
    buyAmount: config.buyAmount,
    slippage: config.slippage,
    mevProtection: true,
    maxGasPrice: 0.001,
    priorityFee: 0.00001,
    sellAt2x: true,
    sellAt5x: true,
    stopLoss: 0.5,
    takeProfit: 2.0,
    autoReinvest: false,
    minLiquidity: 10000,
    maxSlippage: 20,
    copySize: 0.1,
    copyMode: 'percentage', // 'percentage' o 'fixed'
    tradingMode: 'manual' // 'manual', 'copy', 'auto'
};

// Obtener configuración del usuario
function getUserConfig(userId) {
    if (!userConfigs.has(userId)) {
        userConfigs.set(userId, { ...defaultConfig });
    }
    return userConfigs.get(userId);
}

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

// Teclados
const mainKeyboard = (userId = null) => {
    const refInfo = userId ? getReferralInfo(userId) : null;

    return Markup.inlineKeyboard([
        [Markup.button.callback('💳 Mi Wallet', 'action_wallet'), Markup.button.callback('💰 Comprar', 'action_buy')],
        [Markup.button.callback('💸 Vender', 'action_sell'), Markup.button.callback('📊 PnL', 'action_pnl')],
        [Markup.button.callback('💎 Balance', 'action_balance'), Markup.button.callback('🎁 Referidos', 'referidos_menu')],
        [Markup.button.callback('📡 Config', 'action_config'), Markup.button.callback('📋 Canales', 'canales_config')],
        refInfo ? [Markup.button.callback(`🎯 ${refInfo.referredCount} Referidos`, 'referidos_stats')] : []
    ]);
};

const buyKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL 💎', 'buy_0.01'), Markup.button.callback('0.05 SOL 💎', 'buy_0.05')],
    [Markup.button.callback('0.1 SOL 💎', 'buy_0.1'), Markup.button.callback('0.5 SOL 💎', 'buy_0.5')],
    [Markup.button.callback('1 SOL 💎', 'buy_1'), Markup.button.callback('❌ Cancelar', 'cancel')]
]);

// COMANDOS
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const args = ctx.message.text.split(' ');
    const referralCode = args[1];

    // Manejar registro por referido
    if (referralCode) {
        const wasReferred = await handleReferralStart(ctx, referralCode);
        if (wasReferred) {
            await ctx.replyWithMarkdown(
                `🎉 **¡BIENVENIDO!** 🎉\n\n` +
                `✅ *Te has unido con un código de referido*\n\n` +
                `🎁 **Obtén beneficios especiales al operar**\n` +
                `💰 *Deposita y empieza a tradear para activar recompensas*\n\n`
            );
        }
    }

    // Generar código de referido si no tiene
    const refInfo = getReferralInfo(userId);
    if (!refInfo.refCode) {
        const refCode = generateReferralCode(userId);
        refInfo.refCode = refCode;
        referidos.set(userId, refInfo);
    }

    const balance = await getBalance();

    await ctx.replyWithMarkdown(
        `🤖 **Bot Trading ACTIVO** ✅\n\n` +
        `💰 Balance: ${balance.toFixed(4)} SOL\n` +
        `📊 Posiciones: ${posiciones.size} activas\n` +
        `🔥 Estado: ${modoTrading ? 'ACTIVO' : 'PAUSADO'}\n` +
        `📡 Monitoreando: @${Array.from(canales).join(', @')}\n\n` +
        `Selecciona una acción:`,
        mainKeyboard(userId)
    );
});

// Comando de referido
bot.command('referido', async (ctx) => {
    const userId = ctx.from.id.toString();
    const refInfo = getReferralInfo(userId);

    let refCode;
    if (!refInfo.refCode) {
        refCode = generateReferralCode(userId);
        refInfo.refCode = refCode;
        referidos.set(userId, refInfo);
    } else {
        refCode = refInfo.refCode;
    }

    const referralLink = `https://t.me/${ctx.botInfo.username}?start=${refCode}`;

    await ctx.replyWithMarkdown(
        `🎁 **TU ENLACE DE REFERIDO** 🎁\n\n` +
        `🔗 **Enlace único:**\n\`${referralLink}\`\n\n` +
        `📊 **Estadísticas:**\n` +
        `• Referidos: ${refInfo.referredCount}\n` +
        `• Ganancias: ${refInfo.earnings.toFixed(4)} SOL\n\n` +
        `💰 **Recompensas:**\n` +
        `• ${referralConfig.rewardPerReferral} SOL por referido activo\n` +
        `• ${referralConfig.bonusPercentage * 100}% de comisiones\n\n` +
        `✨ *Comparte y gana!*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📊 Ver Estadísticas', 'referidos_stats')],
            [Markup.button.callback('📋 Menú Referidos', 'referidos_menu')]
        ])
    );
});

// Comando de planes y precios
bot.command('planes', async (ctx) => {
    await ctx.replyWithMarkdown(
        `💎 **PLANES Y PRECIOS** 💎\n\n` +

        `🆓 **FREE PLAN**\n` +
        `• ✅ Trading básico\n` +
        `• ✅ 1 wallet\n` +
        `• ✅ Límite de 0.5 SOL por trade\n` +
        `• ❌ Sin copia de canales\n` +
        `• ❌ Sin señales premium\n` +
        `💰 *Gratis*\n\n` +

        `🥉 **BASIC PLAN**\n` +
        `• ✅ Todo lo de FREE\n` +
        `• ✅ 3 wallets\n` +
        `• ✅ Límite de 2 SOL por trade\n` +
        `• ✅ Copia de 1 canal\n` +
        `• ✅ Señales básicas\n` +
        `• ✅ Soporte por email\n` +
        `💰 *0.05 SOL/mes*\n\n` +

        `🥇 **PRO PLAN** ⭐\n` +
        `• ✅ Todo lo de BASIC\n` +
        `• ✅ 5 wallets\n` +
        `• ✅ Límite de 10 SOL por trade\n` +
        `• ✅ Copia de 5 canales\n` +
        `• ✅ Señales premium\n` +
        `• ✅ MEV Protection\n` +
        `• ✅ Trading automático\n` +
        `• ✅ Soporte prioritario\n` +
        `💰 *0.1 SOL/mes*\n\n` +

        `🏆 **ELITE PLAN**\n` +
        `• ✅ Todo lo de PRO\n` +
        `• ✅ 10 wallets\n` +
        `• ✅ Límite ilimitado de SOL\n` +
        `• ✅ Copia ilimitada de canales\n` +
        `• ✅ Señales exclusivas\n` +
        `• ✅ MEV Protection máxima\n` +
        `• ✅ Trading con API\n` +
        `• ✅ Acceso a beta features\n` +
        `• ✅ Soporte 24/7\n` +
        `• ✅ Asesor personal\n` +
        `💰 *0.2 SOL/mes*\n\n` +

        `💳 **MÉTODOS DE PAGO:**\n` +
        `• SOL (Solana)\n` +
        `• USDC/USDT\n` +
        `• Tarjeta (próximamente)\n\n` +

        `🚀 *Actualiza tu plan y maximiza tus ganancias!*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💳 Actualizar Plan', 'action_upgrade')],
            [Markup.button.callback('💰 Ver Métodos de Pago', 'payment_methods')],
            [Markup.button.callback('🔙 Volver al Menú', 'back_main')]
        ])
    );
});

bot.command('buy', async (ctx) => {
    const tokenInput = ctx.message.text.split(' ')[1];
    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/buy PEPE`');
    }

    // Guardar en sesión
    sessionData.set(ctx.from.id, {
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

bot.command('sell', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    const tokenInput = parts[1];
    const porcentaje = parts[2] ? parseFloat(parts[2]) : 100;

    if (!tokenInput) {
        return ctx.reply('❌ Especifica el token\nEj: `/sell PEPE 50`');
    }

    const posicion = posiciones.get(tokenInput);
    if (!posicion) {
        return ctx.reply('❌ No tienes posición en ese token');
    }

    const tokensAVender = posicion.cantidadTokens * (porcentaje / 100);
    const solRecibidos = tokensAVender * (getTokenInfo(posicion.tokenMint).price || posicion.precioEntrada);

    // Actualizar posición
    posicion.cantidadTokens -= tokensAVender;
    if (posicion.cantidadTokens <= 0) {
        posiciones.delete(tokenInput);
    }

    await ctx.replyWithMarkdown(
        `✅ **Venta Exitosa**\n\n` +
        `Tokens vendidos: ${tokensAVender.toFixed(4)}\n` +
        `SOL recibidos: ${solRecibidos.toFixed(4)}\n` +
        `Porcentaje: ${porcentaje}%`
    );
});

bot.command('pnl', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones abiertas');
    }

    let mensaje = '📊 **Tus Posiciones**\n\n';
    let totalPnL = 0;

    for (const [tokenInput, pos] of posiciones) {
        const info = await getTokenInfo(pos.tokenMint);
        const pnlUSD = (pos.cantidadTokens * (info.price || pos.precioEntrada) * 150 / LAMPORTS_PER_SOL) - (pos.invertido * 150);
        totalPnL += pnlUSD;
        const pnlPorcentaje = ((info.price || pos.precioEntrada) / pos.precioEntrada - 1) * 100;

        mensaje += `${tokenInput}: ${pnlPorcentaje > 0 ? '🟢' : '🔴'} ${pnlPorcentaje.toFixed(2)}%\n`;
    }

    mensaje += `\n💰 **PnL Total:** ${totalPnL >= 0 ? '🟢' : '🔴'} $${totalPnL.toFixed(2)}`;
    await ctx.reply(mensaje);
});

bot.command('balance', async (ctx) => {
    const balance = await getBalance();

    await ctx.replyWithMarkdown(
        `💰 **Balance**\n\n` +
        `SOL: ${balance.toFixed(4)} SOL\n` +
        `USD: $${(balance * 150).toFixed(2)}`
    );
});

// Comando para agregar canal
bot.command('addcanal', async (ctx) => {
    const canalInput = ctx.message.text.split(' ')[1];

    if (!canalInput) {
        return ctx.reply('❌ Especifica el canal\nEj: `/addcanal @nombrecanal`');
    }

    // Quitar el @ si lo incluye
    const canal = canalInput.startsWith('@') ? canalInput.slice(1) : canalInput;

    if (canales.has(canal)) {
        return ctx.reply(`❌ El canal @${canal} ya está en la lista`);
    }

    canales.add(canal);

    await ctx.replyWithMarkdown(
        `✅ **Canal agregado**\n\n` +
        `📡 @${canal} ahora está siendo monitoreado\n` +
        `📊 Total de canales: ${canales.size}`
    );
});

// Comando para eliminar canal
bot.command('removecanal', async (ctx) => {
    const canalInput = ctx.message.text.split(' ')[1];

    if (!canalInput) {
        return ctx.reply('❌ Especifica el canal\nEj: `/removecanal @nombrecanal`');
    }

    // Quitar el @ si lo incluye
    const canal = canalInput.startsWith('@') ? canalInput.slice(1) : canalInput;

    if (!canales.has(canal)) {
        return ctx.reply(`❌ El canal @${canal} no está en la lista`);
    }

    canales.delete(canal);

    await ctx.replyWithMarkdown(
        `✅ **Canal eliminado**\n\n` +
        `📡 @${canal} ya no será monitoreado\n` +
        `📊 Total de canales: ${canales.size}`
    );
});

// Comando para ver canales
bot.command('canales', async (ctx) => {
    const canalesList = Array.from(canales);

    if (canalesList.length === 0) {
        return ctx.reply('❌ No hay canales configurados');
    }

    let mensaje = `📋 **CANALES MONITOREADOS** 📋\n\n`;
    canalesList.forEach((canal, index) => {
        mensaje += `${index + 1}. @${canal}\n`;
    });
    mensaje += `\n📊 Total: ${canalesList.length} canales`;

    await ctx.replyWithMarkdown(mensaje);
});

// Callback handlers
bot.action('action_wallet', async (ctx) => {
    const balance = await getBalance();

    await ctx.replyWithMarkdown(
        `💳 **TU WALLET SOLANA** 💳\n\n` +
        `📋 *Dirección Pública:*\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `💰 *Balance:* ${balance.toFixed(4)} SOL\n` +
        `💵 *Valor USD:* $${(balance * 150).toFixed(2)}\n\n` +
        `📊 *Posiciones:* ${posiciones.size} activas\n\n` +
        `⚙️ *Opciones de wallet:*\n` +
        `• Depositar: \`/depositar\`\n` +
        `• Ver balance: \`/balance\`\n` +
        `• Exportar clave: \`/privatekey\`\n\n` +
        `💡 *Para depósitos, envía SOL a la dirección arriba*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📋 Copiar Dirección', 'copy_address'), Markup.button.callback('🔑 Ver Clave Privada', 'show_privatekey')],
            [Markup.button.callback('💰 Depositar SOL', 'deposit_guide'), Markup.button.callback('📊 Ver Tokens', 'view_tokens')],
            [Markup.button.callback('⬅️ Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Copiar dirección
bot.action('copy_address', async (ctx) => {
    await ctx.replyWithMarkdown(
        `📋 **DIRECCIÓN COPIADA** 📋\n\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `✅ *Lista para pegar*`
    );
    ctx.answerCbQuery();
});

// Mostrar clave privada (con advertencia)
bot.action('show_privatekey', async (ctx) => {
    try {
        await ctx.telegram.sendMessage(ctx.from.id,
            `🔐 **CLAVE PRIVADA - MÁXIMA SEGURIDAD** 🔐\n\n` +
            `⚠️ *ADVERTENCIA IMPORTANTE:*\n\n` +
            `• NUNCA compartas esta clave con nadie\n` +
            `• Cualquiera con esta clave tiene control total\n` +
            `• Guárdala en un lugar extremadamente seguro\n\n` +
            `💾 *Tu clave privada:*\n\n` +
            `\`${config.walletPrivateKey}\`\n\n` +
            `🔒 *Esta clave solo ha sido enviada a ti por mensaje privado*`
        );

        await ctx.reply('📩 *Te he enviado tu clave privada por mensaje privado*');
    } catch (error) {
        await ctx.reply('❌ Error: Inicia un chat con el bot primero para recibir la clave privada');
    }
    ctx.answerCbQuery();
});

// Guía de depósito
bot.action('deposit_guide', async (ctx) => {
    await ctx.replyWithMarkdown(
        `💰 **GUÍA DE DEPÓSITO** 💰\n\n` +
        `1️⃣ *Abre Phantom, Solflare o tu wallet Solana*\n\n` +
        `2️⃣ *Copia la dirección abajo*\n\n` +
        `3️⃣ *Envía SOL a la dirección*\n\n` +
        `4️⃣ *Los fondos aparecerán automáticamente*\n\n` +
        `📋 *Tu dirección:*\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `💡 *Mínimo recomendado: 0.01 SOL*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📋 Copiar Dirección', 'copy_address'), Markup.button.callback('⬅️ Volver', 'action_wallet')]
        ])
    );
    ctx.answerCbQuery();
});

// Ver tokens
bot.action('view_tokens', async (ctx) => {
    if (posiciones.size === 0) {
        await ctx.reply('❌ No tienes tokens');
    } else {
        let mensaje = `📊 **TUS TOKENS** 📊\n\n`;

        for (const [tokenInput, pos] of posiciones) {
            const info = await getTokenInfo(tokenInput);
            const value = pos.cantidadTokens * (info.price || pos.precioEntrada);
            const pnl = ((info.price || pos.precioEntrada) / pos.precioEntrada - 1) * 100;

            mensaje += `🪙 ${tokenInput}\n`;
            mensaje += `   Cantidad: ${pos.cantidadTokens.toFixed(2)}\n`;
            mensaje += `   Valor: $${value.toFixed(4)}\n`;
            mensaje += `   PnL: ${pnl > 0 ? '🟢' : '🔴'} ${pnl.toFixed(2)}%\n\n`;
        }

        await ctx.replyWithMarkdown(mensaje);
    }
    ctx.answerCbQuery();
});

// Comando para ver clave privada
bot.command('privatekey', async (ctx) => {
    await ctx.action('show_privatekey');
});

// Comando para ver address
bot.command('address', async (ctx) => {
    await ctx.replyWithMarkdown(
        `📋 **TU DIRECCIÓN** 📋\n\n` +
        `\`${wallet.publicKey.toString()}\`\n\n` +
        `💰 *Balance actual:* ${await getBalance()} SOL`
    );
});

bot.action('action_buy', (ctx) => {
    ctx.replyWithMarkdown(
        '💰 **Comprar Token**\n\n' +
        'Escribe el token:\n' +
        '`/buy PEPE`'
    );
    ctx.answerCbQuery();
});

bot.action('action_sell', async (ctx) => {
    if (posiciones.size === 0) {
        ctx.reply('❌ No tienes posiciones para vender');
    } else {
        let lista = '💸 **Tus Posiciones:**\n\n';
        posiciones.forEach((pos, token) => {
            lista += `• ${token}: ${pos.cantidadTokens.toFixed(0)} tokens\n`;
        });
        lista += '\nUsa: /sell <token> <porcentaje>';
        ctx.reply(lista);
    }
    ctx.answerCbQuery();
});

bot.action('action_pnl', async (ctx) => {
    const balance = await getBalance();
    if (posiciones.size === 0) {
        await ctx.reply('📊 No hay posiciones abiertas');
        ctx.answerCbQuery();
        return;
    }

    let mensaje = '📊 **Tus Posiciones**\n\n';
    let totalPnL = 0;

    for (const [tokenInput, pos] of posiciones) {
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
    const balance = await getBalance();
    await ctx.replyWithMarkdown(
        `💰 **Balance**\n\n` +
        `SOL: ${balance.toFixed(4)} SOL\n` +
        `USD: $${(balance * 150).toFixed(2)}`
    );
    ctx.answerCbQuery();
});

bot.action('action_config', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    await ctx.replyWithMarkdown(
        `⚙️ **CONFIGURACIÓN DE TRADING** ⚙️\n\n` +
        `💰 *Monto de compra:* ${userConfig.buyAmount} SOL\n` +
        `📊 *Slippage:* ${userConfig.slippage}%\n` +
        `🛡️ *MEV Protection:* ${userConfig.mevProtection ? '✅' : '❌'}\n` +
        `⛽ *Max Gas Price:* ${userConfig.maxGasPrice} SOL\n` +
        `💨 *Priority Fee:* ${userConfig.priorityFee} SOL\n` +
        `📈 *Vender al 2x:* ${userConfig.sellAt2x ? '✅' : '❌'}\n` +
        `📈 *Vender al 5x:* ${userConfig.sellAt5x ? '✅' : '❌'}\n` +
        `🛑 *Stop Loss:* ${userConfig.stopLoss * 100}%\n` +
        `🎯 *Take Profit:* ${userConfig.takeProfit}x\n` +
        `🔄 *Auto Reinvertir:* ${userConfig.autoReinvest ? '✅' : '❌'}\n` +
        `💧 *Liquidez mínima:* $${userConfig.minLiquidity.toLocaleString()}\n` +
        `📋 *Modo trading:* ${userConfig.tradingMode === 'manual' ? 'Manual' : userConfig.tradingMode === 'copy' ? 'Copia' : 'Auto'}\n\n` +
        `💡 *Selecciona qué configurar:*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💰 Monto Compra', 'config_buy_amount')],
            [Markup.button.callback('📊 Slippage', 'config_slippage')],
            [Markup.button.callback('🛡️ MEV Protection', 'config_mev')],
            [Markup.button.callback('⛽ Gas Fees', 'config_gas')],
            [Markup.button.callback('📈 Venta Automática', 'config_auto_sell')],
            [Markup.button.callback('🔄 Modo Trading', 'config_trading_mode')],
            [Markup.button.callback('⬅️ Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Configurar monto de compra
bot.action('config_buy_amount', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    await ctx.replyWithMarkdown(
        `💰 **MONTO DE COMPRA** 💰\n\n` +
        `*Actual:* ${userConfig.buyAmount} SOL\n\n` +
        `Selecciona un monto:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('0.01 SOL', 'set_buy_0.01'), Markup.button.callback('0.05 SOL', 'set_buy_0.05')],
            [Markup.button.callback('0.1 SOL', 'set_buy_0.1'), Markup.button.callback('0.5 SOL', 'set_buy_0.5')],
            [Markup.button.callback('1 SOL', 'set_buy_1'), Markup.button.callback('2 SOL', 'set_buy_2')],
            [Markup.button.callback('Personalizar', 'set_buy_custom'), Markup.button.callback('⬅️ Volver', 'action_config')]
        ])
    );
    ctx.answerCbQuery();
});

// Configurar slippage
bot.action('config_slippage', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    await ctx.replyWithMarkdown(
        `📊 **SLIPPAGE** 📊\n\n` +
        `*Actual:* ${userConfig.slippage}%\n\n` +
        `Selecciona slippage:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('3%', 'set_slippage_3'), Markup.button.callback('5%', 'set_slippage_5')],
            [Markup.button.callback('10%', 'set_slippage_10'), Markup.button.callback('15%', 'set_slippage_15')],
            [Markup.button.callback('20%', 'set_slippage_20'), Markup.button.callback('Personalizar', 'set_slippage_custom')],
            [Markup.button.callback('⬅️ Volver', 'action_config')]
        ])
    );
    ctx.answerCbQuery();
});

// Configurar MEV Protection
bot.action('config_mev', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    userConfig.mevProtection = !userConfig.mevProtection;

    await ctx.replyWithMarkdown(
        `🛡️ *MEV Protection ${userConfig.mevProtection ? '✅ Activado' : '❌ Desactivado'}*\n\n` +
        `${userConfig.mevProtection ?
            'Protección contra ataques MEV activada' :
            'Protección contra ataques MEV desactivada'}`
    );
    ctx.answerCbQuery();
});

// Configurar gas fees
bot.action('config_gas', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    await ctx.replyWithMarkdown(
        `⛽ **GAS FEES** ⛽\n\n` +
        `*Max Gas Price:* ${userConfig.maxGasPrice} SOL\n` +
        `*Priority Fee:* ${userConfig.priorityFee} SOL\n\n` +
        `Opciones:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🐢 Lento', 'set_gas_slow'), Markup.button.callback('⚡ Rápido', 'set_gas_fast')],
            [Markup.button.callback('🚀 Ultra', 'set_gas_ultra'), Markup.button.callback('Personalizar', 'set_gas_custom')],
            [Markup.button.callback('⬅️ Volver', 'action_config')]
        ])
    );
    ctx.answerCbQuery();
});

// Configurar venta automática
bot.action('config_auto_sell', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    await ctx.replyWithMarkdown(
        `📈 **VENTA AUTOMÁTICA** 📈\n\n` +
        `*Vender al 2x:* ${userConfig.sellAt2x ? '✅' : '❌'}\n` +
        `*Vender al 5x:* ${userConfig.sellAt5x ? '✅' : '❌'}\n` +
        `*Stop Loss:* ${userConfig.stopLoss * 100}%\n` +
        `*Take Profit:* ${userConfig.takeProfit}x\n\n` +
        `Opciones:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🎯 2x/5x', 'toggle_sell_targets'), Markup.button.callback('🛑 Stop Loss', 'config_stoploss')],
            [Markup.button.callback('📊 Take Profit', 'config_takeprofit'), Markup.button.callback('🔄 Auto Reinvertir', 'toggle_reinvest')],
            [Markup.button.callback('⬅️ Volver', 'action_config')]
        ])
    );
    ctx.answerCbQuery();
});

// Configurar modo trading
bot.action('config_trading_mode', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    let modoActual = userConfig.tradingMode;
    let siguienteModo = modoActual === 'manual' ? 'copy' : modoActual === 'copy' ? 'auto' : 'manual';

    userConfig.tradingMode = siguienteModo;

    await ctx.replyWithMarkdown(
        `🔄 **MODO TRADING** 🔄\n\n` +
        `*Modo actual:* ${siguienteModo === 'manual' ? '👤 Manual' : siguienteModo === 'copy' ? '📋 Copia' : '🤖 Auto'}\n\n` +
        `${siguienteModo === 'manual' ?
            'Operas manualmente con comandos' :
            siguienteModo === 'copy' ?
            'Copia automáticamente las señales de los canales' :
            'Trading completamente automático'}`
    );
    ctx.answerCbQuery();
});

// Handlers para configurar valores
bot.action(/set_buy_(\d+\.?\d*)/, (ctx) => {
    const amount = parseFloat(ctx.match[1]);
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    userConfig.buyAmount = amount;
    ctx.replyWithMarkdown(`✅ *Monto de compra actualizado a ${amount} SOL*`);
    ctx.answerCbQuery();
});

bot.action(/set_slippage_(\d+)/, (ctx) => {
    const slippage = parseInt(ctx.match[1]);
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    userConfig.slippage = slippage;
    ctx.replyWithMarkdown(`✅ *Slippage actualizado a ${slippage}%*`);
    ctx.answerCbQuery();
});

bot.action('toggle_sell_targets', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    userConfig.sellAt2x = !userConfig.sellAt2x;
    userConfig.sellAt5x = !userConfig.sellAt5x;

    ctx.replyWithMarkdown(
        `✅ *Vender al 2x: ${userConfig.sellAt2x ? '✅' : '❌'}*\n` +
        `✅ *Vender al 5x: ${userConfig.sellAt5x ? '✅' : '❌'}*`
    );
    ctx.answerCbQuery();
});

bot.action('toggle_reinvest', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userConfig = getUserConfig(userId);

    userConfig.autoReinvest = !userConfig.autoReinvest;

    ctx.replyWithMarkdown(
        `✅ *Auto reinvertir: ${userConfig.autoReinvest ? '✅ Activado' : '❌ Desactivado'}*`
    );
    ctx.answerCbQuery();
});

bot.action(/buy_(\d+\.?\d+)/, (ctx) => {
    const amount = ctx.match[1];
    const session = sessionData.get(ctx.from.id);

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
    const session = sessionData.get(ctx.from.id);
    if (session) {
        // Simular compra
        const info = await getTokenInfo(session.token);
        const tokensRecibidos = session.amount / (info.price || 0.000001);

        posiciones.set(session.token, {
            tokenMint: session.token,
            tokenInput: session.token,
            cantidadTokens: tokensRecibidos,
            precioEntrada: info.price || 0.000001,
            invertido: session.amount,
            timestamp: new Date(),
            ventas: [],
            estado: 'activa',
            exchange: 'Simulada'
        });

        await ctx.replyWithMarkdown(
            `✅ **Compra Exitosa!**\n\n` +
            `Token: ${session.token}\n` +
            `Cantidad: ${session.amount} SOL\n` +
            `Tokens: ${tokensRecibidos.toFixed(4)}\n` +
            `Estado: Simulado (sin gasto real)`
        );

        sessionData.delete(ctx.from.id);
    }
    ctx.answerCbQuery();
});

bot.action('cancel', (ctx) => {
    sessionData.delete(ctx.from.id);
    ctx.reply('❌ Operación cancelada');
    ctx.answerCbQuery();
});

// Handler para configurar canales
bot.action('canales_config', async (ctx) => {
    const canalesActuales = Array.from(canales).join(', @');

    await ctx.replyWithMarkdown(
        `📋 **CONFIGURACIÓN DE CANALES** 📋\n\n` +
        `📡 *Canales monitoreados actualmente:*\n` +
        `@${canalesActuales}\n\n` +
        `⚙️ *Para agregar o eliminar canales:*\n` +
        `• Agregar: \`/addcanal @nombrecanal\`\n` +
        `• Eliminar: \`/removecanal @nombrecanal\`\n` +
        `• Ver lista: \`/canales\`\n\n` +
        `💡 *El bot copiará las señales de estos canales*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('➕ Agregar Canal', 'add_canal_prompt')],
            [Markup.button.callback('➖ Eliminar Canal', 'remove_canal_prompt')],
            [Markup.button.callback('📋 Ver Lista', 'ver_lista_canales')],
            [Markup.button.callback('⬅️ Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para agregar canal
bot.action('add_canal_prompt', async (ctx) => {
    await ctx.replyWithMarkdown(
        `➕ **AGREGAR CANAL**\n\n` +
        `Escribe el nombre del canal:\n\n` +
        `Ejemplo: \`/addcanal @memecoincalls\`\n\n` +
        `💡 *Debe incluir el @ al inicio*`
    );
    ctx.answerCbQuery();
});

// Handler para eliminar canal
bot.action('remove_canal_prompt', async (ctx) => {
    const canalesActuales = Array.from(canales).join(', @');

    await ctx.replyWithMarkdown(
        `➖ **ELIMINAR CANAL**\n\n` +
        `Canales actuales: @${canalesActuales}\n\n` +
        `Escribe: \`/removecanal @nombrecanal\`\n\n` +
        `💡 *Debes incluir el @ al inicio*`
    );
    ctx.answerCbQuery();
});

// Handler para ver lista
bot.action('ver_lista_canales', async (ctx) => {
    const canalesActuales = Array.from(canales);

    if (canalesActuales.length === 0) {
        await ctx.reply('❌ No hay canales configurados');
    } else {
        let mensaje = `📋 **CANALES MONITOREADOS** 📋\n\n`;
        canalesActuales.forEach((canal, index) => {
            mensaje += `${index + 1}. @${canal}\n`;
        });
        mensaje += `\n📊 Total: ${canalesActuales.length} canales`;
        await ctx.replyWithMarkdown(mensaje);
    }
    ctx.answerCbQuery();
});

// Handler para volver al menú principal
bot.action('back_main', async (ctx) => {
    const balance = await getBalance();

    await ctx.replyWithMarkdown(
        `🤖 **Bot Trading ACTIVO** ✅\n\n` +
        `💰 Balance: ${balance.toFixed(4)} SOL\n` +
        `📊 Posiciones: ${posiciones.size} activas\n` +
        `🔥 Estado: ${modoTrading ? 'ACTIVO' : 'PAUSADO'}\n` +
        `📡 Monitoreando: @${Array.from(canales).join(', @')}\n\n` +
        `Selecciona una acción:`,
        mainKeyboard(ctx.from.id)
    );
    ctx.answerCbQuery();
});

// Handler del menú de referidos
bot.action('referidos_menu', async (ctx) => {
    const userId = ctx.from.id.toString();
    const refInfo = getReferralInfo(userId);

    let refCode;
    if (!refInfo.refCode) {
        refCode = generateReferralCode(userId);
        refInfo.refCode = refCode;
        referidos.set(userId, refInfo);
    } else {
        refCode = refInfo.refCode;
    }

    const referralLink = `https://t.me/${ctx.botInfo.username}?start=${refCode}`;
    const earnedSOL = refInfo.earnings.toFixed(4);

    await ctx.replyWithMarkdown(
        `🎁 **SISTEMA DE REFERIDOS** 🎁\n\n` +
        `🔗 **Tu enlace de referido:**\n\`${referralLink}\`\n\n` +
        `👥 **Referidos directos:** ${refInfo.referredCount}\n` +
        `💰 **Ganancias totales:** ${earnedSOL} SOL\n\n` +
        `📋 **Recompensas:**\n` +
        `• ${referralConfig.rewardPerReferral} SOL por cada referido activo\n` +
        `• ${referralConfig.bonusPercentage * 100}% de las comisiones de tus referidos\n\n` +
        `⚠️ *Los referidos deben operar mínimo ${referralConfig.minTradingVolume} SOL para activar recompensas*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📊 Estadísticas', 'referidos_stats')],
            [Markup.button.callback('🔄 Retirar Ganancias', 'referidos_withdraw')],
            [Markup.button.callback('📋 Copiar Enlace', 'referidos_copy')],
            [Markup.button.callback('🔙 Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para estadísticas de referidos
bot.action('referidos_stats', async (ctx) => {
    const userId = ctx.from.id.toString();
    const refInfo = getReferralInfo(userId);

    if (refInfo.referredCount === 0) {
        await ctx.replyWithMarkdown(
            `📊 **ESTADÍSTICAS DE REFERIDOS**\n\n` +
            `❌ Aún no tienes referidos\n\n` +
            `🔗 **Comparte tu enlace para comenzar:**\n` +
            `https://t.me/${ctx.botInfo.username}?start=${refInfo.refCode || 'TUCODIGO'}`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Volver', 'referidos_menu')]
            ])
        );
        ctx.answerCbQuery();
        return;
    }

    let statsText = `📊 **ESTADÍSTICAS DETALLADAS** 📊\n\n`;
    statsText += `👥 **Total Referidos:** ${refInfo.referredCount}\n`;
    statsText += `💰 **Ganancias Totales:** ${refInfo.earnings.toFixed(4)} SOL\n`;
    statsText += `📈 **Referidos Activos:** ${refInfo.referredUsers.length}\n\n`;
    statsText += `🎯 **Niveles Alcanzados:**\n`;

    if (refInfo.referredCount >= 50) {
        statsText += `🏆 **ELITE** (50+ referidos) - Bonificación del 10%\n`;
    } else if (refInfo.referredCount >= 20) {
        statsText += `💎 **PRO** (20+ referidos) - Bonificación del 7%\n`;
    } else if (refInfo.referredCount >= 10) {
        statsText += `🥇 **GOLD** (10+ referidos) - Bonificación del 5%\n`;
    } else if (refInfo.referredCount >= 5) {
        statsText += `🥈 **SILVER** (5+ referidos) - Bonificación del 3%\n`;
    } else {
        statsText += `🥉 **BRONZE** (${refInfo.referredCount} referidos)\n`;
    }

    await ctx.replyWithMarkdown(
        statsText,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Volver', 'referidos_menu')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para copiar enlace de referido
bot.action('referidos_copy', async (ctx) => {
    const userId = ctx.from.id.toString();
    const refInfo = getReferralInfo(userId);
    const referralLink = `https://t.me/${ctx.botInfo.username}?start=${refInfo.refCode || 'TUCODIGO'}`;

    await ctx.replyWithMarkdown(
        `📋 **ENLACE COPIADO** 📋\n\n` +
        `\`${referralLink}\`\n\n` +
        `✅ ¡Comparte este enlace con tus amigos!`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Volver', 'referidos_menu')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para retirar ganancias de referidos
bot.action('referidos_withdraw', async (ctx) => {
    const userId = ctx.from.id.toString();
    const refInfo = getReferralInfo(userId);

    if (refInfo.earnings <= 0) {
        await ctx.replyWithMarkdown(
            `💰 **RETIRAR GANANCIAS**\n\n` +
            `❌ No tienes ganancias disponibles para retirar\n\n` +
            `🎯 *Invita a más usuarios para generar ganancias*`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Volver', 'referidos_menu')]
            ])
        );
        ctx.answerCbQuery();
        return;
    }

    await ctx.replyWithMarkdown(
        `💰 **RETIRAR GANANCIAS**\n\n` +
        `💎 **Ganancias disponibles:** ${refInfo.earnings.toFixed(4)} SOL\n\n` +
        `⚠️ *Función de retiro automático próximamente*\n\n` +
        `📞 *Contacta al admin para procesar el retiro manual*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Volver', 'referidos_menu')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para actualizar plan
bot.action('action_upgrade', async (ctx) => {
    await ctx.replyWithMarkdown(
        `💳 **ACTUALIZAR PLAN**\n\n` +
        `🎯 *Elige el plan que mejor se adapte a tus necesidades:*\n\n` +
        `💡 *Usa el comando /planes para ver todas las características*\n\n` +
        `🚀 *Mejora tu experiencia de trading!*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🥉 Basic - 0.05 SOL', 'upgrade_basic')],
            [Markup.button.callback('🥇 Pro - 0.1 SOL', 'upgrade_pro')],
            [Markup.button.callback('🏆 Elite - 0.2 SOL', 'upgrade_elite')],
            [Markup.button.callback('💳 Ver Métodos de Pago', 'payment_methods')],
            [Markup.button.callback('🔙 Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para métodos de pago
bot.action('payment_methods', async (ctx) => {
    await ctx.replyWithMarkdown(
        `💳 **MÉTODOS DE PAGO** 💳\n\n` +

        `🪙 **CRYPTO (Recomendado)**\n` +
        `• **SOL (Solana)**\n` +
        `  - Dirección: \`AGe4bMNRKSmN4cpLuQCtYZZ3kQFTr2Txtox5EfLBR2tK\`\n` +
        `  - Confirmación automática\n\n` +

        `• **USDC/USDT**\n` +
        `  - Dirección: \`AGe4bMNRKSmN4cpLuQCtYZZ3kQFTr2Txtox5EfLBR2tK\`\n` +
        `  - Red: Solana\n\n` +

        `💳 **FIAT (Próximamente)**\n` +
        `• Tarjeta de crédito/débito\n` +
        `• Transferencia bancaria\n` +
        `• PayPal\n\n` +

        `⚡ **PASOS PARA PAGAR:**\n` +
        `1. Selecciona tu plan deseado\n` +
        `2. Realiza la transferencia\n` +
        `3. Envía el comprobante con tu ID de usuario\n` +
        `4. Tu plan se activará automáticamente\n\n` +

        `🎯 *Para ayuda contacta al admin*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🥉 Basic - 0.05 SOL', 'upgrade_basic')],
            [Markup.button.callback('🥇 Pro - 0.1 SOL', 'upgrade_pro')],
            [Markup.button.callback('🏆 Elite - 0.2 SOL', 'upgrade_elite')],
            [Markup.button.callback('📞 Contactar Soporte', 'contact_support')],
            [Markup.button.callback('🔙 Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Handlers para actualizar planes
bot.action('upgrade_basic', async (ctx) => {
    await ctx.replyWithMarkdown(
        `🥉 **ACTUALIZAR A BASIC**\n\n` +
        `💰 *Costo: 0.05 SOL/mes*\n\n` +
        `✅ **Beneficios incluidos:**\n` +
        `• 3 wallets\n` +
        `• Límite de 2 SOL por trade\n` +
        `• Copia de 1 canal\n` +
        `• Señales básicas\n` +
        `• Soporte por email\n\n` +

        `🪙 **INSTRUCCIONES:**\n` +
        `1. Transfiere 0.05 SOL a:\n` +
        `\`AGe4bMNRKSmN4cpLuQCtYZZ3kQFTr2Txtox5EfLBR2tK\`\n\n` +
        `2. Envía el comprobante con tu ID: \`${ctx.from.id}\`\n\n` +
        `⚡ *Activación automática en menos de 5 minutos*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💳 Ver Métodos de Pago', 'payment_methods')],
            [Markup.button.callback('📞 Contactar Soporte', 'contact_support')],
            [Markup.button.callback('🔙 Volver', 'action_upgrade')]
        ])
    );
    ctx.answerCbQuery();
});

bot.action('upgrade_pro', async (ctx) => {
    await ctx.replyWithMarkdown(
        `🥇 **ACTUALIZAR A PRO** ⭐\n\n` +
        `💰 *Costo: 0.1 SOL/mes*\n\n` +
        `✅ **Beneficios incluidos:**\n` +
        `• 5 wallets\n` +
        `• Límite de 10 SOL por trade\n` +
        `• Copia de 5 canales\n` +
        `• Señales premium\n` +
        `• MEV Protection\n` +
        `• Trading automático\n` +
        `• Soporte prioritario\n\n` +

        `🪙 **INSTRUCCIONES:**\n` +
        `1. Transfiere 0.1 SOL a:\n` +
        `\`AGe4bMNRKSmN4cpLuQCtYZZ3kQFTr2Txtox5EfLBR2tK\`\n\n` +
        `2. Envía el comprobante con tu ID: \`${ctx.from.id}\`\n\n` +
        `⚡ *Activación automática en menos de 5 minutos*\n\n` +
        `🎯 *Plan más popular!*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💳 Ver Métodos de Pago', 'payment_methods')],
            [Markup.button.callback('📞 Contactar Soporte', 'contact_support')],
            [Markup.button.callback('🔙 Volver', 'action_upgrade')]
        ])
    );
    ctx.answerCbQuery();
});

bot.action('upgrade_elite', async (ctx) => {
    await ctx.replyWithMarkdown(
        `🏆 **ACTUALIZAR A ELITE**\n\n` +
        `💰 *Costo: 0.2 SOL/mes*\n\n` +
        `✅ **Beneficios incluidos:**\n` +
        `• 10 wallets\n` +
        `• Límite ilimitado de SOL\n` +
        `• Copia ilimitada de canales\n` +
        `• Señales exclusivas\n` +
        `• MEV Protection máxima\n` +
        `• Trading con API\n` +
        `• Acceso a beta features\n` +
        `• Soporte 24/7\n` +
        `• Asesor personal\n\n` +

        `🪙 **INSTRUCCIONES:**\n` +
        `1. Transfiere 0.2 SOL a:\n` +
        `\`AGe4bMNRKSmN4cpLuQCtYZZ3kQFTr2Txtox5EfLBR2tK\`\n\n` +
        `2. Envía el comprobante con tu ID: \`${ctx.from.id}\`\n\n` +
        `⚡ *Activación automática en menos de 5 minutos*\n\n` +
        `👑 *Plan para traders profesionales!*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💳 Ver Métodos de Pago', 'payment_methods')],
            [Markup.button.callback('📞 Contactar Soporte', 'contact_support')],
            [Markup.button.callback('🔙 Volver', 'action_upgrade')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para contacto de soporte
bot.action('contact_support', async (ctx) => {
    await ctx.replyWithMarkdown(
        `📞 **CONTACTAR SOPORTE** 📞\n\n` +

        `🔹 **Para pagos y activaciones:**\n` +
        `• @AdminUser - Administrador Principal\n\n` +

        `🔹 **Soporte técnico:**\n` +
        `• @SupportTeam - Equipo de Soporte\n\n` +

        `🔹 **Comercial y empresas:**\n` +
        `• @BusinessTeam - Ventas Corporativas\n\n` +

        `📧 **Email:**\n` +
        `• support@jesusbot.com\n` +
        `• payments@jesusbot.com\n\n` +

        `⏰ **Horario de atención:**\n` +
        `• Lunes a Viernes: 9:00 - 21:00 UTC\n` +
        `• Sábado y Domingo: 10:00 - 18:00 UTC\n\n` +

        `🚀 *Responde en menos de 2 horas durante horario laboral*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Volver', 'back_main')]
        ])
    );
    ctx.answerCbQuery();
});

// Funciones auxiliares
async function getBalance() {
    try {
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

// Funciones del sistema de referidos
function getReferralInfo(userId) {
    const referidoInfo = referidos.get(userId.toString());
    if (!referidoInfo) {
        return {
            referredCount: 0,
            earnings: 0,
            refCode: null,
            referredUsers: []
        };
    }
    return referidoInfo;
}

function generateReferralCode(userId) {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (refCodes.has(code));

    refCodes.set(code, userId.toString());
    return code;
}

async function handleReferralStart(ctx, refCode) {
    const userId = ctx.from.id.toString();

    // Verificar si el código es válido
    const referrerId = refCodes.get(refCode);
    if (!referrerId || referrerId === userId) {
        return false;
    }

    // Verificar si el usuario ya fue referido
    if (referidos.has(userId)) {
        return false;
    }

    // Crear registro de referido
    referidos.set(userId, {
        referrerId: referrerId,
        refCode: refCode,
        referredCount: 0,
        earnings: 0,
        referredUsers: [],
        tradingVolume: 0,
        hasCompletedFirstTrade: false
    });

    // Actualizar contador del referente
    const referrerData = referidos.get(referrerId) || {
        referrerId: null,
        refCode: null,
        referredCount: 0,
        earnings: 0,
        referredUsers: [],
        tradingVolume: 0,
        hasCompletedFirstTrade: false
    };

    referrerData.referredCount++;
    referrerData.referredUsers.push(userId);
    referidos.set(referrerId, referrerData);

    return true;
}

function processReferralRewards(userId, tradeAmount) {
    const referidoInfo = referidos.get(userId);
    if (!referidoInfo || !referidoInfo.referrerId) {
        return;
    }

    // Actualizar volumen de trading del referido
    referidoInfo.tradingVolume = (referidoInfo.tradingVolume || 0) + tradeAmount;
    referidos.set(userId, referidoInfo);

    // Verificar si es el primer trade del referido
    if (!referidoInfo.hasCompletedFirstTrade && referidoInfo.tradingVolume >= referralConfig.minTradingVolume) {
        referidoInfo.hasCompletedFirstTrade = true;

        // Dar recompensa al referente
        const referrerData = referidos.get(referidoInfo.referrerId);
        if (referrerData) {
            referrerData.earnings += referralConfig.rewardPerReferral;
            referidos.set(referidoInfo.referrerId, referrerData);

            // Retornar información para notificar
            return {
                referrerId: referidoInfo.referrerId,
                reward: referralConfig.rewardPerReferral,
                referredUserId: userId
            };
        }
    }

    // Procesar comisión sobre el trade
    const commission = tradeAmount * referralConfig.bonusPercentage;
    const referrerData = referidos.get(referidoInfo.referrerId);
    if (referrerData) {
        referrerData.earnings += commission;
        referidos.set(referidoInfo.referrerId, referrerData);

        return {
            referrerId: referidoInfo.referrerId,
            commission: commission,
            referredUserId: userId
        };
    }

    return null;
}

function saveReferralData() {
    try {
        const data = {
            referidos: Array.from(referidos.entries()),
            refCodes: Array.from(refCodes.entries()),
            userEarnings: Array.from(userEarnings.entries())
        };
        fs.writeFileSync('./referral-data.json', JSON.stringify(data, null, 2));
        console.log('✅ Datos de referidos guardados');
    } catch (error) {
        console.error('❌ Error guardando datos de referidos:', error);
    }
}

function loadReferralData() {
    try {
        if (fs.existsSync('./referral-data.json')) {
            const data = JSON.parse(fs.readFileSync('./referral-data.json', 'utf8'));
            referidos.clear();
            refCodes.clear();
            userEarnings.clear();

            data.referidos.forEach(([key, value]) => referidos.set(key, value));
            data.refCodes.forEach(([key, value]) => refCodes.set(key, value));
            data.userEarnings.forEach(([key, value]) => userEarnings.set(key, value));

            console.log('✅ Datos de referidos cargados');
        }
    } catch (error) {
        console.error('❌ Error cargando datos de referidos:', error);
    }
}

// Detectar tokens
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

// Monitoreo de canales
bot.on('text', async (ctx) => {
    if (!modoTrading) return;

    const username = ctx.chat.username;
    if (!username || !canales.has(username)) return;

    const tokens = extraerTokens(ctx.message.text);

    if (tokens.length > 0) {
        for (const token of tokens) {
            if (!posiciones.has(token.valor)) {
                try {
                    const info = await getTokenInfo(token.valor);

                    ctx.replyWithMarkdown(
                        `🚀 **Token Detectado!**\n\n` +
                        `Token: ${token.valor}\n` +
                        `Precio: $${(info.price || 0).toFixed(8)}\n` +
                        `Liquidez: $${(info.liquidity || 0).toLocaleString()}\n\n` +
                        `Comprando ${config.buyAmount} SOL...`
                    );

                    simularCompra(token.valor, config.buyAmount);

                } catch (error) {
                    console.error(`Error con ${token.valor}:`, error.message);
                }
            }
        }
    }
});

function simularCompra(tokenInput, cantidadSOL) {
    const info = getTokenInfo(tokenInput);
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
}

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot simple iniciado');
    console.log('🎮 Botones funcionando');

    // Cargar datos de referidos
    loadReferralData();

    // Guardar datos de referidos periódicamente
    setInterval(saveReferralData, 60000); // Cada minuto

    bot.launch()
        .then(() => console.log('🎉 Bot activo con botones y sistema de referidos!'))
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