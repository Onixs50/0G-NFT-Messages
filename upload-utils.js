/**
 * Upload utilities for handling file uploads
 */
const uploadUtils = {
    /**
     * Initialize upload utilities
     */
    init: function() {
        console.log('Initializing upload utilities...');
        this.setupUploadArea();
    },
    
    /**
     * Set up drop area for file uploads
     */
    setupUploadArea: function() {
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.getElementById('upload-image');
        
        if (!uploadArea || !fileInput) return;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('highlight');
            }, false);
        });
        
        // Remove highlight when item is dragged out or dropped
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('highlight');
            }, false);
        });
        
        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                fileInput.files = files;
                this.handleImageUpload(files[0]);
            }
        }, false);
        
        // Handle click on upload area
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });
    },
    
    /**
     * Handle image upload
     * @param {File} file - The image file
     */
    handleImageUpload: function(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showUploadError('Please select a valid image file');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            this.showUploadError('File size should be less than 10MB');
            return;
        }
        
        const reader = new FileReader();
        const uploadArea = document.querySelector('.upload-area');
        
        reader.onload = (e) => {
            // Update upload area
            uploadArea.classList.remove('error');
            uploadArea.classList.add('success');
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="upload-message">File uploaded successfully</div>
                <div class="upload-preview">
                    <img src="${e.target.result}" alt="Uploaded Image">
                </div>
            `;
            
            // Store the base64 image data
            uploadArea.dataset.imageBase64 = e.target.result;
            
            // Update preview in the preview card
            const imagePreview = document.getElementById('image-preview');
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="NFT Preview">`;
            }
            
            // Enable the mint button
            const mintBtn = document.getElementById('mint-nft-btn');
            if (mintBtn) {
                mintBtn.disabled = false;
            }
        };
        
        reader.onerror = () => {
            this.showUploadError('Error reading file');
        };
        
        reader.readAsDataURL(file);
    },
    
    /**
     * Show upload error
     * @param {string} message - Error message
     */
    showUploadError: function(message) {
        const uploadArea = document.querySelector('.upload-area');
        
        uploadArea.classList.remove('success');
        uploadArea.classList.add('error');
        uploadArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="upload-message">${message}</div>
            <div class="upload-message">Drag and drop an image here or click to browse</div>
        `;
        
        // Show toast if available
        if (typeof uiUtils !== 'undefined' && uiUtils.showToast) {
            uiUtils.showToast(message, 'error');
        }
    },
    
    /**
     * Get base64 image data from upload area
     * @returns {string|null} Base64 image data or null
     */
    getUploadedImage: function() {
        const uploadArea = document.querySelector('.upload-area');
        return uploadArea ? uploadArea.dataset.imageBase64 : null;
    },
    
    /**
     * Reset upload area
     */
    resetUploadArea: function() {
        const uploadArea = document.querySelector('.upload-area');
        if (!uploadArea) return;
        
        uploadArea.classList.remove('success', 'error', 'highlight');
        uploadArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <div class="upload-message">Drag and drop an image here or click to browse</div>
        `;
        
        // Reset file input
        const fileInput = document.getElementById('upload-image');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Clear stored data
        delete uploadArea.dataset.imageBase64;
    },
    
    /**
     * Prevent default events
     * @param {Event} e - Event object
     */
    preventDefaults: function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
};

// Initialize upload utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    uploadUtils.init();
});