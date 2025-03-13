/**
 * Animation utilities for enhancing the UI with dynamic animations
 */
const animations = {
    /**
     * Initialize animations
     */
    init: function() {
        console.log('Initializing animations...');
        this.setupEntryAnimationParticles();
        this.setupButtonAnimations();
        this.setupScrollAnimations();
    },
    
    /**
     * Setup particle animation for the entry screen
     */
    setupEntryAnimationParticles: function() {
        const particlesContainer = document.querySelector('.particles');
        if (!particlesContainer) return;
        
        const colors = ['#6c5ce7', '#00cec9', '#fdcb6e'];
        
        // Create particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.position = 'absolute';
            particle.style.borderRadius = '50%';
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.opacity = Math.random() * 0.6 + 0.2;
            
            // Animate with GSAP
            gsap.to(particle, {
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100,
                duration: Math.random() * 10 + 10,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
            
            particlesContainer.appendChild(particle);
        }
    },
    
    /**
     * Setup hover animations for buttons
     */
    setupButtonAnimations: function() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.05,
                    duration: 0.2
                });
            });
            
            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    duration: 0.2
                });
            });
        });
    },
    
    /**
     * Setup scroll animations
     */
    setupScrollAnimations: function() {
        gsap.utils.toArray('.tab-content').forEach(section => {
            gsap.fromTo(section.children, {
                y: 50,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                stagger: 0.1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top center",
                    toggleActions: "play none none none"
                }
            });
        });
    },
    
    /**
     * Animate NFT card entrance
     * @param {HTMLElement} element - The element to animate
     * @param {number} delay - Delay in seconds
     */
    animateNFTCardEntrance: function(element, delay = 0) {
        gsap.fromTo(element, 
            { y: 50, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                duration: 0.5, 
                delay: delay,
                ease: "power2.out"
            }
        );
    },
    
    /**
     * Animate transaction processing
     * @param {string} status - 'pending', 'success', or 'error'
     */
    animateTransaction: function(status) {
        const modal = document.getElementById('transaction-modal');
        const pendingSection = document.getElementById('transaction-pending');
        const successSection = document.getElementById('transaction-success');
        const errorSection = document.getElementById('transaction-error');
        
        if (!modal) return;
        
        // Show modal
        modal.classList.add('active');
        
        // Hide all sections
        pendingSection.classList.add('hidden');
        successSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        
        // Show appropriate section
        if (status === 'pending') {
            pendingSection.classList.remove('hidden');
            gsap.fromTo(pendingSection.querySelector('.transaction-spinner'), 
                { rotation: 0 },
                { rotation: 360, duration: 2, repeat: -1, ease: "none" }
            );
        } else if (status === 'success') {
            successSection.classList.remove('hidden');
            gsap.fromTo(successSection.querySelector('.transaction-icon'), 
                { scale: 0, rotation: -30 },
                { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" }
            );
        } else if (status === 'error') {
            errorSection.classList.remove('hidden');
            gsap.fromTo(errorSection.querySelector('.transaction-icon'), 
                { scale: 0 },
                { scale: 1, duration: 0.5, ease: "back.out(1.7)" }
            );
            gsap.to(errorSection.querySelector('.transaction-icon'), {
                rotation: 5,
                duration: 0.1,
                repeat: 5,
                yoyo: true
            });
        }
    },
    
    /**
     * Hide transaction modal
     */
    hideTransactionModal: function() {
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    /**
     * Animate success message after minting
     */
    animateMintSuccess: function() {
        const successBadge = document.querySelector('.success-badge');
        if (successBadge) {
            gsap.fromTo(successBadge, 
                { scale: 0, rotation: -30 },
                { scale: 1, rotation: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" }
            );
        }
        
        const successActions = document.querySelector('.success-actions');
        if (successActions) {
            gsap.fromTo(successActions.children, 
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, delay: 0.5 }
            );
        }
    },
    
    /**
     * Animate message sending
     * @param {HTMLElement} messageElement - The message element to animate
     */
    animateMessageSend: function(messageElement) {
        gsap.fromTo(messageElement, 
            { opacity: 0, x: 50, height: 0 },
            { opacity: 1, x: 0, height: 'auto', duration: 0.3, ease: "power2.out" }
        );
    },
    
    /**
     * Animate property addition
     * @param {HTMLElement} propertyElement - The property element to animate
     */
    animatePropertyAddition: function(propertyElement) {
        gsap.fromTo(propertyElement, 
            { opacity: 0, height: 0 },
            { opacity: 1, height: 'auto', duration: 0.3, ease: "power2.out" }
        );
    },
    
    /**
     * Animate tab transition
     * @param {HTMLElement} tabContent - The tab content element
     */
    animateTabTransition: function(tabContent) {
        gsap.fromTo(tabContent, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
    },
    
    /**
     * Create confetti effect
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    createConfetti: function(x, y) {
        const colors = ['#6c5ce7', '#00cec9', '#fdcb6e', '#ff7675', '#74b9ff'];
        const container = document.body;
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.zIndex = '9999';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.left = `${x}px`;
            confetti.style.top = `${y}px`;
            container.appendChild(confetti);
            
            gsap.to(confetti, {
                x: Math.random() * 300 - 150,
                y: Math.random() * 300 - 50,
                rotation: Math.random() * 360,
                opacity: 0,
                duration: Math.random() * 2 + 1,
                ease: "power2.out",
                onComplete: () => {
                    container.removeChild(confetti);
                }
            });
        }
    },
    
    /**
     * Shake element (for errors)
     * @param {HTMLElement} element - The element to shake
     */
    shakeElement: function(element) {
        gsap.to(element, {
            x: 10,
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                gsap.to(element, { x: 0 });
            }
        });
    },
    
    /**
     * Pulse element (for attention)
     * @param {HTMLElement} element - The element to pulse
     */
    pulseElement: function(element) {
        gsap.fromTo(element, 
            { scale: 1 },
            { scale: 1.05, duration: 0.2, repeat: 1, yoyo: true }
        );
    }
};

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    animations.init();
});