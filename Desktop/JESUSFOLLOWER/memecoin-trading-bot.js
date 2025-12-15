require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const axios = require('axios');
const fs = require('fs');
const bs58 = require('bs58');

// CONFIGURACIÓN
const config = {
    botToken: process.env.BOT_TOKEN, // Token de Telegram del .env
    solanaRpc: process.env.SOLANA_RPC_URL, // RPC URL del .env
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || fs.readFileSync('./keypair.json', 'utf8').trim(),
    slippage: 10, // 10% slippage
    buyAmount: 0.01, // 0.01 SOL por compra inicial
    sellPercentageOn2x: 0.6, // Vender 60% cuando duplique
    progressiveSellThresholds: [
        { multiplier: 2, sellPercentage: 0.2 }, // Vender 20% más en 2x
        { multiplier: 3, sellPercentage: 0.3 }, // Vender 30% más en 3x
        { multiplier: 5, sellPercentage: 0.5 }  // Vender 50% del restante en 5x
    ],
    stopLossPercentage: -0.3, // Vender todo si cae 30%
    checkInterval: 30000 // Revisar cada 30 segundos
};

// Inicializar conexión a Solana
const connection = new Connection(config.solanaRpc, 'confirmed');
const wallet = Keypair.fromSecretKey(bs58.decode(config.walletPrivateKey));

// Bot de Telegram
const bot = new Telegraf(config.botToken);

// Estructura para seguimiento de posiciones
const positions = new Map();

// Función para extraer dirección de contrato de un mensaje
function extractContractAddress(message) {
    // Buscar patrones que parezcan direcciones de contrato de Solana
    const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
    const matches = message.match(solanaAddressRegex);

    if (matches && matches.length > 0) {
        // Filtrar direcciones válidas de Solana
        for (const match of matches) {
            try {
                new PublicKey(match);
                return match;
            } catch (e) {
                // No es una dirección válida
            }
        }
    }
    return null;
}

// Función para obtener datos del token
async function getTokenData(tokenAddress) {
    try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        const pairs = response.data.pairs;

        if (pairs && pairs.length > 0) {
            // Buscar el par más líquido en Raydium u Orca
            const solanaPairs = pairs.filter(p => p.chainId === 'solana' &&
                (p.dexId === 'raydium' || p.dexId === 'orca'));

            if (solanaPairs.length > 0) {
                const bestPair = solanaPairs.reduce((best, current) =>
                    (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
                );

                return {
                    address: tokenAddress,
                    price: parseFloat(bestPair.priceUsd),
                    liquidity: bestPair.liquidity?.usd || 0,
                    volume24h: bestPair.volume?.h24 || 0,
                    pairAddress: bestPair.pairAddress,
                    dexId: bestPair.dexId
                };
            }
        }
    } catch (error) {
        console.error('Error obteniendo datos del token:', error);
    }
    return null;
}

// Función para comprar token
async function buyToken(tokenAddress, amountSOL = config.buyAmount) {
    try {
        console.log(`\n🟢 INICIANDO COMPRA de ${tokenAddress}`);

        const tokenData = await getTokenData(tokenAddress);
        if (!tokenData) {
            console.log('❌ No se encontraron datos del token');
            return null;
        }

        console.log(`💰 Precio actual: $${tokenData.price}`);
        console.log(`💧 Liquidez: $${tokenData.liquidity}`);

        if (tokenData.liquidity < 10000) {
            console.log('⚠️ Liquidez muy baja, omitiendo compra');
            return null;
        }

        // Aquí implementaríamos la lógica de compra real con Jupiter API
        // Por ahora simulo la compra
        const purchasePrice = tokenData.price;
        const tokensBought = (amountSOL / purchasePrice) * 0.98; // Asumiendo 2% de fees

        // Guardar posición
        positions.set(tokenAddress, {
            tokenAddress,
            purchasePrice,
            tokensBought,
            initialAmount: amountSOL,
            remainingTokens: tokensBought,
            sells: [],
            createdAt: new Date(),
            status: 'active'
        });

        console.log(`✅ Compra realizada: ${tokensBought.toFixed(2)} tokens a $${purchasePrice}`);

        // Iniciar monitoreo
        monitorPosition(tokenAddress);

        return tokenData;

    } catch (error) {
        console.error('❌ Error en compra:', error);
        return null;
    }
}

// Función para vender tokens
async function sellToken(tokenAddress, percentageToSell, reason) {
    const position = positions.get(tokenAddress);
    if (!position || position.remainingTokens <= 0) {
        console.log('❌ Sin tokens para vender');
        return false;
    }

    try {
        const tokenData = await getTokenData(tokenAddress);
        if (!tokenData) {
            console.log('❌ No se puede obtener precio actual');
            return false;
        }

        const tokensToSell = position.remainingTokens * percentageToSell;
        const sellValue = tokensToSell * tokenData.price;

        // Simular venta
        position.remainingTokens -= tokensToSell;
        position.sells.push({
            timestamp: new Date(),
            tokensSold: tokensToSell,
            price: tokenData.price,
            value: sellValue,
            percentage: percentageToSell,
            reason
        });

        console.log(`\n🔴 VENTA ${reason}`);
        console.log(`💰 Tokens vendidos: ${tokensToSell.toFixed(2)}`);
        console.log(`💵 Valor: $${sellValue.toFixed(2)}`);
        console.log(`📈 Precio: $${tokenData.price}`);

        if (position.remainingTokens <= 0) {
            position.status = 'closed';
            console.log('✅ Posición cerrada completamente');
        }

        // Aquí implementaríamos la venta real con Jupiter API

        return true;

    } catch (error) {
        console.error('❌ Error en venta:', error);
        return false;
    }
}

// Función para monitorear una posición
async function monitorPosition(tokenAddress) {
    const position = positions.get(tokenAddress);
    if (!position || position.status !== 'active') {
        return;
    }

    const monitor = async () => {
        const currentPos = positions.get(tokenAddress);
        if (!currentPos || currentPos.status !== 'active') {
            return;
        }

        try {
            const tokenData = await getTokenData(tokenAddress);
            if (!tokenData) {
                console.log(`⚠️ No se puede obtener precio de ${tokenAddress}`);
                setTimeout(monitor, config.checkInterval);
                return;
            }

            const currentPrice = tokenData.price;
            const priceMultiplier = currentPrice / currentPos.purchasePrice;
            const priceChange = (priceMultiplier - 1) * 100;

            console.log(`\n📊 MONITOREO ${tokenAddress.substring(0, 8)}...`);
            console.log(`💰 Precio: $${currentPrice} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`);
            console.log(`🎯 Multiplicador: ${priceMultiplier.toFixed(2)}x`);
            console.log(`🪙 Tokens restantes: ${currentPos.remainingTokens.toFixed(2)}`);

            // Venta inicial del 60% si duplica
            if (priceMultiplier >= 2 && !currentPos.sells.some(s => s.reason === 'initial_2x')) {
                await sellToken(tokenAddress, config.sellPercentageOn2x, 'inicial 2x');
            }

            // Ventas progresivas
            for (const threshold of config.progressiveSellThresholds) {
                if (priceMultiplier >= threshold.multiplier) {
                    const alreadySold = currentPos.sells
                        .filter(s => s.reason.includes(`${threshold.multiplier}x`))
                        .reduce((sum, s) => sum + s.percentage, 0);

                    if (alreadySold < threshold.sellPercentage) {
                        const toSell = threshold.sellPercentage - alreadySold;
                        await sellToken(tokenAddress, toSell, `progresiva ${threshold.multiplier}x`);
                    }
                }
            }

            // Stop loss por caída brusca
            if (priceMultiplier <= (1 + config.stopLossPercentage)) {
                console.log('🚨 STOP LOSS ACTIVADO - Caída brusca detectada');
                await sellToken(tokenAddress, 1, 'stop loss');
                return;
            }

            setTimeout(monitor, config.checkInterval);

        } catch (error) {
            console.error('❌ Error en monitoreo:', error);
            setTimeout(monitor, config.checkInterval);
        }
    };

    monitor();
}

// Configurar bot de Telegram
bot.start((ctx) => {
    ctx.reply('🤖 Bot de trading de memecoins activado!\n\n' +
              'Monitoreando: https://t.me/cryptoyeezuscalls\n\n' +
              'Comandos:\n' +
              '/status - Ver posiciones activas\n' +
              '/balance - Ver balance de la wallet\n' +
              '/manual <direccion> - Comprar manualmente');
});

bot.command('status', (ctx) => {
    let message = '📊 POSICIONES ACTIVAS:\n\n';

    if (positions.size === 0) {
        message += 'No hay posiciones activas';
    } else {
        positions.forEach((pos, addr) => {
            const profitLoss = pos.sells.reduce((sum, s) => sum + s.value, 0);
            message += `Token: ${addr.substring(0, 8)}...\n`;
            message += `Estado: ${pos.status}\n`;
            message += `Tokens restantes: ${pos.remainingTokens.toFixed(2)}\n`;
            message += `Ventas realizadas: ${pos.sells.length}\n`;
            message += `Beneficio/loss: $${profitLoss.toFixed(2)}\n\n`;
        });
    }

    ctx.reply(message);
});

bot.command('manual', async (ctx) => {
    const address = ctx.message.text.split(' ')[1];
    if (!address) {
        ctx.reply('❌ Debes proporcionar una dirección de contrato\n' +
                  'Ejemplo: /manual So11111111111111111111111111111111111111112');
        return;
    }

    ctx.reply(`🔄 Procesando compra manual de ${address}...`);
    await buyToken(address);
});

// Escuchar mensajes del canal
bot.on('text', async (ctx) => {
    // Solo procesar mensajes del canal especificado
    if (ctx.message.chat.username === 'cryptoyeezuscalls') {
        const message = ctx.message.text;
        const contractAddress = extractContractAddress(message);

        if (contractAddress) {
            console.log(`\n🎯 DIRECCIÓN DETECTADA: ${contractAddress}`);

            // Verificar si ya tenemos una posición
            if (positions.has(contractAddress)) {
                console.log('⚠️ Ya existe una posición para este token');
                return;
            }

            ctx.reply(`🚀 Nueva llamada detectada!\n` +
                      `Token: ${contractAddress}\n` +
                      `Iniciando análisis y compra...`);

            // Pequeña espera para no front-run
            setTimeout(async () => {
                await buyToken(contractAddress);
            }, 2000);
        }
    }
});

// Función para implementar compras reales con Jupiter
async function executeJupiterSwap(inputMint, outputMint, amount, slippage) {
    try {
        // Obtener quote de Jupiter
        const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
            params: {
                inputMint,
                outputMint,
                amount,
                slippageBps: slippage * 100
            }
        });

        const quote = quoteResponse.data;

        // Obtener transacción de swap
        const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
            quoteResponse: quote,
            userPublicKey: wallet.publicKey.toString(),
            wrapAndUnwrapSol: true
        });

        const swapTransaction = swapResponse.data.swapTransaction;

        // Deserializar y firmar transacción
        const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
        transaction.sign(wallet);

        // Enviar transacción
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
        });

        // Confirmar transacción
        await connection.confirmTransaction(signature, 'confirmed');

        console.log(`✅ Transacción confirmada: ${signature}`);
        return signature;

    } catch (error) {
        console.error('❌ Error en swap de Jupiter:', error);
        throw error;
    }
}

// Iniciar bot
console.log('🚀 Iniciando bot de trading...');
bot.launch();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));