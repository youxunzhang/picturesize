// 全局变量
let originalImage = null;
let processedImage = null;
let canvas = null;
let ctx = null;
let currentFile = null;
let cropData = null;
let isCropping = false;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 获取DOM元素
    canvas = document.getElementById('previewCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新质量显示
    updateQualityDisplay();
}

function setupEventListeners() {
    // 文件上传
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('uploadArea');
    
    imageInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 尺寸调整
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    
    widthInput.addEventListener('input', handleSizeChange);
    heightInput.addEventListener('input', handleSizeChange);
    maintainAspectRatio.addEventListener('change', handleAspectRatioChange);
    
    // 预设尺寸
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', handlePresetSize);
    });
    
    // 裁剪
    const cropBtns = document.querySelectorAll('.crop-btn');
    cropBtns.forEach(btn => {
        btn.addEventListener('click', handleCropRatio);
    });
    
    const cropBtn = document.getElementById('cropBtn');
    cropBtn.addEventListener('click', toggleCrop);
    
    // 质量滑块
    const qualitySlider = document.getElementById('qualitySlider');
    qualitySlider.addEventListener('input', updateQualityDisplay);
    qualitySlider.addEventListener('change', updateImageQuality);
    
    // 格式选择
    const formatRadios = document.querySelectorAll('input[name="format"]');
    formatRadios.forEach(radio => {
        radio.addEventListener('change', updateImageFormat);
    });
    
    // 操作按钮
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    processBtn.addEventListener('click', processImage);
    downloadBtn.addEventListener('click', downloadImage);
    resetBtn.addEventListener('click', resetImage);
}

// 文件处理
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadImage(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            loadImage(file);
        }
    }
}

function loadImage(file) {
    currentFile = file;
    
    // 显示加载状态
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            processedImage = img;
            
            // 显示工具面板
            document.getElementById('toolsSection').style.display = 'block';
            
            // 更新画布
            updateCanvas();
            
            // 更新文件信息
            updateFileInfo();
            
            // 隐藏加载状态
            hideLoading();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateCanvas() {
    if (!processedImage) return;
    
    const maxWidth = 600;
    const maxHeight = 400;
    
    let { width, height } = calculateDisplaySize(processedImage.width, processedImage.height, maxWidth, maxHeight);
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(processedImage, 0, 0, width, height);
    
    // 更新图片信息
    updateImageInfo();
}

function calculateDisplaySize(imgWidth, imgHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    return {
        width: Math.floor(imgWidth * ratio),
        height: Math.floor(imgHeight * ratio)
    };
}

// 尺寸调整
function handleSizeChange(event) {
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    
    if (!originalImage) return;
    
    const originalRatio = originalImage.width / originalImage.height;
    
    if (maintainAspectRatio.checked) {
        if (event.target.id === 'widthInput') {
            const newWidth = parseInt(widthInput.value);
            if (newWidth > 0) {
                heightInput.value = Math.round(newWidth / originalRatio);
            }
        } else if (event.target.id === 'heightInput') {
            const newHeight = parseInt(heightInput.value);
            if (newHeight > 0) {
                widthInput.value = Math.round(newHeight * originalRatio);
            }
        }
    }
}

function handleAspectRatioChange() {
    // 当切换宽高比锁定时，重新计算尺寸
    if (!originalImage) return;
    
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    
    if (maintainAspectRatio.checked && widthInput.value) {
        const originalRatio = originalImage.width / originalImage.height;
        const newWidth = parseInt(widthInput.value);
        heightInput.value = Math.round(newWidth / originalRatio);
    }
}

function handlePresetSize(event) {
    const width = event.target.getAttribute('data-width');
    const height = event.target.getAttribute('data-height');
    
    document.getElementById('widthInput').value = width;
    document.getElementById('heightInput').value = height;
    
    // 取消宽高比锁定
    document.getElementById('maintainAspectRatio').checked = false;
}

// 裁剪功能
function handleCropRatio(event) {
    const ratio = event.target.getAttribute('data-ratio');
    
    // 移除其他按钮的active类
    document.querySelectorAll('.crop-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 添加active类到当前按钮
    event.target.classList.add('active');
    
    // 设置裁剪比例
    cropData = { ratio: ratio };
}

function toggleCrop() {
    if (!originalImage) return;
    
    isCropping = !isCropping;
    const cropBtn = document.getElementById('cropBtn');
    const cropOverlay = document.getElementById('cropOverlay');
    
    if (isCropping) {
        cropBtn.textContent = '完成裁剪';
        cropBtn.classList.add('active');
        cropOverlay.style.display = 'block';
        setupCropBox();
    } else {
        cropBtn.textContent = '开始裁剪';
        cropBtn.classList.remove('active');
        cropOverlay.style.display = 'none';
        applyCrop();
    }
}

function setupCropBox() {
    const cropBox = document.querySelector('.crop-box');
    const canvasRect = canvas.getBoundingClientRect();
    
    // 设置初始裁剪框
    const boxWidth = Math.min(200, canvas.width * 0.8);
    const boxHeight = Math.min(200, canvas.height * 0.8);
    
    cropBox.style.width = boxWidth + 'px';
    cropBox.style.height = boxHeight + 'px';
    cropBox.style.left = (canvas.width - boxWidth) / 2 + 'px';
    cropBox.style.top = (canvas.height - boxHeight) / 2 + 'px';
    
    // 添加拖拽事件
    makeCropBoxDraggable();
}

function makeCropBoxDraggable() {
    const cropBox = document.querySelector('.crop-box');
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    cropBox.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(cropBox.style.left);
        startTop = parseInt(cropBox.style.top);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
    
    function handleMouseMove(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newLeft = Math.max(0, Math.min(startLeft + dx, canvas.width - cropBox.offsetWidth));
        const newTop = Math.max(0, Math.min(startTop + dy, canvas.height - cropBox.offsetHeight));
        
        cropBox.style.left = newLeft + 'px';
        cropBox.style.top = newTop + 'px';
    }
    
    function handleMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

function applyCrop() {
    if (!originalImage || !cropData) return;
    
    const cropBox = document.querySelector('.crop-box');
    const scaleX = originalImage.width / canvas.width;
    const scaleY = originalImage.height / canvas.height;
    
    const x = parseInt(cropBox.style.left) * scaleX;
    const y = parseInt(cropBox.style.top) * scaleY;
    const width = cropBox.offsetWidth * scaleX;
    const height = cropBox.offsetHeight * scaleY;
    
    // 创建新画布进行裁剪
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    tempCtx.drawImage(originalImage, x, y, width, height, 0, 0, width, height);
    
    // 更新处理后的图片
    const croppedImage = new Image();
    croppedImage.onload = function() {
        processedImage = croppedImage;
        updateCanvas();
    };
    croppedImage.src = tempCanvas.toDataURL();
}

// 质量和格式
function updateQualityDisplay() {
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    qualityValue.textContent = qualitySlider.value;
}

function updateImageQuality() {
    if (!processedImage) return;
    
    const quality = document.getElementById('qualitySlider').value / 100;
    const format = document.querySelector('input[name="format"]:checked').value;
    
    // 更新压缩后的文件大小预览
    updateCompressedSize(quality, format);
}

function updateImageFormat() {
    if (!processedImage) return;
    
    const quality = document.getElementById('qualitySlider').value / 100;
    const format = document.querySelector('input[name="format"]:checked').value;
    
    updateCompressedSize(quality, format);
}

function updateCompressedSize(quality, format) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = processedImage.width;
    tempCanvas.height = processedImage.height;
    tempCtx.drawImage(processedImage, 0, 0);
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                    format === 'png' ? 'image/png' : 'image/webp';
    
    const dataUrl = tempCanvas.toDataURL(mimeType, quality);
    const compressedSize = Math.round((dataUrl.length - 22) * 0.75); // 估算文件大小
    
    document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
}

// 图片处理
function processImage() {
    if (!originalImage) return;
    
    showLoading();
    
    // 获取用户设置
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const quality = document.getElementById('qualitySlider').value / 100;
    const format = document.querySelector('input[name="format"]:checked').value;
    
    let newWidth = parseInt(widthInput.value) || processedImage.width;
    let newHeight = parseInt(heightInput.value) || processedImage.height;
    
    // 创建新画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    
    // 绘制调整后的图片
    tempCtx.drawImage(processedImage, 0, 0, newWidth, newHeight);
    
    // 更新处理后的图片
    const processedImg = new Image();
    processedImg.onload = function() {
        processedImage = processedImg;
        updateCanvas();
        updateImageInfo();
        hideLoading();
    };
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                    format === 'png' ? 'image/png' : 'image/webp';
    
    processedImg.src = tempCanvas.toDataURL(mimeType, quality);
}

function downloadImage() {
    if (!processedImage) return;
    
    const quality = document.getElementById('qualitySlider').value / 100;
    const format = document.querySelector('input[name="format"]:checked').value;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = processedImage.width;
    tempCanvas.height = processedImage.height;
    tempCtx.drawImage(processedImage, 0, 0);
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                    format === 'png' ? 'image/png' : 'image/webp';
    
    const dataUrl = tempCanvas.toDataURL(mimeType, quality);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `processed_image.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetImage() {
    if (!originalImage) return;
    
    // 重置所有设置
    document.getElementById('widthInput').value = '';
    document.getElementById('heightInput').value = '';
    document.getElementById('maintainAspectRatio').checked = true;
    document.getElementById('qualitySlider').value = 85;
    document.querySelector('input[name="format"][value="jpeg"]').checked = true;
    
    // 重置裁剪
    isCropping = false;
    document.getElementById('cropBtn').textContent = '开始裁剪';
    document.getElementById('cropBtn').classList.remove('active');
    document.getElementById('cropOverlay').style.display = 'none';
    
    // 重置图片
    processedImage = originalImage;
    updateCanvas();
    updateQualityDisplay();
}

// 辅助函数
function updateFileInfo() {
    if (!currentFile) return;
    
    const originalSize = document.getElementById('originalSize');
    originalSize.textContent = formatFileSize(currentFile.size);
}

function updateImageInfo() {
    if (!processedImage) return;
    
    const imageInfo = document.getElementById('imageInfo');
    imageInfo.textContent = `${processedImage.width} × ${processedImage.height}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showLoading() {
    document.getElementById('loadingModal').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingModal').style.display = 'none';
}

// 添加一些样式类的切换
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('preset-btn')) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }
});

// 消息提示功能
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // 显示消息
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);
    
    // 自动隐藏消息
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// 错误处理
function handleError(error, message = '操作失败') {
    console.error('Error:', error);
    showMessage(message, 'error');
    hideLoading();
}

// 增强的图片加载功能
function loadImageWithValidation(file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        showMessage('请选择有效的图片文件', 'error');
        return;
    }
    
    // 验证文件大小 (限制为50MB)
    if (file.size > 50 * 1024 * 1024) {
        showMessage('图片文件过大，请选择小于50MB的图片', 'error');
        return;
    }
    
    loadImage(file);
}

// 增强的处理图片功能
function processImageWithProgress() {
    if (!originalImage) return;
    
    showLoading();
    
    // 添加进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress-fill"></div>';
    
    const loadingContent = document.querySelector('.modal-content');
    loadingContent.appendChild(progressBar);
    
    const progressFill = progressBar.querySelector('.progress-fill');
    
    // 模拟进度
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        
        if (progress >= 90) {
            clearInterval(progressInterval);
        }
    }, 100);
    
    // 延迟执行实际处理
    setTimeout(() => {
        try {
            processImage();
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                showMessage('图片处理完成！', 'success');
                hideLoading();
                loadingContent.removeChild(progressBar);
            }, 500);
        } catch (error) {
            handleError(error, '图片处理失败');
            loadingContent.removeChild(progressBar);
        }
    }, 1000);
}

// 增强的文件大小显示
function updateFileSizeComparison() {
    if (!currentFile || !processedImage) return;
    
    const quality = document.getElementById('qualitySlider').value / 100;
    const format = document.querySelector('input[name="format"]:checked').value;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = processedImage.width;
    tempCanvas.height = processedImage.height;
    tempCtx.drawImage(processedImage, 0, 0);
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                    format === 'png' ? 'image/png' : 'image/webp';
    
    const dataUrl = tempCanvas.toDataURL(mimeType, quality);
    const compressedSize = Math.round((dataUrl.length - 22) * 0.75);
    
    const originalSize = currentFile.size;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);
    
    // 更新显示
    document.getElementById('originalSize').textContent = formatFileSize(originalSize);
    document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
    
    // 添加压缩比例显示
    const reductionElement = document.querySelector('.size-reduction');
    if (reductionElement) {
        reductionElement.textContent = reduction > 0 ? `节省 ${reduction}%` : '无压缩';
    }
}

// 增强的裁剪功能
function enhancedCropSetup() {
    if (!originalImage) return;
    
    const previewContent = document.querySelector('.preview-content');
    previewContent.classList.add('crop-mode');
    
    showMessage('拖拽选择裁剪区域', 'success');
}

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'o':
                e.preventDefault();
                document.getElementById('imageInput').click();
                break;
            case 's':
                e.preventDefault();
                if (processedImage) {
                    downloadImage();
                    showMessage('图片已下载', 'success');
                }
                break;
            case 'r':
                e.preventDefault();
                if (originalImage) {
                    resetImage();
                    showMessage('图片已重置', 'success');
                }
                break;
        }
    }
    
    // ESC键退出裁剪模式
    if (e.key === 'Escape' && isCropping) {
        toggleCrop();
    }
});

// 增强的事件监听器
function setupEnhancedEventListeners() {
    // 原有的事件监听器
    setupEventListeners();
    
    // 替换文件选择处理
    const imageInput = document.getElementById('imageInput');
    imageInput.removeEventListener('change', handleFileSelect);
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            loadImageWithValidation(file);
        }
    });
    
    // 增强拖拽处理
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('drop', function(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            loadImageWithValidation(files[0]);
        }
    });
    
    // 替换处理按钮
    const processBtn = document.getElementById('processBtn');
    processBtn.removeEventListener('click', processImage);
    processBtn.addEventListener('click', processImageWithProgress);
    
    // 添加质量滑块实时更新
    const qualitySlider = document.getElementById('qualitySlider');
    qualitySlider.addEventListener('input', function() {
        updateQualityDisplay();
        if (processedImage) {
            updateFileSizeComparison();
        }
    });
    
    // 添加格式选择实时更新
    const formatRadios = document.querySelectorAll('input[name="format"]');
    formatRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (processedImage) {
                updateFileSizeComparison();
            }
        });
    });
}

// 初始化增强功能
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEnhancedEventListeners();
    
    // 添加版本信息
    console.log('图片处理工具 v1.0.0 - 已加载');
    console.log('支持的功能：调整大小、裁剪、压缩、格式转换');
    console.log('快捷键：Ctrl+O(打开), Ctrl+S(保存), Ctrl+R(重置), ESC(退出裁剪)');
}); 