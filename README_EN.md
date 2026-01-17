<p align="center">
   <a href="./public/logo.png" target="_blank">
     <img src="./public/logo.png" alt="AI Doc Helper Logo" width="120" />
   </a>
 </p>

<h1 align="center">AI Doc Helper</h1>
<p align="center">🚀 AI-Powered Intelligent Document Processing Assistant V2.0</p>

<p align="center">
   <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.x-61dafb.svg" alt="React 18" /></a>
   <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6.svg" alt="TypeScript 5" /></a>
   <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.x-646CFF.svg" alt="Vite 5" /></a>
   <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" alt="node >=18" /></a>
   <a href="https://www.npmjs.com/"><img src="https://img.shields.io/badge/npm-%3E%3D9-CB3837?logo=npm&logoColor=white" alt="npm >=9" /></a>
   <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
</p>

<div align="center">

**🌐 [English](README_EN.md) | [简体中文](README.md)**

<br>
<br>

<a href="https://ai-doc.xyz" target="_blank" style="display: inline-flex; align-items: center;">
   👉
   <span style="font-size: 16px; font-weight: bold; color: #2563eb;">Try Now: https://ai-doc.xyz</span>
</a>

<br>
<br>

<a href="#-introduction">Introduction</a> ·
<a href="#-core-features">Core Features</a> ·
<a href="#-quick-start">Quick Start</a> ·
<a href="#-tech-stack">Tech Stack</a> ·
<a href="#-project-structure">Project Structure</a>

</div>

---

## 💡 Introduction

**AI Doc Helper** is a professional document processing tool based on **React + Vite + API**, designed specifically for academic writing, report generation, and document processing.

It integrates **Markdown Editor**, **Perfect Word Export** (with LaTeX formula support), **AI Vision Recognition Center** (formulas/tables/handwriting/PDF/watermark removal), **Multi-Document Intelligent Processing**, **AI Deep Research**, **Unified History Management**, and **AI Long-term Memory** capabilities to boost your document creation efficiency!

---

## ✨ Core Features

### 1. 📝 Immersive Editor
Dual-column design with Markdown editing on the left and real-time Word A4 page preview on the right. Supports one-click "Academic Polish", "LaTeX Formula Correction", and "Custom Functions".

#### 1.1 AI Assistant Format Correction
Copy content from deepseek and use AI Assistant to correct and generate properly formatted markdown formulas and tables.
<img src="public/gif/editor_ai.gif" alt="Editor AI Assistant Demo" width="600" />

#### 1.2 Custom AI Assistant Functions
Enter a function name, and the large model automatically generates and applies prompts. Supports full-text correction as well as selected fragment correction.
The GIF example shows [Add More Details]
<img src="public/gif/editor_aidiy.gif" alt="Custom AI Assistant" width="600" />


---

### 2. 🤖 AI Vision Recognition Center
Supports screenshot recognition of mathematical formulas, complex tables, handwritten notes, and intelligent PDF conversion. Automatically converts to LaTeX or Markdown format with one-click insertion into documents.

#### 2.1 Formula Recognition
Recognizes mathematical formulas and converts them to LaTeX format
<img src="public/gif/ocr_latexgif.gif" alt="Formula Recognition Demo" width="600" />

#### 2.2 Table Recognition
Converts tables from screenshots to Markdown format
<img src="public/gif/ocr_tablegif.gif" alt="Table Recognition Demo" width="600" />

#### 2.3 Handwriting Recognition
Recognizes handwritten content and converts it to Markdown
<img src="public/gif/ocr_writegif.gif" alt="Handwriting Recognition Demo" width="600" />

#### 2.4 PDF Intelligent Conversion
Processes PDF pages, intelligently extracting text and images
<img src="public/gif/ocr_pdf.gif" alt="PDF Conversion Demo" width="600" />



---

### 3. 📚 Multi-Document Intelligent Processing
Batch file renaming and weekly report automatic aggregation. AI automatically analyzes file content, extracts key information (such as author, date, assignment batch), and generates standardized filenames.

#### 3.1 Deep Research
Upload multi-format files for deep research and report generation, including research on papers, code, theory, and custom functions.
The large model automatically generates and applies prompts. The GIF example shows [Financial Report Research].

<img src="public/gif/multidoc_dp.gif" alt="Deep Research Demo" width="600" />


#### 3.2 Weekly Report Integration
Batch process report files and automatically aggregate them into a unified report. No more manual weekly report organization.

<img src="public/gif/multidoc_week.gif" alt="Weekly Report Integration" width="600" />

#### 3.3 Missing Items Check
Enter the submission list, import files, and automatically generate verification results (including submitted, missing, and abnormal files). Check who hasn't submitted their homework!

<img src="public/gif/multidoc_check.gif" alt="Missing Items Check" width="600" />

#### 3.4 Intelligent Renaming
Submitted homework is not standardized? One-click renaming automatically extracts key information from filenames (such as author, date, assignment batch, etc.) and generates standardized filenames.

<img src="public/gif/multidoc_rename.gif" alt="Intelligent Renaming" width="600" />


---

### 4. 🔍 AI Deep Research
Automated research report generation system supporting web search, web page access, information aggregation, and report generation. Customize AI Agent prompts to meet personalized research needs.

<img src="public/gif/airesearch.gif" alt="AI Deep Research" width="600" />


---

### 5. 📜 User Center
Configurable theme colors, API management, and custom LLMs


Track all module operation history. All content is saved locally in the browser to ensure data security.


<img src="public/user/user.png" alt="User Center" width="200" />

---

## 🚀 Quick Start (Or visit https://ai-doc.xyz/ for direct access)

### Environment Setup

Ensure [Node.js](https://nodejs.org/) is installed (v18 or v20 recommended)

```bash
# Check Node.js version
node -v
npm -v
```

### Install Dependencies

```bash
# Clone the project (if not already done)
git clone <project-repo>
cd ai-doc-helper

# Install dependencies
npm install
```

### Start Development Server

```bash
npm run dev
```

After successful startup, visit [http://localhost:5173](http://localhost:5173) in your browser to start using.

### API Key Configuration

For convenience, you can directly fill in the API Key in the **"User Center"** in the top-right corner of the webpage:


> 🔒 **Privacy Protection**: API Keys are only stored in the browser's LocalStorage and are not uploaded to any server.

### Production Build

```bash
# Build production version
npm run build

# Preview build result
npm run preview
```

---

## 🛠️ Tech Stack

| Technology | Version | Description |
|------------|---------|-------------|
| **Frontend Framework** | React 18 + TypeScript + Vite 5 | Modern frontend development framework |
| **Language** | TypeScript 5.x | Type-safe superset of JavaScript |
| **Build Tool** | Vite 5.x | Next-generation frontend build tool |
| **UI Styling** | Tailwind CSS | Utility-first CSS framework |
| **Markdown Rendering** | react-markdown | React component-based Markdown rendering |
| **Math Formulas** | KaTeX + remark-math | Fast mathematical formula rendering |
| **Word Processing** | docx | Generate and manipulate Word documents |
| **PDF Processing** | mammoth | Convert Word to Markdown/HTML |
| **AI Integration** | OpenAI API | Compatible with various multimodal and text models |

---

## 📂 Project Structure

```
ai-doc-helper/
├── components/          # Components directory
│   ├── Editor/         # Editor components
│   ├── Layout/         # Layout components
│   ├── MultiDoc/       # Multi-document processing
│   ├── OCR/            # OCR recognition
│   ├── PDF/            # PDF conversion
│   ├── Preview/        # Preview components
│   ├── Research/       # AI research
│   ├── Tools/          # Tool components
│   └── WebSum/         # Web summarization
├── utils/              # Utility functions
│   ├── aiHelper.ts     # AI helper functions (multimodal/text models)
│   ├── converter.ts    # Format conversion
│   ├── gemini.ts       # Gemini API wrapper
│   ├── settings.ts     # Configuration management (model/theme/prompt/memory)
│   ├── historyManager.ts   # Unified history management
├── public/             # Static assets
├── App.tsx             # Main application component
├── index.tsx           # Entry file
├── types.ts            # Type definitions
└── package.json        # Project configuration
```

---

## 📄 License

This project is open source under the [MIT License](./LICENSE).

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

## ⭐ Star History

If this project helps you, please give it a Star ⭐️ to show your support!

---

<p align="center">
   Made with ❤️ by SYSU - The College Dropout
</p>