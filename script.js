// Global variables
let currentImage = null;
let originalImageData = null;
let resizedImageData = null;

// DOM elements (will be initialized after DOM loads)
let uploadArea, imageInput, resizerControls, imagePreview, originalSize, newSize;
let widthInput, heightInput, aspectRatioCheckbox, qualitySlider, qualityValue;
let formatSelect, resizeBtn, downloadBtn, resetBtn;
let hamburger, navMenu;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    initializeEventListeners();
    initializeNavigation();
});

// Initialize DOM elements
function initializeDOMElements() {
    uploadArea = document.getElementById('uploadArea');
    imageInput = document.getElementById('imageInput');
    resizerControls = document.getElementById('resizerControls');
    imagePreview = document.getElementById('previewImage');
    originalSize = document.getElementById('originalSize');
    newSize = document.getElementById('newSize');
    widthInput = document.getElementById('widthInput');
    heightInput = document.getElementById('heightInput');
    aspectRatioCheckbox = document.getElementById('aspectRatio');
    qualitySlider = document.getElementById('qualitySlider');
    qualityValue = document.getElementById('qualityValue');
    formatSelect = document.getElementById('formatSelect');
    resizeBtn = document.getElementById('resizeBtn');
    downloadBtn = document.getElementById('downloadBtn');
    resetBtn = document.getElementById('resetBtn');
    hamburger = document.querySelector('.hamburger');
    navMenu = document.querySelector('.nav-menu');
    
    // Debug: Log which elements were found
    console.log('DOM Elements initialized:', {
        uploadArea: !!uploadArea,
        imageInput: !!imageInput,
        resizerControls: !!resizerControls,
        imagePreview: !!imagePreview,
        originalSize: !!originalSize,
        newSize: !!newSize,
        widthInput: !!widthInput,
        heightInput: !!heightInput,
        aspectRatioCheckbox: !!aspectRatioCheckbox,
        qualitySlider: !!qualitySlider,
        qualityValue: !!qualityValue,
        formatSelect: !!formatSelect,
        resizeBtn: !!resizeBtn,
        downloadBtn: !!downloadBtn,
        resetBtn: !!resetBtn,
        hamburger: !!hamburger,
        navMenu: !!navMenu
    });
}

// Event Listeners
function initializeEventListeners() {
    // Check if elements exist before adding listeners
    if (!uploadArea || !imageInput || !resizerControls) {
        console.error('Required DOM elements not found:', {
            uploadArea: !!uploadArea,
            imageInput: !!imageInput,
            resizerControls: !!resizerControls
        });
        return;
    }
    
    // Upload area events
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            if (imageInput) imageInput.click();
        });
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    // File input event
    if (imageInput) {
        imageInput.addEventListener('change', handleFileSelect);
    }
    
    // Control events
    if (widthInput) widthInput.addEventListener('input', handleDimensionChange);
    if (heightInput) heightInput.addEventListener('input', handleDimensionChange);
    if (aspectRatioCheckbox) aspectRatioCheckbox.addEventListener('change', handleAspectRatioChange);
    if (qualitySlider) qualitySlider.addEventListener('input', updateQualityDisplay);
    
    // Button events
    if (resizeBtn) resizeBtn.addEventListener('click', resizeImage);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadImage);
    if (resetBtn) resetBtn.addEventListener('click', resetResizer);
    
    console.log('Event listeners initialized successfully');
}

// Navigation functionality
function initializeNavigation() {
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// File selection handler
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Process uploaded file
function processFile(file) {
    console.log('Processing file:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('File loaded successfully');
        loadImage(e.target.result);
    };
    reader.onerror = function(e) {
        console.error('Error reading file:', e);
        showError('Error reading the image file.');
    };
    reader.readAsDataURL(file);
}

// Load image and initialize controls
function loadImage(imageSrc) {
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        originalImageData = {
            src: imageSrc,
            width: img.naturalWidth,
            height: img.naturalHeight,
            fileSize: getFileSizeString(imageSrc)
        };
        
        // Update UI
        imagePreview.src = imageSrc;
        originalSize.textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
        newSize.textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
        
        // Set initial dimensions
        widthInput.value = img.naturalWidth;
        heightInput.value = img.naturalHeight;
        
        // Show controls
        resizerControls.style.display = 'grid';
        uploadArea.style.display = 'none';
        
        // Reset buttons
        resizeBtn.disabled = false;
        downloadBtn.disabled = true;
        
        // Add success animation
        imagePreview.classList.add('success-animation');
        setTimeout(() => {
            imagePreview.classList.remove('success-animation');
        }, 600);
    };
    
    img.src = imageSrc;
}

// Handle dimension changes
function handleDimensionChange() {
    if (!currentImage) return;
    
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    
    if (aspectRatioCheckbox.checked) {
        const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
        
        if (this === widthInput) {
            heightInput.value = Math.round(width / aspectRatio);
        } else {
            widthInput.value = Math.round(height * aspectRatio);
        }
    }
    
    updateNewSizeDisplay();
}

// Handle aspect ratio checkbox change
function handleAspectRatioChange() {
    if (this.checked && currentImage) {
        const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
        const currentWidth = parseInt(widthInput.value);
        heightInput.value = Math.round(currentWidth / aspectRatio);
        updateNewSizeDisplay();
    }
}

// Update quality display
function updateQualityDisplay() {
    if (qualityValue && qualitySlider) {
        qualityValue.textContent = qualitySlider.value;
    }
}

// Update new size display
function updateNewSizeDisplay() {
    if (widthInput && heightInput && newSize) {
        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);
        newSize.textContent = `${width} × ${height}px`;
    }
}

// Resize image
async function resizeImage() {
    if (!currentImage) return;
    
    if (!widthInput || !heightInput || !qualitySlider || !formatSelect || !resizeBtn) {
        console.error('Required elements for resizing not found');
        return;
    }
    
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    const quality = parseInt(qualitySlider.value) / 100;
    const format = formatSelect.value;
    
    // Validate dimensions
    if (width < 1 || height < 1 || width > 10000 || height > 10000) {
        showError('Dimensions must be between 1 and 10,000 pixels.');
        return;
    }
    
    // Show loading state
    const originalText = resizeBtn.innerHTML;
    resizeBtn.innerHTML = '<div class="loading"></div> Processing...';
    resizeBtn.disabled = true;
    
    try {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(currentImage, 0, 0, width, height);
        
        // Convert to desired format
        let mimeType = 'image/jpeg';
        if (format === 'png') {
            mimeType = 'image/png';
        } else if (format === 'webp') {
            mimeType = 'image/webp';
        } else if (format === 'original') {
            // Keep original format
            mimeType = currentImage.src.split(';')[0].split(':')[1];
        }
        
        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, quality);
        });
        
        // Create object URL
        resizedImageData = {
            blob: blob,
            url: URL.createObjectURL(blob),
            width: width,
            height: height,
            format: mimeType,
            fileSize: getFileSizeString(blob)
        };
        
        // Update preview
        imagePreview.src = resizedImageData.url;
        
        // Enable download button
        downloadBtn.disabled = false;
        
        // Show success message
        showSuccess('Image resized successfully!');
        
        // Add success animation
        imagePreview.classList.add('success-animation');
        setTimeout(() => {
            imagePreview.classList.remove('success-animation');
        }, 600);
        
    } catch (error) {
        console.error('Error resizing image:', error);
        showError('Failed to resize image. Please try again.');
    } finally {
        // Reset button
        resizeBtn.innerHTML = originalText;
        resizeBtn.disabled = false;
    }
}

// Download resized image
function downloadImage() {
    if (!resizedImageData) return;
    
    const link = document.createElement('a');
    link.href = resizedImageData.url;
    link.download = `resized-image-${resizedImageData.width}x${resizedImageData.height}.${getFileExtension(resizedImageData.format)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Image downloaded successfully!');
}

// Reset resizer
function resetResizer() {
    // Clear all data
    currentImage = null;
    originalImageData = null;
    resizedImageData = null;
    
    // Reset UI
    if (imagePreview) imagePreview.src = '';
    if (originalSize) originalSize.textContent = '';
    if (newSize) newSize.textContent = '';
    if (widthInput) widthInput.value = '';
    if (heightInput) heightInput.value = '';
    if (qualitySlider) qualitySlider.value = 90;
    if (qualityValue) qualityValue.textContent = '90';
    if (formatSelect) formatSelect.value = 'original';
    if (aspectRatioCheckbox) aspectRatioCheckbox.checked = true;
    
    // Hide controls
    if (resizerControls) resizerControls.style.display = 'none';
    if (uploadArea) uploadArea.style.display = 'block';
    
    // Reset buttons
    if (resizeBtn) resizeBtn.disabled = false;
    if (downloadBtn) downloadBtn.disabled = true;
    
    // Clear file input
    if (imageInput) imageInput.value = '';
    
    showSuccess('Resizer reset successfully!');
}

// Utility functions
function getFileSizeString(data) {
    let size;
    if (typeof data === 'string') {
        // Data URL
        size = Math.round((data.length * 3) / 4);
    } else {
        // Blob
        size = data.size;
    }
    
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return Math.round(size / (1024 * 1024)) + ' MB';
}

function getFileExtension(mimeType) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    };
    return extensions[mimeType] || 'jpg';
}

// Notification functions
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Smooth scrolling functions
function scrollToResizer() {
    document.getElementById('resizer').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function scrollToFeatures() {
    document.getElementById('features').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + R to reset
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        resetResizer();
    }
    
    // Ctrl/Cmd + S to save/download
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!downloadBtn.disabled) {
            downloadImage();
        }
    }
    
    // Escape to close mobile menu
    if (e.key === 'Escape') {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Performance optimization: Debounce resize events
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Handle responsive adjustments if needed
        if (window.innerWidth <= 768) {
            // Mobile adjustments
            if (resizerControls.style.display === 'grid') {
                resizerControls.style.gridTemplateColumns = '1fr';
            }
        } else {
            // Desktop adjustments
            if (resizerControls.style.display === 'grid') {
                resizerControls.style.gridTemplateColumns = '1fr 1fr';
            }
        }
    }, 250);
});

// Cleanup function
window.addEventListener('beforeunload', function() {
    // Clean up object URLs to prevent memory leaks
    if (resizedImageData && resizedImageData.url) {
        URL.revokeObjectURL(resizedImageData.url);
    }
});


// Bookmark functionality
function bookmarkPage() {
    const title = document.title;
    const url = window.location.href;
    
    if (window.sidebar && window.sidebar.addPanel) {
        // Firefox
        window.sidebar.addPanel(title, url, '');
    } else if (window.external && ('AddFavorite' in window.external)) {
        // Internet Explorer
        window.external.AddFavorite(url, title);
    } else if (window.opera && window.print) {
        // Opera
        const elem = document.createElement('a');
        elem.setAttribute('href', url);
        elem.setAttribute('title', title);
        elem.setAttribute('rel', 'sidebar');
        elem.click();
    } else {
        // Modern browsers
        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
            alert('Press Ctrl+D (or Cmd+D on Mac) to bookmark this page');
        } else {
            alert('Press Ctrl+D (or Cmd+D on Mac) to bookmark this page');
        }
    }
}

// Share functionality
function sharePage() {
    const title = document.title;
    const url = window.location.href;
    const text = 'Check out this amazing free image resizer tool!';
    
    if (navigator.share) {
        // Native Web Share API
        navigator.share({
            title: title,
            text: text,
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Show share options
        showShareModal(title, text, url);
    }
}

// Show share modal with social media options
function showShareModal(title, text, url) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-header">
                <h3>Share this page</h3>
                <button class="close-modal" onclick="closeShareModal()">&times;</button>
            </div>
            <div class="share-options">
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-option facebook">
                    <i class="fab fa-facebook-f"></i>
                    Facebook
                </a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank" class="share-option twitter">
                    <i class="fab fa-twitter"></i>
                    Twitter
                </a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" class="share-option linkedin">
                    <i class="fab fa-linkedin-in"></i>
                    LinkedIn
                </a>
                <a href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}" target="_blank" class="share-option pinterest">
                    <i class="fab fa-pinterest-p"></i>
                    Pinterest
                </a>
                <a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" target="_blank" class="share-option whatsapp">
                    <i class="fab fa-whatsapp"></i>
                    WhatsApp
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}" target="_blank" class="share-option telegram">
                    <i class="fab fa-telegram-plane"></i>
                    Telegram
                </a>
                <button class="share-option copy-link" onclick="copyToClipboard('${url}')">
                    <i class="fas fa-link"></i>
                    Copy Link
                </button>
            </div>
        </div>
    `;
    
    // Add styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    document.body.appendChild(modal);
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
        closeShareModal();
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
        closeShareModal();
    });
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('share-modal')) {
        closeShareModal();
    }
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
