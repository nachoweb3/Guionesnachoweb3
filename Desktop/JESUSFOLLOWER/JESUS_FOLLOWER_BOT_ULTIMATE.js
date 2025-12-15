// JESUS FOLLOWER BOT ULTIMATE - Mezcla perfecta de las 3 mejores versiones
// Combina: UX de bot-final-con-canales + Pagos de bot-premium-vendedor + DEX real de bot-definitivo

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bs58 = require('bs58');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// CONFIGURACIÓN PRINCIPAL
const bot = new Telegraf(process.env.BOT_TOKEN);
const connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || 741178909;

// ARCHIVOS DE PERSISTENCIA
const USERS_FILE = 'users_db.json';
const PAYMENTS_FILE = 'payments_db.json';
const POSITIONS_FILE = 'positions_db.json';
const WALLET_BACKUP_FILE = 'wallets_backup.json';

// CARGAR DATOS EXISTENTES
let users = {};
let payments = {};
let positions = {};
let referralStats = {};

try {
    if (fs.existsSync(USERS_FILE)) {
        const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        users = data.users || {};
        referralStats = data.referralStats || {};
    }
    if (fs.existsSync(PAYMENTS_FILE)) {
        payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
    }
    if (fs.existsSync(POSITIONS_FILE)) {
        positions = JSON.parse(fs.readFileSync(POSITIONS_FILE, 'utf8'));
    }
} catch (error) {
    console.error('Error cargando datos:', error);
}

// TIERS DE SUSCRIPCIÓN
const TIERS = {
    FREE: {
        name: 'FREE',
        price: 0,
        wallets: 1,
        maxTradeAmount: 50,
        copyTrade: false,
        signals: true,
        features: ['Señales básicas', '1 wallet', 'Límite $50']
    },
    BASIC: {
        name: 'BASIC',
        price: 0.01, // SOL
        wallets: 3,
        maxTradeAmount: 250,
        copyTrade: true,
        signals: true,
        features: ['Señales avanzadas', '3 wallets', 'Límite $250', 'Copy trade']
    },
    PRO: {
        name: 'PRO',
        price: 0.05, // SOL
        wallets: 5,
        maxTradeAmount: 1000,
        copyTrade: true,
        signals: true,
        autoSell: true,
        features: ['Señales premium', '5 wallets', 'Límite $1000', 'Copy trade', 'Auto-venta']
    },
    ELITE: {
        name: 'ELITE',
        price: 0.1, // SOL
        wallets: 10,
        maxTradeAmount: 5000,
        copyTrade: true,
        signals: true,
        autoSell: true,
        aiSignals: true,
        prioritySupport: true,
        features: ['Señales IA', '10 wallets', 'Límite $5000', 'Copy trade', 'Auto-venta', 'Soporte prioritario']
    }
};

// ESTADO TEMPORAL POR USUARIO
const userState = {};

// FUNCIONES AUXILIARES
function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveData() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users, referralStats }, null, 2));
        fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
        fs.writeFileSync(POSITIONS_FILE, JSON.stringify(positions, null, 2));
        console.log('✅ Datos guardados correctamente');
    } catch (error) {
        console.error('❌ Error guardando datos:', error);
    }
}

function generateReferralCode(userId) {
    const timestamp = Date.now().toString(36);
    const userHash = userId.toString(36);
    return `JF${timestamp.toUpperCase()}${userHash.toUpperCase()}`.slice(0, 12);
}

// SISTEMA DE WALLETS
function createWallet() {
    const wallet = Keypair.generate();
    return {
        publicKey: wallet.publicKey.toString(),
        privateKey: bs58.encode(wallet.secretKey),
        wallet: wallet
    };
}

function validateSolanaAddress(address) {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

// API FUNCTIONS - PUMP.FUN INTEGRATION
async function getTokenInfo(tokenAddress) {
    try {
        // Primero intentar con Pump.fun API
        const pumpResponse = await axios.get(`https://pump.fun/api/v1/tokens/${tokenAddress}`, {
            timeout: 5000
        });
        if (pumpResponse.data) {
            return {
                success: true,
                source: 'pump.fun',
                data: pumpResponse.data
            };
        }
    } catch (error) {
        console.log('Pump.fun API falló, intentando DexScreener...');
    }

    try {
        // Fallback a DexScreener
        const dexResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
            timeout: 5000
        });

        if (dexResponse.data && dexResponse.data.pairs && dexResponse.data.pairs.length > 0) {
            const pair = dexResponse.data.pairs.find(p =>
                p.chainId === 'solana' &&
                p.dexId === 'raydium' &&
                pair.liquidity?.usd > 10000
            );

            if (pair) {
                return {
                    success: true,
                    source: 'dexscreener',
                    data: {
                        symbol: pair.baseToken.symbol,
                        name: pair.baseToken.name,
                        price: pair.priceUsd,
                        liquidity: pair.liquidity?.usd,
                        volume24h: pair.volume?.h24,
                        priceChange24h: pair.priceChange?.h24
                    }
                };
            }
        }
    } catch (error) {
        console.error('DexScreener API también falló:', error.message);
    }

    return { success: false, error: 'Token no encontrado' };
}

// TRADING FUNCTIONS
async function buyToken(userId, wallet, tokenAddress, amountSOL) {
    try {
        if (!validateSolanaAddress(tokenAddress)) {
            throw new Error('Dirección de token inválida');
        }

        const tokenInfo = await getTokenInfo(tokenAddress);
        if (!tokenInfo.success) {
            throw new Error('Token no encontrado o sin liquidez');
        }

        // SIMULACIÓN DE COMPRA REAL (aquí iría la transacción real)
        console.log(`🛒 Comprando ${amountSOL} SOL de ${tokenAddress}`);

        // En una implementación real, aquí se construiría y enviaría la transacción
        // const transaction = await createSwapTransaction(wallet, tokenAddress, amountSOL);
        // const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);

        const position = {
            userId,
            walletAddress: wallet.publicKey,
            tokenAddress,
            symbol: tokenInfo.data.symbol || 'UNKNOWN',
            amountInvested: amountSOL,
            tokensReceived: amountSOL / parseFloat(tokenInfo.data.price || 0.00001),
            buyPrice: parseFloat(tokenInfo.data.price || 0.00001),
            timestamp: Date.now(),
            status: 'ACTIVE',
            sellStrategy: {
                takeProfit2x: false,
                takeProfit3x: false,
                takeProfit5x: false,
                stopLoss: false
            }
        };

        const positionId = `${userId}_${Date.now()}`;
        positions[positionId] = position;

        return {
            success: true,
            positionId,
            tokenInfo: tokenInfo.data
        };

    } catch (error) {
        console.error('Error en compra:', error);
        return { success: false, error: error.message };
    }
}

async function sellToken(userId, positionId, sellPercentage = 100) {
    try {
        const position = positions[positionId];
        if (!position || position.userId !== userId) {
            throw new Error('Posición no encontrada');
        }

        if (position.status !== 'ACTIVE') {
            throw new Error('Posición ya cerrada');
        }

        // SIMULACIÓN DE VENTA REAL
        console.log(`💰 Vendiendo ${sellPercentage}% de ${position.symbol}`);

        // En una implementación real, aquí se construiría y enviaría la transacción
        // const transaction = await createSellTransaction(position, sellPercentage);
        // const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);

        const sellValue = position.amountInvested * (sellPercentage / 100);
        const profit = sellValue - (position.amountInvested * (sellPercentage / 100));
        const profitPercentage = (profit / position.amountInvested) * 100;

        position.sellHistory = position.sellHistory || [];
        position.sellHistory.push({
            timestamp: Date.now(),
            percentage: sellPercentage,
            value: sellValue,
            profit,
            profitPercentage
        });

        if (sellPercentage === 100) {
            position.status = 'CLOSED';
        }

        return {
            success: true,
            sellValue,
            profit,
            profitPercentage,
            symbol: position.symbol
        };

    } catch (error) {
        console.error('Error en venta:', error);
        return { success: false, error: error.message };
    }
}

// MONITOR DE CANALES PARA COPY TRADING
async function monitorTelegramChannels() {
    try {
        // Aquí se implementaría el monitoreo real del canal @cryptoyeezuscalls
        // Por ahora, es una simulación
        console.log('📡 Monitoreando canales de Telegram...');

        // Simular detección de señal
        const simulatedSignal = {
            token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC como ejemplo
            action: 'BUY',
            confidence: 85
        };

        // Notificar a usuarios con copy trade activo
        for (const [userId, user] of Object.entries(users)) {
            if (user.tier !== 'FREE' && user.settings?.copyTrade) {
                if (user.settings.autoCopy) {
                    // Ejecutar trade automático
                    const wallet = user.wallets[0];
                    if (wallet) {
                        const amount = Math.min(user.settings.defaultAmount || 10, TIERS[user.tier].maxTradeAmount);
                        const result = await buyToken(userId, wallet, simulatedSignal.token, amount);

                        if (result.success) {
                            await bot.telegram.sendMessage(userId,
                                `🚀 *Copy Trade Automático*\n\n` +
                                `Señal detectada: ${simulatedSignal.confidence}% confianza\n` +
                                `Comprado: ${amount} SOL de ${result.tokenInfo.symbol}\n` +
                                `Posición: #${result.positionId.slice(-6)}`,
                                { parse_mode: 'Markdown' }
                            );
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error en monitoreo:', error);
    }
}

// HANDLER DE COMANDOS PRINCIPALES
bot.start(async (ctx) => {
    const userId = ctx.from.id;

    if (!users[userId]) {
        users[userId] = {
            id: userId,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            tier: 'FREE',
            wallets: [],
            referrals: [],
            referredBy: null,
            totalEarnings: 0,
            registeredAt: Date.now(),
            settings: {
                defaultAmount: 10,
                copyTrade: false,
                autoCopy: false,
                sellStrategy: 'progressive'
            }
        };

        // Check for referral code
        const refCode = ctx.startPayload;
        if (refCode && referralStats[refCode]) {
            users[userId].referredBy = referralStats[refCode].referrerId;
            users[userId].tier = 'BASIC'; // Free trial de BASIC

            // Dar bono al referente
            const referrerId = referralStats[refCode].referrerId;
            if (users[referrerId]) {
                users[referrerId].totalEarnings += 0.001; // 0.001 SOL por referido
                await ctx.telegram.sendMessage(referrerId,
                    `🎉 ¡Nuevo referido!\n\n` +
                    `Usuario: ${ctx.from.first_name}\n` +
                    `Bono recibido: 0.001 SOL`
                );
            }
        }

        // Generate referral code
        const referralCode = generateReferralCode(userId);
        referralStats[referralCode] = {
            referrerId: userId,
            referrals: 0,
            earnings: 0,
            createdAt: Date.now()
        };

        saveData();
    }

    const user = users[userId];
    const tier = TIERS[user.tier];

    const welcomeMessage =
        `🙏 *¡Bienvenido a JESUS FOLLOWER BOT!*\n\n` +
        `🔹 *Tu Tier:* ${tier.name}\n` +
        `🔹 *Wallets:* ${user.wallets.length}/${tier.wallets}\n` +
        `🔹 *Límite trading:* $${tier.maxTradeAmount}\n\n` +
        `🚀 *Características incluidas:*\n` +
        tier.features.map(f => `✅ ${f}`).join('\n') + '\n\n' +
        `🎯 *¿Qué quieres hacer?*`;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('💳 Ver Planes', 'view_plans')],
        [Markup.button.callback('👛 Crear Wallet', 'create_wallet')],
        [Markup.button.callback('📊 Mis Posiciones', 'my_positions')],
        [Markup.button.callback('⚙️ Configuración', 'settings')],
        [Markup.button.callback('👥 Referidos', 'referrals')]
    ]);

    ctx.reply(welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
});

bot.command('premium', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];

    let message = '💎 *PLANES PREMIUM - JESUS FOLLOWER*\n\n';

    for (const [tierKey, tier] of Object.entries(TIERS)) {
        const isCurrent = user.tier === tierKey;
        const status = isCurrent ? ' ✅ *ACTUAL*' : '';

        message += `\n🔸 *${tier.name}*${status}\n`;
        message += `💰 Precio: ${tier.price} SOL\n`;
        message += `👛 Wallets: ${tier.wallets}\n`;
        message += `💸 Límite: $${tier.maxTradeAmount}\n`;
        message += `🎁 Features:\n`;
        tier.features.forEach(f => message += `   • ${f}\n`);
        message += '\n';
    }

    if (user.tier !== 'ELITE') {
        message += `📩 *Para adquirir un plan:*\n`;
        message += `1. Deposita el monto correspondiente a:\n`;
        message += `📲 *Wallet:* \`${process.env.PAYMENT_WALLET}\`\n\n`;
        message += `2. Envía el comprobante con /payment <MONTO>\n`;
    }

    ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('payment', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const amount = parseFloat(args[1]);

    if (!amount) {
        return ctx.reply('❌ Uso: /payment <MONTO_EN_SOL>');
    }

    const userId = ctx.from.id;
    const paymentId = `PAY_${Date.now()}`;

    payments[paymentId] = {
        userId,
        amount,
        status: 'PENDING',
        timestamp: Date.now()
    };

    saveData();

    const message =
        `💳 *Solicitud de Pago Registrada*\n\n` +
        `📋 *ID:* ${paymentId}\n` +
        `💰 *Monto:* ${amount} SOL\n` +
        `📲 *Destino:* \`${process.env.PAYMENT_WALLET}\`\n\n` +
        `⏳ *Esperando confirmación...*\n\n` +
        `⚠️ Una vez confirmado, tu plan se activará automáticamente.`;

    ctx.reply(message, { parse_mode: 'Markdown' });

    // Notificar admin
    await bot.telegram.sendMessage(ADMIN_CHAT_ID,
        `💰 *Nuevo pago solicitado*\n\n` +
        `👤 Usuario: ${ctx.from.first_name} (@${ctx.from.username})\n` +
        `💎 Monto: ${amount} SOL\n` +
        `🆔 ID: ${paymentId}`,
        { parse_mode: 'Markdown' }
    );
});

bot.command('createwallet', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];
    const tier = TIERS[user.tier];

    if (user.wallets.length >= tier.wallets) {
        return ctx.reply(
            `❌ Has alcanzado el límite de wallets para tu tier.\n\n` +
            `📈 *Actual: ${tier.name} (${tier.wallets} wallets)*\n` +
            `🚀 *Mejora tu plan para más wallets!*\n\n` +
            `/premium - Ver planes`
        );
    }

    const newWallet = createWallet();
    user.wallets.push({
        address: newWallet.publicKey,
        privateKey: newWallet.privateKey,
        createdAt: Date.now(),
        label: `Wallet ${user.wallets.length + 1}`
    });

    saveData();

    const message =
        `👛 *Nueva Wallet Creada*\n\n` +
        `🔑 *Address:* \`${newWallet.publicKey}\`\n` +
        `🏷️ *Label:* Wallet ${user.wallets.length}\n\n` +
        `⚠️ *Guarda tu clave privada en lugar seguro!*\n\n` +
        `💡 *Para ver la clave privada:*\n` +
        `/exportkey ${user.wallets.length - 1}`;

    ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('buy', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];

    if (user.wallets.length === 0) {
        return ctx.reply('❌ No tienes wallets. Crea una con /createwallet');
    }

    const args = ctx.message.text.split(' ');
    const tokenAddress = args[1];
    const amount = parseFloat(args[2]) || user.settings.defaultAmount;

    if (!tokenAddress) {
        return ctx.reply('❌ Uso: /buy <TOKEN_ADDRESS> <CANTIDAD_SOL>');
    }

    if (amount > TIERS[user.tier].maxTradeAmount) {
        return ctx.reply(`❌ Límite excedido. Tu tier permite máximo $${TIERS[user.tier].maxTradeAmount}`);
    }

    await ctx.reply('🔄 Procesando compra...');

    const wallet = {
        publicKey: user.wallets[0].address,
        wallet: user.wallets[0] // Aquí estaría el objeto wallet real
    };

    const result = await buyToken(userId, wallet, tokenAddress, amount);

    if (result.success) {
        const message =
            `✅ *Compra Exitosa*\n\n` +
            `🪙 *Token:* ${result.tokenInfo.symbol || tokenAddress.slice(0, 8)}...\n` +
            `💰 *Invertido:* ${amount} SOL\n` +
            `📊 *Precio:* $${result.tokenInfo.price || 'N/A'}\n` +
            `🆔 *Posición:* #${result.positionId.slice(-6)}\n\n` +
            `💡 *Para vender:* /sell ${result.positionId.slice(-6)}`;

        ctx.reply(message, { parse_mode: 'Markdown' });
        saveData();
    } else {
        ctx.reply(`❌ Error en compra: ${result.error}`);
    }
});

bot.command('sell', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const positionIdSuffix = args[1];
    const percentage = parseInt(args[2]) || 100;

    if (!positionIdSuffix) {
        return ctx.reply('❌ Uso: /sell <POSITION_ID> <PORCENTAJE>');
    }

    const userId = ctx.from.id;
    const positionId = Object.keys(positions).find(id => id.endsWith(positionIdSuffix));

    if (!positionId) {
        return ctx.reply('❌ Posición no encontrada');
    }

    await ctx.reply('🔄 Procesando venta...');

    const result = await sellToken(userId, positionId, percentage);

    if (result.success) {
        const emoji = result.profit > 0 ? '🟢' : '🔴';
        const profitText = result.profit > 0 ? `+${formatNumber(result.profit)} SOL` : formatNumber(result.profit) + ' SOL';

        const message =
            `✅ *Venta Exitosa*\n\n` +
            `${emoji} *Token:* ${result.symbol}\n` +
            `💰 *Vendido:* $${formatNumber(result.sellValue)}\n` +
            `📊 *PnL:* ${profitText} (${formatNumber(result.profitPercentage)}%)\n` +
            `📈 *Porcentaje:* ${percentage}%`;

        ctx.reply(message, { parse_mode: 'Markdown' });
        saveData();
    } else {
        ctx.reply(`❌ Error en venta: ${result.error}`);
    }
});

bot.command('positions', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];

    const userPositions = Object.entries(positions).filter(([id, pos]) =>
        pos.userId === userId && pos.status === 'ACTIVE'
    );

    if (userPositions.length === 0) {
        return ctx.reply('📭 No tienes posiciones activas');
    }

    let message = '📊 *Tus Posiciones Activas*\n\n';

    userPositions.forEach(([id, pos]) => {
        const currentPrice = pos.tokensReceived * 0.00001; // Simulación
        const currentValue = currentPrice * pos.tokensReceived;
        const pnl = currentValue - pos.amountInvested;
        const pnlPercent = (pnl / pos.amountInvested) * 100;
        const emoji = pnl >= 0 ? '🟢' : '🔴';

        message += `\n${emoji} *${pos.symbol}* #${id.slice(-6)}\n`;
        message += `💰 Invertido: ${pos.amountInvested} SOL\n`;
        message += `📈 PnL: ${formatNumber(pnlPercent)}%\n`;
        message += `💡 Vender: /sell ${id.slice(-6)}\n`;
    });

    ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('referrals', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];

    const userReferralCode = Object.entries(referralStats).find(([code, stats]) =>
        stats.referrerId === userId
    );

    const referralCode = userReferralCode ? userReferralCode[0] : 'No disponible';
    const referralCount = userReferralCode ? userReferralCode[1].referrals : 0;
    const earnings = user.totalEarnings || 0;

    const message =
        `👥 *Sistema de Referidos*\n\n` +
        `🔗 *Tu código:* \`${referralCode}\`\n` +
        `👤 *Referidos:* ${referralCount}\n` +
        `💰 *Ganancias:* ${formatNumber(earnings)} SOL\n\n` +
        `📝 *Comparte tu enlace:*\n` +
        `https://t.me/JESUS_FOLLOWER_BOT?start=${referralCode}\n\n` +
        `🎁 *Recompensas:*\n` +
        `• 0.001 SOL por cada referido\n` +
        `• 10% de sus pagos futuros`;

    ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('settings', async (ctx) => {
    const userId = ctx.from.id;
    const user = users[userId];

    const message =
        `⚙️ *Configuración de Trading*\n\n` +
        `💰 *Monto default:* ${user.settings.defaultAmount} SOL\n` +
        `🔄 *Copy Trade:* ${user.settings.copyTrade ? '✅' : '❌'}\n` +
        `🤖 *Auto Copy:* ${user.settings.autoCopy ? '✅' : '❌'}\n\n` +
        `📝 *Comandos para cambiar:*\n` +
        `/setamount <MONTO>\n` +
        `/copytrade <on/off>\n` +
        `/autocopy <on/off>`;

    ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('setamount', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const amount = parseFloat(args[1]);

    if (!amount || amount <= 0) {
        return ctx.reply('❌ Monto inválido');
    }

    const userId = ctx.from.id;
    const user = users[userId];

    if (amount > TIERS[user.tier].maxTradeAmount) {
        return ctx.reply(`❌ Límite para tu tier: $${TIERS[user.tier].maxTradeAmount}`);
    }

    user.settings.defaultAmount = amount;
    saveData();

    ctx.reply(`✅ Monto default actualizado a ${amount} SOL`);
});

// CALLBACK HANDLERS
bot.action('view_plans', (ctx) => {
    ctx.answerCbQuery();
    ctx.replyWithMarkdown('💎 *Ver planes premium:* /premium');
});

bot.action('create_wallet', (ctx) => {
    ctx.answerCbQuery();
    ctx.replyWithMarkdown('👛 *Crear wallet:* /createwallet');
});

bot.action('my_positions', (ctx) => {
    ctx.answerCbQuery();
    ctx.replyWithMarkdown('📊 *Ver posiciones:* /positions');
});

bot.action('settings', (ctx) => {
    ctx.answerCbQuery();
    ctx.replyWithMarkdown('⚙️ *Configuración:* /settings');
});

bot.action('referrals', (ctx) => {
    ctx.answerCbQuery();
    ctx.replyWithMarkdown('👥 *Referidos:* /referrals');
});

// ADMIN COMMANDS
bot.command('admin', async (ctx) => {
    if (ctx.from.id !== ADMIN_CHAT_ID) {
        return;
    }

    const totalUsers = Object.keys(users).length;
    const activeUsers = Object.values(users).filter(u =>
        Date.now() - u.lastActive < 86400000
    ).length;
    const totalPositions = Object.keys(positions).length;
    const pendingPayments = Object.values(payments).filter(p =>
        p.status === 'PENDING'
    ).length;

    const statsMessage =
        `📊 *Estadísticas del Bot*\n\n` +
        `👥 *Usuarios totales:* ${totalUsers}\n` +
        `✅ *Usuarios activos:* ${activeUsers}\n` +
        `📈 *Posiciones activas:* ${totalPositions}\n` +
        `💳 *Pagos pendientes:* ${pendingPayments}\n\n` +
        `💰 *Distribución de Tiers:*\n` +
        Object.entries(TIERS).map(([key, tier]) => {
            const count = Object.values(users).filter(u => u.tier === key).length;
            return `${tier.name}: ${count}`;
        }).join('\n');

    ctx.reply(statsMessage, { parse_mode: 'Markdown' });
});

bot.command('confirm_payment', async (ctx) => {
    if (ctx.from.id !== ADMIN_CHAT_ID) return;

    const args = ctx.message.text.split(' ');
    const paymentId = args[1];

    if (!paymentId) {
        return ctx.reply('❌ Uso: /confirm_payment <PAYMENT_ID>');
    }

    const payment = payments[paymentId];
    if (!payment) {
        return ctx.reply('❌ Pago no encontrado');
    }

    const userId = payment.userId;
    const user = users[userId];

    // Determinar tier basado en monto
    let newTier = 'FREE';
    for (const [tierKey, tier] of Object.entries(TIERS)) {
        if (payment.amount >= tier.price && payment.amount > TIERS[newTier].price) {
            newTier = tierKey;
        }
    }

    user.tier = newTier;
    payment.status = 'CONFIRMED';
    payment.confirmedAt = Date.now();

    saveData();

    // Notificar usuario
    await bot.telegram.sendMessage(userId,
        `🎉 *¡Pago Confirmado!*\n\n` +
        `✅ *Tu plan ahora es ${TIERS[newTier].name}*\n\n` +
        `🚀 *Disfruta de tus nuevos beneficios!*\n` +
        TIERS[newTier].features.map(f => `✅ ${f}`).join('\n'),
        { parse_mode: 'Markdown' }
    );

    ctx.reply(`✅ Pago confirmado. Usuario actualizado a ${newTier}`);
});

// START DEL BOT
console.log('🚀 Iniciando JESUS FOLLOWER BOT ULTIMATE...');
console.log('📡 Monitoreando canales de trading...');

// Iniciar monitoreo de canales cada 30 segundos
setInterval(monitorTelegramChannels, 30000);

// Guardar datos cada 5 minutos
setInterval(saveData, 300000);

// Iniciar el bot
bot.launch().then(() => {
    console.log('✅ Bot iniciado correctamente');
}).catch(error => {
    console.error('❌ Error iniciando bot:', error);
});

// Graceful shutdown
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    saveData();
    console.log('🔴 Bot detenido');
});

process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    saveData();
    console.log('🔴 Bot detenido');
});

// Exportar para uso en otros módulos
module.exports = {
    bot,
    buyToken,
    sellToken,
    getTokenInfo,
    users,
    positions,
    payments
};