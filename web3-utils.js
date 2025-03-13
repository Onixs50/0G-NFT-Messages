// Check if uiUtils already exists in the window object
if (typeof window.uiUtils === 'undefined') {
    console.warn('uiUtils not defined, creating minimal version');
    window.uiUtils = {
        showToast: function(message, type) {
            console.log(`[${type}] ${message}`);
        },
        showLoading: function(message) {
            console.log(`Loading: ${message}`);
        },
        hideLoading: function() {
            console.log('Loading hidden');
        },
        showTransactionStatus: function(status, data) {
            console.log(`Transaction status: ${status}`, data);
        }
    };
}

// Define web3Utils object
window.web3Utils = {
    web3: null,
    currentAccount: null,
    isConnecting: false,
    contract: null,
    
    /**
     * Initialize Web3
     */
    init: async function() {
        console.log('Initializing Web3 utilities...');
        
        // Check if MetaMask or other Web3 provider is available
        if (window.ethereum) {
            this.web3 = new Web3(window.ethereum);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Account changed:', accounts);
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.currentAccount = accounts[0];
                    this.updateWalletUI();
                    
                    // Check if on the correct network
                    this.checkAndSwitchNetwork();
                    
                    // Dispatch event for account change
                    document.dispatchEvent(new CustomEvent('accountChanged', { 
                        detail: { account: accounts[0] } 
                    }));
                }
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Network changed:', chainId);
                
                // Convert chainId to hex if it's not already
                const hexChainId = chainId.startsWith('0x') ? chainId : `0x${parseInt(chainId).toString(16)}`;
                
                // Check if the new chain is our target chain
                if (hexChainId !== NETWORK.chainId) {
                    console.log('Wrong network detected, switching to 0G...');
                    this.switchToNetwork();
                } else {
                    console.log('Correct network detected');
                    this.setupContract();
                    
                    // Reload data
                    if (this.isConnected()) {
                        document.dispatchEvent(new Event('networkChanged'));
                    }
                }
            });
            
            // Try to reconnect if previously connected
            this.tryReconnect();
        } else {
            console.warn('No Ethereum provider detected');
        }
    },
    
    /**
     * Try to reconnect to previously connected wallet
     */
    tryReconnect: async function() {
        try {
            const cachedAccount = localStorage.getItem('connectedAccount');
            if (cachedAccount) {
                await this.connectWallet('metamask');
            }
        } catch (error) {
            console.error('Failed to reconnect wallet:', error);
        }
    },
    
    /**
     * Connect wallet
     * @param {string} walletType - Type of wallet ('metamask' or 'okx')
     * @returns {string} Connected account address
     */
    connectWallet: async function(walletType = 'metamask') {
        if (this.isConnecting) return;
        
        this.isConnecting = true;
        
        try {
            let provider;
            
            switch (walletType) {
                case 'metamask':
                    provider = window.ethereum;
                    break;
                case 'okx':
                    provider = window.okxwallet;
                    break;
                default:
                    provider = window.ethereum;
            }
            
            if (!provider) {
                throw new Error(`${walletType} wallet not found. Please install it.`);
            }
            
            // Request accounts
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found.');
            }
            
            this.web3 = new Web3(provider);
            this.currentAccount = accounts[0];
            
            // Switch to the correct network
            await this.switchToNetwork();
            
            // Setup contract
            this.setupContract();
            
            // Save connected account
            localStorage.setItem('connectedAccount', this.currentAccount);
            
            // Update UI
            this.updateWalletUI();
            
            // Dispatch wallet connected event
            document.dispatchEvent(new CustomEvent('walletConnected', { 
                detail: { account: this.currentAccount } 
            }));
            
            // Show success notification
            window.uiUtils.showToast('Wallet connected successfully', 'success');
            
            return this.currentAccount;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            window.uiUtils.showToast(`Failed to connect wallet: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isConnecting = false;
        }
    },
    
    /**
     * Disconnect wallet
     */
    disconnectWallet: function() {
        this.currentAccount = null;
        localStorage.removeItem('connectedAccount');
        this.updateWalletUI();
        
        // Dispatch wallet disconnected event
        document.dispatchEvent(new Event('walletDisconnected'));
        
        // Show notification
        window.uiUtils.showToast('Wallet disconnected', 'info');
    },
    
    /**
     * Switch to 0G Network
     */
    switchToNetwork: async function() {
        if (!window.ethereum) {
            console.error('No ethereum provider available');
            return false;
        }
        
        try {
            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: NETWORK.chainId }],
            });
            
            console.log('Successfully switched to 0G network');
            return true;
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: NETWORK.chainId,
                                chainName: NETWORK.name,
                                nativeCurrency: NETWORK.currency,
                                rpcUrls: NETWORK.rpcUrls,
                                blockExplorerUrls: [NETWORK.blockExplorer]
                            },
                        ],
                    });
                    
                    // Try switching again
                    return await this.switchToNetwork();
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    window.uiUtils.showToast(`Failed to add 0G network: ${addError.message}`, 'error');
                    return false;
                }
            } else {
                console.error('Error switching network:', switchError);
                window.uiUtils.showToast(`Failed to switch to 0G network: ${switchError.message}`, 'error');
                return false;
            }
        }
    },
    
    /**
     * Check if on the correct network and switch if needed
     */
    checkAndSwitchNetwork: async function() {
        if (!window.ethereum || !this.web3) return false;
        
        try {
            const chainId = await this.web3.eth.getChainId();
            const hexChainId = `0x${chainId.toString(16)}`;
            
            if (hexChainId !== NETWORK.chainId) {
                console.log('Wrong network detected, switching to 0G...');
                return await this.switchToNetwork();
            }
            
            return true;
        } catch (error) {
            console.error('Error checking network:', error);
            return false;
        }
    },
    
    /**
     * Update wallet UI based on connection state
     */
    updateWalletUI: function() {
        const walletConnected = document.getElementById('wallet-connected');
        const walletDisconnected = document.getElementById('wallet-disconnected');
        const walletAddress = document.getElementById('wallet-address');
        
        if (this.isConnected()) {
            walletConnected.classList.remove('hidden');
            walletDisconnected.classList.add('hidden');
            
            // Format and display wallet address
            if (walletAddress) {
                const formattedAddress = `${this.currentAccount.substring(0, 6)}...${this.currentAccount.substring(38)}`;
                walletAddress.textContent = formattedAddress;
                walletAddress.setAttribute('data-address', this.currentAccount);
            }
        } else {
            walletConnected.classList.add('hidden');
            walletDisconnected.classList.remove('hidden');
        }
    },
    
    /**
     * Setup the NFT contract instance
     */
    setupContract: function() {
        if (!this.web3) return;
        
        try {
            this.contract = new this.web3.eth.Contract(
                NFT_ABI,
                NETWORK.contractAddress
            );
            console.log('Contract initialized:', this.contract);
        } catch (error) {
            console.error('Failed to initialize contract:', error);
        }
    },
    
    /**
     * Check if wallet is connected
     * @returns {boolean} Whether wallet is connected
     */
    isConnected: function() {
        return !!this.currentAccount;
    },
    
    /**
     * Get current wallet address
     * @returns {string|null} Current wallet address or null if not connected
     */
    getCurrentAccount: function() {
        return this.currentAccount;
    },
    
    /**
     * Mint a new NFT
     * @param {string} tokenURI - IPFS URI for the NFT metadata
     * @param {string} name - Name of the NFT
     * @returns {Object} Transaction receipt
     */
    mintNFT: async function(tokenURI, name) {
        if (!this.isConnected()) {
            throw new Error('Wallet not connected');
        }
        
        try {
            // Show transaction pending
            window.uiUtils.showTransactionStatus('pending');
            
            const receipt = await this.contract.methods.mintNFT(tokenURI, name).send({
                from: this.currentAccount
            });
            
            console.log('NFT minted successfully:', receipt);
            
            // Extract token ID from the event
            const mintEvent = receipt.events.NFTMinted;
            const tokenId = mintEvent ? mintEvent.returnValues.tokenId : null;
            
            // Show success message
            window.uiUtils.showTransactionStatus('success', {
                txHash: receipt.transactionHash,
                message: 'NFT minted successfully!'
            });
            
            return { receipt, tokenId };
        } catch (error) {
            console.error('Failed to mint NFT:', error);
            
            // Show error message
            window.uiUtils.showTransactionStatus('error', {
                message: `Failed to mint NFT: ${error.message}`
            });
            
            throw error;
        }
    },
    
    /**
     * Send a message to an NFT
     * @param {string|number} tokenId - ID of the NFT
     * @param {string} message - Message to send
     * @returns {Object} Transaction receipt
     */
    sendMessage: async function(tokenId, message) {
        if (!this.isConnected()) {
            throw new Error('Wallet not connected');
        }
        
        try {
            // Show transaction pending
            window.uiUtils.showTransactionStatus('pending');
            
            const receipt = await this.contract.methods.sendMessage(tokenId, message).send({
                from: this.currentAccount
            });
            
            console.log('Message sent successfully:', receipt);
            
            // Show success message
            window.uiUtils.showTransactionStatus('success', {
                txHash: receipt.transactionHash,
                message: 'Message sent successfully!'
            });
            
            return receipt;
        } catch (error) {
            console.error('Failed to send message:', error);
            
            // Show error message
            window.uiUtils.showTransactionStatus('error', {
                message: `Failed to send message: ${error.message}`
            });
            
            throw error;
        }
    },
    
    /**
     * Burn an NFT
     * @param {string|number} tokenId - Token ID to burn
     * @returns {Promise} Transaction result
     */
    burnNFT: async function(tokenId) {
        try {
            console.log('Starting burnNFT function for token ID:', tokenId);
            
            // Check if wallet is connected
            if (!this.isConnected()) {
                console.error('Wallet not connected');
                throw new Error('Wallet not connected');
            }
            
            // Check if contract is available
            if (!this.contract) {
                console.error('Contract not initialized');
                this.setupContract();
                if (!this.contract) {
                    console.error('Failed to initialize contract');
                    throw new Error('Contract not available');
                }
            }
            
            // Get current account
            const account = this.getCurrentAccount();
            if (!account) {
                console.error('Account not available');
                throw new Error('Account not available');
            }
            
            // Check if the user is the owner of the NFT
            try {
                const owner = await this.contract.methods.ownerOf(tokenId).call();
                console.log('NFT owner:', owner, 'Current account:', account);
                
                if (owner.toLowerCase() !== account.toLowerCase()) {
                    throw new Error('You are not the owner of this NFT');
                }
            } catch (error) {
                if (error.message.includes('owner query for nonexistent token')) {
                    throw new Error('This NFT does not exist');
                }
                throw error;
            }
            
            console.log('Burning NFT:', tokenId, 'from account:', account);
            
            // Show transaction pending status
            if (window.uiUtils && window.uiUtils.showTransactionStatus) {
                window.uiUtils.showTransactionStatus('pending', {
                    message: 'Please confirm the transaction in your wallet...'
                });
            }
            
            // Convert tokenId to number if it's a string
            const tokenIdNumber = typeof tokenId === 'string' ? parseInt(tokenId) : tokenId;
            
            // Estimate gas first to check if the transaction will fail
            let gasEstimate;
            try {
                gasEstimate = await this.contract.methods.burnNFT(tokenIdNumber).estimateGas({
                    from: account
                });
                console.log('Gas estimate for burning NFT:', gasEstimate);
            } catch (error) {
                console.error('Gas estimation failed:', error);
                throw new Error(`Transaction would fail: ${error.message}`);
            }
            
            // Call the burnNFT function on the contract
            console.log('Calling contract.methods.burnNFT with tokenId:', tokenIdNumber);
            const tx = await this.contract.methods.burnNFT(tokenIdNumber).send({
                from: account,
                gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer to gas estimate
            });
            
            console.log('NFT burned transaction receipt:', tx);
            
            // Verify the transaction by checking events
            let burnSuccessful = false;
            
            if (tx.events && tx.events.NFTBurned) {
                burnSuccessful = true;
                console.log('NFT burned event found:', tx.events.NFTBurned);
            } else if (tx.events && tx.events.Transfer) {
                // ERC721 transfers to zero address for burns
                const transferEvent = tx.events.Transfer;
                if (transferEvent.returnValues && 
                    transferEvent.returnValues.to && 
                    transferEvent.returnValues.to === '0x0000000000000000000000000000000000000000') {
                    burnSuccessful = true;
                    console.log('Transfer to zero address detected (burn):', transferEvent);
                }
            }
            
            // Double check that the NFT no longer exists
            try {
                await this.contract.methods.ownerOf(tokenId).call();
                console.warn('Warning: NFT still exists after burn operation');
                // We won't throw an error here as the transaction was confirmed
            } catch (error) {
                if (error.message.includes('owner query for nonexistent token')) {
                    burnSuccessful = true;
                    console.log('Confirmed: NFT no longer exists');
                }
            }
            
            if (burnSuccessful) {
                // Show success status
                if (window.uiUtils && window.uiUtils.showTransactionStatus) {
                    window.uiUtils.showTransactionStatus('success', {
                        txHash: tx.transactionHash,
                        message: 'NFT burned successfully!'
                    });
                }
                
                // Remove from local storage or cache if applicable
                try {
                    const cachedNFTs = JSON.parse(localStorage.getItem('userNFTs') || '[]');
                    const updatedNFTs = cachedNFTs.filter(nft => nft.tokenId !== tokenIdNumber.toString());
                    localStorage.setItem('userNFTs', JSON.stringify(updatedNFTs));
                } catch (e) {
                    console.warn('Failed to update local cache:', e);
                }
                
                return {
                    success: true,
                    receipt: tx,
                    tokenId: tokenIdNumber
                };
            } else {
                console.error('Burn transaction completed but no burn event found');
                if (window.uiUtils && window.uiUtils.showTransactionStatus) {
                    window.uiUtils.showTransactionStatus('warning', {
                        txHash: tx.transactionHash,
                        message: 'Transaction confirmed, but NFT burn could not be verified'
                    });
                }
                
                return {
                    success: false,
                    receipt: tx,
                    tokenId: tokenIdNumber,
                    warning: 'Transaction confirmed, but NFT burn could not be verified'
                };
            }
        } catch (error) {
            console.error('Error burning NFT:', error);
            
            // Show error status
            if (window.uiUtils && window.uiUtils.showTransactionStatus) {
                window.uiUtils.showTransactionStatus('error', {
                    message: `Failed to burn NFT: ${error.message}`
                });
            }
            
            throw error;
        }
    },
    
    /**
     * Get NFTs owned by the current account
     * @returns {Array} Array of token IDs owned by current account
     */
    getOwnedNFTs: async function() {
        if (!this.isConnected()) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const tokenIds = await this.contract.methods.getOwnedNFTs(this.currentAccount).call();
            return tokenIds;
        } catch (error) {
            console.error('Failed to get owned NFTs:', error);
            throw error;
        }
    },
    
    /**
     * Get messages for an NFT
     * @param {string|number} tokenId - ID of the NFT
     * @returns {Array} Array of messages
     */
    getNFTMessages: async function(tokenId) {
        if (!this.isConnected()) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const messages = await this.contract.methods.getMessages(tokenId).call({
                from: this.currentAccount
            });
            return messages;
        } catch (error) {
            console.error('Failed to get NFT messages:', error);
            throw error;
        }
    },
    
    /**
     * Get the owner of an NFT
     * @param {string|number} tokenId - ID of the NFT
     * @returns {string} Owner address
     */
    getNFTOwner: async function(tokenId) {
        try {
            return await this.contract.methods.ownerOf(tokenId).call();
        } catch (error) {
            console.error('Failed to get NFT owner:', error);
            throw error;
        }
    },
    
    /**
     * Get NFT name
     * @param {string|number} tokenId - ID of the NFT
     * @returns {string} NFT name
     */
    getNFTName: async function(tokenId) {
        try {
            return await this.contract.methods.getNFTName(tokenId).call();
        } catch (error) {
            console.error('Failed to get NFT name:', error);
            throw error;
        }
    },
    
    /**
     * Get NFT token URI
     * @param {string|number} tokenId - ID of the NFT
     * @returns {string} Token URI
     */
    getTokenURI: async function(tokenId) {
        try {
            return await this.contract.methods.tokenURI(tokenId).call();
        } catch (error) {
            console.error('Failed to get token URI:', error);
            throw error;
        }
    },
    
    /**
     * Get total supply of NFTs
     * @returns {number} Total supply
     */
    getTotalSupply: async function() {
        try {
            return await this.contract.methods.totalSupply().call();
        } catch (error) {
            console.error('Failed to get total supply:', error);
            throw error;
        }
    },
    
    /**
     * Get next token ID
     * @returns {number} Next token ID
     */
    getNextTokenId: async function() {
        try {
            return await this.contract.methods.nextTokenId().call();
        } catch (error) {
            console.error('Failed to get next token ID:', error);
            throw error;
        }
    },
    
    /**
     * Get token by index
     * @param {number} index - Token index
     * @returns {number} Token ID
     */
    getTokenByIndex: async function(index) {
        try {
            return await this.contract.methods.tokenByIndex(index).call();
        } catch (error) {
            console.error('Failed to get token by index:', error);
            throw error;
        }
    },
    
    /**
     * Get top message sender
     * @returns {string} Address of top sender
     */
    getTopSender: async function() {
        try {
            return await this.contract.methods.getTopSender().call();
        } catch (error) {
            console.error('Failed to get top sender:', error);
            throw error;
        }
    },
    
    /**
     * Get top message receiver
     * @returns {string} Address of top receiver
     */
    getTopReceiver: async function() {
        try {
            return await this.contract.methods.getTopReceiver().call();
        } catch (error) {
            console.error('Failed to get top receiver:', error);
            throw error;
        }
    },
    
    /**
     * Get sent messages count for an address
     * @param {string} address - Ethereum address
     * @returns {number} Number of sent messages
     */
    getSentMessagesCount: async function(address) {
        try {
            return await this.contract.methods.sentMessagesCount(address).call();
        } catch (error) {
            console.error('Failed to get sent messages count:', error);
            throw error;
        }
    },
    
    /**
     * Get received messages count for an address
     * @param {string} address - Ethereum address
     * @returns {number} Number of received messages
     */
    getReceivedMessagesCount: async function(address) {
        try {
            return await this.contract.methods.receivedMessagesCount(address).call();
        } catch (error) {
            console.error('Failed to get received messages count:', error);
            throw error;
        }
    },
    
    /**
     * Format address to a shorter version
     * @param {string} address - Ethereum address
     * @returns {string} Formatted address
     */
    formatAddress: function(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
    
    /**
     * Get transaction URL on block explorer
     * @param {string} txHash - Transaction hash
     * @returns {string} Transaction URL
     */
    getTransactionUrl: function(txHash) {
        return `${NETWORK.blockExplorer}/tx/${txHash}`;
    },
    
    /**
     * Get address URL on block explorer
     * @param {string} address - Ethereum address
     * @returns {string} Address URL
     */
    getAddressUrl: function(address) {
        return `${NETWORK.blockExplorer}/address/${address}`;
    },
    
    /**
     * Get token URL on block explorer
     * @param {string|number} tokenId - Token ID
     * @returns {string} Token URL
     */
    getTokenUrl: function(tokenId) {
        return `${NETWORK.blockExplorer}/token/${NETWORK.contractAddress}?a=${tokenId}`;
    }
};