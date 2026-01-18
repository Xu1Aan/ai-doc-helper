import React, { useEffect, useState } from 'react';

export type TableAlignment = 'left' | 'center' | 'right';

export interface TableConfig {
  columns: number;
  rows: number;
  alignments: TableAlignment[];
  header: string[];
  body: string[][];
}

export interface TableEditorModalLabels {
  title: string;
  columns: string;
  rows: string;
  alignment: string;
  header: string;
  body: string;
  clear: string;
  cancel: string;
  insert: string;
}

interface TableEditorModalProps {
  isOpen: boolean;
  initialConfig: TableConfig;
  labels: TableEditorModalLabels;
  onClose: () => void;
  onInsert: (markdown: string, config: TableConfig) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  initialConfig,
  labels,
  onClose,
  onInsert
}) => {
  const [table, setTable] = useState<TableConfig>(initialConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTable(initialConfig);
    setIsEditing(false);
    setIsHovering(false);
  }, [isOpen, initialConfig]);

  const resizeTable = (config: TableConfig, nextColumns: number, nextRows: number) => {
    const columns = clamp(nextColumns, 1, 10);
    const rows = clamp(nextRows, 1, 20);

    const alignments = config.alignments.slice(0, columns);
    while (alignments.length < columns) alignments.push('left');

    const header = config.header.slice(0, columns);
    while (header.length < columns) header.push('');

    const body = config.body.slice(0, rows).map((row) => {
      const nextRow = row.slice(0, columns);
      while (nextRow.length < columns) nextRow.push('');
      return nextRow;
    });
    while (body.length < rows) body.push(Array.from({ length: columns }, () => ''));

    return { columns, rows, alignments, header, body };
  };

  const handleColumnsChange = (value: number) => {
    setTable((prev) => resizeTable(prev, value, prev.rows));
  };

  const handleRowsChange = (value: number) => {
    setTable((prev) => resizeTable(prev, prev.columns, value));
  };

  const updateHeaderCell = (columnIndex: number, value: string) => {
    setTable((prev) => {
      const header = [...prev.header];
      header[columnIndex] = value;
      return { ...prev, header };
    });
  };

  const updateBodyCell = (rowIndex: number, columnIndex: number, value: string) => {
    setTable((prev) => {
      const body = prev.body.map((row) => [...row]);
      body[rowIndex][columnIndex] = value;
      return { ...prev, body };
    });
  };

  const cycleAlignment = (columnIndex: number) => {
    const order: TableAlignment[] = ['left', 'center', 'right'];
    setTable((prev) => {
      const alignments = [...prev.alignments];
      const current = alignments[columnIndex] ?? 'left';
      const next = order[(order.indexOf(current) + 1) % order.length];
      alignments[columnIndex] = next;
      return { ...prev, alignments };
    });
  };

  const alignmentLabel = (alignment: TableAlignment) => {
    if (alignment === 'center') return 'C';
    if (alignment === 'right') return 'R';
    return 'L';
  };

  const alignmentClass = (alignment: TableAlignment) => {
    if (alignment === 'center') return 'text-center';
    if (alignment === 'right') return 'text-right';
    return 'text-left';
  };

  const buildMarkdown = (config: TableConfig) => {
    const escapeCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
    const headerRow = `| ${config.header.map(escapeCell).join(' | ')} |`;
    const alignmentRow = `| ${config.alignments
      .map((alignment) => {
        if (alignment === 'center') return ':---:';
        if (alignment === 'right') return '---:';
        return '---';
      })
      .join(' | ')} |`;
    const bodyRows = config.body.map((row) => `| ${row.map(escapeCell).join(' | ')} |`);
    return [headerRow, alignmentRow, ...bodyRows].join('\n');
  };

  const handleInsert = () => {
    onInsert(buildMarkdown(table), table);
  };

  const handleTableFocus = () => {
    setIsEditing(true);
  };

  const handleTableBlur = (e: React.FocusEvent<HTMLTableElement>) => {
    const nextTarget = e.relatedTarget as Node | null;
    if (!nextTarget || !e.currentTarget.contains(nextTarget)) {
      setIsEditing(false);
    }
  };

  const controlsVisible = isHovering && !isEditing;
  const controlVisibilityClass = controlsVisible
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none';

  const handleClear = () => {
    setTable((prev) => ({
      ...prev,
      header: prev.header.map(() => ''),
      body: prev.body.map((row) => row.map(() => ''))
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{labels.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4 flex flex-col max-h-[75vh]">
          <div className="flex-1 min-h-0 overflow-auto pr-1 space-y-4">
            <div
              className="relative border border-slate-200 rounded-lg overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="overflow-auto">
                <div className="min-w-full">
                  <table
                    className="min-w-full text-xs"
                    onFocusCapture={handleTableFocus}
                    onBlurCapture={handleTableBlur}
                  >
                    <thead className="bg-slate-50">
                      <tr>
                        {table.header.map((value, columnIndex) => (
                          <th key={`header-${columnIndex}`} className="border border-slate-200 p-2">
                            <input
                              value={value}
                              onChange={(e) => updateHeaderCell(columnIndex, e.target.value)}
                              placeholder={`H${columnIndex + 1}`}
                              className={`w-full bg-transparent outline-none placeholder-slate-300 focus:placeholder-transparent ${alignmentClass(table.alignments[columnIndex])}`}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.body.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`} className="odd:bg-white even:bg-slate-50">
                          {row.map((value, columnIndex) => (
                            <td key={`cell-${rowIndex}-${columnIndex}`} className="border border-slate-200 p-2">
                              <input
                                value={value}
                                onChange={(e) => updateBodyCell(rowIndex, columnIndex, e.target.value)}
                                placeholder={`R${rowIndex + 1}C${columnIndex + 1}`}
                                className={`w-full bg-transparent outline-none placeholder-slate-300 focus:placeholder-transparent ${alignmentClass(table.alignments[columnIndex])}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-150 ${controlVisibilityClass}`}>
                <div className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => handleColumnsChange(table.columns + 1)}
                    disabled={table.columns >= 10}
                    className="px-2 py-0.5 text-[10px] rounded border border-slate-200 bg-white text-slate-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="increase columns"
                    title={`${labels.columns} +`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleColumnsChange(table.columns - 1)}
                    disabled={table.columns <= 1}
                    className="px-2 py-0.5 text-[10px] rounded border border-slate-200 bg-white text-slate-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="decrease columns"
                    title={`${labels.columns} -`}
                  >
                    -
                  </button>
                </div>
              </div>
              <div className={`absolute bottom-2 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-150 ${controlVisibilityClass}`}>
                <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => handleRowsChange(table.rows + 1)}
                    disabled={table.rows >= 20}
                    className="px-2 py-0.5 text-[10px] rounded border border-slate-200 bg-white text-slate-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="increase rows"
                    title={`${labels.rows} +`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRowsChange(table.rows - 1)}
                    disabled={table.rows <= 1}
                    className="px-2 py-0.5 text-[10px] rounded border border-slate-200 bg-white text-slate-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="decrease rows"
                    title={`${labels.rows} -`}
                  >
                    -
                  </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{labels.alignment}</p>
            <div className="flex flex-wrap gap-2">
              {table.alignments.map((alignment, index) => (
                <button
                  key={`align-${index}`}
                  onClick={() => cycleAlignment(index)}
                  className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-colors"
                >
                  Col {index + 1} {alignmentLabel(alignment)}
                </button>
              ))}
            </div>
          </div>
        </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {labels.clear}
            </button>
            <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {labels.cancel}
            </button>
            <button
              onClick={handleInsert}
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors"
            >
              {labels.insert}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableEditorModal;
