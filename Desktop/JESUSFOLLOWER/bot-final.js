require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, ComputeBudgetProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createCloseAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');
const https = require('https');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido en .env');
    process.exit(1);
}

console.log('🚀 Iniciando Bot de Trading Mejorado...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    rpcUrls: [
        process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
        'https://api.mainnet-beta.solana.com',
        'https://solana-mainnet.rpc.extrnode.com',
        'https://rpc.ankr.com/solana'
    ],
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.01,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    jupiterUrls: [
        'https://quote-api.jup.ag/v6',
        'https://jupiter-api.mainnet.wen.ws',
        'https://legend.jupiter.ag/api/v6'
    ],
    raydiumUrl: 'https://quote-api.raydium.io/v2',
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    minimaLiquidez: parseFloat(process.env.MIN_LIQUIDEZ) || 10000
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection = null;
let wallet = null;
let modoTrading = true;
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();

// Agente https para evitar problemas DNS
const httpsAgent = new https.Agent({
    keepAlive: true,
    timeout: 30000,
    family: 4
});

// Axios instance con retry
const axiosInstance = axios.create({
    timeout: 30000,
    httpsAgent: httpsAgent,
    validateStatus: null
});

// Intentar conexión RPC con fallbacks
async function conectarRPC() {
    for (const rpcUrl of config.rpcUrls) {
        try {
            console.log(`🔄 Probando RPC: ${rpcUrl.split('?')[0]}`);
            connection = new Connection(rpcUrl, {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                httpHeaders: {
                    'User-Agent': 'Solana-Web3-JavaScript/1.91.9'
                }
            });

            wallet = Keypair.fromSecretKey(bs58.decode(config.walletPrivateKey));

            // Probar conexión
            const slot = await connection.getSlot();
            const balance = await connection.getBalance(wallet.publicKey);

            console.log(`✅ RPC conectado: ${rpcUrl.split('?')[0]}`);
            console.log(`💰 Wallet: ${wallet.publicKey.toString()}`);
            console.log(`🔵 Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
            console.log(`📍 Slot actual: ${slot}`);

            return true;
        } catch (error) {
            console.error(`❌ Error RPC ${rpcUrl.split('?')[0]}: ${error.message}`);
        }
    }
    return false;
}

// Ejecutar swap con Jupiter con fallbacks
async function ejecutarSwapJupiter(inputMint, outputMint, amount) {
    for (const jupiterUrl of config.jupiterUrls) {
        try {
            console.log(`🔄 Probando Jupiter API: ${jupiterUrl}`);

            // Obtener quote
            const quoteResponse = await axiosInstance.get(`${jupiterUrl}/quote`, {
                params: {
                    inputMint,
                    outputMint,
                    amount: Math.floor(amount * LAMPORTS_PER_SOL),
                    slippageBps: config.slippage * 100,
                    feeBps: 100, // Fee de 0.1%
                    maxAccounts: 64
                }
            });

            const quote = quoteResponse.data;

            if (!quote || quote.error) {
                throw new Error(quote?.error || 'Respuesta inválida de quote');
            }

            console.log(`💰 Quote: ${quote.outAmount} tokens (${quote.priceImpactPct}% impact)`);

            // Construir transacción
            const swapResponse = await axiosInstance.post(`${jupiterUrl}/swap`, {
                quoteResponse: quote,
                userPublicKey: wallet.publicKey.toString(),
                wrapAndUnwrapSol: true,
                useSharedAccounts: true,
                prioritizationFeeLamports: {
                    priorityLevel: 'high'
                }
            });

            const swapTransaction = swapResponse.data.swapTransaction;

            // Deserializar y firmar
            const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));

            // Añadir compute budget
            const computeUnits = 200000;
            const prioritizationFee = 5000;

            transaction.add(
                ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: prioritizationFee })
            );

            // Obtener blockhash reciente
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // Firmar transacción
            transaction.sign(wallet);

            // Enviar transacción
            console.log('📤 Enviando transacción...');
            const signature = await connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: true,
                maxRetries: 3
            });

            console.log(`⏳ Confirmando transacción: https://solscan.io/tx/${signature}`);

            // Confirmar transacción
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error(`Transacción fallida: ${JSON.stringify(confirmation.value.err)}`);
            }

            return {
                success: true,
                signature,
                inputAmount: amount,
                outputAmount: quote.outAmount / Math.pow(10, quote.outputDecimals || 6),
                priceImpact: parseFloat(quote.priceImpactPct) || 0
            };

        } catch (error) {
            console.error(`❌ Error con ${jupiterUrl}: ${error.message}`);
            continue;
        }
    }

    throw new Error('Todos los endpoints de Jupiter fallaron');
}

// Swap alternativo con Raydium
async function ejecutarSwapRaydium(inputMint, outputMint, amount) {
    try {
        console.log('🔄 Probando swap con Raydium...');

        // Para Raydium necesitamos diferentes endpoints ya que no tiene una API directa como Jupiter
        // Por ahora retornamos error para que intente con Jupiter de nuevo
        throw new Error('Raydium swap no implementado - use Jupiter');

    } catch (error) {
        throw error;
    }
}

// Comprar token
async function comprarToken(tokenMint, cantidadSOL = config.buyAmount) {
    try {
        console.log(`\n🟢 COMPRA: ${tokenMint}`);
        console.log(`💰 Cantidad: ${cantidadSOL} SOL`);

        // Verificar balance
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

        if (balanceSOL < cantidadSOL + 0.01) { // Dejar 0.01 SOL para fees
            throw new Error(`Balance insuficiente. Tienes ${balanceSOL.toFixed(4)} SOL (necesitas ${cantidadSOL + 0.01} SOL)`);
        }

        // SOL mint
        const solMint = 'So11111111111111111111111111111111111111112';

        // Intentar swap con Jupiter primero
        try {
            const resultado = await ejecutarSwapJupiter(solMint, tokenMint, cantidadSOL);

            if (resultado.success) {
                // Guardar posición
                posiciones.set(tokenMint, {
                    tokenMint,
                    cantidadTokens: resultado.outputAmount,
                    precioEntrada: cantidadSOL / resultado.outputAmount,
                    invertido: cantidadSOL,
                    timestamp: new Date(),
                    ventas: [],
                    estado: 'activa',
                    signature: resultado.signature
                });

                console.log(`✅ Compra exitosa: ${resultado.outputAmount.toFixed(4)} tokens`);
                console.log(`🔗 https://solscan.io/tx/${resultado.signature}`);
                return resultado;
            }
        } catch (jupiterError) {
            console.error('❌ Jupiter falló:', jupiterError.message);

            // Intentar con Raydium como fallback
            try {
                const resultado = await ejecutarSwapRaydium(solMint, tokenMint, cantidadSOL);
                return resultado;
            } catch (raydiumError) {
                throw new Error(`Jupiter: ${jupiterError.message}\nRaydium: ${raydiumError.message}`);
            }
        }

    } catch (error) {
        console.error(`❌ Error comprando ${tokenMint}:`, error.message);
        throw error;
    }
}

// Vender token
async function venderToken(tokenMint, porcentaje = 1) {
    try {
        const posicion = posiciones.get(tokenMint);
        if (!posicion || posicion.cantidadTokens <= 0) {
            throw new Error('No hay tokens para vender');
        }

        console.log(`\n🔴 VENTA: ${tokenMint}`);
        console.log(`📊 Porcentaje: ${(porcentaje * 100).toFixed(0)}%`);

        const tokensAVender = posicion.cantidadTokens * porcentaje;
        const tokenMintPubkey = new PublicKey(tokenMint);

        // Obtener cuenta de token asociada
        const ata = await getAssociatedTokenAddress(tokenMintPubkey, wallet.publicKey);

        // Obtener balance del token
        const tokenBalance = await connection.getTokenAccountBalance(ata);
        const balanceTokens = parseFloat(tokenBalance.value.uiAmount);

        if (balanceTokens < tokensAVender) {
            throw new Error(`Balance insuficiente. Tienes ${balanceTokens.toFixed(4)} tokens`);
        }

        // Ejecutar swap a SOL
        const resultado = await ejecutarSwapJupiter(tokenMint, 'So11111111111111111111111111111111111111112', balanceTokens * porcentaje);

        if (resultado.success) {
            // Actualizar posición
            posicion.cantidadTokens -= tokensAVender;
            posicion.ventas.push({
                timestamp: new Date(),
                cantidadVendida: tokensAVender,
                valorSOL: resultado.outputAmount,
                porcentaje,
                signature: resultado.signature
            });

            if (posicion.cantidadTokens <= 0.001) {
                posicion.estado = 'cerrada';
            }

            console.log(`✅ Venta exitosa: ${resultado.outputAmount.toFixed(4)} SOL`);
            return resultado;
        }

    } catch (error) {
        console.error(`❌ Error vendiendo ${tokenMint}:`, error.message);
        throw error;
    }
}

// Obtener balance
async function getBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        return balanceLamports / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error obteniendo balance:', error);
        return 0;
    }
}

// Obtener tokens
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
        console.error('Error obteniendo tokens:', error);
        return [];
    }
}

// Datos del token
async function getDatosToken(tokenMint) {
    try {
        const response = await axiosInstance.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
        const pairs = response.data.pairs;

        if (pairs && pairs.length > 0) {
            const solanaPairs = pairs.filter(p => p.chainId === 'solana');
            if (solanaPairs.length > 0) {
                const bestPair = solanaPairs.reduce((best, current) =>
                    (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
                );

                return {
                    price: parseFloat(bestPair.priceUsd) || 0,
                    liquidity: bestPair.liquidity?.usd || 0,
                    volume24h: bestPair.volume?.h24 || 0,
                    priceChange24h: bestPair.priceChange?.h24 || 0,
                    fdv: bestPair.fdv || 0,
                    pairAddress: bestPair.pairAddress,
                    dexId: bestPair.dexId
                };
            }
        }
    } catch (error) {
        console.error('Error datos token:', error.message);
    }
    return null;
}

// Extraer dirección
function extraerDireccion(texto) {
    const regex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    const matches = texto.match(regex);

    for (const match of matches) {
        try {
            new PublicKey(match);
            return match;
        } catch (e) {}
    }
    return null;
}

// COMANDOS DEL BOT

bot.start(async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    ctx.reply(`🤖 **Bot de Trading - Mainnet** 🔥

💰 **Balance:** ${balance.toFixed(4)} SOL
🪙 **Tokens:** ${tokens.length} diferentes
📊 **Posiciones:** ${posiciones.size} abiertas
🔥 **Estado:** ${modoTrading ? 'ACTIVO' : 'PAUSADO'}
📡 **Canales:** ${Array.from(canales).map(c => '@' + c).join(', ')}

📋 **Comandos:**
/start - Menú principal
/balance - Balance detallado
/posiciones - Ver posiciones
/comprar <token> [cantidad] - Comprar
/vender <token> [porcentaje] - Vender
/canales - Gestionar canales
/estado - Toggle trading
/ayuda - Ayuda`,
    { parse_mode: 'Markdown' });
});

bot.command('balance', async (ctx) => {
    const balance = await getBalance();
    const tokens = await getTokens();

    let msg = `💰 **Balance Completo**\n\n`;
    msg += `🔵 **SOL:** ${balance.toFixed(4)} SOL\n`;
    msg += `💵 **USD (≈):** $${(balance * 150).toFixed(2)}\n\n`;

    if (tokens.length > 0) {
        msg += `🪙 **Tokens (${tokens.length}):**\n`;
        for (const token of tokens.slice(0, 10)) {
            msg += `• \`${token.mint.substring(0, 8)}...\` - ${token.amount.toFixed(4)}\n`;
        }
    }

    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('comprar', async (ctx) => {
    const partes = ctx.message.text.split(' ');
    const tokenMint = partes[1];
    const cantidad = partes[2] ? parseFloat(partes[2]) : config.buyAmount;

    if (!tokenMint) {
        return ctx.reply('❌ Especifica el token\nEj: `/comprar So11111111111111111111111111111111111111112 0.05`',
            { parse_mode: 'Markdown' });
    }

    try {
        new PublicKey(tokenMint);
        await ctx.reply(`🔄 Analizando ${tokenMint}...`);

        // Verificar datos del token primero
        const datos = await getDatosToken(tokenMint);
        if (datos && datos.liquidez < config.minimaLiquidez) {
            return ctx.reply(`⚠️ Liquidez baja: $${datos.liquidity.toLocaleString()}\nMínimo: $${config.minimaLiquidez.toLocaleString()}`);
        }

        await ctx.reply(`🔄 Comprando ${cantidad} SOL de ${tokenMint}...`);

        const resultado = await comprarToken(tokenMint, cantidad);

        if (resultado.success) {
            ctx.reply(`✅ **Compra Exitosa!**\n\n` +
                      `🪙 Tokens: ${resultado.outputAmount.toFixed(4)}\n` +
                      `💸 SOL gastado: ${cantidad}\n` +
                      `📊 Price Impact: ${resultado.priceImpact.toFixed(2)}%\n` +
                      `🔗 [Ver en Solscan](https://solscan.io/tx/${resultado.signature})`,
                { parse_mode: 'Markdown' });
        }

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
        await ctx.reply(`🔄 Vendiendo ${(porcentaje * 100).toFixed(0)}% de ${tokenMint}...`);

        const resultado = await venderToken(tokenMint, porcentaje);

        if (resultado.success) {
            ctx.reply(`✅ **Venta Exitosa!**\n\n` +
                      `💰 SOL recibido: ${resultado.outputAmount.toFixed(4)}\n` +
                      `📊 Price Impact: ${resultado.priceImpact.toFixed(2)}%\n` +
                      `🔗 [Ver en Solscan](https://solscan.io/tx/${resultado.signature})`,
                { parse_mode: 'Markdown' });
        }

    } catch (error) {
        ctx.reply(`❌ Error: ${error.message}`);
    }
});

bot.command('posiciones', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones abiertas');
    }

    let msg = `📊 **Posiciones Abiertas (${posiciones.size})**\n\n`;

    for (const [tokenMint, pos] of posiciones) {
        const datos = await getDatosToken(tokenMint);
        const precioActual = datos ? datos.price : 0;
        const valorActual = precioActual * pos.cantidadTokens;
        const pnl = valorActual - pos.invertido;
        const pnlPorcentaje = ((pnl / pos.invertido) * 100).toFixed(2);

        msg += `🪙 \`${tokenMint.substring(0, 8)}...\`\n`;
        msg += `💰 Cantidad: ${pos.cantidadTokens.toFixed(4)}\n`;
        msg += `💵 Valor: $${valorActual.toFixed(2)}\n`;
        msg += `📈 PnL: ${pnl >= 0 ? '🟢' : '🔴'} $${pnl.toFixed(2)} (${pnlPorcentaje}%)\n\n`;
    }

    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('canales', (ctx) => {
    const partes = ctx.message.text.split(' ');
    const accion = partes[1];

    if (!accion) {
        ctx.reply(`📡 **Canales:**\n\n${Array.from(canales).map(c => `• @${c}`).join('\n')}\n\n` +
                  `📋 _Comandos:_\n/canales agregar @nombre\n/canales quitar @nombre`,
            { parse_mode: 'Markdown' });
        return;
    }

    if (accion === 'agregar' && partes[2]) {
        const canal = partes[2].replace('@', '');
        canales.add(canal);
        ctx.reply(`✅ Canal @${canal} agregado`);
    } else if (accion === 'quitar' && partes[2]) {
        const canal = partes[2].replace('@', '');
        if (canales.delete(canal)) {
            ctx.reply(`✅ Canal @${canal} eliminado`);
        } else {
            ctx.reply(`❌ Canal @${canal} no encontrado`);
        }
    }
});

bot.command('estado', (ctx) => {
    modoTrading = !modoTrading;
    ctx.reply(`🔔 **Trading ${modoTrading ? 'ACTIVADO' : 'PAUSADO'}**`,
        { parse_mode: 'Markdown' });
});

bot.command('ayuda', (ctx) => {
    ctx.reply(`🆘 **Ayuda**\n\n` +
              `📋 **Comandos:**\n` +
              `/start - Menú principal\n` +
              `/balance - Balance completo\n` +
              `/posiciones - Posiciones abiertas\n` +
              `/comprar <token> [cantidad] - Comprar\n` +
              `/vender <token> [porcentaje] - Vender\n` +
              `/canales - Gestionar canales\n` +
              `/estado - Toggle trading\n\n` +
              `⚙️ **Config:**\n` +
              `• Buy: ${config.buyAmount} SOL\n` +
              `• Slippage: ${config.slippage}%\n` +
              `• Min liq: $${config.minimaLiquidez.toLocaleString()}\n\n` +
              `⚠️ **Dinero REAL - Usa con cuidado**`,
        { parse_mode: 'Markdown' });
});

// Monitoreo de canales
bot.on('text', async (ctx) => {
    if (!modoTrading) return;

    const username = ctx.chat.username;
    if (!username || !canales.has(username)) return;

    const tokenMint = extraerDireccion(ctx.message.text);

    if (tokenMint && !posiciones.has(tokenMint)) {
        console.log(`🎯 Token detectado: ${tokenMint}`);

        const datos = await getDatosToken(tokenMint);
        if (!datos) return;

        if (datos.liquidez >= config.minimaLiquidez) {
            try {
                ctx.reply(`🚀 **Llamada detectada!**\n\n` +
                          `🪙 Token: \`${tokenMint}\`\n` +
                          `💰 Precio: $${datos.price}\n` +
                          `💧 Liquidez: $${datos.liquidity.toLocaleString()}\n\n` +
                          `⏳ Ejecutando compra...`,
                    { parse_mode: 'Markdown' });

                const resultado = await comprarToken(tokenMint);

                if (resultado.success) {
                    ctx.reply(`✅ **Compra Ejecutada!**\n\n` +
                              `🪙 Tokens: ${resultado.outputAmount.toFixed(4)}\n` +
                              `💸 SOL: ${config.buyAmount}\n` +
                              `🔗 [Tx](https://solscan.io/tx/${resultado.signature})`,
                        { parse_mode: 'Markdown' });
                }
            } catch (error) {
                ctx.reply(`❌ Error: ${error.message}`);
            }
        }
    }
});

// Inicializar
async function iniciar() {
    const conectado = await conectarRPC();
    if (!conectado) {
        console.error('❌ No se pudo conectar a ningún RPC');
        process.exit(1);
    }

    console.log('✅ Bot listo para trading');
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