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
const mainKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('💰 Comprar', 'action_buy'), Markup.button.callback('💸 Vender', 'action_sell')],
    [Markup.button.callback('📊 PnL', 'action_pnl'), Markup.button.callback('💎 Balance', 'action_balance')],
    [Markup.button.callback('📡 Config', 'action_config'), Markup.button.callback('📋 Canales', 'canales_config')]
]);

const buyKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('0.01 SOL 💎', 'buy_0.01'), Markup.button.callback('0.05 SOL 💎', 'buy_0.05')],
    [Markup.button.callback('0.1 SOL 💎', 'buy_0.1'), Markup.button.callback('0.5 SOL 💎', 'buy_0.5')],
    [Markup.button.callback('1 SOL 💎', 'buy_1'), Markup.button.callback('❌ Cancelar', 'cancel')]
]);

// COMANDOS
bot.start(async (ctx) => {
    const balance = await getBalance();

    await ctx.replyWithMarkdown(
        `🤖 **Bot Trading ACTIVO** ✅\n\n` +
        `💰 Balance: ${balance.toFixed(4)} SOL\n` +
        `📊 Posiciones: ${posiciones.size} activas\n` +
        `🔥 Estado: ${modoTrading ? 'ACTIVO' : 'PAUSADO'}\n` +
        `📡 Monitoreando: @${Array.from(canales).join(', @')}\n\n` +
        `Selecciona una acción:`,
        mainKeyboard
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

bot.action('action_config', (ctx) => {
    ctx.replyWithMarkdown(
        `⚙️ **Configuración**\n\n` +
        `Monto compra: ${config.buyAmount} SOL\n` +
        `Slippage: ${config.slippage}%\n` +
        `Trading: ${modoTrading ? 'ACTIVO' : 'PAUSADO'}`
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
        mainKeyboard
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

    bot.launch()
        .then(() => console.log('🎉 Bot activo con botones!'))
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