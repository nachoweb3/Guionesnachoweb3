// Payment Monitor for Trading Bot
// Monitors blockchain for incoming payments and upgrades user plans

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');
const fs = require('fs');

// Configuration
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const WALLET_TO_MONITOR = 'Dode6Ht9U2kR1oJz53jFLucW31vqYSLj8U9s5DQyLmz1'; // Our wallet

// Pricing
const PLAN_PRICES = {
    BASIC: 29,  // USD
    PRO: 99,
    ENTERPRISE: 299
};

// Estimated SOL price (update with real API)
const SOL_PRICE_USD = 150;

class PaymentMonitor {
    constructor() {
        this.connection = new Connection(SOLANA_RPC);
        this.processedTransactions = new Set();
        this.loadProcessedTransactions();
        this.pendingUpgrades = new Map(); // userId -> {plan, timestamp}
    }

    loadProcessedTransactions() {
        try {
            if (fs.existsSync('./processed_tx.json')) {
                const data = fs.readFileSync('./processed_tx.json', 'utf8');
                const parsed = JSON.parse(data);
                this.processedTransactions = new Set(parsed);
            }
        } catch (error) {
            console.log('No previous transactions found');
        }
    }

    saveProcessedTransactions() {
        try {
            fs.writeFileSync('./processed_tx.json', JSON.stringify([...this.processedTransactions]));
        } catch (error) {
            console.error('Error saving transactions:', error);
        }
    }

    // Check for SOL payments
    async checkSolanaPayments() {
        try {
            const pubkey = new PublicKey(WALLET_TO_MONITOR);
            const signatures = await this.connection.getSignaturesForAddress(pubkey, {
                limit: 20
            });

            for (const sig of signatures) {
                if (this.processedTransactions.has(sig.signature)) continue;

                const tx = await this.connection.getTransaction(sig.signature, {
                    maxSupportedTransactionVersion: 0
                });

                if (!tx) continue;

                // Check for SOL transfer
                for (const inst of tx.transaction.message.instructions) {
                    if (inst.programId.toString() === '11111111111111111111111111111111') {
                        const amount = inst.lamports / LAMPORTS_PER_SOL;
                        const valueUSD = amount * SOL_PRICE_USD;

                        // Determine which plan was purchased
                        const plan = this.determinePlanFromAmount(valueUSD);
                        if (plan) {
                            console.log(`✅ New payment detected: ${amount} SOL ($${valueUSD.toFixed(2)}) - ${plan} plan`);

                            // Mark as processed
                            this.processedTransactions.add(sig.signature);
                            this.saveProcessedTransactions();

                            // In a real implementation, you would:
                            // 1. Get the sender's wallet address
                            // 2. Match it to a Telegram user ID
                            // 3. Upgrade their plan
                            // 4. Send confirmation notification

                            return {
                                signature: sig.signature,
                                amount: amount,
                                valueUSD: valueUSD,
                                plan: plan,
                                timestamp: tx.blockTime * 1000
                            };
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking SOL payments:', error);
        }
        return null;
    }

    determinePlanFromAmount(valueUSD) {
        // Allow some tolerance for price fluctuations
        if (valueUSD >= PLAN_PRICES.ENTERPRISE * 0.95) return 'ENTERPRISE';
        if (valueUSD >= PLAN_PRICES.PRO * 0.95) return 'PRO';
        if (valueUSD >= PLAN_PRICES.BASIC * 0.95) return 'BASIC';
        return null;
    }

    // Monitor for payments (run this periodically)
    async startMonitoring(intervalSeconds = 30) {
        console.log(`🚀 Starting payment monitor (checking every ${intervalSeconds} seconds)...`);

        setInterval(async () => {
            const payment = await this.checkSolanaPayments();
            if (payment) {
                await this.processPayment(payment);
            }
        }, intervalSeconds * 1000);
    }

    async processPayment(payment) {
        console.log(`💰 Processing payment: ${payment.signature}`);

        // Here you would:
        // 1. Identify the user who made the payment
        // 2. Update their plan in the database
        // 3. Send a notification to Telegram

        // For now, just log the payment
        console.log({
            signature: payment.signature,
            amount: payment.amount,
            valueUSD: payment.valueUSD,
            plan: payment.plan,
            timestamp: new Date(payment.timestamp).toISOString()
        });
    }

    // Manual check for a specific transaction
    async checkTransaction(signature) {
        try {
            const tx = await this.connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0
            });

            if (!tx) {
                console.log('Transaction not found');
                return null;
            }

            // Analyze transaction...
            return tx;
        } catch (error) {
            console.error('Error checking transaction:', error);
            return null;
        }
    }
}

// For testing
if (require.main === module) {
    const monitor = new PaymentMonitor();

    // Run once for testing
    monitor.checkSolanaPayments().then(payment => {
        if (payment) {
            console.log('Payment found:', payment);
        } else {
            console.log('No new payments found');
        }
    });
}

module.exports = PaymentMonitor;