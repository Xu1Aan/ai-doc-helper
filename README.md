# AI Doc Helper (AI 文档助手)

这是一个基于 React + Vite + Gemini API 的专业文档处理工具。它集成了 Markdown 编辑器、Word 完美导出（支持 LaTeX 公式）、OCR 公式识别以及 AI 智能润色功能。

## 📸 界面展示 (Interface Preview)

> 💡 **提示**：为了获得最佳体验，请在项目根目录下创建 `docs/images/` 文件夹，并将您的截图按以下命名保存，图片将会自动显示在这里。

### 1. 沉浸式编辑器 (Immersive Editor)
双栏设计，左侧 Markdown 编辑，右侧实时预览 Word A4 纸张排版效果。支持一键“学术化润色”和“LaTeX 公式修正”。
![Editor Interface](docs/images/preview_editor.png)
*(如果未显示图片，请截取编辑器界面并保存为 `docs/images/preview_editor.png`)*

### 2. AI 视觉识别中心 (OCR Intelligence)
支持截图识别数学公式、复杂表格和手写笔记。自动转换为 LaTeX 或 Markdown 格式，一键插入文档。
![OCR Interface](docs/images/preview_ocr.png)
*(请截取 OCR 界面并保存为 `docs/images/preview_ocr.png`)*

### 3. 多文档智能处理 (Batch Processor)
批量文件重命名与周报自动聚合。AI 自动分析文件内容，提取关键信息（如作者、日期、作业批次）并生成规范文件名。
![Multi-Doc Interface](docs/images/preview_multidoc.png)
*(请截取多文档界面并保存为 `docs/images/preview_multidoc.png`)*

---

## ✨ 核心功能

*   **Markdown 编辑器**: 双栏实时预览，支持丰富的快捷键。
*   **Word 完美导出**: 自动转换 Markdown 为 docx 格式，LaTeX 公式自动转为 Word 原生公式对象。
*   **AI 智能润色**: 内置“导出预优化”、“学术化润色”等 Prompt，支持自定义。
*   **OCR 识别**: 截图粘贴即可识别数学公式、表格和手写笔记。
*   **多模型支持**: 兼容 Google Gemini, Alibaba Qwen (通义千问), DeepSeek 等 OpenAI 格式接口。

---

## 🚀 快速开始 (本地运行)

### 1. 环境准备
确保已安装 [Node.js](https://nodejs.org/) (推荐 v18 或 v20)。

### 2. 安装依赖
```bash
npm install
```

### 3. 启动服务
```bash
npm run dev
```
浏览器访问 `http://localhost:5173` 即可使用。

> **关于 API Key**: 为了方便使用，您可以直接在网页右上角的“用户中心”填写 API Key（数据仅保存在本地浏览器），无需配置环境变量。

---

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript + Vite
- **UI 库**: Tailwind CSS
- **文档内核**: `react-markdown` + `katex` + `docx`
- **AI 内核**: Google Gemini SDK / OpenAI Compatible Fetch

## 📄 许可证

MIT License