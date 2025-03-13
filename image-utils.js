/**
 * Utilities for AI image generation and image handling
 */
const imageUtils = {
    /**
     * Generate an image using AI
     * @param {string} prompt - The text prompt for image generation
     * @param {string} model - The model to use ('huggingface' or 'avalai')
     * @returns {Promise<string>} Base64 image data
     */
    generateImage: async function(prompt, model = 'huggingface') {
        try {
            console.log(`Generating image with ${model} model:`, prompt);
            uiUtils.showToast(`Generating your image with ${model === 'huggingface' ? 'Stable Diffusion XL' : 'DALL-E 3'}...`, 'info');
            
            let imageData;
            if (model === 'huggingface') {
                imageData = await this.generateWithHuggingFace(prompt);
            } else if (model === 'avalai') {
                imageData = await this.generateWithAvalAI(prompt);
            } else {
                throw new Error('Invalid model specified');
            }
            
            uiUtils.showToast('Image generated successfully!', 'success');
            return imageData;
        } catch (error) {
            console.error('Failed to generate image:', error);
            uiUtils.showToast(`Failed to generate image: ${error.message}`, 'error');
            throw error;
        }
    },
    
    /**
     * Generate image using Hugging Face API
     * @param {string} prompt - The text prompt for image generation
     * @returns {Promise<string>} Base64 image data
     */
    generateWithHuggingFace: async function(prompt) {
        try {
            const response = await fetch(API_CONFIG.huggingface.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.huggingface.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        negative_prompt: "blurry, bad quality, distorted, low resolution, poor lighting",
                        guidance_scale: 7.5
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('Hugging Face API error:', errorData);
                throw new Error(`API responded with status ${response.status}`);
            }
            
            // Hugging Face returns the image data directly
            const blob = await response.blob();
            return await this.blobToBase64(blob);
        } catch (error) {
            console.error('Error generating with Hugging Face:', error);
            throw new Error(`Failed to generate image with Hugging Face: ${error.message}`);
        }
    },
    
    /**
     * Generate image using AvalAI API
     * @param {string} prompt - The text prompt for image generation
     * @returns {Promise<string>} Base64 image data
     */
    generateWithAvalAI: async function(prompt) {
        try {
            const response = await fetch(`${API_CONFIG.avalai.baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.avalai.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: API_CONFIG.avalai.model,
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    response_format: "b64_json"
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('AvalAI API error:', errorData);
                throw new Error(errorData.error?.message || `API responded with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check if we have the expected response format
            if (!data.data || !data.data[0] || !data.data[0].b64_json) {
                console.error('Unexpected API response:', data);
                throw new Error('API returned unexpected data format');
            }
            
            return `data:image/png;base64,${data.data[0].b64_json}`;
        } catch (error) {
            console.error('Error generating with AvalAI:', error);
            throw new Error(`Failed to generate image with AvalAI: ${error.message}`);
        }
    },
    
    /**
     * Convert a Blob to base64 string
     * @param {Blob} blob - Image blob
     * @returns {Promise<string>} Base64 data URL
     */
    blobToBase64: function(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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
     * Convert base64 to File object
     * @param {string} base64 - Base64 encoded string
     * @param {string} filename - Name of the file
     * @returns {File} - File object
     */
    base64ToFile: function(base64, filename) {
        const blob = this.base64ToBlob(base64);
        
        // Extract content type from data URL if available
        let contentType = 'image/png'; // Default content type
        const dataUrlRegex = /^data:([^;]+);base64,/;
        const matches = base64.match(dataUrlRegex);
        if (matches && matches[1]) {
            contentType = matches[1];
        }
        
        // Create file name if not provided
        const name = filename || `image_${Date.now()}.${contentType.split('/')[1] || 'png'}`;
        
        // Create File object
        return new File([blob], name, { type: contentType });
    },
    
    /**
     * Handle file upload
     * @param {File} file - The uploaded file
     * @returns {Promise<string>} Base64 image data
     */
    handleFileUpload: function(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('Please upload an image file'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Generate a random prompt suggestion
     * @returns {string} Random prompt
     */
    getRandomPrompt: function() {
        const randomIndex = Math.floor(Math.random() * PROMPT_SUGGESTIONS.length);
        return PROMPT_SUGGESTIONS[randomIndex];
    },
    
    /**
     * Resize an image (for optimization)
     * @param {string} base64Image - Base64 image data
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {Promise<string>} Resized base64 image
     */
    resizeImage: function(base64Image, maxWidth = 1024, maxHeight = 1024) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * maxHeight / height);
                        height = maxHeight;
                    }
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert back to base64
                const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
                resolve(resizedBase64);
            };
            
            img.onerror = () => reject(new Error('Failed to load image for resizing'));
            img.src = base64Image;
        });
    }
};

// ??? ??? ??? ????? ????? ???? ?? ?? ?? ???? ???? ????? ????
if (typeof window.imageUtils !== 'undefined') {
    Object.assign(window.imageUtils, imageUtils);
} else {
    window.imageUtils = imageUtils;
}