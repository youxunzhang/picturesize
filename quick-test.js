// 快速功能测试脚本
console.log('🧪 ImageResizer Pro - 快速功能测试');

// 测试1: 检查关键函数是否存在
function testFunctions() {
    console.log('\n📋 测试1: JavaScript函数');
    const functions = ['scrollToResizer', 'scrollToFeatures'];
    let passed = 0;
    
    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} 函数存在`);
            passed++;
        } else {
            console.log(`❌ ${funcName} 函数不存在`);
        }
    });
    
    console.log(`结果: ${passed}/${functions.length} 通过`);
    return passed === functions.length;
}

// 测试2: 检查DOM元素
function testDOMElements() {
    console.log('\n📋 测试2: DOM元素');
    const elements = [
        'uploadArea', 'imageInput', 'resizerControls', 'imagePreview',
        'widthInput', 'heightInput', 'aspectRatio', 'qualitySlider',
        'qualityValue', 'formatSelect', 'resizeBtn', 'downloadBtn', 'resetBtn'
    ];
    
    let found = 0;
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ 元素 #${id} 存在`);
            found++;
        } else {
            console.log(`❌ 元素 #${id} 不存在`);
        }
    });
    
    console.log(`结果: ${found}/${elements.length} 找到`);
    return found === elements.length;
}

// 测试3: 检查CSS样式
function testCSS() {
    console.log('\n📋 测试3: CSS样式');
    const testElement = document.createElement('div');
    testElement.className = 'feature-card';
    document.body.appendChild(testElement);
    
    const styles = window.getComputedStyle(testElement);
    const hasStyles = styles.display !== 'none' && styles.padding !== '0px';
    
    document.body.removeChild(testElement);
    
    if (hasStyles) {
        console.log('✅ CSS样式正常加载');
        return true;
    } else {
        console.log('❌ CSS样式加载异常');
        return false;
    }
}

// 测试4: 检查事件监听器
function testEventListeners() {
    console.log('\n📋 测试4: 事件监听器');
    
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    
    if (uploadArea && imageInput) {
        console.log('✅ 上传区域和文件输入存在');
        
        // 测试点击事件
        try {
            uploadArea.click();
            console.log('✅ 上传区域点击事件正常');
            return true;
        } catch (error) {
            console.log('❌ 上传区域点击事件异常:', error.message);
            return false;
        }
    } else {
        console.log('❌ 上传区域或文件输入不存在');
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    const results = [
        testFunctions(),
        testDOMElements(),
        testCSS(),
        testEventListeners()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n🎯 测试总结: ${passed}/${total} 通过`);
    
    if (passed === total) {
        console.log('🎉 所有测试通过！功能正常！');
    } else {
        console.log('⚠️ 部分测试失败，请检查问题');
    }
    
    return passed === total;
}

// 自动运行测试
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// 导出测试函数供手动调用
window.testImageResizer = {
    testFunctions,
    testDOMElements,
    testCSS,
    testEventListeners,
    runAllTests
};
