import React, { useState } from 'react';

type AlignMarker = 'left' | 'center' | 'right' | 'justify';

interface AlignEditorControllerProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  updateHistory: (value: string) => void;
  isLocked: boolean;
}

const ALIGN_MARKER_TRAILING_RE = /\s*\{\:align=(left|center|right|justify)\}\s*$/;
const ALIGN_MARKER_LEADING_RE = /^\s*\{\:align=(left|center|right|justify)\}\s*/;

const ALIGN_OPTIONS: { label: string; value: AlignMarker; title: string }[] = [
  { label: 'Left', value: 'left', title: 'Align Left' },
  { label: 'Center', value: 'center', title: 'Align Center' },
  { label: 'Right', value: 'right', title: 'Align Right' },
  { label: 'Justify', value: 'justify', title: 'Justify' }
];

const AlignEditorController: React.FC<AlignEditorControllerProps> = ({ textareaRef, updateHistory, isLocked }) => {
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  const alignParagraph = (align: AlignMarker) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;

    const rangeStart = current.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = current.indexOf('\n', end);
    const rangeEnd = nextBreak === -1 ? current.length : nextBreak;
    const block = current.substring(rangeStart, rangeEnd);

    const stripMarker = (value: string) => {
      let cleaned = value.replace(ALIGN_MARKER_LEADING_RE, '');
      cleaned = cleaned.replace(ALIGN_MARKER_TRAILING_RE, '').trimEnd();
      return cleaned;
    };

    let inFence = false;
    const updatedBlock = block
      .split('\n')
      .map((line) => {
        const trimmedStart = line.trimStart();
        if (trimmedStart.startsWith('```')) {
          inFence = !inFence;
          return line;
        }
        if (inFence) return line;
        if (line.trim().length === 0) return line;
        if (trimmedStart.startsWith('|')) return line;

        const indentMatch = line.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        const content = line.slice(indent.length);

        const headingMatch = content.match(/^(#{1,6}\s+)(.*)$/);
        if (headingMatch) {
          const cleaned = stripMarker(headingMatch[2]);
          if (cleaned.trim().length === 0) return line;
          return `${indent}${headingMatch[1]}{:align=${align}} ${cleaned}`;
        }

        const blockquoteMatch = content.match(/^(>+\s+)(.*)$/);
        if (blockquoteMatch) {
          const cleaned = stripMarker(blockquoteMatch[2]);
          if (cleaned.trim().length === 0) return line;
          return `${indent}${blockquoteMatch[1]}{:align=${align}} ${cleaned}`;
        }

        const listMatch = content.match(/^((?:[-+*]|\d+\.)\s+)(.*)$/);
        if (listMatch) {
          const cleaned = stripMarker(listMatch[2]);
          if (cleaned.trim().length === 0) return line;
          return `${indent}${listMatch[1]}{:align=${align}} ${cleaned}`;
        }

        const cleaned = stripMarker(content);
        if (cleaned.trim().length === 0) return line;
        return `${indent}{:align=${align}} ${cleaned}`;
      })
      .join('\n');

    const newValue = current.substring(0, rangeStart) + updatedBlock + current.substring(rangeEnd);
    updateHistory(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(rangeStart, rangeStart + updatedBlock.length);
    }, 0);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => { if (!isLocked) setShowAlignMenu(true); }}
      onMouseLeave={() => setShowAlignMenu(false)}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { if (!isLocked) setShowAlignMenu((prev) => !prev); }}
        disabled={isLocked}
        title="Align"
        className="p-1.5 px-3 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-300 text-[11px] font-bold text-slate-600 transition-all uppercase disabled:opacity-50 flex items-center"
      >
        Align
        <svg className={`w-3 h-3 ml-1 transform transition-transform ${showAlignMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAlignMenu && (
        <div className="absolute top-full left-0 pt-2 z-20">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-1 flex flex-col min-w-[120px]">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => { alignParagraph(option.value); setShowAlignMenu(false); }}
                disabled={isLocked}
                title={option.title}
                className="px-3 py-1.5 rounded text-[11px] font-bold text-left text-slate-600 hover:text-[var(--primary-color)] hover:bg-[var(--primary-50)] disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlignEditorController;
