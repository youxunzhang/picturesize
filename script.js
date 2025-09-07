// 全局变量
let originalImage = null;
let processedImage = null;
let canvas = null;
let ctx = null;
let currentFile = null;
let cropData = null;
let isCropping = false;
let imageHistory = [];
let historyIndex = -1;

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
    const smartCropBtn = document.getElementById('smartCropBtn');
    
    cropBtn.addEventListener('click', toggleCrop);
    smartCropBtn.addEventListener('click', performSmartCrop);
    
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
            
            // 重置历史记录
            imageHistory = [img.src];
            historyIndex = 0;
            
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
    
    // 如果正在裁剪模式，更新裁剪框
    if (isCropping) {
        updateCropBoxRatio();
    }
}

function updateCropBoxRatio() {
    if (!cropData || !cropData.ratio || cropData.ratio === 'free') return;
    
    const cropBox = document.querySelector('.crop-box');
    if (!cropBox) return;
    
    const [ratioW, ratioH] = cropData.ratio.split(':').map(Number);
    const ratio = ratioW / ratioH;
    
    const currentWidth = cropBox.offsetWidth;
    const currentHeight = cropBox.offsetHeight;
    const currentRatio = currentWidth / currentHeight;
    
    let newWidth, newHeight;
    
    if (currentRatio > ratio) {
        // 当前太宽，以高度为准
        newHeight = currentHeight;
        newWidth = newHeight * ratio;
    } else {
        // 当前太高，以宽度为准
        newWidth = currentWidth;
        newHeight = newWidth / ratio;
    }
    
    // 确保不超出画布边界
    const maxWidth = canvas.width - parseInt(cropBox.style.left);
    const maxHeight = canvas.height - parseInt(cropBox.style.top);
    
    if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = newWidth / ratio;
    }
    
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * ratio;
    }
    
    cropBox.style.width = newWidth + 'px';
    cropBox.style.height = newHeight + 'px';
    
    updateCropInfo();
}

function toggleCrop() {
    if (!originalImage) return;
    
    isCropping = !isCropping;
    const cropBtn = document.getElementById('cropBtn');
    const smartCropBtn = document.getElementById('smartCropBtn');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropInfo = document.getElementById('cropInfo');
    
    if (isCropping) {
        cropBtn.textContent = '完成裁剪';
        cropBtn.classList.add('active');
        if (smartCropBtn) smartCropBtn.style.display = 'block';
        cropOverlay.style.display = 'block';
        if (cropInfo) cropInfo.style.display = 'block';
        setupCropBox();
    } else {
        cropBtn.textContent = '开始裁剪';
        cropBtn.classList.remove('active');
        if (smartCropBtn) smartCropBtn.style.display = 'none';
        cropOverlay.style.display = 'none';
        if (cropInfo) cropInfo.style.display = 'none';
        applyCrop();
    }
}

function setupCropBox() {
    const cropBox = document.querySelector('.crop-box');
    const canvasRect = canvas.getBoundingClientRect();
    
    // 设置初始裁剪框
    let boxWidth = Math.min(200, canvas.width * 0.8);
    let boxHeight = Math.min(200, canvas.height * 0.8);
    
    // 如果有裁剪比例约束，应用比例
    if (cropData && cropData.ratio && cropData.ratio !== 'free') {
        const [ratioW, ratioH] = cropData.ratio.split(':').map(Number);
        const ratio = ratioW / ratioH;
        
        if (boxWidth / boxHeight > ratio) {
            boxWidth = boxHeight * ratio;
        } else {
            boxHeight = boxWidth / ratio;
        }
    }
    
    cropBox.style.width = boxWidth + 'px';
    cropBox.style.height = boxHeight + 'px';
    cropBox.style.left = (canvas.width - boxWidth) / 2 + 'px';
    cropBox.style.top = (canvas.height - boxHeight) / 2 + 'px';
    
    // 添加拖拽事件
    makeCropBoxDraggable();
    
    // 更新裁剪信息
    updateCropInfo();
}

function makeCropBoxDraggable() {
    const cropBox = document.querySelector('.crop-box');
    const handles = cropBox.querySelectorAll('.crop-handle');
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    let resizeHandle = null;
    
    // 拖拽移动
    cropBox.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('crop-handle')) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(cropBox.style.left);
        startTop = parseInt(cropBox.style.top);
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    });
    
    // 调整大小
    handles.forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            isResizing = true;
            resizeHandle = this.classList[1]; // 获取方向类名
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(cropBox.style.left);
            startTop = parseInt(cropBox.style.top);
            startWidth = cropBox.offsetWidth;
            startHeight = cropBox.offsetHeight;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleUp);
        });
    });
    
    function handleMove(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newLeft = Math.max(0, Math.min(startLeft + dx, canvas.width - cropBox.offsetWidth));
        const newTop = Math.max(0, Math.min(startTop + dy, canvas.height - cropBox.offsetHeight));
        
        cropBox.style.left = newLeft + 'px';
        cropBox.style.top = newTop + 'px';
        
        updateCropInfo();
    }
    
    function handleResize(e) {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let newLeft = startLeft;
        let newTop = startTop;
        let newWidth = startWidth;
        let newHeight = startHeight;
        
        // 根据拖拽的手柄调整大小
        switch(resizeHandle) {
            case 'top-left':
                newLeft = Math.max(0, startLeft + dx);
                newTop = Math.max(0, startTop + dy);
                newWidth = Math.max(50, startWidth - dx);
                newHeight = Math.max(50, startHeight - dy);
                break;
            case 'top-right':
                newTop = Math.max(0, startTop + dy);
                newWidth = Math.max(50, startWidth + dx);
                newHeight = Math.max(50, startHeight - dy);
                break;
            case 'bottom-left':
                newLeft = Math.max(0, startLeft + dx);
                newWidth = Math.max(50, startWidth - dx);
                newHeight = Math.max(50, startHeight + dy);
                break;
            case 'bottom-right':
                newWidth = Math.max(50, startWidth + dx);
                newHeight = Math.max(50, startHeight + dy);
                break;
        }
        
        // 应用裁剪比例约束
        if (cropData && cropData.ratio && cropData.ratio !== 'free') {
            const [ratioW, ratioH] = cropData.ratio.split(':').map(Number);
            const ratio = ratioW / ratioH;
            
            if (newWidth / newHeight > ratio) {
                newWidth = newHeight * ratio;
            } else {
                newHeight = newWidth / ratio;
            }
        }
        
        // 边界检查
        newLeft = Math.max(0, Math.min(newLeft, canvas.width - newWidth));
        newTop = Math.max(0, Math.min(newTop, canvas.height - newHeight));
        newWidth = Math.min(newWidth, canvas.width - newLeft);
        newHeight = Math.min(newHeight, canvas.height - newTop);
        
        cropBox.style.left = newLeft + 'px';
        cropBox.style.top = newTop + 'px';
        cropBox.style.width = newWidth + 'px';
        cropBox.style.height = newHeight + 'px';
        
        updateCropInfo();
    }
    
    function handleUp() {
        isDragging = false;
        isResizing = false;
        resizeHandle = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleUp);
    }
    
    function updateCropInfo() {
        const width = Math.round(cropBox.offsetWidth);
        const height = Math.round(cropBox.offsetHeight);
        const left = Math.round(parseInt(cropBox.style.left));
        const top = Math.round(parseInt(cropBox.style.top));
        
        // 显示裁剪信息
        const cropInfo = document.getElementById('cropInfo');
        const cropSize = document.getElementById('cropSize');
        if (cropInfo && cropSize) {
            cropSize.textContent = `${width} × ${height}`;
            cropInfo.style.display = 'block';
        }
        
        // 更新裁剪预览
        updateCropPreview();
    }
    
    function updateCropPreview() {
        if (!originalImage) return;
        
        const cropBox = document.querySelector('.crop-box');
        const scaleX = originalImage.width / canvas.width;
        const scaleY = originalImage.height / canvas.height;
        
        const x = parseInt(cropBox.style.left) * scaleX;
        const y = parseInt(cropBox.style.top) * scaleY;
        const width = cropBox.offsetWidth * scaleX;
        const height = cropBox.offsetHeight * scaleY;
        
        // 创建预览画布
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');
        
        previewCanvas.width = Math.min(100, width);
        previewCanvas.height = Math.min(100, height);
        
        // 绘制裁剪预览
        previewCtx.drawImage(originalImage, x, y, width, height, 0, 0, previewCanvas.width, previewCanvas.height);
        
        // 将预览设置为裁剪框的背景
        cropBox.style.backgroundImage = `url(${previewCanvas.toDataURL()})`;
        cropBox.style.backgroundSize = 'cover';
        cropBox.style.backgroundPosition = 'center';
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
        addToHistory(croppedImage.src);
        updateCanvas();
        updateImageInfo();
        showMessage('裁剪完成！', 'success');
    };
    croppedImage.src = tempCanvas.toDataURL();
}

// 智能裁剪功能
function performSmartCrop() {
    if (!originalImage) return;
    
    showLoading();
    
    // 简单的智能裁剪算法：选择图片中心区域
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);
    
    // 获取图片数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 计算图片的"重要性"区域（基于边缘检测的简化版本）
    const importance = calculateImageImportance(data, canvas.width, canvas.height);
    
    // 根据裁剪比例选择最佳区域
    const bestCrop = findBestCropArea(importance, canvas.width, canvas.height);
    
    // 应用智能裁剪
    applySmartCrop(bestCrop);
    
    hideLoading();
}

function calculateImageImportance(data, width, height) {
    const importance = new Array(width * height).fill(0);
    
    // 简化的边缘检测算法
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // 计算梯度
            const gx = Math.abs(
                data[idx + 4] - data[idx - 4] + // R
                data[idx + 5] - data[idx - 3] + // G
                data[idx + 6] - data[idx - 2]   // B
            );
            
            const gy = Math.abs(
                data[(y + 1) * width * 4 + x * 4] - data[(y - 1) * width * 4 + x * 4] + // R
                data[(y + 1) * width * 4 + x * 4 + 1] - data[(y - 1) * width * 4 + x * 4 + 1] + // G
                data[(y + 1) * width * 4 + x * 4 + 2] - data[(y - 1) * width * 4 + x * 4 + 2]   // B
            );
            
            importance[y * width + x] = Math.sqrt(gx * gx + gy * gy);
        }
    }
    
    return importance;
}

function findBestCropArea(importance, width, height) {
    // 获取裁剪比例
    let targetRatio = 1;
    if (cropData && cropData.ratio && cropData.ratio !== 'free') {
        const [ratioW, ratioH] = cropData.ratio.split(':').map(Number);
        targetRatio = ratioW / ratioH;
    }
    
    // 计算裁剪区域大小
    let cropWidth, cropHeight;
    if (width / height > targetRatio) {
        cropHeight = height;
        cropWidth = Math.floor(cropHeight * targetRatio);
    } else {
        cropWidth = width;
        cropHeight = Math.floor(cropWidth / targetRatio);
    }
    
    // 寻找重要性最高的区域
    let maxImportance = 0;
    let bestX = 0, bestY = 0;
    
    for (let y = 0; y <= height - cropHeight; y += 10) {
        for (let x = 0; x <= width - cropWidth; x += 10) {
            let totalImportance = 0;
            
            for (let dy = 0; dy < cropHeight; dy += 5) {
                for (let dx = 0; dx < cropWidth; dx += 5) {
                    totalImportance += importance[(y + dy) * width + (x + dx)];
                }
            }
            
            if (totalImportance > maxImportance) {
                maxImportance = totalImportance;
                bestX = x;
                bestY = y;
            }
        }
    }
    
    return {
        x: bestX,
        y: bestY,
        width: cropWidth,
        height: cropHeight
    };
}

function applySmartCrop(cropArea) {
    // 创建裁剪后的图片
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = cropArea.width;
    tempCanvas.height = cropArea.height;
    
    tempCtx.drawImage(
        originalImage,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
    );
    
    // 更新处理后的图片
    const croppedImage = new Image();
    croppedImage.onload = function() {
        processedImage = croppedImage;
        addToHistory(croppedImage.src);
        updateCanvas();
        updateImageInfo();
        showMessage('智能裁剪完成！', 'success');
    };
    croppedImage.src = tempCanvas.toDataURL();
}

// 历史记录管理
function addToHistory(imageSrc) {
    // 如果当前不在历史记录末尾，删除后面的记录
    if (historyIndex < imageHistory.length - 1) {
        imageHistory = imageHistory.slice(0, historyIndex + 1);
    }
    
    // 添加新的记录
    imageHistory.push(imageSrc);
    historyIndex = imageHistory.length - 1;
    
    // 限制历史记录数量
    if (imageHistory.length > 10) {
        imageHistory.shift();
        historyIndex--;
    }
}

function undoImage() {
    if (historyIndex > 0) {
        historyIndex--;
        const img = new Image();
        img.onload = function() {
            processedImage = img;
            updateCanvas();
            updateImageInfo();
            showMessage('已撤销', 'success');
        };
        img.src = imageHistory[historyIndex];
    }
}

function redoImage() {
    if (historyIndex < imageHistory.length - 1) {
        historyIndex++;
        const img = new Image();
        img.onload = function() {
            processedImage = img;
            updateCanvas();
            updateImageInfo();
            showMessage('已重做', 'success');
        };
        img.src = imageHistory[historyIndex];
    }
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
        addToHistory(processedImg.src);
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
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                    redoImage();
                } else {
                    undoImage();
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

// 收藏功能
function setupBookmarkFeature() {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (!bookmarkBtn) return;
    
    bookmarkBtn.addEventListener('click', function() {
        if (bookmarkBtn.classList.contains('bookmarked')) {
            // 取消收藏
            bookmarkBtn.classList.remove('bookmarked');
            showMessage('已取消收藏', 'success');
        } else {
            // 添加收藏
            bookmarkBtn.classList.add('bookmarked');
            showMessage('已添加到收藏夹', 'success');
        }
    });
}

// 分享功能
function setupShareFeature() {
    const shareBtn = document.getElementById('shareBtn');
    const shareDropdown = document.getElementById('shareDropdown');
    if (!shareBtn || !shareDropdown) return;
    
    shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        shareDropdown.classList.toggle('show');
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', function() {
        shareDropdown.classList.remove('show');
    });
    
    // 分享链接处理
    const shareLinks = document.querySelectorAll('.share-link');
    shareLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.dataset.platform;
            shareToPlatform(platform);
            shareDropdown.classList.remove('show');
        });
    });
}

function shareToPlatform(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const description = encodeURIComponent('免费在线图片处理工具，支持调整大小、裁剪、压缩、格式转换');
    
    let shareUrl = '';
    
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
            break;
        case 'pinterest':
            shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${description}`;
            break;
        case 'reddit':
            shareUrl = `https://reddit.com/submit?url=${url}&title=${title}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${title}%20${url}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
            break;
        case 'copy':
            copyToClipboard(window.location.href);
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('链接已复制到剪贴板', 'success');
        });
    } else {
        // 备用方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('链接已复制到剪贴板', 'success');
    }
}

// 初始化增强功能
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEnhancedEventListeners();
    setupBookmarkFeature();
    setupShareFeature();
    
    // 添加版本信息
    console.log('图片处理工具 v1.0.0 - 已加载');
    console.log('支持的功能：调整大小、裁剪、压缩、格式转换');
    console.log('快捷键：Ctrl+O(打开), Ctrl+S(保存), Ctrl+R(重置), ESC(退出裁剪)');
}); 