require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// Verificar configuración mínima
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido en .env');
    process.exit(1);
}

console.log('🚀 Iniciando Bot de Trading REAL en Mainnet...');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN,
    solanaRpc: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    buyAmount: parseFloat(process.env.BUY_AMOUNT) || 0.01,
    slippage: parseFloat(process.env.SLIPPAGE) || 10,
    jupiterApi: 'https://quote-api.jup.ag/v6',
    canalesMonitorear: (process.env.CANALES || 'cryptoyeezuscalls').split(',').map(c => c.trim()),
    minimaLiquidez: parseFloat(process.env.MIN_LIQUIDEZ) || 10000
};

// Estado global
const bot = new Telegraf(config.botToken);
let connection, wallet;
let modoTrading = true; // Activado por defecto
let canales = new Set(config.canalesMonitorear);
const posiciones = new Map();
let balance = null;

// Inicializar conexión a Solana
async function inicializarSolana() {
    try {
        connection = new Connection(config.solanaRpc, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });
        wallet = Keypair.fromSecretKey(bs58.decode(config.walletPrivateKey));

        const balanceLamports = await connection.getBalance(wallet.publicKey);
        balance = balanceLamports / LAMPORTS_PER_SOL;

        console.log(`✅ Conectado a Solana Mainnet`);
        console.log(`💰 Wallet: ${wallet.publicKey.toString()}`);
        console.log(`🔵 Balance: ${balance.toFixed(4)} SOL`);
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Solana:', error.message);
        return false;
    }
}

// Función para obtener balance actualizado
async function actualizarBalance() {
    try {
        const balanceLamports = await connection.getBalance(wallet.publicKey);
        balance = balanceLamports / LAMPORTS_PER_SOL;
        return balance;
    } catch (error) {
        console.error('Error actualizando balance:', error);
        return balance;
    }
}

// Función para obtener token accounts
async function getTokenAccounts() {
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

// Ejecutar swap con Jupiter
async function ejecutarSwap(inputMint, outputMint, amount) {
    try {
        console.log(`🔄 Ejecutando swap: ${amount} ${inputMint} → ${outputMint}`);

        // Obtener quote
        const quote = await axios.get(`${config.jupiterApi}/quote`, {
            params: {
                inputMint,
                outputMint,
                amount: Math.floor(amount * LAMPORTS_PER_SOL),
                slippageBps: config.slippage * 100,
                feeAccount: wallet.publicKey.toString()
            }
        });

        const quoteData = quote.data;
        console.log(`💰 Quote recibido: ${quoteData.outAmount} tokens`);

        // Construir transacción
        const swapResponse = await axios.post(`${config.jupiterApi}/swap`, {
            quoteResponse: quoteData,
            userPublicKey: wallet.publicKey.toString(),
            wrapAndUnwrapSol: true,
            useSharedAccounts: true,
            computeUnitPriceMicroLamports: 5000
        });

        const swapTransaction = swapResponse.data.swapTransaction;

        // Deserializar y firmar
        const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));

        // Obtener blockhash reciente
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;

        // Firmar transacción
        transaction.sign(wallet);

        // Enviar transacción
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 3
        });

        // Confirmar transacción
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
            throw new Error(`Transacción fallida: ${confirmation.value.err}`);
        }

        console.log(`✅ Swap exitoso: https://solscan.io/tx/${signature}`);
        return {
            success: true,
            signature,
            inputAmount: amount,
            outputAmount: quoteData.outAmount / Math.pow(10, quoteData.outputDecimals)
        };

    } catch (error) {
        console.error('❌ Error en swap:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Comprar token
async function comprarToken(tokenMint, cantidadSOL = config.buyAmount) {
    try {
        console.log(`\n🟢 INICIANDO COMPRA: ${tokenMint}`);
        console.log(`💰 Cantidad: ${cantidadSOL} SOL`);

        // Verificar balance
        await actualizarBalance();
        if (balance < cantidadSOL) {
            throw new Error(`Balance insuficiente. Tienes ${balance.toFixed(4)} SOL`);
        }

        // SOL mint
        const solMint = 'So11111111111111111111111111111111111111112';

        // Ejecutar swap
        const resultado = await ejecutarSwap(solMint, tokenMint, cantidadSOL);

        if (resultado.success) {
            // Guardar posición
            posiciones.set(tokenMint, {
                tokenMint,
                cantidadTokens: resultado.outputAmount,
                precioEntrada: cantidadSOL / resultado.outputAmount,
                invertido: cantidadSOL,
                timestamp: new Date(),
                ventas: [],
                estado: 'activa'
            });

            console.log(`✅ Compra exitosa: ${resultado.outputAmount.toFixed(4)} tokens`);
            return resultado;
        } else {
            throw new Error(resultado.error);
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

        console.log(`\n🔴 INICIANDO VENTA: ${tokenMint}`);
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
        const resultado = await ejecutarSwap(tokenMint, 'So11111111111111111111111111111111111111112', balanceTokens * porcentaje);

        if (resultado.success) {
            // Actualizar posición
            posicion.cantidadTokens -= tokensAVender;
            posicion.ventas.push({
                timestamp: new Date(),
                cantidadVendida: tokensAVender,
                valorSOL: resultado.outputAmount,
                porcentaje
            });

            if (posicion.cantidadTokens <= 0.001) {
                posicion.estado = 'cerrada';
            }

            console.log(`✅ Venta exitosa: ${resultado.outputAmount.toFixed(4)} SOL`);
            return resultado;
        } else {
            throw new Error(resultado.error);
        }

    } catch (error) {
        console.error(`❌ Error vendiendo ${tokenMint}:`, error.message);
        throw error;
    }
}

// Obtener datos del token
async function getDatosToken(tokenMint) {
    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
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
                    fdv: bestPair.fdv || 0
                };
            }
        }
    } catch (error) {
        console.error('Error obteniendo datos del token:', error.message);
    }
    return null;
}

// Extraer dirección de contrato
function extraerDireccionContrato(texto) {
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

// Comandos del bot

bot.start(async (ctx) => {
    await actualizarBalance();

    ctx.reply(`🤖 **Bot de Trading - Mainnet** 🚀

💰 **Balance Actual:** ${balance.toFixed(4)} SOL
🔥 **Estado:** ${modoTrading ? 'TRADING ACTIVO' : 'PAUSADO'}
📊 **Posiciones:** ${posiciones.size} abiertas
📡 **Canales:** ${Array.from(canales).map(c => '@' + c).join(', ')}

📋 **Comandos:**
/start - Menú principal
/balance - Balance detallado
/posiciones - Ver posiciones activas
/comprar <token> - Comprar manualmente
/vender <token> [porcentaje] - Vender tokens
/canales - Gestionar canales
/estado - Toggle trading ON/OFF
/ayuda - Ayuda completa

${modoTrading ? '✅ Trading activado' : '⚠️ Trading pausado'}`,
{ parse_mode: 'Markdown' });
});

bot.command('balance', async (ctx) => {
    await actualizarBalance();
    const tokens = await getTokenAccounts();

    let mensaje = `💰 **Balance de la Wallet**\n\n`;
    mensaje += `🔵 **SOL:** ${balance.toFixed(4)} SOL\n`;
    mensaje += `💵 **USD (≈):** $${(balance * 150).toFixed(2)}\n\n`;

    if (tokens.length > 0) {
        mensaje += `🪙 **Tokens (${tokens.length}):**\n`;
        for (const token of tokens.slice(0, 5)) {
            mensaje += `• \`${token.mint.substring(0, 8)}...\` - ${token.amount.toFixed(4)}\n`;
        }
    }

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

bot.command('posiciones', async (ctx) => {
    if (posiciones.size === 0) {
        return ctx.reply('📊 No hay posiciones abiertas');
    }

    let mensaje = `📊 **Posiciones Abiertas (${posiciones.size})**\n\n`;

    for (const [tokenMint, pos] of posiciones) {
        const datos = await getDatosToken(tokenMint);
        const precioActual = datos ? datos.price : 0;
        const valorActual = precioActual * pos.cantidadTokens;
        const pnl = valorActual - pos.invertido;
        const pnlPorcentaje = ((pnl / pos.invertido) * 100).toFixed(2);

        mensaje += `🪙 Token: \`${tokenMint.substring(0, 8)}...\`\n`;
        mensaje += `💰 Cantidad: ${pos.cantidadTokens.toFixed(4)}\n`;
        mensaje += `💵 Valor actual: $${valorActual.toFixed(2)}\n`;
        mensaje += `📈 PnL: ${pnl >= 0 ? '🟢' : '🔴'} $${pnl.toFixed(2)} (${pnlPorcentaje}%)\n`;
        mensaje += `⏰ Entrada: ${pos.timestamp.toLocaleString()}\n\n`;
    }

    ctx.reply(mensaje, { parse_mode: 'Markdown' });
});

bot.command('comprar', async (ctx) => {
    if (!modoTrading) {
        return ctx.reply('⚠️ Trading está pausado. Usa /estado para activar.');
    }

    const partes = ctx.message.text.split(' ');
    const tokenMint = partes[1];
    const cantidad = partes[2] ? parseFloat(partes[2]) : config.buyAmount;

    if (!tokenMint) {
        return ctx.reply('❌ Especifica el token\nEj: `/comprar So11111111111111111111111111111111111111112 0.1`',
            { parse_mode: 'Markdown' });
    }

    try {
        new PublicKey(tokenMint);
        await ctx.reply(`🔄 Analizando y comprando ${tokenMint}...`);

        const resultado = await comprarToken(tokenMint, cantidad);

        if (resultado.success) {
            ctx.reply(`✅ **Compra exitosa!**\n\n💰 Tokens: ${resultado.outputAmount.toFixed(4)}\n💸 SOL gastado: ${cantidad}\n🔗 [Ver transacción](https://solscan.io/tx/${resultado.signature})`,
                { parse_mode: 'Markdown' });
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        ctx.reply(`❌ Error en compra: ${error.message}`);
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
            ctx.reply(`✅ **Venta exitosa!**\n\n💰 SOL recibido: ${resultado.outputAmount.toFixed(4)}\n🔗 [Ver transacción](https://solscan.io/tx/${resultado.signature})`,
                { parse_mode: 'Markdown' });
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        ctx.reply(`❌ Error en venta: ${error.message}`);
    }
});

bot.command('canales', (ctx) => {
    const partes = ctx.message.text.split(' ');
    const accion = partes[1];

    if (!accion) {
        ctx.reply(`📡 **Canales Monitoreados**\n\n${Array.from(canales).map(c => `• @${c}`).join('\n')}\n\n📋 **Comandos:**\n/canales agregar @nombre - Agregar canal\n/canales quitar @nombre - Quitar canal`,
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
            ctx.reply(`❌ Canal @${canal} no está en la lista`);
        }
    }
});

bot.command('estado', (ctx) => {
    modoTrading = !modoTrading;
    ctx.reply(`🔔 **Trading ${modoTrading ? 'ACTIVADO' : 'PAUSADO'}**\n\n${modoTrading ? '✅ El bot ejecutará trades automáticamente' : '⏸️ El bot está en pausa'}`,
        { parse_mode: 'Markdown' });
});

bot.command('ayuda', (ctx) => {
    ctx.reply(`🆘 **Ayuda del Bot**\n\n📋 **Comandos:**\n/start - Menú principal\n/balance - Ver balance\n/posiciones - Posiciones abiertas\n/comprar <token> [cantidad] - Comprar tokens\n/vender <token> [porcentaje] - Vender tokens\n/canales - Gestionar canales\n/estado - Activar/pausar trading\n/ayuda - Esta ayuda\n\n⚙️ **Configuración:**\n• Buy amount: ${config.buyAmount} SOL\n• Slippage: ${config.slippage}%\n• Min liquidez: $${config.minimaLiquidez.toLocaleString()}\n\n⚠️ **Advertencia:** Este bot opera con fondos reales. Usa con precaución.`,
    { parse_mode: 'Markdown' });
});

// Monitorear mensajes de canales
bot.on('text', async (ctx) => {
    if (!modoTrading) return;

    const username = ctx.chat.username;
    if (!username || !canales.has(username)) return;

    const texto = ctx.message.text;
    const tokenMint = extraerDireccionContrato(texto);

    if (tokenMint && !posiciones.has(tokenMint)) {
        console.log(`🎯 Token detectado en @${username}: ${tokenMint}`);

        // Analizar token antes de comprar
        const datos = await getDatosToken(tokenMint);
        if (!datos) {
            console.log('❌ No se encontraron datos del token');
            return;
        }

        console.log(`📊 Datos: Precio $${datos.price}, Liquidez $${datos.liquidity.toLocaleString()}`);

        if (datos.liquidity >= config.minimaLiquidez) {
            try {
                await ctx.reply(`🚀 **Llamada detectada!**\n\n🪙 Token: \`${tokenMint}\`\n💰 Precio: $${datos.price}\n💧 Liquidez: $${datos.liquidity.toLocaleString()}\n\n⏳ Ejecutando compra...`,
                    { parse_mode: 'Markdown' });

                const resultado = await comprarToken(tokenMint);

                if (resultado.success) {
                    ctx.reply(`✅ **Compra ejecutada!**\n\n🪙 Tokens: ${resultado.outputAmount.toFixed(4)}\n💸 SOL: ${config.buyAmount}\n🔗 [Tx](https://solscan.io/tx/${resultado.signature})`,
                        { parse_mode: 'Markdown' });
                }
            } catch (error) {
                console.error('Error en compra automática:', error.message);
                ctx.reply(`❌ Error en compra: ${error.message}`);
            }
        } else {
            console.log(`⚠️ Liquidez baja: $${datos.liquidity.toLocaleString()}`);
        }
    }
});

// Inicializar y arrancar bot
async function iniciarBot() {
    const conectado = await inicializarSolana();
    if (!conectado) {
        console.error('❌ No se pudo conectar a Solana. Verifica configuración.');
        process.exit(1);
    }

    console.log('✅ Bot listo para trading en mainnet');
    console.log(`🔥 Trading: ${modoTrading ? 'ACTIVO' : 'PAUSADO'}`);
    console.log(`📡 Canales: ${Array.from(canales).join(', ')}`);

    bot.launch()
        .then(() => console.log('🎉 Bot iniciado en Telegram!'))
        .catch(err => {
            console.error('❌ Error iniciando bot:', err);
            process.exit(1);
        });
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
iniciarBot();