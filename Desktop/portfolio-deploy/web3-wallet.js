/* ========================================
   WEB3 WALLET INTEGRATION MODULE
   Real wallet connections and crypto payments
   ======================================== */

/**
 * Web3 Wallet Manager
 * Handles connections to MetaMask, WalletConnect, Phantom, and Trust Wallet
 */
class Web3WalletManager {
    constructor() {
        this.currentProvider = null;
        this.currentWallet = null;
        this.connectedAddress = null;
        this.chainId = null;
        this.walletConnect = null;

        // Supported chains
        this.chains = {
            ethereum: { id: 1, name: 'Ethereum', symbol: 'ETH', rpc: 'https://mainnet.infura.io/v3/' },
            polygon: { id: 137, name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-rpc.com' },
            bsc: { id: 56, name: 'BSC', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org' },
            arbitrum: { id: 42161, name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
        };
    }

    /**
     * Initialize wallet connection based on type
     * @param {string} walletType - Type of wallet (metamask, walletconnect, phantom, trust)
     * @returns {Promise<Object>} Connection result
     */
    async connect(walletType) {
        try {
            switch (walletType.toLowerCase()) {
                case 'metamask':
                    return await this.connectMetaMask();
                case 'walletconnect':
                    return await this.connectWalletConnect();
                case 'phantom':
                    return await this.connectPhantom();
                case 'trust':
                    return await this.connectTrustWallet();
                default:
                    throw new Error('Wallet type not supported');
            }
        } catch (error) {
            console.error(`Error connecting to ${walletType}:`, error);
            throw error;
        }
    }

    /**
     * Connect to MetaMask wallet
     * @returns {Promise<Object>} Connection details
     */
    async connectMetaMask() {
        if (!window.ethereum) {
            throw new Error('MetaMask no está instalado. Por favor instálalo desde metamask.io');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Get chain ID
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            this.currentProvider = window.ethereum;
            this.currentWallet = 'metamask';
            this.connectedAddress = accounts[0];
            this.chainId = parseInt(chainId, 16);

            // Setup event listeners
            this.setupMetaMaskListeners();

            return {
                success: true,
                wallet: 'MetaMask',
                address: this.connectedAddress,
                chainId: this.chainId,
                shortAddress: this.shortenAddress(this.connectedAddress)
            };
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Conexión rechazada por el usuario');
            }
            throw error;
        }
    }

    /**
     * Connect to WalletConnect
     * @returns {Promise<Object>} Connection details
     */
    async connectWalletConnect() {
        try {
            // Check if WalletConnect is available
            if (typeof WalletConnectProvider === 'undefined') {
                throw new Error('WalletConnect no está disponible. Verifica que el script esté cargado.');
            }

            // Create WalletConnect Provider
            const provider = new WalletConnectProvider.default({
                rpc: {
                    1: this.chains.ethereum.rpc,
                    137: this.chains.polygon.rpc,
                    56: this.chains.bsc.rpc,
                    42161: this.chains.arbitrum.rpc,
                }
            });

            // Enable session (triggers QR Code modal)
            await provider.enable();

            this.currentProvider = provider;
            this.currentWallet = 'walletconnect';
            this.connectedAddress = provider.accounts[0];
            this.chainId = provider.chainId;
            this.walletConnect = provider;

            // Setup WalletConnect listeners
            this.setupWalletConnectListeners();

            return {
                success: true,
                wallet: 'WalletConnect',
                address: this.connectedAddress,
                chainId: this.chainId,
                shortAddress: this.shortenAddress(this.connectedAddress)
            };
        } catch (error) {
            if (error.message.includes('User closed modal')) {
                throw new Error('Conexión cancelada por el usuario');
            }
            throw error;
        }
    }

    /**
     * Connect to Phantom wallet (Solana)
     * @returns {Promise<Object>} Connection details
     */
    async connectPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom Wallet no está instalado. Por favor instálalo desde phantom.app');
        }

        try {
            const response = await window.solana.connect();

            this.currentProvider = window.solana;
            this.currentWallet = 'phantom';
            this.connectedAddress = response.publicKey.toString();

            // Setup Phantom listeners
            this.setupPhantomListeners();

            return {
                success: true,
                wallet: 'Phantom',
                address: this.connectedAddress,
                network: 'Solana',
                shortAddress: this.shortenAddress(this.connectedAddress)
            };
        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Conexión rechazada por el usuario');
            }
            throw error;
        }
    }

    /**
     * Connect to Trust Wallet
     * @returns {Promise<Object>} Connection details
     */
    async connectTrustWallet() {
        // Trust Wallet uses same API as MetaMask
        if (!window.ethereum) {
            throw new Error('Trust Wallet no está disponible');
        }

        // Check if it's Trust Wallet
        const isTrustWallet = window.ethereum.isTrust || window.ethereum.isTrustWallet;

        if (!isTrustWallet) {
            // If not Trust Wallet but MetaMask is available, connect anyway
            console.warn('Trust Wallet not detected, using available provider');
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            this.currentProvider = window.ethereum;
            this.currentWallet = 'trust';
            this.connectedAddress = accounts[0];
            this.chainId = parseInt(chainId, 16);

            this.setupMetaMaskListeners(); // Same listeners as MetaMask

            return {
                success: true,
                wallet: 'Trust Wallet',
                address: this.connectedAddress,
                chainId: this.chainId,
                shortAddress: this.shortenAddress(this.connectedAddress)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Disconnect current wallet
     */
    async disconnect() {
        if (this.currentWallet === 'walletconnect' && this.walletConnect) {
            await this.walletConnect.disconnect();
        } else if (this.currentWallet === 'phantom' && window.solana) {
            await window.solana.disconnect();
        }

        this.currentProvider = null;
        this.currentWallet = null;
        this.connectedAddress = null;
        this.chainId = null;
        this.walletConnect = null;

        return { success: true, message: 'Wallet desconectado' };
    }

    /**
     * Switch to a different network
     * @param {string} chainName - Name of the chain to switch to
     */
    async switchNetwork(chainName) {
        const chain = this.chains[chainName.toLowerCase()];
        if (!chain) {
            throw new Error('Red no soportada');
        }

        if (!this.currentProvider) {
            throw new Error('No hay wallet conectado');
        }

        try {
            await this.currentProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chain.id.toString(16)}` }],
            });
        } catch (error) {
            // If chain doesn't exist, add it
            if (error.code === 4902) {
                await this.addNetwork(chainName);
            } else {
                throw error;
            }
        }
    }

    /**
     * Add a new network to wallet
     * @param {string} chainName - Name of the chain to add
     */
    async addNetwork(chainName) {
        const chain = this.chains[chainName.toLowerCase()];

        await this.currentProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${chain.id.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: {
                    name: chain.symbol,
                    symbol: chain.symbol,
                    decimals: 18
                },
                rpcUrls: [chain.rpc],
            }],
        });
    }

    /**
     * Get current wallet balance
     * @returns {Promise<string>} Balance in ETH/native token
     */
    async getBalance() {
        if (!this.currentProvider || !this.connectedAddress) {
            throw new Error('No hay wallet conectado');
        }

        if (this.currentWallet === 'phantom') {
            // Solana balance
            const balance = await window.solana.getBalance();
            return (balance / 1e9).toFixed(4); // Convert lamports to SOL
        } else {
            // EVM balance
            const balance = await this.currentProvider.request({
                method: 'eth_getBalance',
                params: [this.connectedAddress, 'latest']
            });
            // Convert from wei to ETH
            return (parseInt(balance, 16) / 1e18).toFixed(4);
        }
    }

    /**
     * Setup MetaMask event listeners
     */
    setupMetaMaskListeners() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
                this.dispatchEvent('walletDisconnected', {});
            } else {
                this.connectedAddress = accounts[0];
                this.dispatchEvent('accountChanged', { address: accounts[0] });
            }
        });

        window.ethereum.on('chainChanged', (chainId) => {
            this.chainId = parseInt(chainId, 16);
            this.dispatchEvent('chainChanged', { chainId: this.chainId });
            window.location.reload(); // Recommended by MetaMask
        });
    }

    /**
     * Setup WalletConnect event listeners
     */
    setupWalletConnectListeners() {
        this.walletConnect.on('accountsChanged', (accounts) => {
            this.connectedAddress = accounts[0];
            this.dispatchEvent('accountChanged', { address: accounts[0] });
        });

        this.walletConnect.on('chainChanged', (chainId) => {
            this.chainId = chainId;
            this.dispatchEvent('chainChanged', { chainId });
        });

        this.walletConnect.on('disconnect', () => {
            this.disconnect();
            this.dispatchEvent('walletDisconnected', {});
        });
    }

    /**
     * Setup Phantom event listeners
     */
    setupPhantomListeners() {
        window.solana.on('connect', () => {
            this.dispatchEvent('walletConnected', {
                wallet: 'Phantom',
                address: this.connectedAddress
            });
        });

        window.solana.on('disconnect', () => {
            this.disconnect();
            this.dispatchEvent('walletDisconnected', {});
        });
    }

    /**
     * Dispatch custom events
     * @param {string} eventName - Name of the event
     * @param {Object} detail - Event details
     */
    dispatchEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(`wallet:${eventName}`, { detail }));
    }

    /**
     * Shorten wallet address for display
     * @param {string} address - Full wallet address
     * @returns {string} Shortened address
     */
    shortenAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Get current connection status
     * @returns {Object} Connection status
     */
    getStatus() {
        return {
            isConnected: !!this.connectedAddress,
            wallet: this.currentWallet,
            address: this.connectedAddress,
            shortAddress: this.shortenAddress(this.connectedAddress),
            chainId: this.chainId
        };
    }
}

// Create global instance
const walletManager = new Web3WalletManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Web3WalletManager, walletManager };
}
