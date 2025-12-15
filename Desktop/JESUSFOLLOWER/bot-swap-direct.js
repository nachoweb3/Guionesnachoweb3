require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, ComputeBudgetProgram, SystemProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot con Swap Directo...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.01,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    raydiumProgramId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection, wallet;
let modoTrading = true;
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();

// Inicializar conexión
async function inicializar() {
    try {
        connection = new Connection(config.rpcUrl, 'confirmed');
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

// Buscar pools en Raydium
async function findRaydiumPool(tokenMint) {
    try {
        console.log(`🔍 Buscando pool para ${tokenMint}`);

        // API de Raydium para buscar pools
        const response = await axios.get('https://api.raydium.io/v2/sdk/liquidity/mainnet.json', {
            timeout: 10000
        });

        const pools = response.data.official;
        const poolInfo = pools.find(pool =>
            pool.baseMint === tokenMint || pool.quoteMint === tokenMint
        );

        if (poolInfo) {
            console.log(`✅ Pool encontrado: ${poolInfo.id}`);
            return poolInfo;
        }

        // Buscar en pools no oficiales
        const unofficialPools = response.data.unofficial;
        const unofficialPool = unofficialPools.find(pool =>
            pool.baseMint === tokenMint || pool.quoteMint === tokenMint
        );

        if (unofficialPool) {
            console.log(`⚠️ Pool no oficial encontrado: ${unofficialPool.id}`);
            return unofficialPool;
        }

        return null;
    } catch (error) {
        console.error('❌ Error buscando pool:', error.message);
        return null;
    }
}

// Crear transacción de swap simple
async function createSwapTransaction(poolInfo, inputMint, outputMint, amountIn) {
    try {
        const transaction = new Transaction();

        // Calcular monto mínimo de salida con slippage
        const amountOutMin = Math.floor(amountIn * (1 - config.slippage / 100));

        // Instrucciones básicas de swap (simplificado)
        // NOTA: Esta es una versión simplificada. Un swap real requiere:
        // - Crear cuenta de token asociada si no existe
        // - Calcular las cuentas correctas del pool
        // - Firmar transacciones multi-instrucciones

        const instruction = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey('11111111111111111111111111111111'), // Placeholder
            lamports: Math.floor(amountIn * LAMPORTS_PER_SOL * 0.99) // 1% fee estimado
        });

        transaction.add(instruction);

        // Obtener blockhash reciente
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        return transaction;
    } catch (error) {
        console.error('❌ Error creando transacción:', error.message);
        return null;
    }
}

// Comprar token (versión simulada por ahora)
async function comprarToken(tokenMint, cantidadSOL = config.buyAmount) {
    try {
        console.log(`\n🟢 COMPRANDO: ${tokenMint}`);
        console.log(`💰 Cantidad: ${cantidadSOL} SOL`);

        // Verificar balance
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

        if (balanceSOL < cantidadSOL + 0.01) {
            throw new Error(`Balance insuficiente. Tienes ${balanceSOL.toFixed(4)} SOL`);
        }

        // Buscar pool
        const poolInfo = await findRaydiumPool(tokenMint);
        if (!poolInfo) {
            throw new Error('No se encontró pool de liquidez');
        }

        // Simulación de compra (temporal)
        const precioAproximado = Math.random() * 0.00001 + 0.000001;
        const tokensRecibidos = cantidadSOL / precioAproximado;

        console.log(`✅ Compra simulada exitosa`);
        console.log(`🪙 Tokens recibidos: ${tokensRecibidos.toFixed(4)}`);

        // Guardar posición
        posiciones.set(tokenMint, {
            tokenMint,
            cantidadTokens: tokensRecibidos,
            precioEntrada: precioAproximado,
            invertido: cantidadSOL,
            timestamp: new Date(),
            ventas: [],
            estado: 'activa',
            poolId: poolInfo.id
        });

        return {
            success: true,
            outputAmount: tokensRecibidos,
            priceImpact: 0.5,
            poolId: poolInfo.id
        };

    } catch (error) {
        console.error(`❌ Error comprando ${tokenMint}:`, error.message);
        throw error;
    }
}

// Vender token (versión simulada)
async function venderToken(tokenMint, porcentaje = 1) {
    try {
        const posicion = posiciones.get(tokenMint);
        if (!posicion || posicion.cantidadTokens <= 0) {
            throw new Error('No hay tokens para vender');
        }

        console.log(`\n🔴 VENDIENDO: ${tokenMint}`);
        console.log(`📊 Porcentaje: ${(porcentaje * 100).toFixed(0)}%`);

        const tokensAVender = posicion.cantidadTokens * porcentaje;
        const precioVenta = posicion.precioEntrada * (1 + Math.random() * 0.2 - 0.1); // ±10% variación
        const solRecibidos = tokensAVender * precioVenta;

        console.log(`✅ Venta simulada exitosa`);
        console.log(`💰 SOL recibidos: ${solRecibidos.toFixed(4)}`);

        // Actualizar posición
        posicion.cantidadTokens -= tokensAVender;
        posicion.ventas.push({
            timestamp: new Date(),
            cantidadVendida: tokensAVender,
            valorSOL: solRecibidos,
            porcentaje,
            precioVenta
        });

        if (posicion.cantidadTokens <= 0.001) {
            posicion.estado = 'cerrada';
        }

        return {
            success: true,
            outputAmount: solRecibidos,
            priceImpact: 0.5
        };

    } catch (error) {
        console.error(`❌ Error vendiendo ${tokenMint}:`, error.message);
        throw error;
    }
}

// Balance
async function getBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        return balanceLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        return 0;
    }
}

// Tokens
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
                    amount: info.tokenAmount.uiAmount
                });
            }
        }
        return tokens;
    } catch (error) {
        return [];
    }
}

// COMANDOS

bot.start(async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    ctx.reply(`🤖 **Bot de Trading - Modo Simulación** 🎮

💰 **Balance Real:** ${balance.toFixed(4)} SOL
🪙 **Tokens Reales:** ${tokens.length}
📊 **Posiciones Simuladas:** ${posiciones.size}
🔥 **Estado:** ${modoTrading ? 'ACTIVO' : 'PAUSADO'}
📡 **Canales:** ${Array.from(canales).map(c => '@' + c).join(', ')}

⚠️ **MODO SIMULACIÓN** - Las compras son para demostración
Las transacciones reales se implementarán cuando las APIs estén disponibles

📋 **Comandos:**
/start - Menú
/balance - Balance real
/posiciones - Posiciones
/comprar <token> - Simular compra
/vender <token> - Simular venta`,
    { parse_mode: 'Markdown' });
});

bot.command('balance', async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    let msg = `💰 **Balance Real**\n\n`;
    msg += `🔵 **SOL:** ${balance.toFixed(4)} SOL\n`;
    msg += `🪙 **Tokens:** ${tokens.length}\n\n`;

    if (tokens.length > 0) {
        msg += `**Tokens en wallet:**\n`;
        for (const token of tokens.slice(0, 5)) {
            msg += `• \`${token.mint.substring(0, 8)}...\`\n`;
        }
    }

    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('comprar', async (ctx) => {
    const partes = ctx.message.text.split(' ');
    const tokenMint = partes[1];
    const cantidad = partes[2] ? parseFloat(partes[2]) : config.buyAmount;

    if (!tokenMint) {
        return ctx.reply('❌ Especifica el token\nEj: `/comprar So11111111111111111111111111111111111111112`',
            { parse_mode: 'Markdown' });
    }

    try {
        new PublicKey(tokenMint);
        await ctx.reply(`🔄 Simulando compra de ${cantidad} SOL de ${tokenMint}...`);

        const resultado = await comprarToken(tokenMint, cantidad);

        ctx.reply(`✅ **Compra Simulada**\n\n` +
                  `🪙 Tokens: ${resultado.outputAmount.toFixed(4)}\n` +
                  `💸 SOL gastado: ${cantidad}\n` +
                  `📊 Pool ID: ${resultado.poolId}\n\n` +
                  `⚠️ Esta es una simulación - No se ejecutó transacción real`,
            { parse_mode: 'Markdown' });

    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

bot.command('vender', async (ctx) => {
    const partes = ctx.message.text.split(' ');
    const tokenMint = partes[1];
    const porcentaje = partes[2] ? parseFloat(partes[2]) / 100 : 1;

    if (!tokenMint) {
        return ctx.reply('❌ Especifica el token\nEj: `/vender So11111111111111111111111111111111111111112 50`',
            { parse_mode: 'Markdown' });
    }

    try {
        await ctx.reply(`🔄 Simulando venta de ${(porcentaje * 100).toFixed(0)}%...`);

        const resultado = await venderToken(tokenMint, porcentaje);

        ctx.reply(`✅ **Venta Simulada**\n\n` +
                  `💰 SOL recibidos: ${resultado.outputAmount.toFixed(4)}\n\n` +
                  `⚠️ Esta es una simulación - No se ejecutó transacción real`,
            { parse_mode: 'Markdown' });

    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

bot.command('posiciones', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones simuladas');
    }

    let msg = `📊 **Posiciones Simuladas (${posiciones.size})**\n\n`;

    for (const [tokenMint, pos] of posiciones) {
        msg += `🪙 \`${tokenMint.substring(0, 8)}...\`\n`;
        msg += `💰 Cantidad: ${pos.cantidadTokens.toFixed(4)}\n`;
        msg += `💸 Invertido: ${pos.invertido} SOL\n`;
        msg += `📊 Estado: ${pos.estado}\n\n`;
    }

    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('estado', (ctx) => {
    modoTrading = !modoTrading;
    ctx.reply(`🔔 **Trading ${modoTrading ? 'ACTIVADO' : 'PAUSADO'}**\n\n` +
              `⚠️ Modo simulación - APIs externas no disponibles temporalmente`,
        { parse_mode: 'Markdown' });
});

bot.command('ayuda', (ctx) => {
    ctx.reply(`🆘 **Ayuda - Modo Simulación**\n\n` +
              `El bot está operando en modo simulación porque:\n` +
              `• Las APIs de Jupiter/Raydium no están disponibles\n` +
              `• Se simulan las operaciones para demostración\n\n` +
              `📋 **Comandos:**\n` +
              `/start - Menú principal\n` +
              `/balance - Balance real de tu wallet\n` +
              `/posiciones - Posiciones simuladas\n` +
              `/comprar <token> - Simular compra\n` +
              `/vender <token> - Simular venta\n` +
              `/estado - Toggle trading\n\n` +
              `Cuando las APIs estén disponibles, se actualizará a modo real.`,
        { parse_mode: 'Markdown' });
});

// Iniciar bot
async function iniciar() {
    const conectado = await inicializar();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana');
        process.exit(1);
    }

    console.log('✅ Bot en modo simulación iniciado');
    bot.launch()
        .then(() => console.log('🎉 Bot iniciado en Telegram!'))
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