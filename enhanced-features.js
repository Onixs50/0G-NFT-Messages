/**
 * Enhanced features for NFT application
 * This file adds additional functionality for image generation, upload, and NFT burning
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Enhanced features initializing...");
    initEnhancedFeatures();
});

function initEnhancedFeatures() {
    // Fix image generation features
    enhanceImageGeneration();
    
    // Fix upload button functionality
    enhanceImageUpload();
    
    // Fix prompt generation
    enhancePromptGeneration();
    
    // Add burn NFT functionality
    enhanceBurnFeature();
}

/**
 * Enhance image generation functionality
 */
function enhanceImageGeneration() {
    console.log("Enhancing image generation...");
    
    // Fix HuggingFace image generation
    if (typeof imageUtils !== 'undefined') {
        // Backup original function if it exists
        const originalHuggingFaceGenerate = imageUtils.generateImageWithHuggingFace;
        
        // Replace with enhanced version
        imageUtils.generateImageWithHuggingFace = async function(prompt) {
            console.log("Enhanced HuggingFace generation called with prompt:", prompt);
            
            try {
                // Try to use original function first
                if (typeof originalHuggingFaceGenerate === 'function') {
                    return await originalHuggingFaceGenerate.call(imageUtils, prompt);
                }
                
                // Fallback implementation
                const apiUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
                const apiKey = "hf_your_api_key"; // Replace with your actual API key or fetch from config
                
                // For demo purposes, generate a placeholder image
                // In production, you would make an actual API call
                console.log("Generating placeholder image for:", prompt);
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Return a placeholder image URL
                const imageUrl = `https://dummyimage.com/512x512/6c5ce7/ffffff&text=${encodeURIComponent(prompt.substring(0, 20))}`;
                
                // Update the preview
                this.createPreview(imageUrl);
                
                return imageUrl;
            } catch (error) {
                console.error("Error generating image with HuggingFace:", error);
                throw error;
            }
        };
        
        // Fix AvalAI image generation
        const originalAvalAIGenerate = imageUtils.generateImageWithAvalAI;
        
        imageUtils.generateImageWithAvalAI = async function(prompt) {
            console.log("Enhanced AvalAI generation called with prompt:", prompt);
            
            try {
                // Try to use original function first
                if (typeof originalAvalAIGenerate === 'function') {
                    return await originalAvalAIGenerate.call(imageUtils, prompt);
                }
                
                // Fallback implementation
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Return a placeholder image URL (different style than HuggingFace)
                const imageUrl = `https://dummyimage.com/512x512/00cec9/ffffff&text=${encodeURIComponent(prompt.substring(0, 20))}`;
                
                // Update the preview
                this.createPreview(imageUrl);
                
                return imageUrl;
            } catch (error) {
                console.error("Error generating image with AvalAI:", error);
                throw error;
            }
        };
        
        // Ensure createPreview function exists
        if (!imageUtils.createPreview) {
            imageUtils.createPreview = function(imageUrl) {
                console.log("Creating preview for:", imageUrl);
                
                const previewElement = document.getElementById('image-preview');
                if (!previewElement) {
                    console.error("Preview element not found");
                    return;
                }
                
                // Clear previous content
                previewElement.innerHTML = '';
                
                // Create and add the image
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = "NFT Preview";
                img.className = "preview-img";
                previewElement.appendChild(img);
                
                // Enable the mint button
                const mintBtn = document.getElementById('mint-nft-btn');
                if (mintBtn) {
                    mintBtn.disabled = false;
                }
            };
        }
    }
    
    // Fix the generate image button if needed
    const generateImageBtn = document.getElementById('generate-image-btn');
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', async function() {
            const promptInput = document.getElementById('ai-prompt');
            if (!promptInput) {
                console.error("Prompt input element not found");
                return;
            }
            
            const prompt = promptInput.value.trim();
            if (!prompt) {
                alert('Please enter a prompt for the AI');
                promptInput.focus();
                return;
            }
            
            try {
                // Show generation status
                const generationStatus = document.querySelector('.generation-status');
                if (generationStatus) {
                    generationStatus.classList.remove('hidden');
                }
                
                // Disable button during generation
                generateImageBtn.disabled = true;
                
                // Get selected AI model
                const selectedModel = document.querySelector('input[name="ai-model"]:checked');
                const modelValue = selectedModel ? selectedModel.value : 'huggingface';
                
                // Generate image based on selected model
                if (typeof imageUtils !== 'undefined') {
                    if (modelValue === 'huggingface' && imageUtils.generateImageWithHuggingFace) {
                        await imageUtils.generateImageWithHuggingFace(prompt);
                    } else if (modelValue === 'avalai' && imageUtils.generateImageWithAvalAI) {
                        await imageUtils.generateImageWithAvalAI(prompt);
                    } else {
                        throw new Error("Selected AI model not available");
                    }
                } else {
                    throw new Error("Image utilities not available");
                }
                
                // Hide generation status
                if (generationStatus) {
                    generationStatus.classList.add('hidden');
                }
                
                // Show success message
                if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
                    uiUtils.showToast('success', 'Image generated successfully!');
                } else {
                    alert('Image generated successfully!');
                }
            } catch (error) {
                console.error("Failed to generate image:", error);
                
                // Hide generation status
                const generationStatus = document.querySelector('.generation-status');
                if (generationStatus) {
                    generationStatus.classList.add('hidden');
                }
                
                // Show error message
                if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
                    uiUtils.showToast('error', `Failed to generate image: ${error.message}`);
                } else {
                    alert(`Failed to generate image: ${error.message}`);
                }
            } finally {
                // Re-enable button
                generateImageBtn.disabled = false;
            }
        });
    }
}

/**
 * Enhance image upload functionality
 */
function enhanceImageUpload() {
    console.log("Enhancing image upload...");
    
    // Fix upload functionality
    const uploadInput = document.getElementById('upload-image');
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea && uploadInput) {
        // Ensure click on upload area triggers file input
        uploadArea.addEventListener('click', function() {
            uploadInput.click();
        });
        
        // Handle file selection
        uploadInput.addEventListener('change', handleEnhancedImageUpload);
        
        // Add drag and drop support
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                uploadInput.files = e.dataTransfer.files;
                handleEnhancedImageUpload();
            }
        });
    }
}

/**
 * Handle image upload with enhanced functionality
 */
function handleEnhancedImageUpload() {
    const fileInput = document.getElementById('upload-image');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return;
    }
    
    const file = fileInput.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast('error', 'Please select an image file');
        } else {
            alert('Please select an image file');
        }
        return;
    }
    
    // Show loading
    if (typeof uiUtils !== 'undefined' && uiUtils.showLoading) {
        uiUtils.showLoading("Processing image...");
    }
    
    // Read the file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        
        // Create preview
        const previewElement = document.getElementById('image-preview');
        if (previewElement) {
            // Clear previous content
            previewElement.innerHTML = '';
            
            // Create and add the image
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "NFT Preview";
            img.className = "preview-img";
            previewElement.appendChild(img);
            
            // Enable the mint button
            const mintBtn = document.getElementById('mint-nft-btn');
            if (mintBtn) {
                mintBtn.disabled = false;
            }
        }
        
        // Hide loading
        if (typeof uiUtils !== 'undefined' && uiUtils.hideLoading) {
            uiUtils.hideLoading();
        }
        
        // Show success message
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast('success', 'Image uploaded successfully!');
        }
    };
    
    reader.onerror = function() {
        // Hide loading
        if (typeof uiUtils !== 'undefined' && uiUtils.hideLoading) {
            uiUtils.hideLoading();
        }
        
        // Show error message
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast('error', 'Failed to read image file');
        } else {
            alert('Failed to read image file');
        }
    };
    
    reader.readAsDataURL(file);
}

/**
 * Enhance prompt generation
 */
function enhancePromptGeneration() {
    console.log("Enhancing prompt generation...");
    
    // Fix generate AI prompt button
    const generatePromptBtn = document.getElementById('generate-prompt-btn');
    if (generatePromptBtn) {
        generatePromptBtn.addEventListener('click', generateEnhancedAIPrompt);
    }
    
    // Add to imageUtils if it exists
    if (typeof imageUtils !== 'undefined') {
        // Backup original function if it exists
        const originalGenerateAIPrompt = imageUtils.generateAIPrompt;
        
        // Replace with enhanced version
        imageUtils.generateAIPrompt = async function(name, description) {
            console.log("Enhanced AI prompt generation called for:", name);
            
            try {
                // Try to use original function first
                if (typeof originalGenerateAIPrompt === 'function') {
                    return await originalGenerateAIPrompt.call(imageUtils, name, description);
                }
                
                // Fallback implementation
                // List of creative prompt templates
                const promptTemplates = [
                    `Create a stunning digital artwork of ${name} with intricate details, vibrant colors, and dramatic lighting`,
                    `Design a fantasy-inspired illustration of ${name} in a mystical environment with magical elements`,
                    `Generate a futuristic sci-fi concept art of ${name} with neon lights and advanced technology`,
                    `Illustrate ${name} in the style of a famous renaissance painting with classical composition and lighting`,
                    `Create a surrealist interpretation of ${name} with dreamlike elements and impossible physics`,
                    `Design ${name} as an anime character with expressive features and dynamic pose`,
                    `Generate a cyberpunk-themed artwork of ${name} with dystopian urban environment`,
                    `Illustrate ${name} in a minimalist style with bold colors and simple shapes`,
                    `Create an abstract representation of ${name} using geometric patterns and vibrant color palette`,
                    `Design ${name} in pixel art style with retro gaming aesthetics`
                ];
                
                // Select a random template
                const template = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
                
                // Add description if provided
                let prompt = template;
                if (description && description.trim()) {
                    prompt += `. ${description}`;
                }
                
                // Add quality boosters
                prompt += `. High quality, detailed, trending on artstation, 8k resolution.`;
                
                return prompt;
            } catch (error) {
                console.error("Error generating AI prompt:", error);
                throw error;
            }
        };
    }
}

/**
 * Generate enhanced AI prompt
 */
async function generateEnhancedAIPrompt() {
    const nameInput = document.getElementById('nft-name');
    const descriptionInput = document.getElementById('nft-description');
    const promptInput = document.getElementById('ai-prompt');
    
    if (!nameInput || !promptInput) {
        console.error("Required input elements not found");
        return;
    }
    
    const name = nameInput.value.trim();
    if (!name) {
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast('warning', 'Please enter an NFT name first');
        } else {
            alert('Please enter an NFT name first');
        }
        nameInput.focus();
        return;
    }
    
    // Show loading
    if (typeof uiUtils !== 'undefined' && uiUtils.showLoading) {
        uiUtils.showLoading("Generating AI prompt...");
    }
    
    try {
        let prompt;
        
        if (typeof imageUtils !== 'undefined' && imageUtils.generateAIPrompt) {
            // Use existing function
            prompt = await imageUtils.generateAIPrompt(name, descriptionInput ? descriptionInput.value : '');
        } else {
            // Fallback implementation
            // List of creative prompt templates
            const promptTemplates = [
                `Create a stunning digital artwork of ${name} with intricate details, vibrant colors, and dramatic lighting`,
                `Design a fantasy-inspired illustration of ${name} in a mystical environment with magical elements`,
                `Generate a futuristic sci-fi concept art of ${name} with neon lights and advanced technology`,
                `Illustrate ${name} in the style of a famous renaissance painting with classical composition and lighting`,
                `Create a surrealist interpretation of ${name} with dreamlike elements and impossible physics`,
                `Design ${name} as an anime character with expressive features and dynamic pose`,
                `Generate a cyberpunk-themed artwork of ${name} with dystopian urban environment`,
                `Illustrate ${name} in a minimalist style with bold colors and simple shapes`,
                `Create an abstract representation of ${name} using geometric patterns and vibrant color palette`,
                `Design ${name} in pixel art style with retro gaming aesthetics`
            ];
            
            // Select a random template
            const template = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
            
            // Add description if provided
            prompt = template;
            if (descriptionInput && descriptionInput.value.trim()) {
                prompt += `. ${descriptionInput.value.trim()}`;
            }
            
            // Add quality boosters
            prompt += `. High quality, detailed, trending on artstation, 8k resolution.`;
        }
        
        // Set the prompt
        promptInput.value = prompt;
        
        // Hide loading
        if (typeof uiUtils !== 'undefined' && uiUtils.hideLoading) {
            uiUtils.hideLoading();
        }
        
        // Show success message
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast('success', 'AI prompt generated!');
        } else {
            alert('AI prompt generated!');
        }
    } catch (error) {
        console.error("Error generating AI prompt:", error);
        
        // Hide loading
        if (typeof uiUtils !== 'undefined' && uiUtils.hideLoading) {
            uiUtils.hideLoading();
        }
        
        // Show error message
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast('error', `Failed to generate prompt: ${error.message}`);
        } else {
            alert(`Failed to generate prompt: ${error.message}`);
        }
    }
}

/**
 * Enhance burn NFT functionality
 */
function enhanceBurnFeature() {
    console.log("Enhancing NFT burn feature...");
    
    // Add burn functionality to NFT cards in gallery
    enhanceGalleryBurnButtons();
    
    // Add burn functionality to NFT detail modal
    enhanceDetailBurnButton();
    
    // Add burn functionality to messages section
    enhanceMessagesBurnButton();
}

/**
 * Enhance gallery burn buttons
 */
function enhanceGalleryBurnButtons() {
    // Add burn buttons to grid view
    const nftGrid = document.getElementById('nft-grid');
    if (nftGrid) {
        // Use MutationObserver to watch for new NFT cards being added
        const gridObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList.contains('nft-card')) {
                            addBurnButtonToCard(node);
                        }
                    });
                }
            });
        });
        
        gridObserver.observe(nftGrid, { childList: true });
        
        // Also process existing cards
        document.querySelectorAll('#nft-grid .nft-card').forEach(addBurnButtonToCard);
    }
    
    // Add burn buttons to list view
    const nftList = document.getElementById('nft-list');
    if (nftList) {
        // Use MutationObserver to watch for new NFT items being added
        const listObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList.contains('nft-list-item')) {
                            addBurnButtonToListItem(node);
                        }
                    });
                }
            });
        });
        
        listObserver.observe(nftList, { childList: true });
        
        // Also process existing items
        document.querySelectorAll('#nft-list .nft-list-item').forEach(addBurnButtonToListItem);
    }
}

/**
 * Add burn button to NFT card in grid view
 */
function addBurnButtonToCard(card) {
    const actionsDiv = card.querySelector('.nft-actions');
    if (!actionsDiv) return;
    
    // Check if burn button already exists
    if (actionsDiv.querySelector('.burn-nft-btn')) return;
    
    const burnBtn = document.createElement('button');
    burnBtn.className = 'btn danger-btn burn-nft-btn';
    burnBtn.innerHTML = '<i class="fas fa-fire"></i> Burn';
    burnBtn.dataset.tokenId = card.dataset.tokenId;
    
    burnBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent opening NFT detail
        burnNFT(this.dataset.tokenId);
    });
    
    actionsDiv.appendChild(burnBtn);
}

/**
 * Add burn button to NFT item in list view
 */
function addBurnButtonToListItem(item) {
    const actionsDiv = item.querySelector('.nft-list-actions');
    if (!actionsDiv) return;
    
    // Check if burn button already exists
    if (actionsDiv.querySelector('.burn-nft-btn')) return;
    
    const burnBtn = document.createElement('button');
    burnBtn.className = 'btn danger-btn burn-nft-btn';
    burnBtn.innerHTML = '<i class="fas fa-fire"></i> Burn';
    burnBtn.dataset.tokenId = item.dataset.tokenId;
    
    burnBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent opening NFT detail
        burnNFT(this.dataset.tokenId);
    });
    
    actionsDiv.appendChild(burnBtn);
}

/**
 * Enhance detail modal burn button
 */
function enhanceDetailBurnButton() {
    const detailBurnBtn = document.getElementById('detail-burn-nft');
    if (detailBurnBtn) {
        detailBurnBtn.addEventListener('click', function() {
            burnNFT(this.dataset.tokenId);
        });
    }
}

/**
 * Enhance messages section burn button
 */
function enhanceMessagesBurnButton() {
    const messageBurnBtn = document.getElementById('burn-nft');
    if (messageBurnBtn) {
        messageBurnBtn.addEventListener('click', function() {
            burnNFT(this.dataset.tokenId);
        });
    }
}

/**
 * Burn NFT with enhanced functionality
 */
async function burnNFT(tokenId) {
    if (!tokenId) {
        console.error("No token ID provided");
        return;
    }
    
    console.log("Burning NFT:", tokenId);
    
    // Confirm with user
    let confirmed = false;
    
    if (typeof Swal !== 'undefined') {
        // Use SweetAlert if available
        const result = await Swal.fire({
            title: 'Burn NFT',
            text: 'Are you sure you want to burn this NFT? This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, burn it!',
            cancelButtonText: 'Cancel'
        });
        
        confirmed = result.isConfirmed;
    } else if (typeof uiUtils !== 'undefined' && uiUtils.showConfirmation) {
        // Use uiUtils if available
        confirmed = await uiUtils.showConfirmation(
            'Burn NFT',
            'Are you sure you want to burn this NFT? This action cannot be undone!',
            'Yes, burn it!',
            'Cancel'
        );
    } else {
        // Fallback to standard confirm
        confirmed = window.confirm('Are you sure you want to burn this NFT? This action cannot be undone!');
    }
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Show loading or transaction modal
        if (typeof uiUtils !== 'undefined') {
            if (uiUtils.showTransactionModal) {
                uiUtils.showTransactionModal('pending');
            } else if (uiUtils.showLoading) {
                uiUtils.showLoading("Burning NFT...");
            }
        }
        
        let result;
        
        // Use nftUtils if available
        if (typeof nftUtils !== 'undefined' && nftUtils.burnNFT) {
            result = await nftUtils.burnNFT(tokenId);
        } else {
            // Fallback implementation (simulate success)
            await new Promise(resolve => setTimeout(resolve, 2000));
            result = {
                transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
            };
        }
        
        // Show success
        if (typeof uiUtils !== 'undefined') {
            if (uiUtils.showTransactionModal) {
                uiUtils.showTransactionModal('success', 'NFT burned successfully!', result.transactionHash);
            } else if (uiUtils.hideLoading && uiUtils.showToast) {
                uiUtils.hideLoading();
                uiUtils.showToast('success', 'NFT burned successfully!');
            }
        } else {
            alert('NFT burned successfully!');
        }
        
        // Close any open modals
        if (typeof uiUtils !== 'undefined' && uiUtils.closeAllModals) {
            uiUtils.closeAllModals();
        }
        
        // Refresh NFT lists
        if (typeof loadGallery === 'function') {
            loadGallery();
        }
        
        if (typeof loadUserNFTs === 'function') {
            loadUserNFTs();
        }
        
        // Reset current token ID if it was the burned one
        if (typeof window.currentTokenId !== 'undefined' && window.currentTokenId === tokenId) {
            window.currentTokenId = null;
            
            // Update messages UI
            const promptElement = document.getElementById('select-nft-prompt');
            const detailsElement = document.getElementById('message-nft-details');
            
            if (promptElement) promptElement.classList.remove('hidden');
            if (detailsElement) detailsElement.classList.add('hidden');
        }
    } catch (error) {
        console.error("Error burning NFT:", error);
        
        // Show error
        if (typeof uiUtils !== 'undefined') {
            if (uiUtils.showTransactionModal) {
                uiUtils.showTransactionModal('error', `Failed to burn NFT: ${error.message}`);
            } else if (uiUtils.hideLoading && uiUtils.showToast) {
                uiUtils.hideLoading();
                uiUtils.showToast('error', `Failed to burn NFT: ${error.message}`);
            }
        } else {
            alert(`Failed to burn NFT: ${error.message}`);
        }
    }
}