import React, { forwardRef, useImperativeHandle, useState } from 'react';
import TableEditorModal, { type TableAlignment, type TableConfig, type TableEditorModalLabels } from './TableEditorModal';

export interface TableEditorHandle {
  open: () => void;
}

interface TableEditorControllerProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  updateHistory: (value: string) => void;
  isLocked: boolean;
}

const TABLE_EDITOR_LABELS: TableEditorModalLabels = {
  title: '表格编辑器',
  columns: '列',
  rows: '行',
  alignment: '对齐',
  header: '表头',
  body: '内容',
  clear: '清空',
  cancel: '取消',
  insert: '插入表格'
};

const createEmptyConfig = (columns: number, rows: number, alignments: TableAlignment[]): TableConfig => ({
  columns,
  rows,
  alignments,
  header: Array.from({ length: columns }, () => ''),
  body: Array.from({ length: rows }, () => Array.from({ length: columns }, () => ''))
});

const DEFAULT_COLUMNS = 2;
const DEFAULT_ROWS = 2;
const DEFAULT_ALIGNMENTS: TableAlignment[] = ['left', 'left'];

const TableEditorController = forwardRef<TableEditorHandle, TableEditorControllerProps>(
  ({ textareaRef, updateHistory, isLocked }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [initialConfig, setInitialConfig] = useState<TableConfig>(
      createEmptyConfig(DEFAULT_COLUMNS, DEFAULT_ROWS, DEFAULT_ALIGNMENTS)
    );

    const open = () => {
      if (isLocked) return;
      setInitialConfig(createEmptyConfig(DEFAULT_COLUMNS, DEFAULT_ROWS, DEFAULT_ALIGNMENTS));
      setIsOpen(true);
    };

    useImperativeHandle(ref, () => ({ open }));

    const close = () => {
      setIsOpen(false);
    };

    const insertMarkdown = (markdown: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = textarea.value;
      const before = current.substring(0, start);
      const after = current.substring(end);

      const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
      const needsTrailingNewline = after.length > 0 && !after.startsWith('\n');
      const insertion = `${needsLeadingNewline ? '\n' : ''}${markdown}${needsTrailingNewline ? '\n' : ''}`;
      const nextValue = before + insertion + after;

      updateHistory(nextValue);
      setIsOpen(false);

      setTimeout(() => {
        textarea.focus();
        const cursorPosition = before.length + insertion.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    };

    const handleInsert = (markdown: string, _config: TableConfig) => {
      insertMarkdown(markdown);
    };

    return (
      <TableEditorModal
        isOpen={isOpen}
        initialConfig={initialConfig}
        labels={TABLE_EDITOR_LABELS}
        onClose={close}
        onInsert={handleInsert}
      />
    );
  }
);

TableEditorController.displayName = 'TableEditorController';

export default TableEditorController;
