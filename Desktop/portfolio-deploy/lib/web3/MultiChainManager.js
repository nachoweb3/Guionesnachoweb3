/**
 * MULTI-CHAIN WEB3 MANAGER
 * Advanced blockchain integration supporting multiple chains
 * Features: Multi-wallet, Cross-chain, DeFi, NFTs, Smart Contracts
 */

import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

class MultiChainManager {
  constructor(config) {
    this.config = config;
    this.providers = new Map();
    this.currentChain = null;
    this.account = null;
    this.signer = null;
    this.web3Modal = null;
    this.listeners = new Map();
    this.transactionHistory = [];
    this.initialized = false;
  }

  /**
   * Initialize Multi-Chain Manager
   */
  async initialize() {
    if (this.initialized) return;

    // Setup Web3Modal with multi-wallet support
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: this.config.infuraId,
          rpc: this.buildRpcConfig(),
          chainId: 1,
          bridge: 'https://bridge.walletconnect.org'
        }
      },
      coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
          appName: 'Nacho Portfolio',
          infuraId: this.config.infuraId,
          chainId: 1,
          darkMode: true
        }
      }
    };

    this.web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: true,
      providerOptions,
      theme: {
        background: '#111827',
        main: '#6366f1',
        secondary: '#8b5cf6',
        border: '#1f2937',
        hover: '#374151'
      }
    });

    // Initialize Solana connection
    this.solanaConnection = new Connection(
      clusterApiUrl('mainnet-beta'),
      'confirmed'
    );

    this.initialized = true;
    console.log('✅ Multi-Chain Manager initialized');
  }

  /**
   * Build RPC configuration for all chains
   */
  buildRpcConfig() {
    const rpcConfig = {};
    Object.entries(this.config.chains).forEach(([key, chain]) => {
      if (chain.enabled && chain.chainId !== 'solana') {
        rpcConfig[chain.chainId] = chain.rpcUrl;
      }
    });
    return rpcConfig;
  }

  /**
   * Connect wallet with chain selection
   */
  async connect(preferredChain = 'ethereum', walletType = null) {
    try {
      await this.initialize();

      let provider;

      // Handle Solana separately
      if (preferredChain === 'solana') {
        return await this.connectSolana();
      }

      // Connect EVM wallet
      if (walletType === 'phantom' && window.phantom?.solana) {
        return await this.connectSolana();
      } else {
        provider = await this.web3Modal.connect();
      }

      const web3Provider = new ethers.providers.Web3Provider(provider);
      const network = await web3Provider.getNetwork();
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const balance = await web3Provider.getBalance(address);

      // Store connection details
      this.provider = web3Provider;
      this.signer = signer;
      this.account = address;
      this.currentChain = this.getChainById(network.chainId);

      // Setup event listeners
      this.setupProviderListeners(provider);

      // Switch to preferred chain if different
      if (preferredChain !== this.currentChain?.name) {
        await this.switchChain(preferredChain);
      }

      const connectionData = {
        address,
        chain: this.currentChain,
        balance: ethers.utils.formatEther(balance),
        network: network.name,
        chainId: network.chainId
      };

      this.emit('connected', connectionData);
      this.trackEvent('wallet_connected', connectionData);

      return connectionData;

    } catch (error) {
      console.error('Connection error:', error);
      this.emit('error', { type: 'connection', error });
      throw error;
    }
  }

  /**
   * Connect Solana wallet (Phantom, Solflare, etc.)
   */
  async connectSolana() {
    try {
      // Check for Phantom wallet
      if (!window.phantom?.solana) {
        throw new Error('Phantom wallet not found. Please install it.');
      }

      const provider = window.phantom.solana;
      const response = await provider.connect();
      const publicKey = response.publicKey.toString();

      // Get balance
      const balance = await this.solanaConnection.getBalance(
        new PublicKey(publicKey)
      );

      this.account = publicKey;
      this.currentChain = this.config.chains.solana;
      this.solanaProvider = provider;

      const connectionData = {
        address: publicKey,
        chain: this.currentChain,
        balance: (balance / 1e9).toString(), // Convert lamports to SOL
        network: 'solana',
        chainId: 'solana'
      };

      // Setup Solana event listeners
      provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          this.emit('accountChanged', { address: publicKey.toString() });
        } else {
          this.disconnect();
        }
      });

      provider.on('disconnect', () => {
        this.emit('disconnected');
      });

      this.emit('connected', connectionData);
      return connectionData;

    } catch (error) {
      console.error('Solana connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    try {
      if (this.solanaProvider) {
        await this.solanaProvider.disconnect();
      }

      if (this.web3Modal) {
        await this.web3Modal.clearCachedProvider();
      }

      this.provider = null;
      this.signer = null;
      this.account = null;
      this.currentChain = null;
      this.solanaProvider = null;

      this.emit('disconnected');
      this.trackEvent('wallet_disconnected');

    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Switch to different blockchain
   */
  async switchChain(chainKey) {
    const targetChain = this.config.chains[chainKey];
    if (!targetChain) {
      throw new Error(`Chain ${chainKey} not found in configuration`);
    }

    // Handle Solana switch
    if (chainKey === 'solana') {
      return await this.connectSolana();
    }

    // Handle EVM chain switch
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexValue(targetChain.chainId) }]
      });

      this.currentChain = targetChain;
      this.emit('chainChanged', { chain: targetChain });
      this.trackEvent('chain_switched', { chain: chainKey });

    } catch (switchError) {
      // Chain not added to wallet, try to add it
      if (switchError.code === 4902) {
        await this.addChainToWallet(targetChain);
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Add new chain to wallet
   */
  async addChainToWallet(chain) {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: ethers.utils.hexValue(chain.chainId),
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [chain.rpcUrl],
          blockExplorerUrls: [chain.explorerUrl]
        }]
      });

      this.currentChain = chain;
      this.emit('chainAdded', { chain });

    } catch (error) {
      console.error('Error adding chain:', error);
      throw error;
    }
  }

  /**
   * Process crypto payment
   */
  async processPayment({
    recipient,
    amount,
    token = null, // null for native currency, or token address
    decimals = 18,
    onProgress = null
  }) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      let tx;

      if (this.currentChain.chainId === 'solana') {
        // Solana payment logic
        tx = await this.processSolanaPayment(recipient, amount);
      } else {
        // EVM payment logic
        if (token) {
          tx = await this.processTokenPayment(recipient, amount, token, decimals);
        } else {
          tx = await this.processNativePayment(recipient, amount);
        }
      }

      if (onProgress) onProgress('pending', tx);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Store in transaction history
      this.transactionHistory.push({
        hash: receipt.transactionHash,
        from: this.account,
        to: recipient,
        amount,
        token,
        chain: this.currentChain.name,
        timestamp: Date.now(),
        status: 'confirmed'
      });

      if (onProgress) onProgress('confirmed', receipt);
      this.emit('paymentCompleted', { tx, receipt });
      this.trackEvent('payment_completed', {
        amount,
        chain: this.currentChain.name
      });

      return receipt;

    } catch (error) {
      console.error('Payment error:', error);
      this.emit('paymentFailed', { error });
      throw error;
    }
  }

  /**
   * Process native currency payment (ETH, MATIC, BNB, etc.)
   */
  async processNativePayment(recipient, amount) {
    const tx = await this.signer.sendTransaction({
      to: recipient,
      value: ethers.utils.parseEther(amount.toString()),
      gasLimit: ethers.utils.hexlify(100000)
    });
    return tx;
  }

  /**
   * Process ERC-20 token payment
   */
  async processTokenPayment(recipient, amount, tokenAddress, decimals) {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address owner) view returns (uint256)'
      ],
      this.signer
    );

    const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals);
    const tx = await tokenContract.transfer(recipient, tokenAmount);
    return tx;
  }

  /**
   * Process Solana payment
   */
  async processSolanaPayment(recipient, amount) {
    const { SystemProgram, Transaction } = await import('@solana/web3.js');

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(this.account),
        toPubkey: new PublicKey(recipient),
        lamports: amount * 1e9 // Convert SOL to lamports
      })
    );

    const signature = await this.solanaProvider.signAndSendTransaction(transaction);

    return {
      hash: signature,
      wait: async () => {
        const confirmation = await this.solanaConnection.confirmTransaction(signature);
        return {
          transactionHash: signature,
          status: confirmation.value.err ? 'failed' : 'confirmed'
        };
      }
    };
  }

  /**
   * Get current wallet balance
   */
  async getBalance(address = null, token = null) {
    const targetAddress = address || this.account;

    if (!targetAddress) {
      throw new Error('No address provided');
    }

    if (this.currentChain?.chainId === 'solana') {
      const balance = await this.solanaConnection.getBalance(
        new PublicKey(targetAddress)
      );
      return (balance / 1e9).toString();
    }

    if (token) {
      return await this.getTokenBalance(targetAddress, token);
    }

    const balance = await this.provider.getBalance(targetAddress);
    return ethers.utils.formatEther(balance);
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(address, tokenAddress) {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address owner) view returns (uint256)'],
      this.provider
    );

    const balance = await tokenContract.balanceOf(address);
    return ethers.utils.formatUnits(balance, 18);
  }

  /**
   * Sign message
   */
  async signMessage(message) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    if (this.currentChain?.chainId === 'solana') {
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await this.solanaProvider.signMessage(encodedMessage);
      return signedMessage.signature;
    }

    const signature = await this.signer.signMessage(message);
    return signature;
  }

  /**
   * Setup provider event listeners
   */
  setupProviderListeners(provider) {
    // Account changed
    provider.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.account = accounts[0];
        this.emit('accountChanged', { address: accounts[0] });
      }
    });

    // Chain changed
    provider.on('chainChanged', (chainId) => {
      const chain = this.getChainById(parseInt(chainId, 16));
      this.currentChain = chain;
      this.emit('chainChanged', { chain });
      window.location.reload(); // Recommended by MetaMask
    });

    // Disconnected
    provider.on('disconnect', () => {
      this.disconnect();
    });
  }

  /**
   * Get chain by ID
   */
  getChainById(chainId) {
    return Object.values(this.config.chains).find(
      chain => chain.chainId === chainId
    );
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return Object.entries(this.config.chains)
      .filter(([_, chain]) => chain.enabled)
      .map(([key, chain]) => ({ key, ...chain }));
  }

  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));
  }

  /**
   * Analytics tracking
   */
  trackEvent(eventName, properties = {}) {
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackEvent(eventName, {
        ...properties,
        chain: this.currentChain?.name,
        account: this.account
      });
    }
  }

  /**
   * Get transaction history
   */
  getTransactionHistory() {
    return this.transactionHistory;
  }

  /**
   * Format address for display
   */
  formatAddress(address, length = 4) {
    if (!address) return '';
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    return !!this.account;
  }

  /**
   * Get current account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Get current chain
   */
  getCurrentChain() {
    return this.currentChain;
  }
}

// Singleton instance
let multiChainManager = null;

export const getMultiChainManager = (config) => {
  if (!multiChainManager) {
    multiChainManager = new MultiChainManager(config);
  }
  return multiChainManager;
};

export default MultiChainManager;
