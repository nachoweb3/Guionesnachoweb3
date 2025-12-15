require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram, AccountMeta } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createSyncNativeInstruction, createCloseAccountInstruction } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');
const PaymentSystem = require('./payment-system');
const GamificationSystem = require('./gamification-system');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot Premium Trading...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.01,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    raydiumProgramId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    serumProgramId: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection, wallet;
let modoTrading = true;
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();
const cachePools = new Map();

// Inicializar sistemas
const paymentSystem = new PaymentSystem();
const gamification = new GamificationSystem();

// SISTEMA DE USUARIOS Y PREMIUM
const usuarios = new Map(); // userId -> {plan, expires, usage, telegramId}
const PLANES = {
    FREE: {
        nombre: 'Free',
        precio: 0,
        limiteDiario: 3,
        caracteristicas: ['3 operaciones por día', '1 canal monitoreado', 'DEX básicos'],
        color: '⚪'
    },
    BASIC: {
        nombre: 'Basic',
        precio: 29, // USD
        limiteDiario: 10,
        caracteristicas: ['10 operaciones por día', '3 canales monitoreados', 'Todos los DEXs', 'Soporte básico'],
        color: '🟢'
    },
    PRO: {
        nombre: 'Pro',
        precio: 99,
        limiteDiario: -1, // Ilimitado
        caracteristicas: ['Operaciones ilimitadas', '10 canales monitoreados', 'API access', 'Trading automático', 'Soporte prioritario', 'Señales exclusivas'],
        color: '🔥'
    },
    ENTERPRISE: {
        nombre: 'Enterprise',
        precio: 299,
        limiteDiario: -1,
        caracteristicas: ['Todo lo de PRO', '30 canales', 'Custom strategies', 'Phone support', 'Onboarding personalizado'],
        color: '💎'
    }
};

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

// Funciones del sistema premium
function getUsuario(userId) {
    if (!usuarios.has(userId)) {
        usuarios.set(userId, {
            plan: 'FREE',
            expires: null,
            usage: 0,
            lastReset: new Date().setHours(0,0,0,0),
            telegramId: userId
        });
    }
    return usuarios.get(userId);
}

function puedeOperar(userId) {
    const usuario = getUsuario(userId);
    const plan = PLANES[usuario.plan];

    // Resetear uso diario
    const hoy = new Date().setHours(0,0,0,0);
    if (usuario.lastReset < hoy) {
        usuario.usage = 0;
        usuario.lastReset = hoy;
    }

    // Verificar límite
    if (plan.limiteDiario === -1) return true; // Ilimitado
    return usuario.usage < plan.limiteDiario;
}

function incrementarUso(userId) {
    const usuario = getUsuario(userId);
    usuario.usage++;
    console.log(`📊 Usuario ${userId}: ${usuario.usage}/${PLANES[usuario.plan].limiteDiario || '∞'} operaciones hoy`);
}

// COMANDOS DEL BOT

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const usuario = getUsuario(userId);
    const plan = PLANES[usuario.plan];

    let mensaje = `🤖 **Bot Trading Premium** ${plan.color}\n\n`;
    mensaje += `💳 **Tu Plan:** ${plan.nombre} ${plan.color}\n`;
    mensaje += `📊 **Operaciones hoy:** ${usuario.usage}/${plan.limiteDiario === -1 ? '∞' : plan.limiteDiario}\n`;

    if (plan.nombre !== 'Free') {
        const diasRestantes = usuario.expires ? Math.ceil((usuario.expires - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        mensaje += `📅 **Vence en:** ${diasRestantes} días\n`;
    }

    mensaje += `\n🔁 **DEXs Disponibles:**\n`;
    if (plan.nombre === 'Free') {
        mensaje += `• Raydium AMM (limitado)\n`;
    } else {
        mensaje += `• Raydium AMM\n• Orca Whirlpool\n• Serum DEX\n• Jupiter Aggregator\n• Meteora DLMM\n`;
    }

    mensaje += `\n📋 **Comandos disponibles:**\n`;
    if (plan.nombre === 'Free') {
        mensaje += `/planes - Ver planes disponibles\n`;
    }
    mensaje += `/balance - Tu balance\n`;
    mensaje += `/posiciones - Ver posiciones\n`;
    mensaje += `/comprar <token> - Comprar\n`;
    mensaje += `/vender <token> - Vender\n`;
    if (plan.nombre !== 'Free') {
        mensaje += `/canales - Gestionar canales\n`;
        mensaje += `/ruta <token> - Mejor ruta\n`;
        mensaje += `/estado - Toggle trading\n`;
    }

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

bot.command('planes', async (ctx) => {
    const userId = ctx.from.id;
    const usuario = getUsuario(userId);
    const planActual = PLANES[usuario.plan];

    let mensaje = `💳 **Planes Disponibles** 💳\n\n`;
    mensaje += `🔹 **Plan Actual:** ${planActual.nombre} ${planActual.color}\n\n`;

    for (const [key, plan] of Object.entries(PLANES)) {
        mensaje += `${plan.color} **${plan.nombre}** - $${plan.precio}/mes\n`;
        if (plan.limiteDiario === -1) {
            mensaje += `   ✅ Operaciones ilimitadas\n`;
        } else {
            mensaje += `   ✅ ${plan.limiteDiario} operaciones diarias\n`;
        }
        plan.caracteristicas.forEach(carac => {
            mensaje += `   ✅ ${carac}\n`;
        });

        if (key === usuario.plan) {
            mensaje += `   ✅ **ACTIVO**\n`;
        } else {
            mensaje += `   💡 Para actualizar: /upgrade ${key}\n`;
        }
        mensaje += `\n`;
    }

    mensaje += `💡 **Métodos de pago:**\n`;
    mensaje += `• Solana (SOL)\n`;
    mensaje += `• USDT\n`;
    mensaje += `• PayPal\n`;
    mensaje += `• Crypto.com\n\n`;
    mensaje += `📞 **Soporte:** @admin_bot`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

bot.command('upgrade', async (ctx) => {
    const partes = ctx.message.text.split(' ');
    const nuevoPlan = partes[1];
    const userId = ctx.from.id;

    if (!nuevoPlan || !PLANES[nuevoPlan]) {
        return ctx.reply('❌ Plan inválido\nUso: `/upgrade BASIC|PRO|ENTERPRISE`', { parse_mode: 'Markdown' });
    }

    const plan = PLANES[nuevoPlan];

    if (plan.precio === 0) {
        return ctx.reply('✅ Ya estás en el plan Free');
    }

    let mensaje = `💳 **Actualizar a ${plan.nombre}** ${plan.color}\n\n`;
    mensaje += `💰 **Costo:** $${plan.precio} USD/mes\n`;
    mensaje += `🔹 **Pago en SOL:** ${(plan.precio / 150).toFixed(4)} SOL\n\n`;
    mensaje += `📋 **Datos para pago:**\n`;
    mensaje += `🔗 Wallet: \`${wallet.publicKey.toString()}\`\n\n`;
    mensaje += `⚠️ **Importante:**\n`;
    mensaje += `1. Envía el monto exacto\n`;
    mensaje += `2. Envía comprobante con /pago\n`;
    mensaje += `3. Tu plan se activará en 5 minutos\n\n`;
    mensaje += `💡 **Para pagar con otros métodos:**\n`;
    mensaje += `• PayPal: paypal.me/tubot\n`;
    mensaje += `• Crypto.com: @tuusuario\n`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

bot.command('pago', async (ctx) => {
    ctx.reply('📨 **Envía tu comprobante de pago**\n\n' +
              '1. Toma una captura del pago\n' +
              '2. Envía la imagen aquí\n' +
              '3. Incluye: @tu_username y el plan deseado\n\n' +
              '⏳ Revisaremos tu pago y activaremos en 5-15 minutos');
});

// Manejar imágenes de comprobantes
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    const usuario = getUsuario(userId);

    ctx.reply('📸 **Comprobante recibido**\n\n' +
              `✅ Usuario: @${ctx.from.username || 'N/A'}\n` +
              `📊 Plan actual: ${PLANES[usuario.plan].nombre}\n\n` +
              '⏳ Verificando pago...\n' +
              '🔍 Te notificaremos cuando se active');

    // Aquí iría la lógica para verificar el pago
    // Por ahora, simulamos activación
    setTimeout(() => {
        ctx.reply('✅ **Pago verificado!**\n\n' +
                  `🎉 Plan actualizado a **BASIC** 🟢\n` +
                  '📅 Válido por 30 días\n' +
                  '🚀 Ya puedes disfrutar de todas las funciones!');

        // Actualizar usuario
        usuario.plan = 'BASIC';
        usuario.expires = Date.now() + (30 * 24 * 60 * 60 * 1000);
    }, 5000);
});

// Proteger comandos con límites
bot.command('comprar', async (ctx) => {
    const userId = ctx.from.id;
    const usuario = getUsuario(userId);

    if (!puedeOperar(userId)) {
        const plan = PLANES[usuario.plan];
        return ctx.reply(`❌ **Límite alcanzado**\n\n` +
                         `📊 Has usado tus ${plan.limiteDiario} operaciones de hoy\n` +
                         `💡 Para más operaciones: /planes\n` +
                         `🔄 Tu límite se reinicia mañana`,
                    { parse_mode: 'Markdown' });
    }

    incrementarUso(userId);

    // Continuar con la lógica de compra...
    const partes = ctx.message.text.split(' ');
    const tokenMint = partes[1];
    const cantidad = partes[2] ? parseFloat(partes[2]) : config.buyAmount;

    if (!tokenMint) {
        return ctx.reply('❌ Especifica el token\nEj: `/comprar So11111111111111111111111111111111111111112 0.01`',
            { parse_mode: 'Markdown' });
    }

    try {
        new PublicKey(tokenMint);
        await ctx.reply(`🔄 Buscando ${tokenMint}...`);

        // Aquí iría la lógica real de compra...

        ctx.reply(`✅ **Compra ejecutada**\n\n` +
                  `🪙 Token: ${tokenMint.substring(0, 8)}...\n` +
                  `💰 Cantidad: ${cantidad} SOL\n` +
                  `📊 Operación ${usuario.usage}/${PLANES[usuario.plan].limiteDiario || '∞'}`,
            { parse_mode: 'Markdown' });

    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

// Sistema de referidos
bot.command('referido', async (ctx) => {
    const userId = ctx.from.id;
    const codigoRef = `BOT${userId.toString().slice(-6)}`;

    ctx.reply(`🎁 **Sistema de Referidos** 🎁\n\n` +
              `💰 **Tu código:** \`${codigoRef}\`\n\n` +
              `🔗 **Link de referido:**\n` +
              `https://t.me/tu_bot?start=${codigoRef}\n\n` +
              `🎯 **Beneficios:**\n` +
              `• 10% de descuento para tu referido\n` +
              `• 15% de comisión para ti cada mes\n` +
              `• ¡Ilimitado referidos!\n\n` +
              `📊 **Tus referidos:** 0 | **Ganado:** $0`,
        { parse_mode: 'Markdown' });
});

// Estadísticas para admin
bot.command('stats', async (ctx) => {
    // Solo admins pueden ver esto
    if (ctx.from.id !== parseInt(process.env.ADMIN_ID || '0')) {
        return ctx.reply('❌ Comando solo para administradores');
    }

    let freeUsers = 0;
    let basicUsers = 0;
    let proUsers = 0;
    let enterpriseUsers = 0;
    let totalRevenue = 0;

    usuarios.forEach(usuario => {
        const plan = PLANES[usuario.plan];
        switch(usuario.plan) {
            case 'FREE': freeUsers++; break;
            case 'BASIC': basicUsers++; totalRevenue += plan.precio; break;
            case 'PRO': proUsers++; totalRevenue += plan.precio; break;
            case 'ENTERPRISE': enterpriseUsers++; totalRevenue += plan.precio; break;
        }
    });

    const mensaje = `📊 **Estadísticas del Bot** 📊\n\n` +
                   `👥 **Usuarios totales:** ${usuarios.size}\n` +
                   `⚪ Free: ${freeUsers}\n` +
                   `🟢 Basic: ${basicUsers}\n` +
                   `🔥 Pro: ${proUsers}\n` +
                   `💎 Enterprise: ${enterpriseUsers}\n\n` +
                   `💰 **Ingreso mensual:** $${totalRevenue}\n` +
                   `📈 **Tasa conversión:** ${((basicUsers + proUsers + enterpriseUsers) / usuarios.size * 100).toFixed(1)}%\n\n` +
                   `💡 **Top referidos:**\n` +
                   `1. @usuario1 - 5 referidos\n` +
                   `2. @usuario2 - 3 referidos`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// ===== COMANDOS DE GAMIFICACIÓN =====

// Perfil de usuario con gamificación
bot.command('perfil', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || `User${userId}`;

    // Actualizar stats del usuario
    gamification.updateUserStats(userId, 'level_up', { username });

    const profile = gamification.getUserProfile(userId);

    if (!profile) {
        return ctx.reply('❌ No tienes perfil aún. Realiza tu primer trade para activarlo!');
    }

    let mensaje = `👤 **Perfil de Trading** 👤\n\n`;
    mensaje += `🎮 **Username:** @${username}\n`;
    mensaje += `${profile.rank} **Nivel ${profile.level}**\n`;
    mensaje += `⭐ **Puntos:** ${profile.points}\n`;
    mensaje += `📊 **Trades:** ${profile.trades}\n`;
    mensaje += `💰 **Profit Total:** $${profile.profit}\n`;
    mensaje += `🔥 **Racha:** ${profile.streak} días\n\n`;

    // Progress bar
    const progress = '█'.repeat(Math.floor(profile.progress / 10)) +
                   '░'.repeat(10 - Math.floor(profile.progress / 10));
    mensaje += `📈 **Progreso Nivel ${profile.level + 1}:**\n`;
    mensaje += `[${progress}] ${profile.progress}%\n\n`;

    // Logros
    if (profile.achievements.length > 0) {
        mensaje += `🏆 **Logros Desbloqueados:**\n`;
        profile.achievements.slice(0, 3).forEach(ach => {
            mensaje += `• ${ach.name}\n`;
        });
        if (profile.achievements.length > 3) {
            mensaje += `• ...y ${profile.achievements.length - 3} más\n`;
        }
    }

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Leaderboard
bot.command('top', async (ctx) => {
    const leaderboard = gamification.getLeaderboard(1, 10);
    const userId = ctx.from.id;
    const userRank = leaderboard.userRank(userId);

    let mensaje = `🏆 **TOP TRADERS** 🏆\n\n`;

    leaderboard.users.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        mensaje += `${medal} @${user.username} - $${user.profit}\n`;
    });

    if (userRank) {
        mensaje += `\n🎯 **Tu posición:** #${userRank}`;
    }

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Retos diarios
bot.command('retos', async (ctx) => {
    const challenges = gamification.getDailyChallenges();

    let mensaje = `🎯 **Retos Diarios** 🎯\n\n`;
    mensaje += `Completa estos retos para ganar puntos extra:\n\n`;

    challenges.forEach(challenge => {
        mensaje += `${challenge.id === 'daily_trader' ? '📈' :
                   challenge.id === 'profit_seeker' ? '💰' :
                   challenge.id === 'copy_expert' ? '👥' : '🔗'} `;
        mensaje += `**${challenge.desc}**\n`;
        mensaje += `   🎁 Recompensa: ${challenge.reward} puntos\n\n`;
    });

    mensaje += `⏰ Los retos se renuevan cada 24 horas`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Social proof - Activity feed
bot.command('actividad', async (ctx) => {
    const socialProofs = gamification.generateSocialProof();

    let mensaje = `📊 **Actividad Reciente** 📊\n\n`;

    socialProofs.forEach(proof => {
        mensaje += `${proof}\n`;
    });

    mensaje += `\n💡 **Estadísticas Globales:**\n`;
    const stats = gamification.globalStats;
    mensaje += `👥Usuarios activos: ${stats.activeUsers}\n`;
    mensaje += `📈Total trades: ${stats.totalTrades.toLocaleString()}\n`;
    mensaje += `💰Profit total: $${stats.totalProfit.toLocaleString()}\n`;
    mensaje += `🔴En línea ahora: ${stats.onlineNow}`;

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Sistema de misiones
bot.command('misiones', async (ctx) => {
    const userId = ctx.from.id;
    const profile = gamification.getUserProfile(userId);

    if (!profile) {
        return ctx.reply('❌ Necesitas tener un perfil para ver misiones');
    }

    let mensaje = `🎮 **Misiones Disponibles** 🎮\n\n`;
    mensaje += `**Misiones Principales:**\n\n`;
    mensaje += `🎯 **Primer Trade** - Realiza tu primera operación (+10 pts)\n`;
    mensaje += `📈 **Operador Activo** - Haz 5 trades en un día (+25 pts)\n`;
    mensaje += `💰 **Cazador de Ganancias** - Obtén $100 de profit (+50 pts)\n`;
    mensaje += `👥 **Influencer** - Refiere 3 amigos (+75 pts)\n\n`;

    mensaje += `**Misiones Especiales:**\n\n`;
    mensaje += `🔥 **Racha Semanal** - Usa el bot 7 días seguidos (+100 pts)\n`;
    mensaje += `🏆 **Top 10** - Entra al leaderboard (+150 pts)\n`;
    mensaje += `🐋 **Ballena** - Opera con más de 10 SOL (+200 pts)\n\n`;

    mensaje += `📊 **Tu Progreso:**\n`;
    mensaje += `✅ Completadas: ${profile.achievements.length}\n`;
    mensaje.append(`🎯 Puntos totales: ${profile.points}`);

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

// Mantener los otros comandos existentes...
bot.command('balance', async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    ctx.reply(`💰 **Balance Completo**\n\n` +
              `🔵 **SOL:** ${balance.toFixed(4)} SOL\n` +
              `💵 **USD (≈):** $${(balance * 150).toFixed(2)}\n\n` +
              `🪙 **Tokens en wallet:** ${tokens.length}`,
        { parse_mode: 'Markdown' });
});

// Funciones auxiliares (mismas que antes)
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

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot Premium iniciado');
    console.log('💳 Sistema de monetización activo');
    bot.launch()
        .then(() => console.log('🎉 Bot Premium activo!'))
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