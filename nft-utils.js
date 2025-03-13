/**
 * NFT utilities for handling NFT data and metadata
 */
const nftUtils = {
    allNFTs: [],
    userNFTs: [],
    cachedMetadata: {},
    
    /**
     * Initialize NFT utilities
     */
    init: function() {
        console.log('Initializing NFT utilities...');
        
        // Listen for wallet connection events
        document.addEventListener('walletConnected', () => {
            this.loadAllNFTs();
        });

        // Setup image upload functionality
        this.setupImageUploadEvents();
        
        // Setup image preview updates
        this.setupPreviewUpdates();
    },
    
    /**
     * Setup image upload functionality
     */
    setupImageUploadEvents: function() {
        console.log('Setting up image upload events...');
        
        // Find the upload button and area
        const uploadArea = document.querySelector('.upload-area');
        const uploadInput = document.getElementById('upload-image');
        
        if (uploadArea) {
            console.log('Found upload area, setting up event listeners');
            
            // Make sure the input is properly styled
            if (uploadInput) {
                uploadInput.style.display = 'none';
            }
            
            // Add upload button if it doesn't exist
            if (!uploadArea.querySelector('.upload-image-btn')) {
                const uploadBtn = document.createElement('button');
                uploadBtn.className = 'btn secondary-btn upload-image-btn';
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Browse Files';
                uploadArea.appendChild(uploadBtn);
            }
            
            // Click event for the upload area
            uploadArea.addEventListener('click', (e) => {
                // Prevent click if it's on the button (button has its own handler)
                if (e.target.closest('.upload-image-btn')) return;
                
                if (uploadInput) {
                    uploadInput.click();
                } else {
                    console.error('Upload input not found');
                }
            });
            
            // Click event for the browse button
            const browseBtn = uploadArea.querySelector('.upload-image-btn');
            if (browseBtn) {
                browseBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the uploadArea click
                    if (uploadInput) uploadInput.click();
                });
            }
            
            // Drag and drop events
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
        } else {
            console.warn('Upload area not found in the DOM');
        }
        
        // Add change event to the upload input
        if (uploadInput) {
            uploadInput.addEventListener('change', (event) => {
                if (event.target.files && event.target.files[0]) {
                    this.handleImageUpload(event.target.files[0]);
                }
            });
        } else {
            console.warn('Upload input not found in the DOM');
        }
    },
    
    /**
     * Setup preview updates when form fields change
     */
    setupPreviewUpdates: function() {
        const nameInput = document.getElementById('nft-name');
        const descriptionInput = document.getElementById('nft-description');
        const previewName = document.getElementById('preview-name');
        const previewDescription = document.getElementById('preview-description');
        
        if (nameInput && previewName) {
            nameInput.addEventListener('input', () => {
                previewName.textContent = nameInput.value || 'NFT Name';
            });
        }
        
        if (descriptionInput && previewDescription) {
            descriptionInput.addEventListener('input', () => {
                previewDescription.textContent = descriptionInput.value || 'NFT description will appear here';
            });
        }
        
        // Setup property preview updates
        document.addEventListener('click', (e) => {
            if (e.target.closest('#add-property-btn')) {
                setTimeout(() => this.updatePropertiesPreview(), 100);
            } else if (e.target.closest('.remove-property-btn')) {
                setTimeout(() => this.updatePropertiesPreview(), 100);
            }
        });
        
        // Listen for property input changes
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('property-name') || e.target.classList.contains('property-value')) {
                this.updatePropertiesPreview();
            }
        });
    },
    
    /**
     * Update properties preview
     */
    updatePropertiesPreview: function() {
        const propertiesContainer = document.getElementById('properties-container');
        const previewPropertiesList = document.getElementById('preview-properties-list');
        const noPropertiesMsg = document.querySelector('.no-properties');
        
        if (!propertiesContainer || !previewPropertiesList) return;
        
        // Get all property rows
        const propertyRows = propertiesContainer.querySelectorAll('.property-row');
        
        // Clear current preview
        previewPropertiesList.innerHTML = '';
        
        // Check if we have any properties
        if (propertyRows.length === 0 || (propertyRows.length === 1 && 
            !propertyRows[0].querySelector('.property-name').value && 
            !propertyRows[0].querySelector('.property-value').value)) {
            
            previewPropertiesList.innerHTML = '<p class="no-properties">No properties added</p>';
            return;
        }
        
        // Add each property to the preview
        propertyRows.forEach(row => {
            const nameInput = row.querySelector('.property-name');
            const valueInput = row.querySelector('.property-value');
            
            if (nameInput && valueInput && (nameInput.value || valueInput.value)) {
                const propertyItem = document.createElement('div');
                propertyItem.className = 'property-item';
                propertyItem.innerHTML = `
                    <span class="property-item-name">${nameInput.value || 'Unnamed'}</span>
                    <span class="property-item-value">${valueInput.value || 'No value'}</span>
                `;
                previewPropertiesList.appendChild(propertyItem);
            }
        });
    },
    
    /**
     * Handle image upload and display preview
     * @param {File} file - The uploaded image file
     */
    handleImageUpload: function(file) {
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            uiUtils.showToast('Invalid file type. Please upload a JPG, PNG, GIF, or SVG image.', 'error');
            return;
        }
        
        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            uiUtils.showToast('File is too large. Maximum size is 10MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Update the preview image
            const previewImage = document.getElementById('image-preview');
            if (previewImage) {
                previewImage.innerHTML = ''; // Clear placeholder
                
                const img = document.createElement('img');
                img.src = imageData;
                img.alt = 'NFT Preview';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                previewImage.appendChild(img);
                
                // Enable the mint button
                const mintButton = document.getElementById('mint-nft-btn');
                if (mintButton) {
                    mintButton.disabled = false;
                }
            }
            
            // Store the image data for later use
            document.getElementById('mint-nft-btn').dataset.uploadedImage = imageData;
            
            // Show success message
            uiUtils.showToast('Image uploaded successfully!', 'success');
        };
        
        reader.onerror = () => {
            uiUtils.showToast('Failed to read the image file', 'error');
        };
        
        reader.readAsDataURL(file);
    },
    
    /**
     * Create NFT metadata
     * @param {Object} data - NFT data
     * @returns {Object} NFT metadata
     */
    createNFTMetadata: function(data) {
        return {
            name: data.name,
            description: data.description,
            image: data.image,
            attributes: data.attributes || []
        };
    },
    
    /**
     * Convert base64 to Blob
     * @param {string} base64 - Base64 encoded string
     * @param {string} contentType - MIME type of the file
     * @returns {Blob} - Blob object
     */
    base64ToBlob: function(base64, contentType = '') {
        // Remove data URL prefix if present
        const dataUrlRegex = /^data:([^;]+);base64,/;
        let processedBase64 = base64;
        let detectedContentType = contentType;
        
        const matches = base64.match(dataUrlRegex);
        if (matches) {
            detectedContentType = matches[1] || contentType;
            processedBase64 = base64.replace(dataUrlRegex, '');
        }
        
        // Convert base64 to binary
        const byteCharacters = atob(processedBase64);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        return new Blob(byteArrays, { type: detectedContentType });
    },
    
    /**
     * Upload image to IPFS
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} IPFS hash
     */
    uploadImageToIPFS: async function(base64Image) {
        try {
            uiUtils.showLoading('Uploading image to IPFS...');
            
            // Convert base64 to blob
            const imageBlob = this.base64ToBlob(base64Image);
            
            // Create form data
            const formData = new FormData();
            formData.append('file', imageBlob);
            
            // Upload to Pinata
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${IPFS_CONFIG.pinata.jwt}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to upload image: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            const ipfsHash = data.IpfsHash;
            
            return ipfsHash;
        } catch (error) {
            console.error('Failed to upload image to IPFS:', error);
            throw error;
        } finally {
            uiUtils.hideLoading();
        }
    },
    
    /**
     * Upload metadata to IPFS
     * @param {Object} metadata - NFT metadata
     * @returns {Promise<string>} IPFS hash
     */
    uploadMetadataToIPFS: async function(metadata) {
        try {
            uiUtils.showLoading('Uploading metadata to IPFS...');
            
            // Upload to Pinata
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${IPFS_CONFIG.pinata.jwt}`
                },
                body: JSON.stringify(metadata)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to upload metadata: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            const ipfsHash = data.IpfsHash;
            
            return ipfsHash;
        } catch (error) {
            console.error('Failed to upload metadata to IPFS:', error);
            throw error;
        } finally {
            uiUtils.hideLoading();
        }
    },
    
    /**
     * Create and mint a new NFT
     * @param {Object} nftData - NFT data
     * @returns {Promise<Object>} Minting result
     */
    createAndMintNFT: async function(nftData) {
        try {
            // Upload image to IPFS
            const imageHash = await this.uploadImageToIPFS(nftData.image);
            const imageUrl = `ipfs://${imageHash}`;
            
            // Create metadata
            const metadata = this.createNFTMetadata({
                name: nftData.name,
                description: nftData.description,
                image: imageUrl,
                attributes: nftData.attributes
            });
            
            // Upload metadata to IPFS
            const metadataHash = await this.uploadMetadataToIPFS(metadata);
            const metadataUrl = `ipfs://${metadataHash}`;
            
            // Mint NFT
            const result = await web3Utils.mintNFT(metadataUrl, nftData.name);
            
            // Return result with all data
            return {
                ...result,
                imageUrl,
                metadataUrl,
                nftData
            };
        } catch (error) {
            console.error('Failed to create and mint NFT:', error);
            throw error;
        }
    },
    
    /**
     * Get all NFTs
     * @returns {Promise<Array>} Array of NFTs
     */
    loadAllNFTs: async function() {
        try {
            if (!web3Utils.isConnected()) return [];
            
            let nfts = [];
            
            try {
                // Method 1: Try using totalSupply
                const totalSupply = await web3Utils.getTotalSupply();
                console.log('Total supply:', totalSupply);
                
                for (let i = 0; i < totalSupply; i++) {
                    const tokenId = await web3Utils.getTokenByIndex(i);
                    nfts.push({ tokenId: tokenId });
                }
            } catch (error) {
                console.error('Error using totalSupply method:', error);
                
                // Method 2: Use nextTokenId
                try {
                    const nextTokenId = await web3Utils.getNextTokenId();
                    console.log('Next token ID:', nextTokenId);
                    
                    for (let i = 0; i < nextTokenId; i++) {
                        try {
                            const owner = await web3Utils.getNFTOwner(i);
                            if (owner) {
                                nfts.push({ tokenId: i });
                            }
                        } catch (error) {
                            // Skip tokens that don't exist or are burned
                        }
                    }
                } catch (error) {
                    console.error('Error using nextTokenId method:', error);
                    throw error;
                }
            }
            
            console.log('All NFTs:', nfts);
            this.allNFTs = nfts;
            
            // Load metadata for each NFT
            await this.loadNFTsMetadata(nfts);
            
            return this.allNFTs;
        } catch (error) {
            console.error('Failed to load all NFTs:', error);
            throw error;
        }
    },
    
    /**
     * Get NFTs owned by current user
     * @returns {Promise<Array>} Array of NFTs
     */
    getUserNFTs: async function() {
        try {
            if (!web3Utils.isConnected()) return [];
            
            const tokenIds = await web3Utils.getOwnedNFTs();
            console.log('User token IDs:', tokenIds);
            
            const userNFTs = tokenIds.map(id => ({ tokenId: id }));
            
            // Load metadata for each NFT
            await this.loadNFTsMetadata(userNFTs);
            
            this.userNFTs = userNFTs;
            return userNFTs;
        } catch (error) {
            console.error('Failed to get user NFTs:', error);
            throw error;
        }
    },
    
    /**
     * Load metadata for NFTs
     * @param {Array} nfts - Array of NFT objects
     */
    loadNFTsMetadata: async function(nfts) {
        try {
            const promises = nfts.map(async nft => {
                try {
                    // Get owner
                    nft.owner = await web3Utils.getNFTOwner(nft.tokenId);
                    
                    // Get name
                    nft.name = await web3Utils.getNFTName(nft.tokenId);
                    
                    // Get tokenURI
                    nft.tokenURI = await web3Utils.getTokenURI(nft.tokenId);
                    
                    // Get metadata from tokenURI
                    nft.metadata = await this.getMetadataFromTokenURI(nft.tokenURI);
                    
                    // Check if current user is the owner
                    nft.isOwner = web3Utils.getCurrentAccount() === nft.owner;
                } catch (error) {
                    console.error(`Failed to load metadata for NFT ${nft.tokenId}:`, error);
                    nft.error = error.message;
                }
                
                return nft;
            });
            
            await Promise.all(promises);
        } catch (error) {
            console.error('Failed to load NFTs metadata:', error);
            throw error;
        }
    },
    
    /**
     * Get metadata from token URI
     * @param {string} tokenURI - Token URI
     * @returns {Promise<Object>} Metadata object
     */
    getMetadataFromTokenURI: async function(tokenURI) {
        // Check if metadata is cached
        if (this.cachedMetadata[tokenURI]) {
            return this.cachedMetadata[tokenURI];
        }
        
        try {
            let metadataUrl = tokenURI;
            
            // Handle IPFS URIs
            if (tokenURI.startsWith('ipfs://')) {
                metadataUrl = `${IPFS_CONFIG.pinata.gateway}${tokenURI.replace('ipfs://', '')}`;
            }
            
            // Fetch metadata
            const response = await fetch(metadataUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch metadata: ${response.statusText}`);
            }
            
            const metadata = await response.json();
            
            // Cache metadata
            this.cachedMetadata[tokenURI] = metadata;
            
            // Handle IPFS image URL
            if (metadata.image && metadata.image.startsWith('ipfs://')) {
                metadata.imageUrl = `${IPFS_CONFIG.pinata.gateway}${metadata.image.replace('ipfs://', '')}`;
            } else {
                metadata.imageUrl = metadata.image;
            }
            
            return metadata;
        } catch (error) {
            console.error('Failed to get metadata from token URI:', error);
            return {
                name: 'Unknown',
                description: 'Metadata could not be loaded',
                image: '',
                imageUrl: ''
            };
        }
    },
    
    /**
     * Get NFT details by token ID
     * @param {string|number} tokenId - Token ID
     * @returns {Promise<Object>} NFT details
     */
    getNFTDetails: async function(tokenId) {
        try {
            const nft = {
                tokenId: tokenId,
                owner: await web3Utils.getNFTOwner(tokenId),
                name: await web3Utils.getNFTName(tokenId),
                tokenURI: await web3Utils.getTokenURI(tokenId)
            };
            
            // Get metadata from tokenURI
            nft.metadata = await this.getMetadataFromTokenURI(nft.tokenURI);
            
            // Check if current user is the owner
            nft.isOwner = web3Utils.getCurrentAccount() === nft.owner;
            
            // Get messages if user is the owner
            if (nft.isOwner) {
                try {
                    nft.messages = await web3Utils.getNFTMessages(tokenId);
                } catch (error) {
                    console.error('Failed to get NFT messages:', error);
                    nft.messages = [];
                }
            }
            
            return nft;
        } catch (error) {
            console.error('Failed to get NFT details:', error);
            throw error;
        }
    },
    
    /**
     * Get leaderboard data
     * @returns {Promise<Object>} Leaderboard data
     */
    getLeaderboard: async function() {
        try {
            if (!web3Utils.isConnected()) return { sent: [], received: [] };
            
            // Get all NFTs to analyze owners
            const nfts = this.allNFTs.length > 0 ? this.allNFTs : await this.loadAllNFTs();
            
            // Get unique owners
            const uniqueOwners = [...new Set(nfts.map(nft => nft.owner))];
            
            // Get sent and received counts for each owner
            const leaderboardData = {
                sent: [],
                received: []
            };
            
            for (const address of uniqueOwners) {
                if (!address) continue;
                
                try {
                    const sentCount = await web3Utils.getSentMessagesCount(address);
                    const receivedCount = await web3Utils.getReceivedMessagesCount(address);
                    
                    leaderboardData.sent.push({ address, count: parseInt(sentCount) });
                    leaderboardData.received.push({ address, count: parseInt(receivedCount) });
                } catch (error) {
                    console.error(`Failed to get message counts for ${address}:`, error);
                }
            }
            
            // Sort by count (descending)
            leaderboardData.sent.sort((a, b) => b.count - a.count);
            leaderboardData.received.sort((a, b) => b.count - a.count);
            
            return leaderboardData;
        } catch (error) {
            console.error('Failed to get leaderboard data:', error);
            throw error;
        }
    },
    
    /**
     * Search NFTs by name or description
     * @param {Array} nfts - Array of NFTs to search
     * @param {string} query - Search query
     * @returns {Array} Filtered NFTs
     */
    searchNFTs: function(nfts, query) {
        if (!query || query.trim() === '') return nfts;
        
        const lowerQuery = query.toLowerCase().trim();
        
        return nfts.filter(nft => {
            const name = nft.name ? nft.name.toLowerCase() : '';
            const description = nft.metadata?.description ? nft.metadata.description.toLowerCase() : '';
            
            return name.includes(lowerQuery) || description.includes(lowerQuery);
        });
    },
    
    /**
     * Sort NFTs by different criteria
     * @param {Array} nfts - Array of NFTs to sort
     * @param {string} sortBy - Sort criterion
     * @returns {Array} Sorted NFTs
     */
    sortNFTs: function(nfts, sortBy = 'newest') {
        const nftsCopy = [...nfts];
        
        switch (sortBy) {
            case 'newest':
                // Assuming higher tokenId means newer
                return nftsCopy.sort((a, b) => parseInt(b.tokenId) - parseInt(a.tokenId));
            
            case 'oldest':
                // Assuming lower tokenId means older
                return nftsCopy.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId));
            
            case 'name-asc':
                return nftsCopy.sort((a, b) => {
                    const nameA = a.name || a.metadata?.name || '';
                    const nameB = b.name || b.metadata?.name || '';
                    return nameA.localeCompare(nameB);
                });
            
            case 'name-desc':
                return nftsCopy.sort((a, b) => {
                    const nameA = a.name || a.metadata?.name || '';
                    const nameB = b.name || b.metadata?.name || '';
                    return nameB.localeCompare(nameA);
                });
            
            default:
                return nftsCopy;
        }
    },
    
    /**
     * Create a tweet URL for sharing an NFT
     * @param {Object} nft - NFT object
     * @returns {string} Tweet URL
     */
    createTweetURL: function(nft) {
        const text = encodeURIComponent(`Check out my new NFT "${nft.name}" that I just minted on the 0G Network! #AI #NFT #0GNetwork`);
        const url = encodeURIComponent(window.location.href);
        
        return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    },
    
    /**
     * Show transaction success modal with SweetAlert2
     * @param {Object} nftData - Data about the minted NFT
     * @param {string} txHash - Transaction hash
     */
    showTransactionSuccess: function(nftData, txHash) {
        const explorerUrl = `${NETWORK.blockExplorer}/tx/${txHash}`;
        
        // HTML for the success modal with NFT details
        const html = `
            <div class="swal-nft-container">
                <div class="swal-nft-image">
                    <img src="${nftData.image}" alt="${nftData.name}">
                    <div class="swal-success-badge">
                        <i class="fas fa-check-circle"></i>
                    </div>
                </div>
                <div class="swal-nft-details">
                    <h4>${nftData.name}</h4>
                    <div class="swal-nft-detail">
                        <span class="detail-label">Token ID:</span>
                        <span class="detail-value">${nftData.tokenId}</span>
                    </div>
                    <div class="swal-nft-detail">
                        <span class="detail-label">Transaction:</span>
                        <span class="detail-value tx-hash">${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}</span>
                    </div>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: 'NFT Minted Successfully!',
            html: html,
            showConfirmButton: true,
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: '<i class="fas fa-eye"></i> View NFT',
            cancelButtonText: '<i class="fas fa-external-link-alt"></i> View on Explorer',
            confirmButtonColor: '#6c5ce7',
            cancelButtonColor: '#3085d6',
            allowOutsideClick: false,
            customClass: {
                popup: 'swal-nft-popup',
                title: 'swal-nft-title',
                actions: 'swal-nft-actions'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Handle "View NFT" button click
                const galleryTab = document.querySelector('.nav-tab[data-tab="gallery"]');
                if (galleryTab) {
                    galleryTab.click();
                }
                
                // TODO: Show the specific NFT in the gallery
                // showNFTInGallery(nftData.tokenId);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Handle "View on Explorer" button click
                window.open(explorerUrl, '_blank');
            }
        });
    },
    
    /**
     * Send a message to an NFT owner
     * @param {string} recipient - Recipient address
     * @param {string} message - Message content
     * @param {string|number} tokenId - Token ID
     * @returns {Promise<Object>} Message sending result
     */
    sendMessage: async function(recipient, message, tokenId) {
        console.log('Sending message:', { recipient, message, tokenId });
        
        try {
            // Show loading
            if (window.uiUtils && window.uiUtils.showLoading) {
                window.uiUtils.showLoading('Sending message...');
            }
            
            // Check if Web3 is available
            if (typeof Web3 === 'undefined') {
                throw new Error('Web3 is not available. Please make sure Web3.js is loaded.');
            }
            
            // Check if ethereum provider is available
            if (!window.ethereum) {
                throw new Error('No Ethereum provider found. Please install MetaMask or another wallet');
            }
            
            // Create Web3 instance
            const web3 = new Web3(window.ethereum);
            
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const sender = accounts[0];
            
            console.log('Connected account (sender):', sender);
            
            // Check if web3Utils has sendMessage function
            if (window.web3Utils && typeof window.web3Utils.sendMessage === 'function') {
                console.log('Using web3Utils.sendMessage');
                return await window.web3Utils.sendMessage(recipient, message, tokenId);
            }
            
            // Create message data
            const messageData = {
                from: sender,
                to: recipient,
                message: message,
                tokenId: tokenId || '0',
                timestamp: Math.floor(Date.now() / 1000)
            };
            
            console.log('Message data:', messageData);
            
            // Sign the message
            console.log('Signing message...');
            const messageToSign = JSON.stringify(messageData);
            const signature = await web3.eth.personal.sign(messageToSign, sender);
            
            // Prepare the final message object
            const finalMessage = {
                ...messageData,
                signature: signature
            };
            
            console.log('Message signed:', finalMessage);
            
            // Fallback: Store message in local storage
            console.log('Using local storage fallback for message');
            
            // Get existing messages
            const storedMessages = localStorage.getItem('nft_messages') || '[]';
            const messages = JSON.parse(storedMessages);
            
            // Add new message
            messages.push(finalMessage);
            
            // Save messages
            localStorage.setItem('nft_messages', JSON.stringify(messages));
            
            // Show success message
            if (window.uiUtils && window.uiUtils.showToast) {
                window.uiUtils.showToast('Message sent successfully!', 'success');
            }
            
            return {
                success: true,
                message: finalMessage,
                stored: 'local'
            };
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Show error message
            if (window.uiUtils && window.uiUtils.showToast) {
                window.uiUtils.showToast(`Failed to send message: ${error.message}`, 'error');
            }
            
            throw error;
        } finally {
            // Hide loading
            if (window.uiUtils && window.uiUtils.hideLoading) {
                window.uiUtils.hideLoading();
            }
        }
    }
};

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    nftUtils.init();
});
// Make nftUtils globally available (ensure it's defined before main.js runs)
window.nftUtils = nftUtils;
