/* ========================================
   CRYPTO PAYMENT SYSTEM
   Handles cryptocurrency payments and transactions
   ======================================== */

/**
 * Crypto Payment Manager
 * Processes payments in various cryptocurrencies
 */
class CryptoPaymentManager {
    constructor() {
        this.walletAddresses = {
            BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            ETH: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            USDT_TRC20: 'TJ6BbsbfPkmFk2jGmKD9B3pFLWGVRehonk',
            USDT_ERC20: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            BNB: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            MATIC: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        };

        this.pendingTransactions = [];
        this.completedTransactions = [];
    }

    /**
     * Initialize a crypto payment
     * @param {Object} paymentData - Payment information
     * @param {string} paymentData.productId - Product ID
     * @param {string} paymentData.productName - Product name
     * @param {number} paymentData.amount - Amount in USD
     * @param {string} paymentData.currency - Crypto currency
     * @param {string} paymentData.customerEmail - Customer email
     * @returns {Promise<Object>} Payment details
     */
    async initializePayment(paymentData) {
        const { productId, productName, amount, currency, customerEmail } = paymentData;

        // Validate payment data
        if (!productId || !productName || !amount || !currency || !customerEmail) {
            throw new Error('Datos de pago incompletos');
        }

        // Get crypto amount based on current rates
        const cryptoAmount = await this.convertUSDToCrypto(amount, currency);
        const walletAddress = this.getWalletAddress(currency);

        if (!walletAddress) {
            throw new Error('Criptomoneda no soportada');
        }

        const payment = {
            id: this.generatePaymentId(),
            productId,
            productName,
            amountUSD: amount,
            currency,
            cryptoAmount,
            walletAddress,
            customerEmail,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
        };

        this.pendingTransactions.push(payment);

        return payment;
    }

    /**
     * Process payment with connected wallet
     * @param {Object} payment - Payment object from initializePayment
     * @param {Object} walletManager - Instance of Web3WalletManager
     * @returns {Promise<Object>} Transaction result
     */
    async processWalletPayment(payment, walletManager) {
        if (!walletManager.currentProvider) {
            throw new Error('No hay wallet conectado');
        }

        try {
            const { currency, cryptoAmount, walletAddress } = payment;

            // Convert amount to wei (for EVM chains)
            const weiAmount = this.toWei(cryptoAmount);

            let txHash;

            if (walletManager.currentWallet === 'phantom') {
                // Solana transaction
                txHash = await this.processSolanaPayment(cryptoAmount, walletAddress);
            } else {
                // EVM transaction (Ethereum, Polygon, BSC, etc.)
                txHash = await this.processEVMPayment(
                    walletManager.currentProvider,
                    walletAddress,
                    weiAmount
                );
            }

            // Update payment status
            payment.status = 'processing';
            payment.txHash = txHash;
            payment.processedAt = new Date().toISOString();

            // Monitor transaction
            this.monitorTransaction(payment, walletManager);

            return {
                success: true,
                txHash,
                payment,
                message: 'Transacción enviada. Esperando confirmación...'
            };
        } catch (error) {
            payment.status = 'failed';
            payment.error = error.message;
            throw error;
        }
    }

    /**
     * Process EVM (Ethereum-based) payment
     * @param {Object} provider - Web3 provider
     * @param {string} toAddress - Recipient address
     * @param {string} amount - Amount in wei
     * @returns {Promise<string>} Transaction hash
     */
    async processEVMPayment(provider, toAddress, amount) {
        const transactionParameters = {
            to: toAddress,
            from: walletManager.connectedAddress,
            value: '0x' + parseInt(amount).toString(16),
            gas: '0x5208', // 21000 Gwei
        };

        try {
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });

            return txHash;
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Transacción rechazada por el usuario');
            }
            throw error;
        }
    }

    /**
     * Process Solana payment via Phantom
     * @param {number} amount - Amount in SOL
     * @param {string} toAddress - Recipient address
     * @returns {Promise<string>} Transaction signature
     */
    async processSolanaPayment(amount, toAddress) {
        try {
            const solana = window.solana;

            // Create transaction
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: solana.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(toAddress),
                    lamports: amount * solanaWeb3.LAMPORTS_PER_SOL,
                })
            );

            // Get recent blockhash
            const connection = new solanaWeb3.Connection(
                solanaWeb3.clusterApiUrl('mainnet-beta')
            );
            transaction.recentBlockhash = (
                await connection.getRecentBlockhash()
            ).blockhash;
            transaction.feePayer = solana.publicKey;

            // Sign and send transaction
            const signed = await solana.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());

            return signature;
        } catch (error) {
            throw new Error('Error procesando pago Solana: ' + error.message);
        }
    }

    /**
     * Monitor transaction status
     * @param {Object} payment - Payment object
     * @param {Object} walletManager - Wallet manager instance
     */
    async monitorTransaction(payment, walletManager) {
        const checkInterval = 5000; // Check every 5 seconds
        const maxAttempts = 120; // 10 minutes max
        let attempts = 0;

        const intervalId = setInterval(async () => {
            attempts++;

            try {
                const receipt = await this.getTransactionReceipt(
                    payment.txHash,
                    walletManager.currentProvider
                );

                if (receipt) {
                    clearInterval(intervalId);

                    if (receipt.status === 1 || receipt.status === '0x1') {
                        // Transaction successful
                        payment.status = 'completed';
                        payment.completedAt = new Date().toISOString();
                        payment.confirmations = receipt.confirmations || 1;

                        // Move to completed transactions
                        this.pendingTransactions = this.pendingTransactions.filter(
                            p => p.id !== payment.id
                        );
                        this.completedTransactions.push(payment);

                        // Dispatch success event
                        this.dispatchPaymentEvent('paymentCompleted', payment);

                        // Send confirmation email (if backend is available)
                        this.sendPaymentConfirmation(payment);
                    } else {
                        // Transaction failed
                        payment.status = 'failed';
                        payment.error = 'Transacción revertida';
                        this.dispatchPaymentEvent('paymentFailed', payment);
                    }
                }

                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    payment.status = 'timeout';
                    this.dispatchPaymentEvent('paymentTimeout', payment);
                }
            } catch (error) {
                console.error('Error monitoring transaction:', error);
            }
        }, checkInterval);
    }

    /**
     * Get transaction receipt
     * @param {string} txHash - Transaction hash
     * @param {Object} provider - Web3 provider
     * @returns {Promise<Object|null>} Transaction receipt
     */
    async getTransactionReceipt(txHash, provider) {
        try {
            const receipt = await provider.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash],
            });
            return receipt;
        } catch (error) {
            return null;
        }
    }

    /**
     * Convert USD to cryptocurrency amount
     * @param {number} usdAmount - Amount in USD
     * @param {string} currency - Target cryptocurrency
     * @returns {Promise<number>} Amount in crypto
     */
    async convertUSDToCrypto(usdAmount, currency) {
        try {
            // Use CoinGecko API for price conversion
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoId(currency)}&vs_currencies=usd`
            );
            const data = await response.json();
            const coinId = this.getCoinGeckoId(currency);
            const priceUSD = data[coinId]?.usd;

            if (!priceUSD) {
                throw new Error('No se pudo obtener el precio de ' + currency);
            }

            return parseFloat((usdAmount / priceUSD).toFixed(8));
        } catch (error) {
            // Fallback to static rates if API fails
            const fallbackRates = {
                BTC: 45000,
                ETH: 2500,
                BNB: 300,
                MATIC: 0.8,
                USDT: 1,
                USDC: 1
            };

            const rate = fallbackRates[currency] || 1;
            return parseFloat((usdAmount / rate).toFixed(8));
        }
    }

    /**
     * Get CoinGecko ID for currency
     * @param {string} currency - Crypto currency symbol
     * @returns {string} CoinGecko ID
     */
    getCoinGeckoId(currency) {
        const mapping = {
            BTC: 'bitcoin',
            ETH: 'ethereum',
            BNB: 'binancecoin',
            MATIC: 'matic-network',
            USDT: 'tether',
            USDC: 'usd-coin',
            SOL: 'solana'
        };
        return mapping[currency.toUpperCase()] || currency.toLowerCase();
    }

    /**
     * Get wallet address for currency
     * @param {string} currency - Crypto currency
     * @returns {string} Wallet address
     */
    getWalletAddress(currency) {
        return this.walletAddresses[currency.toUpperCase()] || null;
    }

    /**
     * Convert crypto amount to wei
     * @param {number} amount - Amount in crypto
     * @returns {string} Amount in wei
     */
    toWei(amount) {
        return Math.floor(amount * 1e18).toString();
    }

    /**
     * Generate unique payment ID
     * @returns {string} Payment ID
     */
    generatePaymentId() {
        return 'PAY_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Generate QR code for payment address
     * @param {string} currency - Crypto currency
     * @param {number} amount - Amount
     * @returns {Promise<string>} QR code data URL
     */
    async generatePaymentQR(currency, amount) {
        const address = this.getWalletAddress(currency);
        const cryptoAmount = await this.convertUSDToCrypto(amount, currency);

        // Create payment URI
        let paymentURI;
        if (currency === 'BTC') {
            paymentURI = `bitcoin:${address}?amount=${cryptoAmount}`;
        } else if (currency === 'ETH' || currency.includes('ERC20')) {
            paymentURI = `ethereum:${address}?value=${cryptoAmount}e18`;
        } else {
            paymentURI = address; // Fallback to just address
        }

        // Generate QR code using QRCode library
        if (typeof QRCode !== 'undefined') {
            try {
                const qrDataURL = await QRCode.toDataURL(paymentURI, {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    quality: 0.95,
                    margin: 1,
                    width: 300,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                return qrDataURL;
            } catch (error) {
                console.error('Error generating QR code:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Send payment confirmation email
     * @param {Object} payment - Payment object
     */
    async sendPaymentConfirmation(payment) {
        try {
            // This would typically call a backend API
            const response = await fetch('/api/send-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: payment.customerEmail,
                    payment: {
                        id: payment.id,
                        product: payment.productName,
                        amount: payment.cryptoAmount,
                        currency: payment.currency,
                        txHash: payment.txHash
                    }
                })
            });

            if (!response.ok) {
                console.error('Failed to send confirmation email');
            }
        } catch (error) {
            console.log('Email notification not available:', error.message);
        }
    }

    /**
     * Dispatch payment event
     * @param {string} eventName - Event name
     * @param {Object} payment - Payment data
     */
    dispatchPaymentEvent(eventName, payment) {
        window.dispatchEvent(new CustomEvent(`payment:${eventName}`, {
            detail: payment
        }));
    }

    /**
     * Get payment by ID
     * @param {string} paymentId - Payment ID
     * @returns {Object|null} Payment object
     */
    getPayment(paymentId) {
        return [...this.pendingTransactions, ...this.completedTransactions]
            .find(p => p.id === paymentId) || null;
    }

    /**
     * Get all transactions for a customer
     * @param {string} email - Customer email
     * @returns {Array} Array of transactions
     */
    getCustomerTransactions(email) {
        return [...this.pendingTransactions, ...this.completedTransactions]
            .filter(p => p.customerEmail === email);
    }
}

// Create global instance
const paymentManager = new CryptoPaymentManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoPaymentManager, paymentManager };
}
