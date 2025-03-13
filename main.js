// Make sure dependencies are available
if (typeof window.uiUtils === 'undefined') {
    console.error('uiUtils is not defined globally! Loading fallback...');
    // Create a minimal fallback
    window.uiUtils = {
        showToast: function(message, type = 'info') {
            console.log(`Toast (${type}): ${message}`);
            alert(`${type.toUpperCase()}: ${message}`);
        },
        showLoading: function(message) {
            console.log(`Loading: ${message}`);
        },
        hideLoading: function() {
            console.log('Hide loading');
        },
        showModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('active');
        },
        hideModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        },
        showConfirm: function(title, message, confirmText, cancelText) {
            return new Promise((resolve) => {
                if (confirm(message)) {
                    resolve({ isConfirmed: true });
                } else {
                    resolve({ isConfirmed: false });
                }
            });
        },
        showTransactionStatus: function(status, data) {
            console.log(`Transaction status: ${status}`, data);
            if (typeof animations !== 'undefined') {
                animations.animateTransaction(status);
            }
        }
    };
}



const app = {
    // State variables
    currentTab: 'mint',
    generatedImage: null,
    selectedNFT: null,
    pageSize: 12,
    currentPage: 1,
    
    // Initialize app
    init: async function() {
        console.log('Initializing application...');
        try {
            // Setup entry animation
            await this.setupEntryAnimation();
            
            // Initialize components
            await web3Utils.init();
            await nftUtils.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Set up UI
            this.setupUI();
            
            // Handle URL hash for direct tab access
            this.handleUrlHash();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            uiUtils.showToast('Failed to initialize application', 'error');
        }
    },

    /**
     * Setup entry animation and transition to main app
     */
    setupEntryAnimation: function() {
        return new Promise((resolve) => {
            const entryAnimation = document.getElementById('entry-animation');
            const app = document.getElementById('app');
            const enterBtn = document.getElementById('enter-app');
            
            if (!entryAnimation || !app || !enterBtn) {
                resolve();
                return;
            }
            
            enterBtn.addEventListener('click', () => {
                entryAnimation.classList.add('exit');
                
                setTimeout(() => {
                    entryAnimation.style.display = 'none';
                    app.classList.remove('hidden');
                    
                    setTimeout(() => {
                        app.classList.add('visible');
                        resolve();
                    }, 100);
                }, 1000);
            });
        });
    },
    /**
     * Setup all event listeners
     */
    setupEventListeners: function() {
        // Wallet connection
        document.getElementById('connect-wallet-btn').addEventListener('click', () => {
            this.showWalletModal();
        });
        
        document.getElementById('disconnect-wallet-btn').addEventListener('click', () => {
            web3Utils.disconnectWallet();
        });
        
        // Wallet options
        const walletOptions = document.querySelectorAll('.wallet-option');
        walletOptions.forEach(option => {
            option.addEventListener('click', () => {
                const walletType = option.dataset.wallet;
                web3Utils.connectWallet(walletType).then(() => {
                    uiUtils.hideModal('wallet-modal');
                }).catch(error => {
                    console.error('Failed to connect wallet:', error);
                });
            });
        });
        
        // Tab navigation
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Close modals
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    uiUtils.hideModal(modal.id);
                }
            });
        });
        
        // Info button
        document.getElementById('info-btn').addEventListener('click', () => {
            uiUtils.showModal('info-modal');
        });
        
        // Mint tab events
        this.setupMintTabEvents();
        
        // Gallery tab events
        this.setupGalleryTabEvents();
        
        // Messages tab events
        this.setupMessagesTabEvents();
        
        // Leaderboard tab events
        this.setupLeaderboardTabEvents();
        
        // Transaction modal events
        document.getElementById('transaction-dismiss').addEventListener('click', () => {
            animations.hideTransactionModal();
        });
        
        // Navigation buttons to mint tab
        document.querySelectorAll('.nav-to-mint').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab('mint');
            });
        });
        
        // Wallet connection events
        document.addEventListener('walletConnected', () => {
            this.handleWalletConnected();
        });
        
        document.addEventListener('walletDisconnected', () => {
            this.handleWalletDisconnected();
        });
        
        document.addEventListener('accountChanged', () => {
            this.refreshData();
        });
        
        document.addEventListener('networkChanged', () => {
            this.refreshData();
        });
    },
    
    /**
     * Setup mint tab events
     */
    setupMintTabEvents: function() {
        // Toggle between AI generation and upload
        const toggleButtons = document.querySelectorAll('.mint-form .toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                this.toggleGenerationMethod(method);
            });
        });
        
        // Generate image button
        document.getElementById('generate-image-btn').addEventListener('click', () => {
            this.generateImage();
        });
        
        // Generate prompt button
        document.getElementById('generate-prompt-btn').addEventListener('click', () => {
            this.generateRandomPrompt();
        });
        
        // Upload image area
        const uploadArea = document.querySelector('.upload-area');
        const uploadInput = document.getElementById('upload-image');
        const uploadButton = document.querySelector('.upload-image-btn');

        if (uploadArea && uploadInput) {
            // Click event for the upload area
            uploadArea.addEventListener('click', (e) => {
                // Prevent click if it's on the button (button has its own handler)
                if (e.target.closest('.upload-image-btn')) return;
                
                uploadInput.click();
            });
            
            // Click event for the browse button
            if (uploadButton) {
                uploadButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the uploadArea click
                    uploadInput.click();
                });
            }
            
            // File selected event
            uploadInput.addEventListener('change', (event) => {
                if (event.target.files && event.target.files[0]) {
                    this.handleImageUpload(event.target.files[0]);
                }
            });
            
            // Drag and drop for image upload
            uploadArea.addEventListener('dragover', (event) => {
                event.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (event) => {
                event.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (event.dataTransfer.files && event.dataTransfer.files[0]) {
                    this.handleImageUpload(event.dataTransfer.files[0]);
                }
            });
        }    
        
        // Add property button
        document.getElementById('add-property-btn').addEventListener('click', () => {
            this.addPropertyRow();
        });
        
        // Form input events for live preview
        document.getElementById('nft-name').addEventListener('input', this.updatePreview.bind(this));
        document.getElementById('nft-description').addEventListener('input', this.updatePreview.bind(this));
        
        // Mint NFT button
        document.getElementById('mint-nft-btn').addEventListener('click', () => {
            this.mintNFT();
        });
        
        // Success modal share on Twitter button
        document.getElementById('success-share-twitter').addEventListener('click', () => {
            if (this.mintedNFT) {
                const tweetUrl = nftUtils.createTweetURL(this.mintedNFT);
                window.open(tweetUrl, '_blank');
            }
        });
        
        // Success modal view NFT button
        document.getElementById('success-view-nft').addEventListener('click', () => {
            uiUtils.hideModal('mint-success-modal');
            this.switchTab('gallery');
        });
    },
    
    /**
     * Setup gallery tab events
     */
    setupGalleryTabEvents: function() {
        // Search
        const searchInput = document.getElementById('search-nfts');
        searchInput.addEventListener('input', uiUtils.debounce(() => {
            this.filterGallery();
        }, 300));
        
        // Sort
        document.getElementById('sort-nfts').addEventListener('change', (event) => {
            this.sortGallery(event.target.value);
        });
        
        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.toggleGalleryView(view);
            });
        });
        
        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateGalleryPagination();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredNFTs.length / this.pageSize);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updateGalleryPagination();
            }
        });
    },
    
/**
 * Setup messages tab events
 */
setupMessagesTabEvents: function() {
    // Helper function to safely add event listeners
    const addSafeEventListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with ID '${id}' not found for event binding`);
        }
    };
    
    // Refresh NFTs button
    addSafeEventListener('refresh-nfts', 'click', () => {
        this.loadMessagesTab();
    });
    
    // Refresh messages button
    addSafeEventListener('refresh-messages', 'click', () => {
        if (this.selectedNFT) {
            this.loadNFTMessages(this.selectedNFT.tokenId);
        }
    });
    
    // View on explorer button
    addSafeEventListener('view-on-explorer', 'click', () => {
        if (this.selectedNFT) {
            const url = web3Utils.getTokenUrl(this.selectedNFT.tokenId);
            window.open(url, '_blank');
        }
    });
    
    // Burn NFT button
    addSafeEventListener('burn-nft', 'click', () => {
        if (!this.selectedNFT) {
            uiUtils.showToast('No NFT selected', 'warning');
            return;
        }
        
        if (!this.selectedNFT.isOwner) {
            uiUtils.showToast('You are not the owner of this NFT', 'error');
            return;
        }
        
        this.confirmBurnNFT(this.selectedNFT.tokenId);
    });
    
    // Detail burn NFT button (in the NFT detail view)
    addSafeEventListener('detail-burn-nft', 'click', () => {
        if (!this.selectedNFT) {
            uiUtils.showToast('No NFT selected', 'warning');
            return;
        }
        
        if (!this.selectedNFT.isOwner) {
            uiUtils.showToast('You are not the owner of this NFT', 'error');
            return;
        }
        
        this.confirmBurnNFT(this.selectedNFT.tokenId);
    });
    
    // Send message button
    addSafeEventListener('send-message', 'click', () => {
        this.sendMessage();
    });
    
    // Message input - send on Enter key
    addSafeEventListener('message-input', 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    });
},
    
 /**
 * Setup leaderboard tab events
 */
setupLeaderboardTabEvents: function() {
    // Toggle between sent and received
    const toggleButtons = document.querySelectorAll('.leaderboard-toggle .toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const board = btn.dataset.board;
            this.toggleLeaderboard(board);
        });
    });
},
    
    /**
     * Setup UI components
     */
    setupUI: function() {
        // Set initial tab
        this.switchTab(this.currentTab);
    },
    
    /**
     * Show wallet connection modal
     */
    showWalletModal: function() {
        uiUtils.showModal('wallet-modal');
    },
    
    /**
     * Handle URL hash for direct tab access
     */
    handleUrlHash: function() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const tabId = hash.split('/')[0];
            if (['mint', 'gallery', 'messages', 'leaderboard'].includes(tabId)) {
                this.switchTab(tabId);
            }
        }
    },
    
    /**
     * Switch between tabs
     * @param {string} tabId - ID of the tab to switch to
     */
    switchTab: function(tabId) {
        if (!tabId || this.currentTab === tabId) return;
        
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(`${tabId}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
            animations.animateTabTransition(selectedTab);
        }
        
        // Update URL hash
        window.location.hash = `#${tabId}`;
        
        // Load tab-specific data
        this.loadTabData(tabId);
        
        this.currentTab = tabId;
    },
    
    /**
     * Load data for the selected tab
     * @param {string} tabId - ID of the tab
     */
    loadTabData: function(tabId) {
        switch (tabId) {
            case 'gallery':
                this.loadGalleryTab();
                break;
            
            case 'messages':
                this.loadMessagesTab();
                break;
            
            case 'leaderboard':
                this.loadLeaderboardTab();
                break;
        }
    },
    
    /**
     * Toggle between AI generation and upload
     * @param {string} method - Generation method ('ai' or 'upload')
     */
    toggleGenerationMethod: function(method) {
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            if (btn.dataset.method === method) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide generation method containers
        if (method === 'ai') {
            document.getElementById('ai-generation').classList.remove('hidden');
            document.getElementById('upload-image-section').classList.add('hidden');
        } else if (method === 'upload') {
            document.getElementById('ai-generation').classList.add('hidden');
            document.getElementById('upload-image-section').classList.remove('hidden');
        }
    },
    
    /**
     * Generate an image with AI
     */
    generateImage: async function() {
        const promptInput = document.getElementById('ai-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            uiUtils.showToast('Please enter a prompt for the image', 'error');
            animations.shakeElement(promptInput);
            return;
        }
        
        const generationStatus = document.querySelector('.generation-status');
        generationStatus.classList.remove('hidden');
        
        try {
            const modelRadio = document.querySelector('input[name="ai-model"]:checked');
            const model = modelRadio ? modelRadio.value : 'huggingface';
            
            // Generate image
            const imageBase64 = await imageUtils.generateImage(prompt, model);
            this.generatedImage = imageBase64;
            
            // Update preview
            const imagePreview = document.getElementById('image-preview');
            await imageUtils.createPreview(imageBase64, imagePreview);
            
            // Enable mint button
            document.getElementById('mint-nft-btn').removeAttribute('disabled');
            
            // Update preview
            this.updatePreview();
            
            uiUtils.showToast('Image generated successfully!', 'success');
        } catch (error) {
            console.error('Failed to generate image:', error);
            uiUtils.showToast(`Failed to generate image: ${error.message}`, 'error');
        } finally {
            generationStatus.classList.add('hidden');
        }
    },
    
    /**
     * Generate a random prompt for AI image generation
     */
    generateRandomPrompt: function() {
        const promptInput = document.getElementById('ai-prompt');
        // Use getRandomPrompt function from imageUtils
        const randomPrompt = imageUtils.getRandomPrompt();
        
        // Set the prompt with animation
        const currentText = promptInput.value;
        
        // Clear current text
        promptInput.value = '';
        
        // Type in new text character by character
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < randomPrompt.length) {
                promptInput.value += randomPrompt.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                animations.pulseElement(promptInput);
            }
        }, 30);
    },
    
    /**
     * Handle image upload
     * @param {File} file - Uploaded image file
     */
    handleImageUpload: async function(file) {
        if (!file.type.startsWith('image/')) {
            uiUtils.showToast('Please upload an image file', 'error');
            return;
        }
        
        try {
            uiUtils.showLoading('Processing uploaded image...');
            
            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result;
                
                // Resize if needed
                const resizedImage = await imageUtils.resizeImage(base64Image, 512, 512);
                this.generatedImage = resizedImage;
                
                // Update preview
                const imagePreview = document.getElementById('image-preview');
                imagePreview.innerHTML = ''; // Clear placeholder
                
                const img = document.createElement('img');
                img.src = resizedImage;
                img.alt = 'NFT Preview';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                imagePreview.appendChild(img);
                
                // Enable mint button
                document.getElementById('mint-nft-btn').removeAttribute('disabled');
                
                // Update preview
                this.updatePreview();
                
                uiUtils.hideLoading();
                uiUtils.showToast('Image uploaded successfully!', 'success');
            };
            
            reader.onerror = () => {
                uiUtils.hideLoading();
                uiUtils.showToast('Failed to read the image file', 'error');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            uiUtils.hideLoading();
            console.error('Failed to upload image:', error);
            uiUtils.showToast(`Failed to upload image: ${error.message}`, 'error');
        }
    },
    
    /**
     * Add a property row to the NFT properties
     */
    addPropertyRow: function() {
        const container = document.getElementById('properties-container');
        const rowCount = container.querySelectorAll('.property-row').length;
        
        if (rowCount >= 10) {
            uiUtils.showToast('Maximum 10 properties allowed', 'warning');
            return;
        }
        
        const row = document.createElement('div');
        row.className = 'property-row';
        row.innerHTML = `
            <input type="text" placeholder="Property name" class="property-name">
            <input type="text" placeholder="Value" class="property-value">
            <button class="remove-property-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add remove button event
        row.querySelector('.remove-property-btn').addEventListener('click', () => {
            row.remove();
            this.updatePreview();
        });
        
        // Add input events for live preview
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', this.updatePreview.bind(this));
        });
        
        container.appendChild(row);
        animations.animatePropertyAddition(row);
    },
    
    /**
     * Update NFT preview
     */
    updatePreview: function() {
        const nameInput = document.getElementById('nft-name');
        const descriptionInput = document.getElementById('nft-description');
        const previewName = document.getElementById('preview-name');
        const previewDescription = document.getElementById('preview-description');
        const propertiesList = document.getElementById('preview-properties-list');
        
        // Update name and description
        previewName.textContent = nameInput.value || 'NFT Name';
        previewDescription.textContent = descriptionInput.value || 'NFT description will appear here';
        
        // Update properties
        propertiesList.innerHTML = '';
        
        const propertyRows = document.querySelectorAll('.property-row');
        let hasProperties = false;
        
        propertyRows.forEach(row => {
            const nameInput = row.querySelector('.property-name');
            const valueInput = row.querySelector('.property-value');
            
            const name = nameInput.value.trim();
            const value = valueInput.value.trim();
            
            if (name && value) {
                hasProperties = true;
                const propertyElement = document.createElement('div');
                propertyElement.className = 'preview-property';
                propertyElement.innerHTML = `
                    <span class="property-name">${name}</span>
                    <span class="property-value">${value}</span>
                `;
                propertiesList.appendChild(propertyElement);
            }
        });
        
        if (!hasProperties) {
            propertiesList.innerHTML = '<p class="no-properties">No properties added</p>';
        }
    },
    
    /**
     * Mint a new NFT
     */
    mintNFT: async function() {
        if (!web3Utils.isConnected()) {
            this.showWalletModal();
            return;
        }
        
        if (!this.generatedImage) {
            uiUtils.showToast('Please generate or upload an image first', 'error');
            return;
        }
        
        const nameInput = document.getElementById('nft-name');
        const descriptionInput = document.getElementById('nft-description');
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        
        // Validate inputs
        if (!name) {
            uiUtils.showToast('Please enter a name for your NFT', 'error');
            animations.shakeElement(nameInput);
            return;
        }
        
        if (!description) {
            uiUtils.showToast('Please enter a description for your NFT', 'error');
            animations.shakeElement(descriptionInput);
            return;
        }
        
        // Collect properties
        const attributes = [];
        const propertyRows = document.querySelectorAll('.property-row');
        
        propertyRows.forEach(row => {
            const nameInput = row.querySelector('.property-name');
            const valueInput = row.querySelector('.property-value');
            
            const trait_type = nameInput.value.trim();
            const value = valueInput.value.trim();
            
            if (trait_type && value) {
                attributes.push({ trait_type, value });
            }
        });
        
        try {
            uiUtils.showLoading('Creating your NFT...');
            
            // Create and mint NFT
            const result = await nftUtils.createAndMintNFT({
                name,
                description,
                image: this.generatedImage,
                attributes
            });
            
            console.log('Mint result:', result);
            
            // Store minted NFT for sharing
            this.mintedNFT = {
                tokenId: result.tokenId,
                name,
                description,
                imageUrl: result.imageUrl
            };
            
            // Show success modal
            this.showMintSuccessModal(result);
            
            // Reset form
            this.resetMintForm();
            
            // Refresh gallery
            await this.loadGalleryTab();
        } catch (error) {
            console.error('Failed to mint NFT:', error);
            uiUtils.showToast(`Failed to mint NFT: ${error.message}`, 'error');
        } finally {
            uiUtils.hideLoading();
        }
    },
    
    /**
     * Show mint success modal
     * @param {Object} result - Mint result
     */
    showMintSuccessModal: function(result) {
        const modal = document.getElementById('mint-success-modal');
        const nftImage = document.getElementById('success-nft-img');
        const nftName = document.getElementById('success-nft-name');
        const nftId = document.getElementById('success-nft-id');
        const nftTx = document.getElementById('success-nft-tx');
        
        // Set modal content
        nftImage.src = this.generatedImage;
        nftName.textContent = this.mintedNFT.name;
        nftId.textContent = result.tokenId;
        
        // Set transaction link
        nftTx.href = web3Utils.getTransactionUrl(result.receipt.transactionHash);
        nftTx.textContent = web3Utils.formatAddress(result.receipt.transactionHash);
        
        // Show modal
        uiUtils.showModal('mint-success-modal');
        
        // Animate success elements
        animations.animateMintSuccess();
        
        // Create confetti effect
        const rect = nftImage.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        animations.createConfetti(x, y);
    },
    
    /**
     * Reset mint form
     */
    resetMintForm: function() {
        document.getElementById('nft-name').value = '';
        document.getElementById('nft-description').value = '';
        document.getElementById('ai-prompt').value = '';
        document.getElementById('properties-container').innerHTML = `
            <div class="property-row">
                <input type="text" placeholder="Property name" class="property-name">
                <input type="text" placeholder="Value" class="property-value">
                <button class="remove-property-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add event listener to the remove button
        document.querySelector('.remove-property-btn').addEventListener('click', function() {
            this.closest('.property-row').remove();
        });
        
        // Reset preview
        document.getElementById('image-preview').innerHTML = `
            <i class="fas fa-image"></i>
            <p>Image preview will appear here</p>
        `;
        
        this.generatedImage = null;
        document.getElementById('mint-nft-btn').setAttribute('disabled', 'disabled');
        this.updatePreview();
    },
    
/**
 * Load gallery tab data
 */
loadGalleryTab: async function() {
    if (!web3Utils.isConnected()) {
        document.getElementById('gallery-empty').classList.remove('hidden');
        document.getElementById('gallery-loading').classList.add('hidden');
        return;
    }
    
    try {
        document.getElementById('gallery-loading').classList.remove('hidden');
        document.getElementById('gallery-empty').classList.add('hidden');
        document.getElementById('nft-grid').innerHTML = '';
        document.getElementById('nft-list').innerHTML = '';
        
        // Load all NFTs
        const allNFTs = await nftUtils.loadAllNFTs();
        this.filteredNFTs = [...allNFTs];
        
        // Filter and display
        this.filterGallery();
        
        document.getElementById('gallery-loading').classList.add('hidden');
        
        if (allNFTs.length === 0) {
            document.getElementById('gallery-empty').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to load NFTs:', error);
        document.getElementById('gallery-loading').classList.add('hidden');
        uiUtils.showToast('Failed to load NFTs', 'error');
    }
},
    
    /**
     * Filter gallery by search query and sort
     */
    filterGallery: function() {
        if (!this.filteredNFTs) return;
        
        const searchQuery = document.getElementById('search-nfts').value;
        const sortBy = document.getElementById('sort-nfts').value;
        
        // Filter by search query
        let filtered = nftUtils.searchNFTs(this.filteredNFTs, searchQuery);
        
        // Sort
        filtered = nftUtils.sortNFTs(filtered, sortBy);
        
        // Update filtered NFTs
        this.filteredNFTs = filtered;
        
        // Reset pagination
        this.currentPage = 1;
        
        // Update UI
        this.updateGalleryPagination();
    },
    
    /**
     * Sort gallery
     * @param {string} sortBy - Sort criterion
     */
    sortGallery: function(sortBy) {
        if (!this.filteredNFTs) return;
        
        this.filteredNFTs = nftUtils.sortNFTs(this.filteredNFTs, sortBy);
        this.updateGalleryPagination();
    },
    
    /**
     * Toggle gallery view between grid and list
     * @param {string} view - View type ('grid' or 'list')
     */
    toggleGalleryView: function(view) {
        const gridView = document.getElementById('nft-grid');
        const listView = document.getElementById('nft-list');
        const gridButton = document.querySelector('.view-btn[data-view="grid"]');
        const listButton = document.querySelector('.view-btn[data-view="list"]');
        
        if (view === 'grid') {
            gridView.classList.remove('hidden');
            listView.classList.add('hidden');
            gridButton.classList.add('active');
            listButton.classList.remove('active');
        } else {
            gridView.classList.add('hidden');
            listView.classList.remove('hidden');
            gridButton.classList.remove('active');
            listButton.classList.add('active');
        }
    },
    
    /**
     * Update gallery pagination
     */
    updateGalleryPagination: function() {
        const gridView = document.getElementById('nft-grid');
        const listView = document.getElementById('nft-list');
        
        // Clear views
        gridView.innerHTML = '';
        listView.innerHTML = '';
        
        // Calculate pagination
        const totalNFTs = this.filteredNFTs.length;
        const totalPages = Math.ceil(totalNFTs / this.pageSize);
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = Math.min(startIdx + this.pageSize, totalNFTs);
        
        // Update page info
        document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages || 1}`;
        
        // Update pagination buttons
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;
        
        // Show NFTs for current page
        if (totalNFTs === 0) {
            const emptySearch = document.createElement('div');
            emptySearch.className = 'empty-search';
            emptySearch.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No NFTs Found</h3>
                <p>Try adjusting your search or filters</p>
            `;
            gridView.appendChild(emptySearch);
            return;
        }
        
        const pageNFTs = this.filteredNFTs.slice(startIdx, endIdx);
        
        // Render NFTs in both views
        pageNFTs.forEach((nft, index) => {
            this.renderNFTCardWithBurn(nft, index, gridView, listView);
        });
    },
    
    /**
     * Render NFT card in grid and list views
     * @param {Object} nft - NFT data
     * @param {number} index - NFT index
     * @param {HTMLElement} gridContainer - Grid view container
     * @param {HTMLElement} listContainer - List view container
     */
    renderNFTCard: function(nft, index, gridContainer, listContainer) {
        // Get NFT data
        const tokenId = nft.tokenId;
        const name = nft.name || nft.metadata?.name || `NFT #${tokenId}`;
        const imageUrl = nft.metadata?.imageUrl || '';
        const owner = nft.owner;
        const isOwner = nft.isOwner;
        
        // Create grid card
        const gridCard = document.createElement('div');
        gridCard.className = 'nft-card';
        gridCard.dataset.tokenId = tokenId;
        gridCard.innerHTML = `
            <div class="nft-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : 
                `<div class="no-image"><i class="fas fa-image"></i></div>`}
            </div>
            <div class="nft-info">
                <h3>${name}</h3>
                <div class="nft-meta">
                    <span>Token ID: ${tokenId}</span>
                    ${isOwner ? '<span class="owner-badge">You own this</span>' : ''}
                </div>
                <div class="nft-actions">
                    <button class="btn secondary-btn view-nft-btn">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${isOwner ? `
                    <button class="btn danger-btn burn-nft-btn" data-token-id="${tokenId}">
                        <i class="fas fa-fire"></i> Burn
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Create list row
        const listRow = document.createElement('div');
        listRow.className = 'nft-row';
        listRow.dataset.tokenId = tokenId;
        listRow.innerHTML = `
            <div class="nft-row-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : 
                `<div class="no-image"><i class="fas fa-image"></i></div>`}
            </div>
            <div class="nft-row-info">
                <h3>${name}</h3>
                <p class="nft-row-description">${nft.metadata?.description || 'No description available'}</p>
            </div>
            <div class="nft-row-meta">
                <span>Token ID: ${tokenId}</span>
                <span>Owner: ${web3Utils.formatAddress(owner)}</span>
            </div>
            <div class="nft-row-actions">
                <button class="btn secondary-btn view-nft-btn">
                    <i class="fas fa-eye"></i> View
                </button>
                ${isOwner ? `
                <button class="btn danger-btn burn-nft-btn" data-token-id="${tokenId}">
                    <i class="fas fa-fire"></i> Burn
                </button>
                ` : ''}
            </div>
        `;
        
        // Add click events to the grid card
        gridCard.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.showNFTDetails(tokenId);
            }
        });
        
        const gridViewBtn = gridCard.querySelector('.view-nft-btn');
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showNFTDetails(tokenId);
            });
        }
        
        // Add burn button event in grid view
        if (isOwner) {
            const gridBurnBtn = gridCard.querySelector('.burn-nft-btn');
            if (gridBurnBtn) {
                gridBurnBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.confirmBurnNFT(tokenId);
                });
            }
        }
        
        // Add click events to list view buttons
        const listViewBtn = listRow.querySelector('.view-nft-btn');
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.showNFTDetails(tokenId);
            });
        }
        
        // Add burn button event in list view
        if (isOwner) {
            const listBurnBtn = listRow.querySelector('.burn-nft-btn');
            if (listBurnBtn) {
                listBurnBtn.addEventListener('click', () => {
                    this.confirmBurnNFT(tokenId);
                });
            }
        }
        
        // Append to containers with animation delay
        gridContainer.appendChild(gridCard);
        listContainer.appendChild(listRow);
        
        animations.animateNFTCardEntrance(gridCard, index * 0.05);
        animations.animateNFTCardEntrance(listRow, index * 0.05);
    },
    
    /**
     * Render NFT card with burn button
     * @param {Object} nft - NFT data
     * @param {number} index - NFT index
     * @param {HTMLElement} gridContainer - Grid view container
     * @param {HTMLElement} listContainer - List view container
     */
    renderNFTCardWithBurn: function(nft, index, gridContainer, listContainer) {
        // Get NFT data
        const tokenId = nft.tokenId;
        const name = nft.name || nft.metadata?.name || `NFT #${tokenId}`;
        const imageUrl = nft.metadata?.imageUrl || '';
        const owner = nft.owner;
        const isOwner = nft.isOwner;
        
        // Create grid card
        const gridCard = document.createElement('div');
        gridCard.className = 'nft-card';
        gridCard.dataset.tokenId = tokenId;
        gridCard.innerHTML = `
            <div class="nft-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : 
                `<div class="no-image"><i class="fas fa-image"></i></div>`}
            </div>
            <div class="nft-info">
                <h3>${name}</h3>
                <div class="nft-meta">
                    <span>Token ID: ${tokenId}</span>
                    ${isOwner ? '<span class="owner-badge">You own this</span>' : ''}
                </div>
                <div class="nft-actions">
                    <button class="btn secondary-btn view-nft-btn">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${isOwner ? `
                    <button class="btn danger-btn burn-nft-btn" data-token-id="${tokenId}">
                        <i class="fas fa-fire"></i> Burn
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Create list row
        const listRow = document.createElement('div');
        listRow.className = 'nft-row';
        listRow.dataset.tokenId = tokenId;
        listRow.innerHTML = `
            <div class="nft-row-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : 
                `<div class="no-image"><i class="fas fa-image"></i></div>`}
            </div>
            <div class="nft-row-info">
                <h3>${name}</h3>
                <p class="nft-row-description">${nft.metadata?.description || 'No description available'}</p>
            </div>
            <div class="nft-row-meta">
                <span>Token ID: ${tokenId}</span>
                <span>Owner: ${web3Utils.formatAddress(owner)}</span>
            </div>
            <div class="nft-row-actions">
                <button class="btn secondary-btn view-nft-btn">
                    <i class="fas fa-eye"></i> View
                </button>
                ${isOwner ? `
                <button class="btn danger-btn burn-nft-btn" data-token-id="${tokenId}">
                    <i class="fas fa-fire"></i> Burn
                </button>
                ` : ''}
            </div>
        `;
        
        // Add click events for grid view
        gridCard.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.showNFTDetails(tokenId);
            }
        });
        
        const gridViewBtn = gridCard.querySelector('.view-nft-btn');
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showNFTDetails(tokenId);
            });
        }
        
        // Add burn button event in grid view
        if (isOwner) {
            const gridBurnBtn = gridCard.querySelector('.burn-nft-btn');
            if (gridBurnBtn) {
                gridBurnBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.confirmBurnNFT(tokenId);
                });
            }
        }
        
        // Add click events for list view
        const listViewBtn = listRow.querySelector('.view-nft-btn');
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.showNFTDetails(tokenId);
            });
        }
        
        // Add burn button event in list view
        if (isOwner) {
            const listBurnBtn = listRow.querySelector('.burn-nft-btn');
            if (listBurnBtn) {
                listBurnBtn.addEventListener('click', () => {
                    this.confirmBurnNFT(tokenId);
                });
            }
        }
        
        // Append to containers with animation delay
        gridContainer.appendChild(gridCard);
        listContainer.appendChild(listRow);
        
        animations.animateNFTCardEntrance(gridCard, index * 0.05);
        animations.animateNFTCardEntrance(listRow, index * 0.05);
    },
    
    /**
     * Show NFT details in modal
     * @param {string|number} tokenId - Token ID
     */
    showNFTDetails: async function(tokenId) {
        try {
            uiUtils.showLoading('Loading NFT details...');
            
            // Get NFT details
            const nft = await nftUtils.getNFTDetails(tokenId);
            
            // Update modal
            const modal = document.getElementById('nft-detail-modal');
            const nftName = document.getElementById('detail-nft-name');
            const nftImage = document.getElementById('detail-nft-img');
            const nftOwner = document.getElementById('detail-nft-owner');
            const nftId = document.getElementById('detail-nft-id');
            const nftDescription = document.getElementById('detail-nft-description');
            const nftProperties = document.getElementById('detail-nft-properties');
            const burnButton = document.getElementById('detail-burn-nft');
            const sendMessageButton = document.getElementById('detail-send-message');
            const messageForm = document.getElementById('detail-message-form');
            const explorerButton = document.getElementById('detail-view-explorer');
            
            // Set content
            nftName.textContent = nft.name || nft.metadata?.name || `NFT #${tokenId}`;
            nftImage.src = nft.metadata?.imageUrl || '';
            nftOwner.textContent = web3Utils.formatAddress(nft.owner);
            nftOwner.title = nft.owner;
            nftId.textContent = tokenId;
            nftDescription.textContent = nft.metadata?.description || 'No description available';
            
            // Set properties
            nftProperties.innerHTML = '';
            if (nft.metadata?.attributes && nft.metadata.attributes.length > 0) {
                nft.metadata.attributes.forEach(attr => {
                    const propertyElement = document.createElement('div');
                    propertyElement.className = 'nft-property';
                    propertyElement.innerHTML = `
                        <div class="property-name">${attr.trait_type}</div>
                        <div class="property-value">${attr.value}</div>
                    `;
                    nftProperties.appendChild(propertyElement);
                });
            } else {
                nftProperties.innerHTML = '<p class="no-properties">No properties</p>';
            }
            
            // Show/hide burn button based on ownership
            if (nft.isOwner) {
                burnButton.classList.remove('hidden');
            } else {
                burnButton.classList.add('hidden');
            }
            
            // Set explorer link
            explorerButton.addEventListener('click', () => {
                const url = web3Utils.getTokenUrl(tokenId);
                window.open(url, '_blank');
            });
            
            // Set message button action
            sendMessageButton.onclick = () => {
                if (messageForm.classList.contains('hidden')) {
                    messageForm.classList.remove('hidden');
                    sendMessageButton.innerHTML = '<i class="fas fa-times"></i> Cancel';
                } else {
                    messageForm.classList.add('hidden');
                    sendMessageButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }
            };
            
            // Set burn button action
            burnButton.onclick = () => {
                uiUtils.hideModal('nft-detail-modal');
                this.confirmBurnNFT(tokenId);
            };
            
            // Set send message form action
            document.getElementById('detail-send-message-btn').onclick = () => {
                const messageInput = document.getElementById('detail-message-input');
                const message = messageInput.value.trim();
                
                if (message) {
                    this.sendMessageToNFT(tokenId, message);
                    messageInput.value = '';
                    messageForm.classList.add('hidden');
                    sendMessageButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                    uiUtils.hideModal('nft-detail-modal');
                } else {
                    uiUtils.showToast('Please enter a message', 'error');
                    animations.shakeElement(messageInput);
                }
            };
            
            // Show modal
            uiUtils.showModal('nft-detail-modal');
        } catch (error) {
            console.error('Failed to load NFT details:', error);
            uiUtils.showToast(`Failed to load NFT details: ${error.message}`, 'error');
        } finally {
            uiUtils.hideLoading();
        }
    },
    
    /**
     * Load messages tab data
     */
    loadMessagesTab: async function() {
        if (!web3Utils.isConnected()) {
            document.getElementById('message-sidebar-empty').classList.remove('hidden');
            document.getElementById('message-sidebar-loading').classList.add('hidden');
            document.getElementById('message-nft-list').innerHTML = '';
            return;
        }
        
        try {
            document.getElementById('message-sidebar-loading').classList.remove('hidden');
            document.getElementById('message-sidebar-empty').classList.add('hidden');
            document.getElementById('message-nft-list').innerHTML = '';
            
            // Load user's NFTs
            const userNFTs = await nftUtils.getUserNFTs();
            
            // Hide loading
            document.getElementById('message-sidebar-loading').classList.add('hidden');
            
            if (userNFTs.length === 0) {
                document.getElementById('message-sidebar-empty').classList.remove('hidden');
                return;
            }
            
            // Render NFT list
            const nftList = document.getElementById('message-nft-list');
            userNFTs.forEach((nft, index) => {
                this.renderMessageNFT(nft, index, nftList);
            });
            
            // Select first NFT if none selected
            if (!this.selectedNFT && userNFTs.length > 0) {
                this.selectNFT(userNFTs[0].tokenId);
            }
        } catch (error) {
            console.error('Failed to load messages tab:', error);
            document.getElementById('message-sidebar-loading').classList.add('hidden');
            uiUtils.showToast(`Failed to load messages: ${error.message}`, 'error');
        }
    },
    
    /**
     * Render NFT in messages sidebar
     * @param {Object} nft - NFT data
     * @param {number} index - NFT index
     * @param {HTMLElement} container - Container element
     */
    renderMessageNFT: function(nft, index, container) {
        const tokenId = nft.tokenId;
        const name = nft.name || nft.metadata?.name || `NFT #${tokenId}`;
        const imageUrl = nft.metadata?.imageUrl || '';
        
        const nftElement = document.createElement('div');
        nftElement.className = 'message-nft';
        nftElement.dataset.tokenId = tokenId;
        
        if (this.selectedNFT && this.selectedNFT.tokenId == tokenId) {
            nftElement.classList.add('selected');
        }
        
        nftElement.innerHTML = `
            <div class="message-nft-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : 
                `<div class="no-image"><i class="fas fa-image"></i></div>`}
            </div>
            <div class="message-nft-info">
                <h4>${name}</h4>
                <span class="message-count" id="message-count-${tokenId}">Loading messages...</span>
            </div>
        `;
        
        // Add click event to select NFT
        nftElement.addEventListener('click', () => {
            this.selectNFT(tokenId);
        });
        
        // Add to container with animation delay
        container.appendChild(nftElement);
        animations.animateNFTCardEntrance(nftElement, index * 0.05);
        
        // Load message count
        this.loadNFTMessageCount(tokenId);
    },
    
    /**
     * Load message count for an NFT
     * @param {string|number} tokenId - Token ID
     */
    loadNFTMessageCount: async function(tokenId) {
        try {
            const messages = await web3Utils.getNFTMessages(tokenId);
            const countElement = document.getElementById(`message-count-${tokenId}`);
            
            if (countElement) {
                const count = messages.length;
                countElement.textContent = count === 1 ? '1 message' : `${count} messages`;
            }
        } catch (error) {
            console.error(`Failed to load message count for NFT ${tokenId}:`, error);
            const countElement = document.getElementById(`message-count-${tokenId}`);
            if (countElement) {
                countElement.textContent = 'Error loading messages';
            }
        }
    },
    
    /**
     * Select an NFT in messages tab
     * @param {string|number} tokenId - Token ID
     */
    selectNFT: async function(tokenId) {
        try {
            // Update sidebar selection
            document.querySelectorAll('.message-nft').forEach(nft => {
                if (nft.dataset.tokenId == tokenId) {
                    nft.classList.add('selected');
                } else {
                    nft.classList.remove('selected');
                }
            });
            
            // Hide prompt and show NFT details
            document.getElementById('select-nft-prompt').classList.add('hidden');
            document.getElementById('message-nft-details').classList.remove('hidden');
            
            // Show loading
            document.getElementById('messages-loading').classList.remove('hidden');
            document.getElementById('no-messages').classList.add('hidden');
            document.getElementById('messages-list').innerHTML = '';
            
            // Load NFT details
            const nft = await nftUtils.getNFTDetails(tokenId);
            this.selectedNFT = nft;
            
            // Update UI
            document.getElementById('message-nft-img').src = nft.metadata?.imageUrl || '';
            document.getElementById('message-nft-name').textContent = nft.name || nft.metadata?.name || `NFT #${tokenId}`;
            document.getElementById('message-nft-id').textContent = `Token ID: ${tokenId}`;
            
            // Show/hide burn button
            const burnButton = document.getElementById('burn-nft');
            if (nft.isOwner) {
                burnButton.classList.remove('hidden');
            } else {
                burnButton.classList.add('hidden');
            }
            
            // Load messages
            this.loadNFTMessages(tokenId);
        } catch (error) {
            console.error(`Failed to select NFT ${tokenId}:`, error);
            uiUtils.showToast(`Failed to load NFT details: ${error.message}`, 'error');
        }
    },
    
    /**
     * Load messages for an NFT
     * @param {string|number} tokenId - Token ID
     */
    loadNFTMessages: async function(tokenId) {
        try {
            // Show loading
            document.getElementById('messages-loading').classList.remove('hidden');
            document.getElementById('no-messages').classList.add('hidden');
            document.getElementById('messages-list').innerHTML = '';
            
            // Load messages
            const messages = await web3Utils.getNFTMessages(tokenId);
            
            // Hide loading
            document.getElementById('messages-loading').classList.add('hidden');
            
            // Show messages or empty state
            if (messages.length === 0) {
                document.getElementById('no-messages').classList.remove('hidden');
                return;
            }
            
            // Render messages
            const messagesList = document.getElementById('messages-list');
            messages.forEach((message, index) => {
                this.renderMessage(message, index, messagesList);
            });
            
            // Scroll to bottom
            messagesList.scrollTop = messagesList.scrollHeight;
        } catch (error) {
            console.error(`Failed to load messages for NFT ${tokenId}:`, error);
            document.getElementById('messages-loading').classList.add('hidden');
            uiUtils.showToast(`Failed to load messages: ${error.message}`, 'error');
        }
    },
    
    /**
     * Render a message
     * @param {string} message - Message text
     * @param {number} index - Message index
     * @param {HTMLElement} container - Container element
     */
    renderMessage: function(message, index, container) {
        try {
            // Try to parse message as JSON (for structured messages)
            const messageData = JSON.parse(message);
            
            const messageElement = document.createElement('div');
            messageElement.className = 'message received';
            messageElement.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${messageData.sender || 'Unknown'}</span>
                    <span class="message-time">${messageData.timestamp ? uiUtils.formatDate(messageData.timestamp) : 'Unknown time'}</span>
                </div>
                <div class="message-content">${messageData.text || message}</div>
            `;
            
            container.appendChild(messageElement);
            animations.animateMessageSend(messageElement);
        } catch (error) {
            // Handle plain text messages
            const messageElement = document.createElement('div');
            messageElement.className = 'message received';
            messageElement.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">Anonymous</span>
                    <span class="message-time">Unknown time</span>
                </div>
                <div class="message-content">${message}</div>
            `;
            
            container.appendChild(messageElement);
            animations.animateMessageSend(messageElement);
        }
    },
    
 /**
 * Send a message to the selected NFT
 */
sendMessage: async function() {
    if (!this.selectedNFT) {
        uiUtils.showToast('No NFT selected', 'warning');
        return;
    }
    
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) {
        uiUtils.showToast('Please enter a message', 'warning');
        messageInput.focus();
        return;
    }
    
    try {
        uiUtils.showLoading('Sending message...');
        
        await nftUtils.sendMessage(this.selectedNFT.tokenId, message);
        
        uiUtils.hideLoading();
        uiUtils.showToast('Message sent successfully', 'success');
        
        // Clear the input
        messageInput.value = '';
        
        // Refresh messages
        this.loadNFTMessages(this.selectedNFT.tokenId);
    } catch (error) {
        uiUtils.hideLoading();
        console.error('Failed to send message:', error);
        uiUtils.showToast(`Failed to send message: ${error.message}`, 'error');
    }
},
    
    /**
     * Send a message to an NFT
     * @param {string|number} tokenId - Token ID
     * @param {string} text - Message text
     */
    sendMessageToNFT: async function(tokenId, text) {
        try {
            // Create structured message
            const messageData = {
                text: text,
                sender: web3Utils.formatAddress(web3Utils.getCurrentAccount()),
                timestamp: Date.now()
            };
            
            const message = JSON.stringify(messageData);
            
            // Send message to blockchain
            await web3Utils.sendMessage(tokenId, message);
            
            // Show success message
            uiUtils.showToast('Message sent successfully!', 'success');
            
            // Reload messages if this is the selected NFT
            if (this.selectedNFT && this.selectedNFT.tokenId == tokenId) {
                this.loadNFTMessages(tokenId);
            }
            
            // Update message count
            this.loadNFTMessageCount(tokenId);
            
            // Reload leaderboard if it's active
            if (this.currentTab === 'leaderboard') {
                this.loadLeaderboardTab();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            uiUtils.showToast(`Failed to send message: ${error.message}`, 'error');
        }
    },
    
/**
 * Confirm burning an NFT
 * @param {string} tokenId - Token ID to burn
 */
confirmBurnNFT: function(tokenId) {
    uiUtils.showConfirm(
        'Burn NFT',
        'Are you sure you want to burn this NFT? This action cannot be undone.',
        'Burn NFT',
        'Cancel'
    ).then((result) => {
        if (result.isConfirmed) {
            this.burnNFT(tokenId);
        }
    });
},

/**
 * Burn an NFT
 * @param {string} tokenId - Token ID to burn
 */
burnNFT: async function(tokenId) {
    try {
        uiUtils.showLoading('Burning NFT...');
        
        // Call the burn function from web3Utils
        await web3Utils.burnNFT(tokenId);
        
        uiUtils.hideLoading();
        uiUtils.showToast('NFT burned successfully!', 'success');
        
        // Refresh the data
        this.refreshData();
        
        // If this was the selected NFT in messages, reset the view
        if (this.selectedNFT && this.selectedNFT.tokenId === tokenId) {
            this.selectedNFT = null;
            
            const selectPrompt = document.getElementById('select-nft-prompt');
            const nftDetails = document.getElementById('message-nft-details');
            
            if (selectPrompt) selectPrompt.classList.remove('hidden');
            if (nftDetails) nftDetails.classList.add('hidden');
        }
    } catch (error) {
        uiUtils.hideLoading();
        console.error('Failed to burn NFT:', error);
        uiUtils.showToast(`Failed to burn NFT: ${error.message}`, 'error');
    }
},  
    /**
     * Load leaderboard tab data
     */
    loadLeaderboardTab: async function() {
        if (!web3Utils.isConnected()) {
            document.getElementById('leaderboard-empty').classList.remove('hidden');
            document.getElementById('leaderboard-loading').classList.add('hidden');
            return;
        }
        
        try {
            document.getElementById('leaderboard-loading').classList.remove('hidden');
            document.getElementById('leaderboard-empty').classList.add('hidden');
            document.getElementById('leaderboard-body').innerHTML = '';
            
            // Load leaderboard data
            const leaderboardData = await nftUtils.getLeaderboard();
            
            // Hide loading
            document.getElementById('leaderboard-loading').classList.add('hidden');
            
            // Show leaderboard or empty state
            const hasSentData = leaderboardData.sent.length > 0;
            const hasReceivedData = leaderboardData.received.length > 0;
            
            if (!hasSentData && !hasReceivedData) {
                document.getElementById('leaderboard-empty').classList.remove('hidden');
                return;
            }
            
            // Store leaderboard data
            this.leaderboardData = leaderboardData;
            
            // Display leaderboard
            const activeToggle = document.querySelector('.leaderboard-toggle .toggle-btn.active');
            const activeBoard = activeToggle ? activeToggle.dataset.board : 'sent';
            this.toggleLeaderboard(activeBoard);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            document.getElementById('leaderboard-loading').classList.add('hidden');
            uiUtils.showToast(`Failed to load leaderboard: ${error.message}`, 'error');
        }
    },
    
    /**
     * Toggle leaderboard between sent and received
     * @param {string} board - Leaderboard type ('sent' or 'received')
     */
    toggleLeaderboard: function(board) {
        if (!this.leaderboardData) return;
        
        // Update toggle buttons
        document.querySelectorAll('.leaderboard-toggle .toggle-btn').forEach(btn => {
            if (btn.dataset.board === board) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Get data for selected board
        const data = board === 'sent' ? this.leaderboardData.sent : this.leaderboardData.received;
        
        // Render leaderboard
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = '';
        
        if (data.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="3" class="empty-leaderboard">No data available</td>
            `;
            leaderboardBody.appendChild(emptyRow);
            return;
        }
        
        const currentAccount = web3Utils.getCurrentAccount();
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            if (item.address === currentAccount) {
                row.classList.add('current-user');
            }
            
            row.innerHTML = `
                <td class="rank-column">${index + 1}</td>
                <td>
                    <a href="${web3Utils.getAddressUrl(item.address)}" target="_blank" class="address-link">
                        ${web3Utils.formatAddress(item.address)}
                    </a>
                </td>
                <td class="count-column">${item.count}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
    },
    
    /**
     * Handle wallet connected event
     */
    handleWalletConnected: function() {
        // Load data for current tab
        this.loadTabData(this.currentTab);
    },
    
    /**
     * Handle wallet disconnected event
     */
    handleWalletDisconnected: function() {
        // Clear data
        this.selectedNFT = null;
        
        // Reset UI
        document.getElementById('select-nft-prompt').classList.remove('hidden');
        document.getElementById('message-nft-details').classList.add('hidden');
        
        // Update tabs
        this.loadTabData(this.currentTab);
    },
    
   /**
     * Refresh all data
     */
    refreshData: function() {
        // Reload data for current tab
        this.loadTabData(this.currentTab);
        
        // Clear cached data
        nftUtils.allNFTs = [];
        nftUtils.userNFTs = [];
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});