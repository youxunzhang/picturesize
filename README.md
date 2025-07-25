# 图片处理工具

一个功能强大的在线图片处理工具，支持调整大小、裁剪、压缩和格式转换。所有处理都在浏览器本地完成，保护您的隐私。

## 功能特点

### 🖼️ 调整大小
- 自定义宽度和高度
- 保持宽高比选项
- 预设常用尺寸 (1920x1080, 1280x720, 800x600)
- 实时预览效果

### ✂️ 智能裁剪
- 多种裁剪比例 (1:1, 16:9, 4:3, 自由)
- 可拖拽的裁剪框
- 精确的裁剪控制
- 实时预览裁剪结果

### 🗜️ 图片压缩
- 可调节压缩质量 (1-100)
- 实时显示文件大小对比
- 保持图片质量的同时减小文件大小
- 支持批量处理

### 🔄 格式转换
- 支持 JPEG、PNG、WebP 格式
- 无损格式转换
- 优化网络传输
- 兼容性强

## 使用方法

### 1. 上传图片
- **拖拽上传**: 直接将图片拖拽到上传区域
- **点击上传**: 点击"选择图片"按钮选择文件
- **支持格式**: JPG、PNG、GIF、WebP

### 2. 调整图片
- **调整大小**: 在左侧工具栏输入新的宽度和高度
- **裁剪图片**: 选择裁剪比例后点击"开始裁剪"
- **压缩图片**: 调整质量滑块来控制压缩程度
- **转换格式**: 选择目标格式（JPEG/PNG/WebP）

### 3. 预览和下载
- **实时预览**: 右侧预览区域显示处理后的效果
- **应用修改**: 点击"应用修改"按钮处理图片
- **下载图片**: 点击"下载图片"按钮保存处理后的图片
- **重置图片**: 点击"重置"按钮恢复原始图片

## 快捷键

- `Ctrl/Cmd + O`: 打开文件选择器
- `Ctrl/Cmd + S`: 下载处理后的图片
- `Ctrl/Cmd + R`: 重置图片

## 技术特点

- **纯前端实现**: 使用 HTML5 Canvas API 进行图片处理
- **隐私保护**: 所有处理都在浏览器本地完成，不上传到服务器
- **响应式设计**: 支持桌面和移动设备
- **现代UI**: 使用现代化的设计语言和动画效果
- **高性能**: 优化的图片处理算法，快速响应

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 文件结构

```
IMGSIZE/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # JavaScript 功能
├── README.md          # 说明文档
└── 需求.txt           # 需求文档
```

## 开发说明

### 本地运行
1. 克隆或下载项目文件
2. 使用现代浏览器打开 `index.html`
3. 开始使用图片处理功能

### 部署
由于是纯前端项目，可以直接部署到任何静态文件服务器：
- GitHub Pages
- Netlify
- Vercel
- 任何支持静态文件的服务器

## 更新日志

### v1.0.0
- 初始版本发布
- 支持图片调整大小
- 支持图片裁剪
- 支持图片压缩
- 支持格式转换
- 响应式设计
- 拖拽上传功能

## 许可证

MIT License - 可自由使用、修改和分发

## 联系我们

如果您有任何问题或建议，请通过以下方式联系我们：
- 提交 Issue
- 发送邮件
- 在线反馈

---

**隐私声明**: 本工具所有图片处理操作都在您的浏览器本地完成，不会上传到任何服务器，完全保护您的隐私安全。 