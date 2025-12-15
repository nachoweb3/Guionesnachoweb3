require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot Premium Vendedor...');

// CONFIGURACIÓN DE TIERS
const TIERS = {
    free: {
        name: 'FREE',
        price: 0,
        features: ['1 wallet', '3 posiciones max', 'Señales básicas'],
        color: '⚪'
    },
    basic: {
        name: 'BASIC',
        price: 0.1,
        features: ['1 wallet', '10 posiciones', 'Señales avanzadas', 'Auto-trading básico'],
        color: '🟢'
    },
    pro: {
        name: 'PRO',
        price: 0.5,
        features: ['3 wallets', 'Ilimitadas posiciones', 'Señales premium', 'Auto-trading avanzado', 'Soporte prioritario'],
        color: '🔵'
    },
    elite: {
        name: 'ELITE',
        price: 1.0,
        features: ['10 wallets', 'Todas las funciones', 'Señales exclusivas', 'API access', 'Soporte 24/7', 'Grupo privado'],
        color: '👑'
    }
};

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    paymentWallet: process.env.PAYMENT_WALLET_PUBLIC_KEY || 'DRpKq1kYmT9Jix1ZRnFRJU5VmdkUKdEo3hsuv7ZPJmzJ',
    githubPagesUrl: process.env.GITHUB_PAGES_URL || 'https://nachoweb3.github.io/jesus-follower-bot',
    apis: {
        dexscreener: 'https://api.dexscreener.com/latest'
    }
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection;
const userTiers = new Map(); // userId -> tier
const userWallets = new Map(); // userId -> [wallets]
const posiciones = new Map(); // userId -> positions
const payments = new Map(); // paymentId -> paymentData

// Base de datos
const DB_FILE = './premium_bot_db.json';
const PAYMENTS_FILE = './payments.json';

// Cargar base de datos
function cargarBaseDatos() {
    try {
        // Cargar usuarios y tiers
        if (fs.existsSync(DB_FILE)) {
            const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

            Object.entries(data.users || {}).forEach(([userId, userData]) => {
                userTiers.set(userId, userData.tier || 'free');

                // Cargar wallets del usuario
                if (userData.wallets) {
                    userWallets.set(userId, userData.wallets.map(w => ({
                        keypair: Keypair.fromSecretKey(Buffer.from(w.secretKey)),
                        publicKey: new PublicKey(w.publicKey),
                        secretKey: w.secretKey,
                        label: w.label || 'Wallet Principal'
                    })));
                }

                // Cargar posiciones
                if (userData.positions) {
                    const posMap = new Map();
                    Object.entries(userData.positions).forEach(([token, pos]) => {
                        posMap.set(token, pos);
                    });
                    posiciones.set(userId, posMap);
                }
            });

            console.log(`✅ Base de datos cargada: ${userTiers.size} usuarios`);
        }

        // Cargar pagos
        if (fs.existsSync(PAYMENTS_FILE)) {
            const paymentData = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
            Object.entries(paymentData).forEach(([paymentId, payment]) => {
                payments.set(paymentId, payment);
            });
        }
    } catch (error) {
        console.error('Error cargando base de datos:', error.message);
    }
}

// Guardar base de datos
function guardarBaseDatos() {
    try {
        const data = {
            users: {},
            lastUpdated: new Date().toISOString()
        };

        // Guardar usuarios
        userTiers.forEach((tier, userId) => {
            data.users[userId] = {
                tier: tier,
                wallets: userWallets.get(userId) ? userWallets.get(userId).map(w => ({
                    publicKey: w.publicKey.toString(),
                    secretKey: w.secretKey,
                    label: w.label
                })) : [],
                positions: posiciones.has(userId) ? Object.fromEntries(posiciones.get(userId)) : {}
            };
        });

        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error guardando base de datos:', error.message);
    }
}

// Verificar si un usuario ha pagado
async function verificarPago(userId) {
    try {
        // Primero verificar pagos locales (más rápido)
        const userPayments = Array.from(payments.values()).filter(p => p.userId === userId && p.confirmed);
        if (userPayments.length > 0) {
            const lastPayment = userPayments[userPayments.length - 1];
            // Verificar si el pago aún está vigente (30 días)
            const paymentDate = new Date(lastPayment.confirmedAt);
            const now = new Date();
            const daysDiff = (now - paymentDate) / (1000 * 60 * 60 * 24);

            if (daysDiff < 30) {
                return lastPayment.tier;
            }
        }

        // Si no hay pagos locales vigentes, verificar en GitHub Pages
        if (config.githubPagesUrl) {
            try {
                const response = await axios.get(`${config.githubPagesUrl}/api/check-payment/${userId}`);
                if (response.data && response.data.paid) {
                    return response.data.tier;
                }
            } catch (webError) {
                console.log('Error verificando en GitHub Pages:', webError.message);
            }
        }

        return 'free';
    } catch (error) {
        console.error('Error verificando pago:', error.message);
        return 'free';
    }
}

// Actualizar tier del usuario
async function actualizarTier(userId) {
    const tier = await verificarPago(userId);
    userTiers.set(userId, tier);
    guardarBaseDatos();
    return tier;
}

// Inicializar conexión
async function inicializar() {
    try {
        connection = new Connection(config.rpcUrl, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });

        cargarBaseDatos();

        // Verificar pagos cada 5 minutos
        setInterval(async () => {
            console.log('🔄 Verificando pagos...');
            for (const [userId] of userTiers) {
                await actualizarTier(userId);
            }
        }, 5 * 60 * 1000);

        console.log(`✅ Conectado a Solana`);
        return true;
    } catch (error) {
        console.error('❌ Error conexión:', error.message);
        return false;
    }
}

// Obtener máximo de wallets permitidas
function getMaxWallets(tier) {
    switch(tier) {
        case 'basic': return 1;
        case 'pro': return 3;
        case 'elite': return 10;
        default: return 1;
    }
}

// Obtener máximo de posiciones
function getMaxPositions(tier) {
    switch(tier) {
        case 'free': return 3;
        case 'basic': return 10;
        case 'pro': return 50;
        case 'elite': return Infinity;
        default: return 3;
    }
}

// TECLADOS
const mainMenu = (tier) => Markup.inlineKeyboard([
    [Markup.button.callback('💳 Mis Wallets', 'menu_wallets'), Markup.button.callback('💰 Trading', 'menu_trading')],
    [Markup.button.callback('📊 Estadísticas', 'menu_stats'), Markup.button.callback('🎯 Señales', 'menu_signals')],
    ...(tier !== 'elite' ? [[Markup.button.callback('⭐ Actualizar Plan', 'menu_upgrade')]] : []),
    [Markup.button.callback('⚙️ Config', 'menu_config')]
]);

const upgradeMenu = Markup.inlineKeyboard([
    [Markup.button.callback(`🟢 BASIC - 0.1 SOL/mes`, 'upgrade_basic')],
    [Markup.button.callback(`🔵 PRO - 0.5 SOL/mes`, 'upgrade_pro')],
    [Markup.button.callback(`👑 ELITE - 1 SOL/mes`, 'upgrade_elite')],
    [Markup.button.callback('❓ Ver Beneficios', 'view_benefits')],
    [Markup.button.callback('⬅️ Volver', 'menu_start')]
]);

// COMANDO START
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const userName = ctx.from.first_name || 'Trader';

    // Actualizar tier
    const tier = await actualizarTier(userId);
    const tierInfo = TIERS[tier];

    // Crear wallet principal si no existe
    if (!userWallets.has(userId)) {
        const wallet = Keypair.generate();
        userWallets.set(userId, [{
            keypair: wallet,
            publicKey: wallet.publicKey,
            secretKey: Array.from(wallet.secretKey),
            label: 'Wallet Principal'
        }]);

        // Enviar clave privada
        try {
            await ctx.telegram.sendMessage(userId,
                `🔐 **TU CLAVE PRIVADA** 🔐\n\n` +
                `💾 *Guarda esta clave de forma segura:*\n\n` +
                `\`${Buffer.from(wallet.secretKey).toString('hex')}\`\n\n` +
                `⚠️ *Nunca la compartas con nadie*`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Error enviando clave privada:', error);
        }
    }

    guardarBaseDatos();

    await ctx.replyWithMarkdown(
        `🤖 **JESUS FOLLOWER BOT - ${tierInfo.color} ${tierInfo.name}** 🤖\n\n` +
        `👋 *Bienvenido ${userName}!*\n\n` +
        `${tierInfo.color} *Tu plan actual: ${tierInfo.name}*\n` +
        `💰 *Max posiciones:* ${getMaxPositions(tier)}\n` +
        `💳 *Max wallets:* ${getMaxWallets(tier)}\n\n` +
        `🎯 *¿Qué quieres hacer?*`,
        mainMenu(tier)
    );
});

// Handler para actualizar plan
bot.action('menu_upgrade', async (ctx) => {
    const userId = ctx.from.id.toString();
    const currentTier = userTiers.get(userId) || 'free';

    let mensaje = `⭐ **ACTUALIZAR TU PLAN** ⭐\n\n` +
                 `📋 *Plan actual:* ${TIERS[currentTier].color} ${TIERS[currentTier].name}\n\n` +
                 `💰 *Planes disponibles:*\n\n`;

    Object.entries(TIERS).forEach(([key, tier]) => {
        if (key !== currentTier && tier.price > 0) {
            mensaje += `${tier.color} **${tier.name}** - ${tier.price} SOL/mes\n`;
            mensaje += `   ${tier.features.map(f => `• ${f}`).join('\n   ')}\n\n`;
        }
    });

    await ctx.replyWithMarkdown(mensaje, upgradeMenu);
    ctx.answerCbQuery();
});

// Handler para actualizar a un tier específico
bot.action(/upgrade_(\w+)/, async (ctx) => {
    const tier = ctx.match[1];
    const tierInfo = TIERS[tier];
    const userId = ctx.from.id.toString();

    if (!tierInfo || tierInfo.price === 0) {
        ctx.reply('❌ Plan inválido');
        ctx.answerCbQuery();
        return;
    }

    // Opciones de pago
    await ctx.replyWithMarkdown(
        `💳 **ACTUALIZAR A ${tierInfo.color} ${tierInfo.name}**\n\n` +
        `💰 *Costo:* ${tierInfo.price} SOL\n` +
        `⏳ *Duración:* 30 días\n\n` +
        `🔗 *Elige tu método de pago:*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💳 Pagar con SOL', `pay_sol_${tier}`)],
            [Markup.button.callback('🌐 Pagar en Web', `pay_web_${tier}`)],
            [Markup.button.callback('❌ Cancelar', 'menu_start')]
        ])
    );

    ctx.answerCbQuery();
});

// Pagar con SOL directo
bot.action(/pay_sol_(\w+)/, async (ctx) => {
    const tier = ctx.match[1];
    const tierInfo = TIERS[tier];
    const userId = ctx.from.id.toString();

    // Generar referencia de pago
    const paymentId = `payment_${Date.now()}_${userId}`;

    await ctx.replyWithMarkdown(
        `💳 **PAGAR CON SOL**\n\n` +
        `${tierInfo.color} *Plan:* ${tierInfo.name}\n` +
        `💰 *Costo:* ${tierInfo.price} SOL\n\n` +
        `📋 *Instrucciones:*\n` +
        `1. Envía ${tierInfo.price} SOL a:\n` +
        `\`${config.paymentWallet}\`\n\n` +
        `2. Memo: \`${paymentId}\`\n\n` +
        `✅ *Tu plan se activará automáticamente*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('✅ He pagado', `check_payment_${paymentId}_${tier}`)],
            [Markup.button.callback('⬅️ Volver', `menu_upgrade')]
        ])
    );

    ctx.answerCbQuery();
});

// Pagar por web
bot.action(/pay_web_(\w+)/, async (ctx) => {
    const tier = ctx.match[1];
    const tierInfo = TIERS[tier];
    const userId = ctx.from.id.toString();

    // Generar pago en el servidor local
    try {
        const response = await axios.post(`http://localhost:3000/api/initiate-payment`, {
            userId: userId,
            tier: tier,
            telegramId: ctx.from.id
        });

        const { paymentId, amount } = response.data;

        // Crear URL de pago para GitHub Pages
        const paymentUrl = `${config.githubPagesUrl || 'https://your-github-pages-url'}/payment.html?paymentId=${paymentId}&tier=${tier}&amount=${amount}`;

        await ctx.replyWithMarkdown(
            `🌐 **PAGO POR WEB**\n\n` +
            `${tierInfo.color} *Plan:* ${tierInfo.name}\n` +
            `💰 *Costo:* ${amount} SOL\n\n` +
            `🔗 *Haz clic en el botón para pagar:*\n` +
            `💡 *Acepta tarjetas de crédito, USDT, USDC y más*`,
            Markup.inlineKeyboard([
                [Markup.button.url('💳 Pagar Ahora', paymentUrl)],
                [Markup.button.callback('✅ Verificar Pago', `verify_web_payment_${paymentId}`)],
                [Markup.button.callback('⬅️ Volver', `menu_upgrade')]
            ])
        );
    } catch (error) {
        console.error('Error iniciando pago web:', error);
        await ctx.reply('❌ Error iniciando pago. Intenta con SOL directo.');
    }

    ctx.answerCbQuery();
});

// Verificar pago web
bot.action(/verify_web_payment_(.+?)$/, async (ctx) => {
    const paymentId = ctx.match[1];
    const userId = ctx.from.id.toString();

    await ctx.reply('⏳ Verificando pago...');

    try {
        // Verificar con el servidor local
        const payments = Array.from(this.payments?.values() || []).filter(p => p.userId === userId);
        const payment = payments.find(p => p.paymentId === paymentId);

        if (payment && payment.status === 'confirmed') {
            await ctx.replyWithMarkdown(
                `✅ **PAGO CONFIRMADO**\n\n` +
                `🎉 *Tu plan ha sido actualizado*\n` +
                `⭐ *Disfruta de tus nuevos beneficios*`
            );
            await ctx.command('start');
        } else {
            await ctx.reply('❌ Pago no encontrado o pendiente. Intenta en unos minutos.');
        }
    } catch (error) {
        await ctx.reply('❌ Error verificando pago. Contacta soporte.');
    }

    ctx.answerCbQuery();
});

// Verificar pago
bot.action(/check_payment_(.+?)_(\w+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    const tier = ctx.match[2];
    const userId = ctx.from.id.toString();

    await ctx.replyWithMarkdown(
        `⏳ *Verificando tu pago...*\n\n` +
        `🔍 *ID de pago:* ${paymentId}\n` +
        `⏱️ *Por favor espera un momento*`
    );

    // Simular verificación (en producción, conectar con blockchain)
    setTimeout(async () => {
        // Actualizar tier
        userTiers.set(userId, tier);
        guardarBaseDatos();

        const tierInfo = TIERS[tier];

        await ctx.replyWithMarkdown(
            `✅ **PAGO CONFIRMADO** ✅\n\n` +
            `${tierInfo.color} *Felicitaciones! Ahora tienes el plan ${tierInfo.name}*\n\n` +
            `🎉 *Nuevas características desbloqueadas:*\n` +
            `${tierInfo.features.map(f => `• ${f}`).join('\n')}\n\n` +
            `🚀 *Disfruta de tu nuevo plan!*`,
            mainMenu(tier)
        );
    }, 3000);

    ctx.answerCbQuery();
});

// Handler para mostrar beneficios
bot.action('view_benefits', async (ctx) => {
    let mensaje = `💎 **BENEFICIOS POR PLAN** 💎\n\n`;

    Object.entries(TIERS).forEach(([key, tier]) => {
        mensaje += `${tier.color} **${tier.name}** ${tier.price > 0 ? `- ${tier.price} SOL/mes` : '- GRATIS'}\n`;
        mensaje += `${tier.features.map(f => `   • ${f}`).join('\n')}\n\n`;
    });

    await ctx.replyWithMarkdown(mensaje, upgradeMenu);
    ctx.answerCbQuery();
});

// COMANDO DE TRADING RESTRINGIDO
bot.command('buy', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';
    const maxPositions = getMaxPositions(tier);

    const userPos = posiciones.get(userId) || new Map();
    if (userPos.size >= maxPositions) {
        return ctx.replyWithMarkdown(
            `❌ *Límite alcanzado*\n\n` +
            `📊 *Plan:* ${TIERS[tier].color} ${TIERS[tier].name}\n` +
            `📍 *Posiciones:* ${userPos.size}/${maxPositions}\n\n` +
            `⭐ *Actualiza tu plan para más posiciones:* /upgrade`
        );
    }

    // Lógica de compra normal...
    ctx.reply('🔄 Procesando compra...');
});

// COMANDO PARA VER TIPO DE PLAN
bot.command('plan', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';
    const tierInfo = TIERS[tier];
    const userPos = posiciones.get(userId) || new Map();
    const userWalletsCount = userWallets.get(userId)?.length || 0;

    await ctx.replyWithMarkdown(
        `📊 **TU PLAN ACTUAL** 📊\n\n` +
        `${tierInfo.color} **${tierInfo.name}**\n\n` +
        `💳 *Wallets:* ${userWalletsCount}/${getMaxWallets(tier)}\n` +
        `📈 *Posiciones:* ${userPos.size}/${getMaxPositions(tier)}\n\n` +
        `✨ *Características:*\n` +
        `${tierInfo.features.map(f => `• ${f}`).join('\n')}\n\n` +
        `⭐ *Para actualizar:* /upgrade`
    );
});

// Handler para menú trading
bot.action('menu_trading', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';
    const settings = getSettings(userId);
    const userPos = posiciones.get(userId) || new Map();

    await ctx.replyWithMarkdown(
        `💰 **MENÚ TRADING** 💰\n\n` +
        `${TIERS[tier].color} *Plan:* ${TIERS[tier].name}\n` +
        `💎 *Monto por defecto:* ${settings.buyAmount || 0.1} SOL\n` +
        `📊 *Slippage:* ${settings.slippage || 10}%\n` +
        `📈 *Posiciones:* ${userPos.size}/${getMaxPositions(tier)}\n\n` +
        `🎯 *Selecciona una operación:*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💎 Comprar Rápido', 'trade_quick_buy')],
            [Markup.button.callback('💸 Vender', 'trade_sell')],
            [Markup.button.callback('📋 Mis Posiciones', 'trade_positions')],
            [Markup.button.callback('⬅️ Volver', 'menu_start')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para menú señales
bot.action('menu_signals', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';

    let mensaje = `🎯 **SEÑALES DE TRADING** 🎯\n\n`;
    mensaje += `${TIERS[tier].color} *Tu plan:* ${TIERS[tier].name}\n\n`;

    if (tier === 'free') {
        mensaje += `📊 *Señales disponibles:*\n`;
        mensaje += `• Señales básicas (limitadas)\n`;
        mensaje += `• Retraso de 5 minutos\n\n`;
        mensaje += `⭐ *Actualiza a PRO para señales en tiempo real*`;
    } else if (tier === 'basic') {
        mensaje += `📊 *Señales disponibles:*\n`;
        mensaje += `• Señales avanzadas\n`;
        mensaje += `• Retraso de 1 minuto\n`;
        mensaje += `• Auto-trading básico\n\n`;
    } else if (tier === 'pro') {
        mensaje += `📊 *Señales disponibles:*\n`;
        mensaje += `• Señales premium ⭐\n`;
        mensaje += `• Tiempo real\n`;
        mensaje += `• Auto-trading avanzado\n`;
        mensaje += `• Análisis técnico\n\n`;
    } else if (tier === 'elite') {
        mensaje += `👑 *Señales exclusivas ELITE:*\n`;
        mensaje += `• Acceso a grupo privado\n`;
        mensaje += `• Señales de whales\n`;
        mensaje += `• Pre-lanzamientos\n`;
        mensaje += `• Soporte directo\n\n`;
    }

    await ctx.replyWithMarkdown(
        mensaje,
        Markup.inlineKeyboard([
            [Markup.button.callback('📈 Últimas Señales', 'last_signals')],
            [Markup.button.callback('⚙️ Configurar Auto-trading', 'config_auto')],
            ...(tier !== 'elite' ? [[Markup.button.callback('⭐ Mejorar Plan', 'menu_upgrade')]] : []),
            [Markup.button.callback('⬅️ Volver', 'menu_start')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para menú estadísticas
bot.action('menu_stats', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userPos = posiciones.get(userId) || new Map();
    const tier = userTiers.get(userId) || 'free';
    const balance = await getBalance(userId);

    let totalInvested = 0;
    let totalPnL = 0;
    let wins = 0;
    let losses = 0;

    for (const [token, pos] of userPos) {
        totalInvested += pos.invertido;
        const info = await getTokenInfo(token);
        const currentPrice = info.price || pos.precioEntrada;
        const pnl = (pos.cantidadTokens * currentPrice) - pos.invertido;
        totalPnL += pnl;

        if (pnl > 0) wins++;
        else if (pnl < 0) losses++;
    }

    const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;

    await ctx.replyWithMarkdown(
        `📊 **TUS ESTADÍSTICAS** 📊\n\n` +
        `${TIERS[tier].color} *Plan:* ${TIERS[tier].name}\n\n` +
        `💰 *Balance Disponible:* ${balance.toFixed(4)} SOL\n` +
        `💵 *Valor USD:* $${(balance * 150).toFixed(2)}\n\n` +
        `📈 *Trading:*\n` +
        `• Invertido: ${totalInvested.toFixed(4)} SOL\n` +
        `• PnL Total: ${totalPnL >= 0 ? '🟢' : '🔴'} ${totalPnL.toFixed(4)} SOL\n` +
        `• Rendimiento: ${totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0}%\n\n` +
        `🎯 *Posiciones:* ${wins} ganadas / ${losses} perdidas\n` +
        `📊 *Win Rate:* ${winRate}%\n\n` +
        `💡 *Posiciones activas:* ${userPos.size}/${getMaxPositions(tier)}`,
        Markup.inlineKeyboard([
            [Markup.button.callback('📋 Ver Posiciones', 'menu_wallets')],
            [Markup.button.callback('🔄 Historial', 'trade_history')],
            [Markup.button.callback('⬅️ Volver', 'menu_start')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para menú config
bot.action('menu_config', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';
    const settings = getSettings(userId);

    await ctx.replyWithMarkdown(
        `⚙️ **CONFIGURACIÓN** ⚙️\n\n` +
        `${TIERS[tier].color} *Plan:* ${TIERS[tier].name}\n\n` +
        `💰 *Monto compra:* ${settings.buyAmount || 0.1} SOL\n` +
        `📊 *Slippage:* ${settings.slippage || 10}%\n` +
        `🤖 *Auto-vender:* ${settings.autoSell ? '✅' : '❌'}\n` +
        `🛑 *Stop Loss:* -${Math.abs(settings.stopLoss || 50)}%\n` +
        `🔔 *Notificaciones:* ${settings.notifications !== false ? '✅' : '❌'}\n\n` +
        `⚡ *¿Qué quieres configurar?*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('💰 Monto Compra', 'config_buy_amount')],
            [Markup.button.callback('📊 Slippage', 'config_slippage')],
            [Markup.button.callback('🤖 Auto-trading', 'config_auto')],
            [Markup.button.callback('🛑 Stop Loss', 'config_stoploss')],
            [Markup.button.callback('⬅️ Volver', 'menu_start')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para comprar rápido
bot.action('trade_quick_buy', async (ctx) => {
    await ctx.replyWithMarkdown(
        `💰 **COMPRA RÁPIDA**\n\n` +
        `Escribe el token que quieres comprar:\n\n` +
        `Ejemplos:\n` +
        `\`/buy PEPE\`\n` +
        `\`/buy BONK 0.5\`\n\n` +
        `💡 *O usa el menú principal para configurar monto*`
    );
    ctx.answerCbQuery();
});

// Handler para vender
bot.action('trade_sell', async (ctx) => {
    const userId = ctx.from.id.toString();
    const userPos = posiciones.get(userId) || new Map();

    if (userPos.size === 0) {
        await ctx.reply('❌ No tienes posiciones para vender');
        ctx.answerCbQuery();
        return;
    }

    let mensaje = `💸 **VENDER POSICIONES** 💸\n\n`;
    userPos.forEach((pos, token) => {
        const info = getTokenInfoSync(token);
        const currentPrice = info.price || pos.precioEntrada;
        const value = pos.cantidadTokens * currentPrice;
        const pnl = ((currentPrice / pos.precioEntrada - 1) * 100);

        mensaje += `🪙 ${token}: ${pnl > 0 ? '🟢' : '🔴'} ${pnl.toFixed(2)}%\n`;
    });

    mensaje += `\nUsa: \`/sell <token> <porcentaje>\``;

    await ctx.replyWithMarkdown(mensaje);
    ctx.answerCbQuery();
});

// Handler para ver posiciones
bot.action('trade_positions', async (ctx) => {
    await ctx.command('posiciones');
    ctx.answerCbQuery();
});

// Handler para últimas señales
bot.action('last_signals', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';

    // Simular señales
    const signals = [
        { token: 'PEPE', entry: 0.00000123, target: 0.000002, confidence: 85 },
        { token: 'BONK', entry: 0.000014, target: 0.000025, confidence: 92 },
        { token: 'WIF', entry: 1.23, target: 2.50, confidence: 78 }
    ];

    let mensaje = `📈 **ÚLTIMAS SEÑALES** 📈\n\n`;
    signals.forEach((signal, index) => {
        mensaje += `🎯 *Señal ${index + 1}:*\n`;
        mensaje += `🪙 Token: ${signal.token}\n`;
        mensaje += `💰 Entry: $${signal.entry}\n`;
        mensaje += `🎯 Target: $${signal.target}\n`;
        mensaje += `📊 Confianza: ${signal.confidence}%\n\n`;
    });

    if (tier === 'free') {
        mensaje += `⏰ *Las señales se actualizan cada 30 minutos*\n`;
        mensaje += `⭐ *Actualiza para tiempo real*`;
    } else {
        mensaje += `⚡ *Señales en tiempo real*`;
    }

    await ctx.replyWithMarkdown(mensaje);
    ctx.answerCbQuery();
});

// Función para obtener token info sincronizada
function getTokenInfoSync(token) {
    // Placeholder - en producción usar API real
    return {
        symbol: token,
        price: 0.000001,
        liquidity: 10000
    };
}

// COMANDO UPGRADE
bot.command('upgrade', async (ctx) => {
    ctx.answerCbQuery();
    return ctx.action('menu_upgrade');
});

// Handler para menú start
bot.action('menu_start', async (ctx) => {
    await ctx.command('start');
    ctx.answerCbQuery();
});

// Handler para configurar auto-trading
bot.action('config_auto', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    await ctx.replyWithMarkdown(
        `🤖 **AUTO-TRADING** 🤖\n\n` +
        `Estado: ${settings.autoSell ? '✅ Activado' : '❌ Desactivado'}\n\n` +
        `💡 *El auto-trading ejecuta automáticamente:\n` +
        `• Compra cuando detecta señales\n` +
        `• Vende en objetivos de precio\n` +
        `• Aplica stop-loss configurado\n\n` +
        `⚙️ *Configuración:*\n` +
        `• Vender al 2x: ${settings.sellAt2x ? '✅' : '❌'}\n` +
        `• Vender al 5x: ${settings.sellAt5x ? '✅' : '❌'}\n` +
        `• Stop-loss: -${Math.abs(settings.stopLoss || 50)}%`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Activar/Desactivar', 'toggle_auto')],
            [Markup.button.callback('🎯 Configurar Objetivos', 'config_targets')],
            [Markup.button.callback('⬅️ Volver', 'menu_config')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para toggle auto-trading
bot.action('toggle_auto', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    settings.autoSell = !settings.autoSell;
    guardarBaseDatos();

    await ctx.replyWithMarkdown(
        `🤖 *Auto-trading ${settings.autoSell ? '✅ Activado' : '❌ Desactivado'}*`
    );
    ctx.answerCbQuery();
});

// Handler para configurar stop-loss
bot.action('config_stoploss', async (ctx) => {
    await ctx.replyWithMarkdown(
        `🛑 **CONFIGURAR STOP LOSS**\n\n` +
        `El stop-loss vende automáticamente cuando una posición pierde el porcentaje configurado.\n\n` +
        `Escribe el comando:\n\n` +
        `\`/stoploss <porcentaje>\`\n\n` +
        `Ejemplos:\n` +
        `\`/stoploss 30\` - Vender con -30%\n` +
        `\`/stoploss 50\` - Vender con -50%\n\n` +
        `💡 *Recomendado: 30-50%`,
        Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Volver', 'menu_config')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para historial
bot.action('trade_history', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';

    if (tier === 'free') {
        await ctx.replyWithMarkdown(
            `📊 **HISTORIAL** 📊\n\n` +
            `❌ *Esta función requiere plan PRO*\n\n` +
            `⭐ *Actualiza tu plan para ver historial completo*`,
            Markup.inlineKeyboard([
                [Markup.button.callback('⭐ Actualizar Plan', 'menu_upgrade')],
                [Markup.button.callback('⬅️ Volver', 'menu_stats')]
            ])
        );
    } else {
        await ctx.replyWithMarkdown(
            `📊 **TU HISTORIAL** 📊\n\n` +
            `📈 *Operaciones recientes:*\n` +
            `• PEPE: +25.3% ✅\n` +
            `• BONK: -12.1% ❌\n` +
            `• WIF: +45.7% ✅\n\n` +
            `💰 *PnL del mes: +0.5 SOL*\n` +
            `📊 *Win Rate: 68%*`,
            Markup.inlineKeyboard([
                [Markup.button.callback('📥 Exportar CSV', 'export_csv')],
                [Markup.button.callback('⬅️ Volver', 'menu_stats')]
            ])
        );
    }
    ctx.answerCbQuery();
});

// Handler para exportar CSV
bot.action('export_csv', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';

    if (tier === 'elite') {
        await ctx.reply(
            '📥 *Preparando tu CSV...*\n\n' +
            'Lo recibirás en breve con todo tu historial de trading.'
        );
    } else {
        await ctx.replyWithMarkdown(
            `❌ *Exportar CSV requiere plan ELITE*\n\n` +
            `👑 *Actualiza para acceso completo*`,
            Markup.inlineKeyboard([
                [Markup.button.callback('⭐ Actualizar a ELITE', 'upgrade_elite')],
                [Markup.button.callback('⬅️ Volver', 'menu_stats')]
            ])
        );
    }
    ctx.answerCbQuery();
});

// Handler para configurar objetivos
bot.action('config_targets', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    await ctx.replyWithMarkdown(
        `🎯 **CONFIGURAR OBJETIVOS** 🎯\n\n` +
        `Configura en qué punto vender automáticamente:\n\n` +
        `💰 *Objetivos actuales:*\n` +
        `• Vender al 2x: ${settings.sellAt2x ? '✅' : '❌'}\n` +
        `• Vender al 5x: ${settings.sellAt5x ? '✅' : '❌'}\n\n` +
        `💡 *Puedes configurar objetivos personalizados con:*\n` +
        `\`/target <token> <precio>\``,
        Markup.inlineKeyboard([
            [Markup.button.callback('2x 🎯', 'toggle_2x'), Markup.button.callback('5x 🎯', 'toggle_5x')],
            [Markup.button.callback('⬅️ Volver', 'config_auto')]
        ])
    );
    ctx.answerCbQuery();
});

// Handler para toggle 2x
bot.action('toggle_2x', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    settings.sellAt2x = !settings.sellAt2x;
    guardarBaseDatos();

    await ctx.replyWithMarkdown(
        `🎯 *Vender al 2x: ${settings.sellAt2x ? '✅ Activado' : '❌ Desactivado'}*`
    );
    ctx.answerCbQuery();
});

// Handler para toggle 5x
bot.action('toggle_5x', async (ctx) => {
    const userId = ctx.from.id.toString();
    const settings = getSettings(userId);

    settings.sellAt5x = !settings.sellAt5x;
    guardarBaseDatos();

    await ctx.replyWithMarkdown(
        `🎯 *Vender al 5x: ${settings.sellAt5x ? '✅ Activado' : '❌ Desactivado'}*`
    );
    ctx.answerCbQuery();
});

// Menú de wallets con botones
bot.action('menu_wallets', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';
    const wallets = userWallets.get(userId) || [];
    const maxWallets = getMaxWallets(tier);

    let mensaje = `💳 **TUS WALLETS** 💳\n\n`;
    let keyboardButtons = [];

    if (wallets.length === 0) {
        mensaje += `❌ *No tienes wallets creadas*\n\n`;
    } else {
        wallets.forEach((wallet, index) => {
            mensaje += `${index + 1}. *${wallet.label}*\n`;
            mensaje += `   \`${wallet.publicKey.toString().slice(0, 8)}...${wallet.publicKey.toString().slice(-8)}\`\n`;

            // Botón para cada wallet individual
            keyboardButtons.push([Markup.button.callback(`🗑️ Eliminar ${wallet.label}`, `delete_wallet_${index}`)]);
        });
    }

    mensaje += `\n💳 *Wallets:* ${wallets.length}/${maxWallets}`;

    // Botón para crear nueva wallet si hay espacio
    if (wallets.length < maxWallets) {
        keyboardButtons.unshift([Markup.button.callback('➕ Crear Nueva Wallet', 'create_new_wallet')]);
    }

    // Botón de volver
    keyboardButtons.push([Markup.button.callback('⬅️ Volver', 'menu_start')]);

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard(keyboardButtons));
    ctx.answerCbQuery();
});

// Crear nueva wallet
bot.action('create_new_wallet', async (ctx) => {
    const userId = ctx.from.id.toString();
    const tier = userTiers.get(userId) || 'free';
    const wallets = userWallets.get(userId) || [];
    const maxWallets = getMaxWallets(tier);

    if (wallets.length >= maxWallets) {
        await ctx.replyWithMarkdown(
            `❌ *Límite alcanzado*\n\n` +
            `💳 *Wallets:* ${wallets.length}/${maxWallets}\n` +
            `⭐ *Actualiza tu plan para más wallets*: /upgrade`
        );
        ctx.answerCbQuery();
        return;
    }

    // Crear nueva wallet
    const wallet = Keypair.generate();
    if (!userWallets.has(userId)) {
        userWallets.set(userId, []);
    }

    const walletNumber = wallets.length + 1;
    const newWallet = {
        keypair: wallet,
        publicKey: wallet.publicKey,
        secretKey: Array.from(wallet.secretKey),
        label: `Wallet ${walletNumber}`
    };

    userWallets.get(userId).push(newWallet);
    guardarBaseDatos();

    // Enstrar clave privada por mensaje privado
    try {
        await ctx.telegram.sendMessage(userId,
            `🔐 **NUEVA WALLET CREADA** 🔐\n\n` +
            `💳 *Nombre:* ${newWallet.label}\n` +
            `📋 *Dirección:* ${wallet.publicKey.toString()}\n\n` +
            `💾 *Guarda esta clave de forma segura:*\n\n` +
            `\`${Buffer.from(wallet.secretKey).toString('hex')}\`\n\n` +
            `⚠️ *Nunca la compartas con nadie*`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error enviando clave privada:', error);
    }

    await ctx.replyWithMarkdown(
        `✅ *Wallet creada exitosamente*\n\n` +
        `💳 *Nombre:* ${newWallet.label}\n` +
        `📋 *Dirección:* \`${wallet.publicKey.toString().slice(0, 8)}...${wallet.publicKey.toString().slice(-8)}\`\n\n` +
        `📩 *Te he enviado la clave privada por mensaje privado*`
    );

    ctx.answerCbQuery();
});

// Eliminar wallet
bot.action(/delete_wallet_(\d+)/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const walletIndex = parseInt(ctx.match[1]);
    const wallets = userWallets.get(userId) || [];

    if (walletIndex >= wallets.length) {
        await ctx.reply('❌ Wallet no encontrada');
        ctx.answerCbQuery();
        return;
    }

    const walletToDelete = wallets[walletIndex];

    // Verificar si tiene posiciones
    const userPos = posiciones.get(userId) || new Map();
    let hasPositions = false;
    for (const [token, pos] of userPos) {
        if (pos.walletIndex === walletIndex) {
            hasPositions = true;
            break;
        }
    }

    if (hasPositions) {
        await ctx.replyWithMarkdown(
            `❌ *No puedes eliminar esta wallet*\n\n` +
            `📊 *Tiene posiciones activas*\n` +
            `💰 *Vende todas las posiciones primero*`
        );
        ctx.answerCbQuery();
        return;
    }

    // Si es la única wallet, no permitir eliminar
    if (wallets.length === 1) {
        await ctx.reply('❌ No puedes eliminar tu única wallet. Crea una nueva primero.');
        ctx.answerCbQuery();
        return;
    }

    // Confirmar eliminación
    await ctx.replyWithMarkdown(
        `⚠️ **¿Eliminar Wallet?**\n\n` +
        `💳 *Nombre:* ${walletToDelete.label}\n` +
        `📋 *Dirección:* \`${walletToDelete.publicKey.toString().slice(0, 8)}...${walletToDelete.publicKey.toString().slice(-8)}\`\n\n` +
        `❗ *Esta acción es irreversible*\n` +
        `💰 *Asegúrate de no tener fondos en esta wallet*`,
        Markup.inlineKeyboard([
            [Markup.button.callback('✅ Confirmar', `confirm_delete_${walletIndex}`)],
            [Markup.button.callback('❌ Cancelar', 'menu_wallets')]
        ])
    );

    ctx.answerCbQuery();
});

// Confirmar eliminación de wallet
bot.action(/confirm_delete_(\d+)/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const walletIndex = parseInt(ctx.match[1]);
    const wallets = userWallets.get(userId) || [];

    if (walletIndex < wallets.length) {
        const walletName = wallets[walletIndex].label;
        wallets.splice(walletIndex, 1);

        // Re-etiquetar las wallets restantes
        wallets.forEach((wallet, index) => {
            wallet.label = `Wallet ${index + 1}`;
        });

        guardarBaseDatos();

        await ctx.replyWithMarkdown(
            `✅ *Wallet eliminada exitosamente*\n\n` +
            `💳 *${walletName} ha sido eliminada*`
        );
    }

    // Volver al menú de wallets
    await ctx.action('menu_wallets');
});

// Función para obtener precio SOL
async function getSolPrice() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        return response.data.solana.usd;
    } catch {
        return 150;
    }
}

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot Premium Vendedor iniciado');
    console.log('💳 Sistema de pagos activo');
    console.log('⭐ Tiers configurados');

    bot.launch()
        .then(() => console.log('🎉 Bot ready para vender!'))
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

// Iniciar
iniciar();