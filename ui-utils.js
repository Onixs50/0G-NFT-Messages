/**
 * UI utilities for handling interface elements and notifications
 */
const uiUtils = {
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (info, success, error, warning)
     * @param {number} duration - How long to show the toast in milliseconds
     * @returns {HTMLElement} The toast element
     */
    showToast: function(message, type = 'info', duration = 3000) {
        // Make sure parameters are in the right order (handle both formats)
        if (typeof message === 'string' && ['success', 'error', 'warning', 'info'].includes(message)) {
            const temp = message;
            message = type;
            type = temp;
        }
        
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        // Remove any existing toasts with the same message to prevent duplicates
        const existingToasts = toastContainer.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            const toastMessage = toast.querySelector('.toast-message');
            if (toastMessage && toastMessage.textContent === message) {
                this.removeToast(toast);
            }
        });
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon;
        switch(type) {
            case 'success': icon = 'fa-check-circle'; break;
            case 'error': icon = 'fa-exclamation-circle'; break;
            case 'warning': icon = 'fa-exclamation-triangle'; break;
            default: icon = 'fa-info-circle';
        }
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Force a reflow to ensure CSS transitions work properly
        toast.offsetHeight;
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Store the timeout ID so we can clear it if needed
        if (duration > 0) {
            toast._timeoutId = setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        return toast;
    },
    
    /**
     * Create toast container if it doesn't exist
     * @returns {HTMLElement} The toast container
     */
    createToastContainer: function() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },
    
    /**
     * Remove a toast from the container
     * @param {HTMLElement} toast - The toast element to remove
     */
    removeToast: function(toast) {
        // Clear any existing timeout
        if (toast._timeoutId) {
            clearTimeout(toast._timeoutId);
            toast._timeoutId = null;
        }
        
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    /**
     * Show loading overlay
     * @param {string} message - The message to display
     */
    showLoading: function(message = 'Processing your request...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingMessage = document.getElementById('loading-message');
        
        if (overlay && loadingMessage) {
            loadingMessage.textContent = message;
            overlay.classList.remove('hidden');
        }
    },
    
    /**
     * Hide loading overlay
     */
    hideLoading: function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },
    
    /**
     * Show a modal
     * @param {string} modalId - The ID of the modal to show
     */
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    /**
     * Hide a modal
     * @param {string} modalId - The ID of the modal to hide
     */
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    /**
     * Format date to a readable string
     * @param {number|Date} timestamp - The timestamp or Date object
     * @param {boolean} includeTime - Whether to include time in the format
     * @returns {string} Formatted date string
     */
    formatDate: function(timestamp, includeTime = true) {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleDateString(undefined, options);
    },
    
    /**
     * Format relative time (e.g., "5 minutes ago")
     * @param {number|Date} timestamp - The timestamp or Date object
     * @returns {string} Relative time string
     */
    formatRelativeTime: function(timestamp) {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        
        if (diffSeconds < 60) {
            return 'just now';
        } else if (diffSeconds < 3600) {
            const minutes = Math.floor(diffSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffSeconds < 86400) {
            const hours = Math.floor(diffSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffSeconds < 2592000) {
            const days = Math.floor(diffSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(diffSeconds / 2592000);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }
    },
    
    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - The function to debounce
     * @param {number} wait - Time to wait in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait = 300) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    /**
     * Show a sweet alert notification
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @param {string} icon - Alert icon (success, error, warning, info, question)
     * @returns {Promise} SweetAlert promise
     */
    showAlert: function(title, message, icon = 'info') {
        return Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonColor: '#6c5ce7',
            confirmButtonText: 'OK'
        });
    },
    
    /**
     * Show a confirmation dialog
     * @param {string} title - Confirmation title
     * @param {string} message - Confirmation message
     * @param {string} confirmText - Text for confirm button
     * @param {string} cancelText - Text for cancel button
     * @returns {Promise} SweetAlert promise
     */
    showConfirm: function(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6c5ce7',
            cancelButtonColor: '#e74c3c',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText
        });
    },
    
    /**
     * Show transaction status
     * @param {string} status - Transaction status (pending, success, error)
     * @param {Object} data - Transaction data
     */
    showTransactionStatus: function(status, data = {}) {
        animations.animateTransaction(status);
        
        if (status === 'success' && data.txHash) {
            const txLink = document.getElementById('transaction-link');
            if (txLink) {
                txLink.href = `${NETWORK.blockExplorer}/tx/${data.txHash}`;
            }
            
            const successMessage = document.getElementById('transaction-success-message');
            if (successMessage && data.message) {
                successMessage.textContent = data.message;
            }
            
            // Auto-hide transaction success after 5 seconds
            setTimeout(() => {
                animations.hideTransactionModal();
            }, 5000);
        } else if (status === 'error' && data.message) {
            const errorMessage = document.getElementById('transaction-error-message');
            if (errorMessage) {
                errorMessage.textContent = data.message;
            }
        }
    },
    
    /**
     * Show transaction success modal with SweetAlert2
     * @param {Object} nftData - Data about the minted NFT
     * @param {string} txHash - Transaction hash
     */
    showTransactionSuccess: function(nftData, txHash) {
        const explorerUrl = `${NETWORK.blockExplorer}/tx/${txHash}`;
        
        // HTML content for NFT success modal
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
                // Redirect to gallery tab
                const galleryTab = document.querySelector('.nav-tab[data-tab="gallery"]');
                if (galleryTab) {
                    galleryTab.click();
                }
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Open explorer in new tab
                window.open(explorerUrl, '_blank');
            }
        });
    },
    
    /**
     * Create an element with specified attributes and content
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement} content - Element content
     * @returns {HTMLElement} The created element
     */
    createElement: function(tag, attributes = {}, content = null) {
        const element = document.createElement(tag);
        
        // Set attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        // Add content
        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.appendChild(content);
            }
        }
        
        return element;
    },
    
    /**
     * Validate form inputs
     * @param {Object} fields - Field selectors and validation rules
     * @returns {boolean} Whether all fields are valid
     */
    validateForm: function(fields) {
        let isValid = true;
        
        for (const [selector, rules] of Object.entries(fields)) {
            const element = document.querySelector(selector);
            if (!element) continue;
            
            let fieldValid = true;
            let errorMessage = '';
            
            if (rules.required && !element.value.trim()) {
                fieldValid = false;
                errorMessage = rules.requiredMessage || 'This field is required';
            } else if (rules.minLength && element.value.length < rules.minLength) {
                fieldValid = false;
                errorMessage = rules.minLengthMessage || `Must be at least ${rules.minLength} characters`;
            } else if (rules.pattern && !rules.pattern.test(element.value)) {
                fieldValid = false;
                errorMessage = rules.patternMessage || 'Invalid format';
            } else if (rules.custom && !rules.custom(element.value)) {
                fieldValid = false;
                errorMessage = rules.customMessage || 'Invalid value';
            }
            
            // Handle validation UI
            const errorElement = document.querySelector(`${selector}-error`);
            if (errorElement) {
                errorElement.textContent = fieldValid ? '' : errorMessage;
            }
            
            if (!fieldValid) {
                animations.shakeElement(element);
                isValid = false;
            }
        }
        
        return isValid;
    },
    
    /**
     * Close all open toasts
     */
    closeAllToasts: function() {
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toasts = toastContainer.querySelectorAll('.toast');
            toasts.forEach(toast => {
                this.removeToast(toast);
            });
        }
    }
};

// Export uiUt// Export uiUtils to window
if (typeof window !== 'undefined') {
    window.uiUtils = uiUtils;
}

// Event listeners for Escape key and outside clicks
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        uiUtils.closeAllToasts();
    }
});

document.addEventListener('click', function(e) {
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer && !toastContainer.contains(e.target)) {
        const isActionButton = e.target.closest('button, a, .btn');
        if (!isActionButton) {
            uiUtils.closeAllToasts();
        }
    }
});

// Check for stuck toasts
setInterval(function() {
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        const toasts = toastContainer.querySelectorAll('.toast');
        if (toasts.length > 0) {
            const now = Date.now();
            toasts.forEach(toast => {
                const creationTime = parseInt(toast.dataset.creationTime || '0');
                if (creationTime && (now - creationTime > 10000)) {
                    uiUtils.removeToast(toast);
                }
            });
        }
    }
}, 5000);
