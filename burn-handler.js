// burn-handler.js
console.log('Burn Handler loading...');

// Create the burn handler object
const burnHandler = {
    // Define contract address directly
    contractAddress: '0x3ad6ca089c783c637b7049c82aaf317a055fd850',
    
    // Track pending transactions to prevent duplicates
    pendingBurns: {},
    
    // Store the current page type
    currentPage: null,
    
    /**
     * Determine the current page type
     * @returns {string} Page type: 'gallery', 'mint', or 'other'
     */
    detectPageType: function() {
        // Check if we're on a mint page first
        if (this.isMintPage()) {
            return 'mint';
        }
        
        // Then check if we're on a gallery page
        if (this.isGalleryPage()) {
            return 'gallery';
        }
        
        // Default to other
        return 'other';
    },
    
    /**
     * Check if we're on a gallery/collection page
     * @returns {boolean} True if on gallery page
     */
    isGalleryPage: function() {
        // Check URL patterns
        const galleryUrlPatterns = [
            '/gallery', 
            '/collection', 
            '#gallery', 
            '#collection',
            '/nfts',
            '#nfts',
            'view=gallery',
            'view=collection',
            'tab=gallery',
            'tab=collection'
        ];
        
        for (const pattern of galleryUrlPatterns) {
            if (window.location.href.includes(pattern)) {
                console.log(`Detected gallery page from URL pattern: ${pattern}`);
                return true;
            }
        }
        
        // Check for tab elements with gallery/collection IDs
        const galleryTabs = document.querySelectorAll('.nav-tab[data-tab="gallery"], .nav-tab[data-tab="collection"], .tab[data-target="gallery"], .tab[data-target="collection"]');
        if (galleryTabs.length > 0) {
            for (const tab of galleryTabs) {
                if (tab.classList.contains('active')) {
                    console.log('Detected gallery page from active tab');
                    return true;
                }
            }
        }
        
        // Check for gallery-related elements
        const galleryElements = document.querySelectorAll(
            '.gallery, .collection, .nft-grid, .nft-list, .nft-card, .nft-item, .gallery-container, .collection-container'
        );
        
        if (galleryElements.length > 3) { // If we have multiple gallery elements, it's likely a gallery page
            console.log(`Detected gallery page from ${galleryElements.length} gallery elements`);
            return true;
        }
        
        // Check for NFT detail view
        const nftDetailElements = document.querySelectorAll(
            '.nft-detail, .nft-details, .token-details, .nft-view, #nft-detail'
        );
        
        if (nftDetailElements.length > 0) {
            console.log('Detected NFT detail view');
            return true;
        }
        
        return false;
    },
    
    /**
     * Check if we're on a mint page
     * @returns {boolean} True if on mint page
     */
    isMintPage: function() {
        // Check URL patterns
        const mintUrlPatterns = [
            '/mint', 
            '/create', 
            '#mint', 
            '#create',
            'view=mint',
            'view=create',
            'tab=mint',
            'tab=create'
        ];
        
        for (const pattern of mintUrlPatterns) {
            if (window.location.href.includes(pattern)) {
                console.log(`Detected mint page from URL pattern: ${pattern}`);
                return true;
            }
        }
        
        // Check for tab elements with mint IDs
        const mintTabs = document.querySelectorAll('.nav-tab[data-tab="mint"], .nav-tab[data-tab="create"], .tab[data-target="mint"], .tab[data-target="create"]');
        if (mintTabs.length > 0) {
            for (const tab of mintTabs) {
                if (tab.classList.contains('active')) {
                    console.log('Detected mint page from active tab');
                    return true;
                }
            }
        }
        
        // Check for mint-related elements - look for combinations of elements
        const mintFormElements = document.querySelectorAll(
            '#mint-form, .mint-form, #create-form, .create-form'
        );
        
        const mintInputElements = document.querySelectorAll(
            '#nft-name, #nft-description, #token-name, #token-description'
        );
        
        const mintButtonElements = document.querySelectorAll(
            '#mint-nft-btn, .mint-nft-btn, #create-nft-btn, .create-nft-btn, button[data-action="mint"]'
        );
        
        const uploadElements = document.querySelectorAll(
            '.upload-area, #upload-area, .image-upload, #image-upload'
        );
        
        // If we have elements from at least 2 of these categories, it's likely a mint page
        let mintElementCategories = 0;
        if (mintFormElements.length > 0) mintElementCategories++;
        if (mintInputElements.length > 0) mintElementCategories++;
        if (mintButtonElements.length > 0) mintElementCategories++;
        if (uploadElements.length > 0) mintElementCategories++;
        
        if (mintElementCategories >= 2) {
            console.log(`Detected mint page from ${mintElementCategories} categories of mint elements`);
            return true;
        }
        
        return false;
    },
    
    /**
     * Initialize the handler
     */
    init: function() {
        console.log('Initializing Burn Handler...');
        
        // Detect the current page type
        this.currentPage = this.detectPageType();
        console.log(`Current page type detected as: ${this.currentPage}`);
        
        // Only activate on gallery pages
        if (this.currentPage !== 'gallery') {
            console.log(`Not activating burn handler on ${this.currentPage} page`);
            return;
        }
        
        console.log('Activating burn handler on gallery page');
        
        // Override existing burn functions
        this.overrideExistingFunctions();
        
        // Setup direct event listeners
        this.setupDirectEventListeners();
        
        // Add global click handler as fallback
        this.setupGlobalClickHandler();
        
        // Watch for tab changes that might change the page type
        this.watchForTabChanges();
        
        console.log('Burn handler activated successfully');
    },
    
    /**
     * Watch for tab changes that might change the page type
     */
    watchForTabChanges: function() {
        // Monitor tab clicks to update the current page type
        document.addEventListener('click', (event) => {
            const tabElement = event.target.closest('.nav-tab, .tab');
            if (!tabElement) return;
            
            const tabId = tabElement.getAttribute('data-tab') || tabElement.getAttribute('data-target');
            if (!tabId) return;
            
            // Give the DOM time to update
            setTimeout(() => {
                // Re-detect page type
                const newPageType = this.detectPageType();
                
                if (newPageType !== this.currentPage) {
                    console.log(`Page type changed from ${this.currentPage} to ${newPageType}`);
                    this.currentPage = newPageType;
                    
                    // Reactivate burn handler if we switched to gallery
                    if (newPageType === 'gallery') {
                        console.log('Reactivating burn handler on gallery tab');
                        this.setupDirectEventListeners();
                    }
                }
            }, 200);
        });
    },

    /**
     * Override existing burn functions in the app
     */
    overrideExistingFunctions: function() {
        console.log('Overriding existing burn functions');
        
        // Override app.burnNFT if it exists
        if (window.app && typeof window.app.burnNFT === 'function') {
            console.log('Overriding app.burnNFT');
            
            // Store the original function
            window.app._originalBurnNFT = window.app.burnNFT;
            
            // Replace with our function
            window.app.burnNFT = async (tokenId) => {
                console.log('Intercepted app.burnNFT call with tokenId:', tokenId);
                
                // Only process if we're on a gallery page
                if (this.currentPage !== 'gallery') {
                    console.log(`Not processing burn on ${this.currentPage} page`);
                    return null;
                }
                
                return await this.burnNFT(tokenId);
            };
        }
        
        // Override web3Utils.burnNFT if it exists
        if (window.web3Utils && typeof window.web3Utils.burnNFT === 'function') {
            console.log('Overriding web3Utils.burnNFT');
            
            // Store the original function
            window.web3Utils._originalBurnNFT = window.web3Utils.burnNFT;
            
            // Replace with our function
            window.web3Utils.burnNFT = async (tokenId) => {
                console.log('Intercepted web3Utils.burnNFT call with tokenId:', tokenId);
                
                // Only process if we're on a gallery page
                if (this.currentPage !== 'gallery') {
                    console.log(`Not processing burn on ${this.currentPage} page`);
                    return null;
                }
                
                return await this.burnNFT(tokenId);
            };
        }
        
        // Override any confirmBurnNFT functions
        if (window.app && typeof window.app.confirmBurnNFT === 'function') {
            console.log('Overriding app.confirmBurnNFT');
            
            // Store the original function
            window.app._originalConfirmBurnNFT = window.app.confirmBurnNFT;
            
            // Replace with our function
            window.app.confirmBurnNFT = (tokenId) => {
                console.log('Intercepted app.confirmBurnNFT call with tokenId:', tokenId);
                
                // Only process if we're on a gallery page
                if (this.currentPage !== 'gallery') {
                    console.log(`Not processing burn on ${this.currentPage} page`);
                    return;
                }
                
                this.handleBurnClick(null, tokenId);
            };
        }
    },
    
    /**
     * Setup direct event listeners for known burn buttons
     */
    setupDirectEventListeners: function() {
        console.log('Setting up direct event listeners for burn buttons');
        
        // Common button IDs used for burning NFTs
        const burnButtonIds = [
            'burn-nft',
            'detail-burn-nft',
            'burn-button',
            'burnNFT',
            'burnButton',
            'burn-token',
            'burn'
        ];
        
        // Add event listeners to buttons with these IDs
        burnButtonIds.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                console.log(`Found burn button with ID: ${id}`);
                
                // Remove any existing click listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', (event) => {
                    console.log(`Burn button clicked: ${id}`);
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Only process if we're on a gallery page
                    if (this.currentPage !== 'gallery') {
                        console.log(`Not processing burn on ${this.currentPage} page`);
                        return;
                    }
                    
                    // Get the token ID from the current selection
                    let tokenId = this.getTokenIdFromContext(newButton);
                    
                    if (tokenId) {
                        this.handleBurnClick(event, tokenId);
                    }
                });
            }
        });
        
        // Also find buttons by class
        const burnButtonClasses = [
            'burn-btn',
            'burn-button',
            'btn-burn',
            'button-burn'
        ];
        
        burnButtonClasses.forEach(className => {
            const buttons = document.getElementsByClassName(className);
            if (buttons.length > 0) {
                console.log(`Found ${buttons.length} burn buttons with class: ${className}`);
                Array.from(buttons).forEach(button => {
                    // Remove any existing click listeners
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    
                    newButton.addEventListener('click', (event) => {
                        console.log(`Burn button clicked: ${className}`);
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // Only process if we're on a gallery page
                        if (this.currentPage !== 'gallery') {
                            console.log(`Not processing burn on ${this.currentPage} page`);
                            return;
                        }
                        
                        // Get token ID from button attributes
                        let tokenId = this.getTokenIdFromContext(newButton);
                        
                        if (tokenId) {
                            this.handleBurnClick(event, tokenId);
                        }
                    });
                });
            }
        });
    },
    
    /**
     * Get token ID from context (button, selected NFT, etc.)
     * @param {Element} element - The button or element that was clicked
     * @returns {string|number|null} - The token ID or null if not found
     */
    getTokenIdFromContext: function(element) {
        // Try to get token ID from element attributes
        let tokenId = element.getAttribute('data-token-id') || 
                      element.getAttribute('data-tokenid') || 
                      element.getAttribute('data-id');
        
        if (tokenId) {
            console.log(`Found token ID from element attributes: ${tokenId}`);
            return tokenId;
        }
        
        // Try to get token ID from parent container
        const container = element.closest('[data-token-id], [data-tokenid], [data-id]');
        if (container) {
            tokenId = container.getAttribute('data-token-id') || 
                      container.getAttribute('data-tokenid') || 
                      container.getAttribute('data-id');
            
            if (tokenId) {
                console.log(`Found token ID from container: ${tokenId}`);
                return tokenId;
            }
        }
        
        // Try to get token ID from app.selectedNFT
        if (window.app && window.app.selectedNFT && window.app.selectedNFT.tokenId) {
            tokenId = window.app.selectedNFT.tokenId;
            console.log(`Found token ID from app.selectedNFT: ${tokenId}`);
            return tokenId;
        }
        
        // Try to get token ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        tokenId = urlParams.get('tokenId') || urlParams.get('id') || urlParams.get('token');
        
        if (tokenId) {
            console.log(`Found token ID from URL: ${tokenId}`);
            return tokenId;
        }
        
        // Try to extract token ID from the URL path
        const urlPathMatch = window.location.pathname.match(/\/nft\/(\d+)|\/token\/(\d+)|\/(\d+)/);
        if (urlPathMatch) {
            tokenId = urlPathMatch[1] || urlPathMatch[2] || urlPathMatch[3];
            console.log(`Found token ID from URL path: ${tokenId}`);
            return tokenId;
        }
        
        // If all else fails, prompt the user
        tokenId = prompt('Please enter the Token ID of the NFT you want to burn:');
        if (tokenId) {
            console.log(`User entered token ID: ${tokenId}`);
            return tokenId;
        }
        
        console.log('Could not determine token ID');
        return null;
    },
    
    /**
     * Setup global click handler to catch all potential burn buttons
     */
    setupGlobalClickHandler: function() {
        console.log('Setting up global click handler for burn buttons');
        
        // Use event delegation to handle clicks
        document.addEventListener('click', (event) => {
            // Skip if we're not on a gallery page
            if (this.currentPage !== 'gallery') {
                return;
            }
            
            // Check if the click is already being handled by our direct event listeners
            if (event.defaultPrevented) {
                return;
            }
            
            const target = event.target;
            
            // Check if this is a button or link
            if (!target.tagName || (target.tagName !== 'BUTTON' && target.tagName !== 'A' && 
                !target.closest('button') && !target.closest('a'))) {
                return;
            }
            
            // Get the actual button element
            const element = target.tagName === 'BUTTON' || target.tagName === 'A' ? 
                          target : 
                          (target.closest('button') || target.closest('a'));
            
            // Check if this looks like a burn button
            const buttonText = element.textContent || '';
            const buttonId = element.id || '';
            const buttonClass = element.className || '';
            
            const isBurnButton = 
                buttonText.toLowerCase().includes('burn') ||
                buttonId.toLowerCase().includes('burn') ||
                buttonClass.toLowerCase().includes('burn') ||
                element.getAttribute('data-action') === 'burn' ||
                element.querySelector('.fa-fire, .fa-trash');
            
            if (isBurnButton) {
                console.log('Potential burn button clicked via global handler:', element);
                
                // Prevent default action and stop propagation
                event.preventDefault();
                event.stopPropagation();
                
                // Get token ID from context
                let tokenId = this.getTokenIdFromContext(element);
                
                if (tokenId) {
                    this.handleBurnClick(event, tokenId);
                }
            }
        }, true); // Use capture phase to intercept events early
    },
    
    /**
     * Handle burn button click
     * @param {Event|null} event - The click event
     * @param {string|number} tokenId - Token ID to burn
     */
    handleBurnClick: function(event, tokenId) {
        console.log('Burn button click handler triggered with tokenId:', tokenId);
        
        // Prevent default action if event exists
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (!tokenId) {
            console.error('No token ID provided');
            alert('Please provide a token ID to burn');
            return;
        }
        
        // Clean and validate token ID
        let cleanTokenId;
        
        try {
            if (typeof tokenId === 'string') {
                // Remove any non-numeric characters
                cleanTokenId = tokenId.replace(/[^0-9]/g, '');
                
                if (!cleanTokenId) {
                    throw new Error('Token ID must contain numeric characters');
                }
                
                cleanTokenId = parseInt(cleanTokenId, 10);
                
                if (isNaN(cleanTokenId)) {
                    throw new Error('Token ID must be a number');
                }
            } else if (typeof tokenId === 'number') {
                cleanTokenId = tokenId;
            } else {
                throw new Error('Invalid token ID type');
            }
            
            // Ensure it's a positive number
            if (cleanTokenId <= 0) {
                throw new Error('Token ID must be a positive number');
            }
        } catch (error) {
            console.error('Invalid token ID:', error);
            alert(`Invalid token ID: ${error.message}`);
            return;
        }
        
        console.log('Validated token ID:', cleanTokenId);
        
        // Check if we're already processing this token ID
        if (this.pendingBurns[cleanTokenId]) {
            console.log(`Already processing burn for token ID: ${cleanTokenId}`);
            alert(`Already processing a burn transaction for token ID: ${cleanTokenId}`);
            return;
        }
        
        // Show confirmation dialog using SweetAlert if available, otherwise use confirm
        if (window.Swal) {
            window.Swal.fire({
                title: 'Burn NFT?',
                html: `Are you sure you want to burn NFT with Token ID: <strong>${cleanTokenId}</strong>?<br><br>This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, burn it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log('User confirmed burn action (SweetAlert)');
                    
                    // Mark this token ID as pending
                    this.pendingBurns[cleanTokenId] = true;
                    
                    // Start the burn process
                    this.burnNFT(cleanTokenId)
                        .finally(() => {
                            // Clear the pending status when done
                            delete this.pendingBurns[cleanTokenId];
                        });
                } else {
                    console.log('User cancelled burn action (SweetAlert)');
                }
            });
        } else {
            // Fallback to standard confirm
            if (confirm(`Are you sure you want to burn NFT with Token ID: ${cleanTokenId}? This action cannot be undone.`)) {
                console.log('User confirmed burn action');
                
                // Mark this token ID as pending
                this.pendingBurns[cleanTokenId] = true;
                
                // Start the burn process
                this.burnNFT(cleanTokenId)
                    .finally(() => {
                        // Clear the pending status when done
                        delete this.pendingBurns[cleanTokenId];
                    });
            } else {
                console.log('User cancelled burn action');
            }
        }
    },
    
    /**
     * Get contract ABI
     * @returns {Array} Contract ABI
     */
    getContractABI: function() {
        // Default minimal ABI for ERC721 with burn function
        const defaultABI = [
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "burnNFT",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "ownerOf",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        // Try to get ABI from various possible sources
        if (window.NFT_ABI) {
            return window.NFT_ABI;
        } else if (window.CONTRACT_ABI) {
            return window.CONTRACT_ABI;
        } else if (window.ABI) {
            return window.ABI;
        } else {
            console.warn('Using default ABI for ERC721 with burn function');
            return defaultABI;
        }
    },
    
    /**
     * Get contract address
     * @returns {string} Contract address
     */
    getContractAddress: function() {
        // Use the directly defined address as default
        let address = this.contractAddress;
        
        // Try to get address from various possible sources
        if (window.NFT_CONTRACT_ADDRESS) {
            address = window.NFT_CONTRACT_ADDRESS;
        } else if (window.CONTRACT_ADDRESS) {
            address = window.CONTRACT_ADDRESS;
        } else if (window.app && window.app.contractAddress) {
            address = window.app.contractAddress;
        } else if (window.web3Utils && window.web3Utils.contractAddress) {
            address = window.web3Utils.contractAddress;
        }
        
        console.log('Using contract address:', address);
        return address;
    },
    
    /**
     * Burn the NFT
     * @param {number} tokenId - Token ID to burn
     * @returns {Promise<Object>} Transaction result
     */
    burnNFT: async function(tokenId) {
        console.log('Starting burnNFT with token ID:', tokenId);
        
        // Validate token ID again to be sure
        if (typeof tokenId !== 'number' || isNaN(tokenId) || tokenId <= 0) {
            console.error('Invalid token ID:', tokenId);
            throw new Error('Invalid token ID: Must be a positive number');
        }
        
        try {
            // Show loading
            this.showLoading(`Burning NFT with Token ID: ${tokenId}...`);
            
            // Check if Web3 is available
            if (typeof Web3 === 'undefined') {
                console.error('Web3 library not found');
                throw new Error('Web3 is not available. Please make sure Web3.js is loaded.');
            }
            
            // Check if ethereum provider is available
            if (!window.ethereum) {
                console.error('No Ethereum provider found');
                throw new Error('No Ethereum provider found. Please install MetaMask or another wallet');
            }
            
            // Create Web3 instance
            const web3 = new Web3(window.ethereum);
            console.log('Web3 instance created');
            
            // Request account access
            console.log('Requesting account access...');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            console.log('Connected account:', account);
            
            // Get the NFT contract address
            const contractAddress = this.getContractAddress();
            
            // Get contract ABI
            const contractABI = this.getContractABI();
            
            // Create contract instance
            console.log('Creating contract instance...');
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Check if the burnNFT method exists
            if (!contract.methods.burnNFT) {
                console.error('burnNFT method not found in contract');
                throw new Error('This contract does not support the burnNFT method');
            }
            
            // Check if user is the owner of the NFT
            console.log(`Checking ownership of token ID: ${tokenId}`);
            try {
                const owner = await contract.methods.ownerOf(tokenId).call();
                console.log('NFT owner:', owner);
                console.log('Current account:', account);
                
                if (owner.toLowerCase() !== account.toLowerCase()) {
                    throw new Error('You are not the owner of this NFT');
                }
                
                console.log('User is the owner, proceeding with burn');
            } catch (error) {
                if (error.message.includes('owner query for nonexistent token')) {
                    throw new Error('This NFT does not exist');
                }
                throw error;
            }
            
            // Estimate gas to ensure the transaction will succeed
            let gasEstimate;
            try {
                console.log('Estimating gas...');
                gasEstimate = await contract.methods.burnNFT(tokenId).estimateGas({
                    from: account
                });
                console.log('Gas estimate:', gasEstimate);
            } catch (error) {
                console.error('Gas estimation failed:', error);
                throw new Error(`Transaction would fail: ${error.message}`);
            }
            
            // Call the burnNFT function
            console.log(`Sending burn transaction for token ID: ${tokenId}`);
            this.showMessage('Please confirm the transaction in your wallet...', 'info');
            
            const tx = await contract.methods.burnNFT(tokenId).send({
                from: account,
                gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
            });
            
            console.log('Burn transaction successful:', tx);
            
            // Hide loading
            this.hideLoading();
            
            // Show success message
            this.showSuccess(`NFT with Token ID: ${tokenId} burned successfully!`);
            
            // Remove the NFT from the UI
            this.removeNFTFromUI(tokenId);
            
            return tx;
        } catch (error) {
            console.error('Error burning NFT:', error);
            
            // Hide loading
            this.hideLoading();
            
            // Show error message
            this.showError(`Failed to burn NFT: ${error.message}`);
            
            throw error;
        }
    },
    
    /**
     * Show loading message
     * @param {string} message - Loading message
     */
    showLoading: function(message) {
        console.log(`[Loading] ${message}`);
        
        // Check if uiUtils is available
        if (window.uiUtils && window.uiUtils.showLoading) {
            window.uiUtils.showLoading(message);
            return;
        }
        
        // Check if SweetAlert2 is available
        if (window.Swal) {
            window.Swal.fire({
                title: 'Processing...',
                html: message,
                allowOutsideClick: false,
                didOpen: () => {
                    window.Swal.showLoading();
                }
            });
            return;
        }
        
        // Fallback to alert
        alert(message);
    },
    
    /**
     * Hide loading message
     */
    hideLoading: function() {
        console.log('Hiding loading message');
        
        // Check if uiUtils is available
        if (window.uiUtils && window.uiUtils.hideLoading) {
            window.uiUtils.hideLoading();
            return;
        }
        
        // Check if SweetAlert2 is available
        if (window.Swal) {
            window.Swal.close();
            return;
        }
    },
    
    /**
     * Show message to the user
     * @param {string} message - Message content
     * @param {string} type - Message type: 'info', 'success', 'error', 'warning'
     */
    showMessage: function(message, type) {
        console.log(`[${type}] ${message}`);
        
        // Check if uiUtils is available
        if (window.uiUtils && window.uiUtils.showToast) {
            window.uiUtils.showToast(message, type);
            return;
        }
        
        // Check if SweetAlert2 is available
        if (window.Swal && type !== 'info') {
            window.Swal.fire({
                title: type.charAt(0).toUpperCase() + type.slice(1),
                text: message,
                icon: type,
                confirmButtonColor: '#3085d6'
            });
            return;
        }
        
        // Fallback to alert
        if (type === 'error') {
            alert(`Error: ${message}`);
        } else if (type === 'success') {
            alert(`Success: ${message}`);
        } else {
            alert(message);
        }
    },
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess: function(message) {
        this.showMessage(message, 'success');
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: function(message) {
        this.showMessage(message, 'error');
    },
    
    /**
     * Remove the NFT from the UI after successful burn
     * @param {number} tokenId - Token ID that was burned
     */
    removeNFTFromUI: function(tokenId) {
        console.log('Removing NFT from UI, token ID:', tokenId);
        
        // Find all elements with the token ID
        const nftElements = document.querySelectorAll(`[data-token-id="${tokenId}"], [data-tokenid="${tokenId}"], [data-id="${tokenId}"]`);
        
        if (nftElements.length > 0) {
            console.log(`Found ${nftElements.length} elements to remove`);
            
            nftElements.forEach(element => {
                // Find the parent container
                const container = element.closest('.nft-item, .nft-card, .collection-item, .nft-container, .token-card, .token-item');
                
                if (container) {
                    console.log('Removing container:', container);
                    container.style.opacity = '0.5';
                    container.style.transition = 'opacity 0.5s';
                    
                    setTimeout(() => {
                        container.remove();
                    }, 500);
                } else {
                    // If no container found, remove the element itself
                    element.style.opacity = '0.5';
                    element.style.transition = 'opacity 0.5s';
                    
                    setTimeout(() => {
                        element.remove();
                    }, 500);
                }
            });
        } else {
            console.log('No elements found with token ID:', tokenId);
            
            // Try to find elements with the token ID in text content
            const allNFTElements = document.querySelectorAll('.nft-item, .nft-card, .collection-item, .nft-container, .token-card, .token-item');
            
            allNFTElements.forEach(element => {
                if (element.textContent.includes(`Token ID: ${tokenId}`) || 
                    element.textContent.includes(`TokenID: ${tokenId}`) || 
                    element.textContent.includes(`ID: ${tokenId}`)) {
                    console.log('Found element with token ID in text:', element);
                    element.style.opacity = '0.5';
                    element.style.transition = 'opacity 0.5s';
                    
                    setTimeout(() => {
                        element.remove();
                    }, 500);
                }
            });
        }
        
        // Update any lists or caches
        if (window.app) {
            // Update NFT lists if they exist
            if (window.app.allNFTs) {
                window.app.allNFTs = window.app.allNFTs.filter(nft => nft.tokenId != tokenId);
            }
            
            if (window.app.userNFTs) {
                window.app.userNFTs = window.app.userNFTs.filter(nft => nft.tokenId != tokenId);
            }
            
            // Call refresh function if it exists
            if (typeof window.app.refreshData === 'function') {
                console.log('Calling app.refreshData() to update UI');
                setTimeout(() => {
                    window.app.refreshData();
                }, 1000);
            } else if (typeof window.app.refreshUI === 'function') {
                console.log('Calling app.refreshUI() to update UI');
                setTimeout(() => {
                    window.app.refreshUI();
                }, 1000);
            }
        }
        
        // Also update nftUtils lists if they exist
        if (window.nftUtils) {
            if (window.nftUtils.allNFTs) {
                window.nftUtils.allNFTs = window.nftUtils.allNFTs.filter(nft => nft.tokenId != tokenId);
            }
            
            if (window.nftUtils.userNFTs) {
                window.nftUtils.userNFTs = window.nftUtils.userNFTs.filter(nft => nft.tokenId != tokenId);
            }
        }
    }
};

// Initialize the burn handler when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing burn handler');
    burnHandler.init();
});

// Also initialize on page load in case DOMContentLoaded already fired
window.addEventListener('load', function() {
    console.log('Page loaded, ensuring burn handler is initialized');
    if (!window.burnHandlerInitialized) {
        burnHandler.init();
        window.burnHandlerInitialized = true;
    }
});

// Watch for tab changes that might change the page context
document.addEventListener('click', function(event) {
    const tabElement = event.target.closest('.nav-tab, .tab');
    if (!tabElement) return;
    
    // Re-initialize after a short delay to allow the DOM to update
    setTimeout(() => {
        if (!window.burnHandlerInitialized) {
            burnHandler.init();
            window.burnHandlerInitialized = true;
        } else {
            // Update current page type
            burnHandler.currentPage = burnHandler.detectPageType();
            console.log(`Tab clicked, current page type updated to: ${burnHandler.currentPage}`);
        }
    }, 200);
});

// Make burnHandler globally available
window.burnHandler = burnHandler;

console.log('Burn Handler loaded');