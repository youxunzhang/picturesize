// Debug script to test functionality
console.log('Debug script loaded');

// Test DOM elements
function testDOMElements() {
    console.log('Testing DOM elements...');
    
    const elements = [
        'uploadArea',
        'imageInput', 
        'resizerControls',
        'previewImage',
        'originalSize',
        'newSize',
        'widthInput',
        'heightInput',
        'aspectRatio',
        'qualitySlider',
        'qualityValue',
        'formatSelect',
        'resizeBtn',
        'downloadBtn',
        'resetBtn'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? 'Found' : 'NOT FOUND');
    });
}

// Test file upload
function testFileUpload() {
    console.log('Testing file upload...');
    const fileInput = document.getElementById('imageInput');
    if (fileInput) {
        console.log('File input found');
        
        // Create a test file
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        
        canvas.toBlob(function(blob) {
            const file = new File([blob], 'test.png', { type: 'image/png' });
            console.log('Test file created:', file);
            
            // Simulate file selection
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
            
            console.log('File change event triggered');
        }, 'image/png');
    } else {
        console.log('File input not found');
    }
}

// Run tests when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running tests...');
    setTimeout(() => {
        testDOMElements();
        testFileUpload();
    }, 1000);
});
