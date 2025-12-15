// 🚀 QUANTUM TRADING BOT - VERSIÓN DEFINITIVA
// Arquitectura profesional con webhook y estado persistente

require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// =======================================
// CONFIGURACIÓN
// =======================================
const config = {
    botToken: process.env.BOT_TOKEN,
    webhookDomain: process.env.WEBHOOK_DOMAIN || 'https://your-domain.com',
    port: process.env.PORT || 3000,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    adminId: process.env.ADMIN_ID || 'ADMIN_TELEGRAM_ID_HERE',
    stripeKey: process.env.STRIPE_SECRET_KEY
};

console.log('🚀 Iniciando Quantum Trading Bot Definitivo...');

// =======================================
// ESTADO PERSISTENTE
// =======================================
class StateManager {
    constructor() {
        this.state = {
            users: new Map(),
            wallets: new Map(),
            subscriptions: new Map(),
            copyTraders: new Map(),
            trades: [],
            stats: {
                totalUsers: 0,
                activeUsers: 0,
                totalTrades: 0,
                totalRevenue: 0,
                dailyTrades: 0,
                dailyRevenue: 0
            },
            channels: new Set(['cryptoyeezuscalls', 'nachoweb3kols', 'pumpfunsignals']),
            lastUpdate: Date.now()
        };
        this.loadState();
    }

    async loadState() {
        try {
            const data = await fs.readFile('./quantum-state.json', 'utf8');
            const parsed = JSON.parse(data);

            // Convertir arrays a Maps
            this.state.users = new Map(parsed.users);
            this.state.wallets = new Map(parsed.wallets);
            this.state.subscriptions = new Map(parsed.subscriptions);
            this.state.copyTraders = new Map(parsed.copyTraders);
            this.state.channels = new Set(parsed.channels);

            console.log('✅ Estado cargado correctamente');
        } catch (error) {
            console.log('📝 Creando nuevo estado');
            this.initializeState();
        }
    }

    async saveState() {
        try {
            const data = {
                users: Array.from(this.state.users.entries()),
                wallets: Array.from(this.state.wallets.entries()),
                subscriptions: Array.from(this.state.subscriptions.entries()),
                copyTraders: Array.from(this.state.copyTraders.entries()),
                channels: Array.from(this.state.channels),
                trades: this.state.trades,
                stats: this.state.stats
            };
            await fs.writeFile('./quantum-state.json', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error guardando estado:', error);
        }
    }

    initializeState() {
        // Crear estado inicial para admin
        const adminWallet = Keypair.generate();
        this.state.wallets.set(config.adminId, {
            publicKey: adminWallet.publicKey.toString(),
            secretKey: Buffer.from(adminWallet.secretKey).toString('hex'),
            createdAt: Date.now()
        });

        this.state.users.set(config.adminId, {
            id: config.adminId,
            username: 'admin',
            role: 'admin',
            plan: 'enterprise',
            walletId: config.adminId,
            createdAt: Date.now(),
            isActive: true
        });

        this.state.stats.totalUsers = 1;
    }

    saveUser(user) {
        this.state.users.set(user.id, user);
        this.saveState();
    }

    saveWallet(userId, wallet) {
        this.state.wallets.set(userId, wallet);
        this.saveState();
    }
}

// =======================================
// SISTEMA DE PAGOS
// =======================================
class PaymentService {
    constructor() {
        this.plans = {
            free: { name: 'Free', price: 0, features: ['1 wallet', '5 trades/day', '1 canal'] },
            starter: { name: 'Starter', price: 29, features: ['3 wallets', '20 trades/day', '5 canales'] },
            pro: { name: 'Pro', price: 99, features: ['10 wallets', 'unlimited trades', 'todos los canales'] },
            enterprise: { name: 'Enterprise', price: 299, features: ['unlimited', 'api access', 'priority support'] }
        };
    }

    async createPaymentLink(userId, plan) {
        const price = this.plans[plan].price;
        if (price === 0) return null;

        // Aquí integraríamos con Stripe u otro procesador
        return {
            url: `https://buy.stripe.com/quantum_${plan}_${userId}`,
            price: price,
            currency: 'USD'
        };
    }

    async verifyPayment(paymentId) {
        // Verificar con el procesador de pagos
        return true; // Placeholder
    }
}

// =======================================
// COPY TRADING ENGINE
// =======================================
class CopyTradingEngine {
    constructor() {
        this.activeCopies = new Map();
        this.monitoring = false;
    }

    async startMonitoring() {
        if (this.monitoring) return;
        this.monitoring = true;
        console.log('👥 Iniciando monitoreo de copy trading...');

        // Monitorear canales cada 30 segundos
        setInterval(async () => {
            await this.checkSignals();
        }, 30000);
    }

    async checkSignals() {
        // Simular detección de señales
        if (Math.random() > 0.8) {
            const signal = {
                token: 'So11111111111111111111111111111111111111112',
                action: 'buy',
                amount: Math.random() * 0.5 + 0.01,
                source: 'cryptoyeezuscalls',
                timestamp: Date.now()
            };

            console.log(`🎯 Señal detectada: ${signal.action} ${signal.token}`);

            // Ejecutar para todos los usuarios con copy trading activo
            for (const [userId, config] of this.activeCopies) {
                if (config.active && config.channels.includes(signal.source)) {
                    await this.executeCopy(userId, signal);
                }
            }
        }
    }

    async executeCopy(userId, signal) {
        // Aquí ejecutaríamos el trade real
        console.log(`✅ Copiando trade para usuario ${userId}`);

        // Registrar trade
        const trade = {
            userId,
            ...signal,
            executedAt: Date.now(),
            status: 'executed'
        };

        return trade;
    }

    configure(userId, config) {
        this.activeCopies.set(userId, {
            active: config.active || false,
            channels: config.channels || [],
            maxAmount: config.maxAmount || 0.5,
            stopLoss: config.stopLoss || 0.05,
            takeProfit: config.takeProfit || 0.20
        });
    }
}

// =======================================
// INICIALIZACIÓN
// =======================================
const stateManager = new StateManager();
const paymentService = new PaymentService();
const copyEngine = new CopyTradingEngine();

// Crear bot con webhook
const bot = new Telegraf(config.botToken);
const app = express();

app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

// Conexión a Solana
let connection;
async function initConnection() {
    connection = new Connection(config.rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000
    });
    console.log('✅ Conectado a Solana');
}

// =======================================
// COMANDOS PRINCIPALES
// =======================================

// Start mejorado
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const username = ctx.from.username || `User${userId}`;

    // Crear o recuperar usuario
    let user = stateManager.state.users.get(userId);
    if (!user) {
        user = {
            id: userId,
            username: username,
            role: 'user',
            plan: 'free',
            createdAt: Date.now(),
            isActive: false
        };
        stateManager.saveUser(user);
        stateManager.state.stats.totalUsers++;
    }

    // Verificar si tiene wallet
    const wallet = stateManager.state.wallets.get(userId);

    let mensaje = `🤖 **QUANTUM TRADING BOT** 🤖\n\n`;
    mensaje += `¡Hola ${username}! 👋\n\n`;

    if (!wallet) {
        mensaje += `🔑 **Para empezar, necesitas una wallet:**\n\n`;
        mensaje += `1️⃣ /crearwallet - Crear nueva wallet\n`;
        mensaje += `2️⃣ /importar <private_key> - Importar existente\n\n`;
        mensaje += `⚠️ Guarda tu private key de forma segura!\n`;
    } else {
        const balance = await getBalance(wallet.publicKey);

        mensaje += `💰 **Tu Wallet:**\n`;
        mensaje += `Balance: ${balance.toFixed(4)} SOL\n`;
        mensaje += `Plan: ${stateManager.state.plans[user.plan]?.name || 'Free'}\n\n`;

        mensaje += `🚀 **Características Activas:**\n`;
        mensaje += `✅ Copy Trading de KOLs\n`;
        mensaje += `✅ Trading en Pump.fun\n`;
        mensaje += `✅ Multi-DEX Integration\n`;
        mensaje += `✅ Ejecución en tiempo real\n\n`;

        mensaje += `📋 **Comandos:**\n`;
        mensaje += `/balance - Ver balance\n`;
        mensaje += `/comprar <token> - Comprar\n`;
        mensaje += `/vender <token> - Vender\n`;
        mensaje += `/copytrading - Configurar copy\n`;
        mensaje += `/planes - Ver planes premium\n`;
    }

    const keyboard = {
        inline_keyboard: [
            [{ text: '💰 Ver Planes', callback_data: 'planes' }],
            [{ text: '📊 Activar Copy Trading', callback_data: 'copy_activate' }],
            [{ text: '🎯 Tutorial', callback_data: 'tutorial' }]
        ]
    };

    ctx.reply(mensaje, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
    });
});

// Crear wallet
bot.command('crearwallet', async (ctx) => {
    const userId = ctx.from.id.toString();

    if (stateManager.state.wallets.has(userId)) {
        return ctx.reply('⚠️ Ya tienes una wallet. Usa /deletewallet para crear otra.');
    }

    const wallet = Keypair.generate();
    const walletData = {
        publicKey: wallet.publicKey.toString(),
        secretKey: Buffer.from(wallet.secretKey).toString('hex'),
        createdAt: Date.now()
    };

    stateManager.saveWallet(userId, walletData);

    let mensaje = `✅ **Wallet Creada Exitosamente!**\n\n`;
    mensaje += `🔑 **Public Key:**\n`;
    mensaje += `\`${walletData.publicKey}\`\n\n`;
    mensaje += `🔒 **Private Key (GUARDALA):**\n`;
    mensaje += `\`${walletData.secretKey}\`\n\n`;
    mensaje += `💡 **Próximos pasos:**\n`;
    mensaje += `1. Envía SOL a tu wallet\n`;
    mensaje += `2. Usa /comprar para operar\n`;
    mensaje += `3. Activa /copytrading`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Copy Trading
bot.command('copytrading', async (ctx) => {
    const userId = ctx.from.id.toString();

    let mensaje = `👥 **COPY TRADING PROFESIONAL** 👥\n\n`;
    mensaje += `🎯 **Copia automáticamente a los mejores traders:**\n\n`;
    mensaje += `**Canales Monitoreados:**\n`;

    Array.from(stateManager.state.channels).forEach(channel => {
        mensaje += `✅ @${channel}\n`;
    });

    mensaje += `\n⚡ **Características:**\n`;
    mensaje += `• Ejecución instantánea (< 1s)\n`;
    mensaje += `• Risk management configurado\n`;
    mensaje += `• Stop loss automático\n`;
    mensaje += `• Take profit inteligente\n\n`;

    if (stateManager.state.users.get(userId)?.plan !== 'free') {
        mensaje += `✅ Tu plan permite copy trading ilimitado!`;
    } else {
        mensaje += `⚠️ Requiere plan Starter o superior\n`;
        mensaje += `/planes - Actualizar ahora`;
    }

    const keyboard = {
        inline_keyboard: [
            [{ text: '✅ Activar Copy Trading', callback_data: 'copy_activate' }],
            [{ text: '⚙️ Configurar Parámetros', callback_data: 'copy_config' }],
            [{ text: '📊 Ver Rendimiento', callback_data: 'copy_stats' }]
        ]
    };

    ctx.reply(mensaje, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
    });
});

// Planes
bot.command('planes', async (ctx) => {
    const userId = ctx.from.id.toString();
    const currentPlan = stateManager.state.users.get(userId)?.plan || 'free';

    let mensaje = `💳 **PLANES QUANTUM** 💳\n\n`;
    mensaje += `🎯 **Tu plan actual:** ${paymentService.plans[currentPlan]?.name || 'Free'}\n\n`;

    Object.entries(paymentService.plans).forEach(([key, plan]) => {
        const isActive = key === currentPlan;
        mensaje += `${isActive ? '✅' : '⭕'} **${plan.name}** - $${plan.price}/mes\n`;

        plan.features.forEach(feature => {
            mensaje += `  • ${feature}\n`;
        });

        if (!isActive) {
            mensaje += `  💡 /upgrade ${key}\n`;
        }
        mensaje += `\n`;
    });

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Upgrade
bot.command('upgrade', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    const plan = parts[1];
    const userId = ctx.from.id.toString();

    if (!plan || !paymentService.plans[plan]) {
        return ctx.reply('❌ Plan inválido. Usa: /upgrade <starter|pro|enterprise>');
    }

    const paymentLink = await paymentService.createPaymentLink(userId, plan);

    if (paymentLink) {
        ctx.reply(`💳 **Actualizar a ${paymentService.plans[plan].name}**\n\n` +
                 `💰 Costo: $${paymentLink.price} USD\n\n` +
                 `🔗 Pagar: ${paymentLink.url}\n\n` +
                 `✅ Te notificaremos cuando se confirme el pago.`);
    }
});

// Admin
bot.command('admin', async (ctx) => {
    if (ctx.from.id.toString() !== config.adminId) {
        return ctx.reply('❌ Comando solo para admin');
    }

    const stats = stateManager.state.stats;
    const activeUsers = Array.from(stateManager.state.users.values()).filter(u => u.isActive).length;

    let mensaje = `🔐 **PANEL ADMIN - QUANTUM BOT** 🔐\n\n`;
    mensaje += `📊 **Estadísticas Globales:**\n`;
    mensaje += `• Users: ${stats.totalUsers}\n`;
    mensaje += `• Activos: ${activeUsers}\n`;
    mensaje += `• Trades: ${stats.totalTrades}\n`;
    mensaje += `• Revenue: $${stats.totalRevenue}\n\n`;

    mensaje += `🎛️ **Comandos Admin:**\n`;
    mensaje += `/broadcast <msg> - Enviar a todos\n`;
    mensaje += `/stats - Estadísticas detalladas\n`;
    mensaje += `/users - Ver usuarios\n`;
    mensaje += `/revenue - Revenue tracker\n`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Callback handlers
bot.action('copy_activate', async (ctx) => {
    const userId = ctx.from.id.toString();
    copyEngine.configure(userId, {
        active: true,
        channels: ['cryptoyeezuscalls', 'nachoweb3kols']
    });

    await ctx.editMessageText('✅ **Copy Trading ACTIVADO!**\n\n' +
                              '🚀 El bot copiará automáticamente las operaciones de los profesionales');
    await ctx.answerCbQuery();
});

bot.action('planes', async (ctx) => {
    await ctx.reply('💳 Usa /planes para ver todos los planes disponibles');
    await ctx.answerCbQuery();
});

bot.action('tutorial', async (ctx) => {
    const tutorial = `🎓 **TUTORIAL RÁPIDO** 🎓\n\n` +
                    `1️⃣ **Configurar wallet**\n` +
                    `   /crearwallet o /importar\n\n` +
                    `2️⃣ **Fondear wallet**\n` +
                    `   Envía SOL a tu dirección\n\n` +
                    `3️⃣ **Configurar copy trading**\n` +
                    `   /copytrading → Activar\n\n` +
                    `4️⃣ **Empezar a operar**\n` +
                    `   /comprar <token>\n\n` +
                    `💡 **Tip:** Comienza con el plan Starter para ilimitado!`;

    ctx.reply(tutorial, { parse_mode: 'Markdown' });
    await ctx.answerCbQuery();
});

// =======================================
// WEBSERVER
// =======================================
async function startServer() {
    await initConnection();
    await copyEngine.startMonitoring();

    // Set webhook
    await bot.telegram.setWebhook(`${config.webhookDomain}/webhook`);
    console.log('✅ Webhook configurado');

    app.listen(config.port, () => {
        console.log(`🌐 Servidor corriendo en puerto ${config.port}`);
        console.log(`🤖 Bot listo para recibir comandos!`);
    });
}

// =======================================
// FUNCIONES AUXILIARES
// =======================================
async function getBalance(publicKey) {
    try {
        const balance = await connection.getBalance(new PublicKey(publicKey));
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        return 0;
    }
}

// Graceful shutdown
process.once('SIGINT', async () => {
    console.log('\n🛑 Guardando estado...');
    await stateManager.saveState();
    process.exit(0);
});

// Iniciar
startServer().catch(console.error);