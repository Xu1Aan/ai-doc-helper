
export enum AppView {
  EDITOR = 'editor',
  AI_VISION = 'ai_vision', // Renamed from OCR
  MULTI_DOC = 'multi_doc',
  AI_RESEARCH = 'ai_research'
}

export enum WordTemplate {
  STANDARD = 'standard',
  ACADEMIC = 'academic',
  NOTE = 'note',
  CUSTOM = 'custom'
}

export interface DocumentState {
  markdown: string;
  isProcessing: boolean;
  progress: number;
}

export interface OCRResult {
  latex: string;
  confidence?: number;
}

export interface DocumentStyle {
  fontFace: string;
  fontSize: number;
  lineSpacing: number;
  textColor: string;
  alignment: string;
  // 首行缩进（字符数）
  firstLineIndent: number;
  // 正文段落间距
  paragraphSpacing: {
    before: number;
    after: number;
  };
  // 各级标题样式
  heading1: {
    fontSize: number;
    fontFace: string;
    color: string;
    alignment: string;
    lineSpacing: number;
    spacing: {
      before: number;
      after: number;
    };
  };
  heading2: {
    fontSize: number;
    fontFace: string;
    color: string;
    alignment: string;
    lineSpacing: number;
    spacing: {
      before: number;
      after: number;
    };
  };
  heading3: {
    fontSize: number;
    fontFace: string;
    color: string;
    alignment: string;
    lineSpacing: number;
    spacing: {
      before: number;
      after: number;
    };
  };
  // 表格格式选项
  table: {
    isThreeLineTable: boolean;
  };
}

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'action' | 'error' | 'success';
  message: string;
  details?: string;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface ResearchState {
  topic: string;
  isRunning: boolean;
  logs: LogEntry[];
  report: string;
  sources: SearchResult[];
}
