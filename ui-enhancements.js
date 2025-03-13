/**
 * UI enhancements for the NFT app
 */
const uiEnhancements = {
    init: function() {
        console.log('Initializing UI enhancements...');
        this.addBurnButtons();
        this.enhanceModals();
        this.setupTwitterSharing();
    },
    
    /**
     * Add burn buttons to NFT details and messages
     */
    addBurnButtons: function() {
        // Add burn button to NFT detail modal
        const detailActionContainer = document.querySelector('.detail-actions');
        if (detailActionContainer) {
            // Check if button already exists
            if (!document.getElementById('detail-burn-nft')) {
                const burnButton = document.createElement('button');
                burnButton.id = 'detail-burn-nft';
                burnButton.className = 'btn danger-btn burn-nft-btn';
                burnButton.innerHTML = '<i class="fas fa-fire"></i> Burn NFT';
                burnButton.dataset.tokenId = '';
                burnButton.addEventListener('click', function() {
                    const tokenId = this.dataset.tokenId;
                    if (tokenId) {
                        this.confirmAndBurnNFT(tokenId);
                    }
                }.bind(this));
                
                detailActionContainer.appendChild(burnButton);
            }
        }
        
        // Add burn button to messages header
        const messageNftActions = document.querySelector('.message-nft-actions');
        if (messageNftActions) {
            // Check if button already exists
            if (!document.getElementById('burn-nft')) {
                const burnButton = document.createElement('button');
                burnButton.id = 'burn-nft';
                burnButton.className = 'btn danger-btn burn-nft-btn';
                burnButton.innerHTML = '<i class="fas fa-fire"></i> Burn NFT';
                burnButton.dataset.tokenId = '';
                burnButton.addEventListener('click', function() {
                    const tokenId = this.dataset.tokenId;
                    if (tokenId) {
                        this.confirmAndBurnNFT(tokenId);
                    }
                }.bind(this));
                
                messageNftActions.appendChild(burnButton);
            }
        }
    },
    
    /**
     * Confirm and burn NFT
     * @param {string} tokenId - Token ID to burn
     */
    confirmAndBurnNFT: async function(tokenId) {
        // Confirm with user
        let confirmed = false;
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: 'Burn NFT',
                text: 'Are you sure you want to burn this NFT? This action cannot be undone!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, Burn It',
                cancelButtonText: 'Cancel'
            });
            
            confirmed = result.isConfirmed;
        } else {
            // Fallback confirmation
            confirmed = window.confirm('Are you sure you want to burn this NFT? This action cannot be undone!');
        }
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Show transaction modal
            if (typeof showTransactionModal === 'function') {
                showTransactionModal('pending');
            }
            
            // Burn NFT
            const result = await nftUtils.burnNFT(tokenId);
            
            // Show success
            if (typeof showTransactionModal === 'function') {
                showTransactionModal('success', 'NFT burned successfully!', result.transactionHash);
            } else {
                alert('NFT burned successfully!');
            }
            
            // Refresh NFT lists
            if (typeof loadUserNFTs === 'function') {
                await loadUserNFTs();
            }
            
            if (typeof loadGallery === 'function') {
                await loadGallery();
            }
            
            // Close detail modal if open
            if (typeof closeAllModals === 'function') {
                closeAllModals();
            }
        } catch (error) {
            console.error("Error burning NFT:", error);
            
            // Show error
            if (typeof showTransactionModal === 'function') {
                showTransactionModal('error', `Failed to burn NFT: ${error.message}`);
            } else {
                alert(`Failed to burn NFT: ${error.message}`);
            }
        }
    },
    
    /**
     * Enhance modals with additional features
     */
    enhanceModals: function() {
        // Add loading indicator for image generation
        const aiSection = document.getElementById('ai-generation');
        if (aiSection) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'generation-status hidden';
            statusDiv.innerHTML = `
                <div class="status-spinner"></div>
                <div class="status-text">Generating image... This may take a few moments.</div>
            `;
            aiSection.appendChild(statusDiv);
        }
        
        // Add Twitter share button to success modal
        const successActions = document.querySelector('.success-actions');
        if (successActions) {
            // Check if button already exists
            if (!document.getElementById('success-share-twitter')) {
                const twitterBtn = document.createElement('a');
                twitterBtn.id = 'success-share-twitter';
                twitterBtn.className = 'btn twitter-btn';
                twitterBtn.innerHTML = '<i class="fab fa-twitter"></i> Share on Twitter';
                twitterBtn.href = '#';
                twitterBtn.target = '_blank';
                
                successActions.appendChild(twitterBtn);
            }
        }
    },
    
    /**
     * Setup Twitter sharing functionality
     */
    setupTwitterSharing: function() {
        const twitterBtn = document.getElementById('success-share-twitter');
        if (twitterBtn) {
            twitterBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const nameElement = document.getElementById('success-nft-name');
                const idElement = document.getElementById('success-nft-id');
                const imgElement = document.getElementById('success-nft-img');
                
                if (nameElement && idElement && imgElement) {
                    const name = nameElement.textContent;
                    const tokenId = idElement.textContent;
                    const imageUrl = imgElement.src;
                    
                    const twitterUrl = imageUtils.createTwitterShareLink(name, tokenId, imageUrl);
                    window.open(twitterUrl, '_blank');
                }
            });
        }
    }
};

// Initialize UI enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure other scripts are loaded
    setTimeout(() => {
        uiEnhancements.init();
    }, 1000);
});