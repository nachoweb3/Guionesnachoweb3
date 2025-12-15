// Sistema de Pagos Crypto para el Bot
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');

// Configuración
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const SOL_ADDRESSES = [
    'Dode6Ht9U2kR1oJz53jFLucW31vqYSLj8U9s5DQyLmz1',
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
];

// Direcciones de pago
const PAYMENT_ADDRESSES = {
    SOL: 'Dode6Ht9U2kR1oJz53jFLucW31vqYSLj8U9s5DQyLmz1',
    USDT_TRC20: 'TRXNHQJXm1fu9W3nR7rJ2oG2gRGxXG8dKdL9sQ4tMhT',
    USDC_SOLANA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
};

class PaymentSystem {
    constructor() {
        this.connection = new Connection(SOLANA_RPC, 'confirmed');
        this.pendingPayments = new Map();
        this.processedTransactions = new Set();
    }

    // Verificar pago en Solana
    async checkSolanaPayment(userAddress, amount) {
        try {
            const userPubkey = new PublicKey(userAddress);
            const signatures = await this.connection.getSignaturesForAddress(userPubkey, { limit: 10 });

            for (const sig of signatures) {
                if (this.processedTransactions.has(sig.signature)) continue;

                const tx = await this.connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
                if (!tx) continue;

                // Buscar transferencia a nuestras direcciones
                for (const address of SOL_ADDRESSES) {
                    const transfer = tx.transaction.message.instructions.find(inst => {
                        if (inst.programId.toString() !== '11111111111111111111111111111111') return false;
                        return inst.destination && inst.destination.toString() === address;
                    });

                    if (transfer && transfer.lamports >= amount * LAMPORTS_PER_SOL) {
                        this.processedTransactions.add(sig.signature);
                        return {
                            confirmed: true,
                            amount: transfer.lamports / LAMPORTS_PER_SOL,
                            signature: sig.signature,
                            timestamp: tx.blockTime * 1000
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Error checking SOL payment:', error);
        }
        return null;
    }

    // Verificar pago en TRON (USDT)
    async checkTronPayment(userAddress, amount) {
        try {
            const response = await axios.get(`https://api.trongrid.io/v1/accounts/${userAddress}/transactions/trc20`, {
                params: {
                    limit: 10,
                    contract_address: PAYMENT_ADDRESSES.USDT_TRC20
                }
            });

            for (const tx of response.data.data) {
                if (this.processedTransactions.has(tx.txID)) continue;

                const tokenInfo = JSON.parse(tx.token_info);
                if (tokenInfo.to === PAYMENT_ADDRESSES.USDT_TRC20 &&
                    tokenInfo.amount >= amount * 1000000) { // USDT has 6 decimals
                    this.processedTransactions.add(tx.txID);
                    return {
                        confirmed: true,
                        amount: tokenInfo.amount / 1000000,
                        signature: tx.txID,
                        timestamp: tx.block_timestamp
                    };
                }
            }
        } catch (error) {
            console.error('Error checking TRC20 payment:', error);
        }
        return null;
    }

    // Verificar pago en Bitcoin
    async checkBitcoinPayment(userAddress, amount) {
        try {
            const response = await axios.get(`https://blockstream.info/api/address/${userAddress}/txs`);

            for (const tx of response.data) {
                if (this.processedTransactions.has(tx.txid)) continue;

                for (const vout of tx.vout) {
                    if (vout.scriptpubkey_address === PAYMENT_ADDRESSES.BTC &&
                        vout.value >= amount) {
                        this.processedTransactions.add(tx.txid);
                        return {
                            confirmed: true,
                            amount: vout.value,
                            signature: tx.txid,
                            timestamp: tx.status.block_time * 1000
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Error checking BTC payment:', error);
        }
        return null;
    }

    // Generar dirección de pago temporal (para seguimiento)
    generatePaymentAddress(userId, plan) {
        const timestamp = Date.now();
        return {
            SOL: `${PAYMENT_ADDRESSES.SOL}?memo=${userId}_${plan}_${timestamp}`,
            USDT: PAYMENT_ADDRESSES.USDT_TRC20,
            USDC: PAYMENT_ADDRESSES.USDC_SOLANA,
            BTC: PAYMENT_ADDRESSES.BTC
        };
    }

    // Verificar cualquier pago
    async checkPayment(userAddress, amount, currency) {
        switch (currency.toUpperCase()) {
            case 'SOL':
                return this.checkSolanaPayment(userAddress, amount);
            case 'USDT':
                return this.checkTronPayment(userAddress, amount);
            case 'BTC':
                return this.checkBitcoinPayment(userAddress, amount);
            default:
                return null;
        }
    }

    // Crear QR para pago
    generateQRCode(address, amount, currency) {
        let qrData;

        switch (currency) {
            case 'SOL':
                qrData = `solana:${address.split('?')[0]}?amount=${amount}&label=QuantumBot`;
                break;
            case 'USDT':
                qrData = `tron:${address}?amount=${amount}&token=USDT`;
                break;
            case 'BTC':
                qrData = `bitcoin:${address}?amount=${amount}&label=QuantumBot`;
                break;
            default:
                return null;
        }

        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    }

    // Monitorear pagos pendientes
    async monitorPendingPayments() {
        for (const [userId, paymentInfo] of this.pendingPayments) {
            const result = await this.checkPayment(
                paymentInfo.userAddress,
                paymentInfo.amount,
                paymentInfo.currency
            );

            if (result) {
                // Pago confirmado
                this.pendingPayments.delete(userId);
                return {
                    userId,
                    ...result,
                    plan: paymentInfo.plan
                };
            }
        }
        return null;
    }

    // Añadir pago pendiente
    addPendingPayment(userId, userAddress, amount, currency, plan) {
        this.pendingPayments.set(userId, {
            userAddress,
            amount,
            currency,
            plan,
            timestamp: Date.now()
        });
    }

    // Limpiar pagos muy antiguos
    cleanOldPayments(maxAge = 3600000) { // 1 hora por defecto
        const now = Date.now();
        for (const [userId, paymentInfo] of this.pendingPayments) {
            if (now - paymentInfo.timestamp > maxAge) {
                this.pendingPayments.delete(userId);
            }
        }
    }
}

module.exports = PaymentSystem;