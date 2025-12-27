
import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import JSZip from 'jszip';
import { getModelConfig } from '../../utils/settings';
import { generateContent } from '../../utils/aiHelper';
import { Type } from '@google/genai';
import { downloadDocx } from '../../utils/converter';
import { WordTemplate } from '../../types';

type Mode = 'rename' | 'report' | 'missing';

interface FileItem {
  file: File;
  contentSnippet: string; // 提取的前1000个字符用于分析
  status: 'pending' | 'processing' | 'done' | 'error';
  newName?: string;
  reason?: string;
}

interface CheckResult {
  submitted: { name: string; fileName: string }[];
  missing: string[];
  extras: string[]; // 文件存在但不在名单中
}

const DEFAULT_RENAME_PROMPT = `Analyze the provided file contents to extract key metadata: Date, Author, Assignment Batch (e.g., "First Assignment", "第X次作业"), and Topic/Content.
Goal: Rename these files exactly matching the target naming pattern provided.
Output: A JSON array of objects, each containing "originalName", "newName", and "reason".
Important: 
1. If the pattern includes "第X次作业", extract the specific number from the text (e.g., if text says "Third Assignment", output "第三次作业").
2. Format dates strictly according to the pattern (e.g., YYYYMMDD).
3. Extract the specific topic/content for the assignment.`;

const DEFAULT_REPORT_PROMPT = `You are a team leader assistant. 
Goal: Aggregate the following weekly reports into a single, cohesive team weekly report.

Requirements:
1. **Header**: Start by explicitly listing the names of all members who submitted a report (e.g., "Contributors: Name1, Name2...").
2. **Categorization**: Group the updates by technical domain (e.g., RL, CV, NLP, LLM Fine-tuning) rather than just listing by person.
3. **Structure**: Use clear Markdown headings for "Team Progress", "Key Learnings", and "Next Steps".
4. **Tone**: Professional and concise.
5. **Language**: The output report MUST be in the same language as the input contents (e.g., if inputs are Chinese, output Chinese; if mixed, default to Chinese).

Input: A list of report contents from different team members.`;

const DEFAULT_MISSING_PROMPT = `You are a teaching assistant checking homework submissions.
Goal: Compare the provided "Class Roster" against the list of "Submitted Files".

Rules:
1. **Fuzzy Match**: Match names even if the filename contains extra text (e.g., Roster: "ZhangSan", File: "Homework-ZhangSan-v2.docx" -> Match).
2. **Content Awareness**: If the filename is ambiguous, assume the "Snippet" content might contain the author's name.
3. **Categorize**:
   - "submitted": The name from the roster that was found in the files.
   - "missing": The name from the roster that was NOT found.
   - "extras": Filenames that do not match anyone in the roster.

Output strictly valid JSON with this structure:
{
  "submitted": [{"name": "RosterName", "fileName": "FileName"}],
  "missing": ["RosterName"],
  "extras": ["FileName"]
}`;

const MultiDocProcessor: React.FC = () => {
  const [mode, setMode] = useState<Mode>('rename');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultReport, setResultReport] = useState<string>('');
  
  // Roster State for Missing Mode
  const [rosterText, setRosterText] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rosterInputRef = useRef<HTMLInputElement>(null);

  // Rename Pattern State
  const [renamePattern, setRenamePattern] = useState('');

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [renamePrompt, setRenamePrompt] = useState(() => localStorage.getItem('prompt_rename') || DEFAULT_RENAME_PROMPT);
  const [reportPrompt, setReportPrompt] = useState(() => localStorage.getItem('prompt_report') || DEFAULT_REPORT_PROMPT);
  const [missingPrompt, setMissingPrompt] = useState(() => localStorage.getItem('prompt_missing') || DEFAULT_MISSING_PROMPT);
  
  const [tempPrompt, setTempPrompt] = useState('');

  const config = getModelConfig('text');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileItem[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        let contentSnippet = '';
        
        try {
          if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            contentSnippet = result.value.substring(0, 1000); // 提取前1000字
          } else {
            const text = await file.text();
            contentSnippet = text.substring(0, 1000);
          }
        } catch (err) {
          console.error(`Error reading file ${file.name}`, err);
          contentSnippet = "(Error reading file content)";
        }

        newFiles.push({ file, contentSnippet, status: 'pending' });
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input to allow re-selection
    if (e.target) e.target.value = '';
  };

  const handleRosterImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          let text = '';
          if (file.name.endsWith('.docx')) {
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              text = result.value;
          } else {
              text = await file.text();
          }
          // Simple cleanup: remove empty lines
          const cleanList = text.split(/\r?\n/).map(l => l.trim()).filter(l => l).join('\n');
          setRosterText(cleanList);
      } catch (err) {
          alert('读取名单失败，请重试');
      }
      if (e.target) e.target.value = '';
  };

  const createDocxBlob = async (text: string): Promise<Blob> => {
      const doc = new Document({
          sections: [{
              properties: {},
              children: text.split('\n').map(line => new Paragraph({
                  children: [new TextRun(line)],
              })),
          }],
      });
      return await Packer.toBlob(doc);
  };

  const loadSampleFiles = async () => {
    let samples = [];
    
    // 清除旧数据
    setFiles([]);
    setResultReport('');
    setCheckResult(null);

    if (mode === 'rename') {
        samples = [
            { name: "李四_2.docx", text: "【实验报告】\n\n实验人：李四\n日期：2026年3月15日\n实验名称：物理光学干涉实验\n\n备注：这是本学期的第三次作业，请查收。" },
            { name: "draft_2025_wangwu.docx", text: "【期末提交】\n汇报人：王五\n时间：2025/12/20\n作业批次：第八次作业\n作业主题：前端架构设计与Vue3迁移实践\n\n正文：..." },
            { name: "新建文本文档 (3).docx", text: "课程：数据结构\n姓名：张三\n提交时间：2026-01-01\n内容：第一次作业 - 二叉树遍历算法\n\n代码如下..." },
            { name: "final_v2_resubmit.docx", text: "姓名：赵六\nDate: 2025.11.11\nSubject: 数据库系统原理\nBatch: 第五次作业\n\nSQL优化实验报告..." },
            { name: "20240909_unknown.docx", text: "学生：陈七\n提交日期：2024年9月9日\n作业：第二次作业\n题目：操作系统进程调度\n\n..." }
        ];
        setRenamePattern('20260101_张三_第一次作业_作业内容.docx');
    } else if (mode === 'report') {
        samples = [
            { name: "周报_萧炎.docx", text: "姓名：萧炎\n部门：强化学习组\n本周工作总结：\n1. 深入学习了强化学习算法基础。\n2. 重点研究了 PPO 算法的超参数调优。\n\n下周计划：\n- 在仿真环境中测试新模型。" },
            { name: "周报_林动.docx", text: "汇报人：林动\n岗位：CV算法工程师\n\n本周进度：\n- 专注于计算机视觉（CV）领域的经典算法复习。\n- 完成了 YOLOv8 的部署测试。\n\n遇到的问题：\n- 显存占用过高，需优化。" },
            { name: "周报_牧尘.docx", text: "姓名：牧尘\n组别：NLP组\n\n本周产出：\n1. 完成了 BERT 模型的微调实验。\n2. 阅读了 3 篇关于 RAG (检索增强生成) 的最新论文。\n\n下周重点：\n- 搭建本地知识库问答系统。" },
            { name: "周报_罗峰.docx", text: "汇报人：罗峰\n部门：大模型训练\n\n工作内容：\n- 监控 7B 模型预训练进度，Loss 收敛正常。\n- 清洗了 100GB 的高质量代码数据集。\n\n风险：\n- 算力资源紧张，需申请更多 GPU。" }
        ];
    } else if (mode === 'missing') {
        // 设置一个花名册
        setRosterText("孙悟空\n猪八戒\n沙悟净\n唐三藏\n白龙马");
        
        // 模拟提交的文件：有人交了，有人没交，有人名字写得不规范
        samples = [
            { name: "作业_孙悟空.docx", text: "这是孙悟空的作业。" },
            { name: "八戒的检讨书.docx", text: "检讨人：猪八戒\n内容：我错了..." }, 
            { name: "卷帘大将_报告.docx", text: "姓名：沙悟净\n职务：卷帘大将\n汇报..." },
            { name: "UNKNOWN_FILE.docx", text: "没有写名字的神秘文件..." }
        ];
        // 预期：唐三藏、白龙马 未交
    }

    const newFiles: FileItem[] = [];
    for (const s of samples) {
        const blob = await createDocxBlob(s.text);
        const file = new File([blob], s.name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        newFiles.push({
            file: file,
            contentSnippet: s.text,
            status: 'pending'
        });
    }
    setFiles(newFiles);
  };

  const clearFiles = () => {
    setFiles([]);
    setResultReport('');
    setCheckResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processRename = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const inputs = files.map(f => ({
        originalName: f.file.name,
        contentStart: f.contentSnippet.replace(/\n/g, ' ').substring(0, 500)
      }));
      const effectivePattern = renamePattern || 'YYYY-MM-DD_作者_文件主题.ext';
      const prompt = `${renamePrompt}\n\nIMPORTANT: Use this Target Naming Pattern: "${effectivePattern}"\n\nFiles to process:\n${JSON.stringify(inputs, null, 2)}`;
      
      const response = await generateContent({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        prompt: prompt,
        jsonSchema: { type: Type.ARRAY }
      });

      let jsonStr = response.trim().replace(/```json|```/g, '');
      const mapping = JSON.parse(jsonStr); 

      if (Array.isArray(mapping)) {
        setFiles(prev => prev.map(f => {
          const match = mapping.find((m: any) => m.originalName === f.file.name);
          return match ? { ...f, newName: match.newName, reason: match.reason, status: 'done' } : f;
        }));
      }
    } catch (e) {
      console.error(e);
      alert("AI 处理失败，请检查 Prompt 或重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const processReport = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const combinedContent = files.map((f, idx) => `--- Report ${idx + 1} (${f.file.name}) ---\n${f.contentSnippet}`).join('\n\n');
      const prompt = `${reportPrompt}\n\nReports Content:\n${combinedContent}`;
      const response = await generateContent({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        prompt: prompt
      });
      setResultReport(response);
      setFiles(prev => prev.map(f => ({ ...f, status: 'done' })));
    } catch (e) {
      console.error(e);
      alert("生成报告失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const processCheckMissing = async () => {
      if (files.length === 0 || !rosterText.trim()) {
          alert("请确保已输入应交名单并上传了文件。");
          return;
      }
      setIsProcessing(true);
      setCheckResult(null);

      try {
          // Clean roster
          const rosterList = rosterText.split(/\n|,|，/).map(s => s.trim()).filter(s => s);
          
          const fileInputs = files.map(f => ({
              fileName: f.file.name,
              snippet: f.contentSnippet.replace(/\n/g, ' ').substring(0, 200) // Small snippet to help identify name
          }));

          const prompt = `${missingPrompt}\n\nClass Roster:\n${JSON.stringify(rosterList)}\n\nSubmitted Files:\n${JSON.stringify(fileInputs)}`;

          const response = await generateContent({
            apiKey: config.apiKey,
            model: config.model,
            baseUrl: config.baseUrl,
            prompt: prompt,
            jsonSchema: {
                type: Type.OBJECT,
                properties: {
                    submitted: { type: Type.ARRAY },
                    missing: { type: Type.ARRAY },
                    extras: { type: Type.ARRAY }
                }
            }
          });

          let jsonStr = response.trim().replace(/```json|```/g, '');
          const result = JSON.parse(jsonStr);
          setCheckResult(result);
          setFiles(prev => prev.map(f => ({ ...f, status: 'done' })));

      } catch (e) {
          console.error(e);
          alert("AI 核对失败，请检查网络或配置。");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownloadFile = (fileItem: FileItem) => {
    const fileName = (fileItem.status === 'done' && fileItem.newName) ? fileItem.newName : fileItem.file.name;
    const url = URL.createObjectURL(fileItem.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
      if (files.length === 0) return;
      const zip = new JSZip();
      let hasFiles = false;
      files.forEach(f => {
          // 只下载有文件内容的
          if (f.file) {
              const fileName = (f.status === 'done' && f.newName) ? f.newName : f.file.name;
              zip.file(fileName, f.file);
              hasFiles = true;
          }
      });
      
      if (!hasFiles) return;

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renamed_files_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleDownloadReport = async () => {
      if (!resultReport) return;
      await downloadDocx(resultReport, WordTemplate.STANDARD);
  };

  const openSettings = () => {
      if (mode === 'rename') setTempPrompt(renamePrompt);
      else if (mode === 'report') setTempPrompt(reportPrompt);
      else setTempPrompt(missingPrompt);
      setShowSettings(true);
  };

  const saveSettings = () => {
      if (mode === 'rename') {
          setRenamePrompt(tempPrompt);
          localStorage.setItem('prompt_rename', tempPrompt);
      } else if (mode === 'report') {
          setReportPrompt(tempPrompt);
          localStorage.setItem('prompt_report', tempPrompt);
      } else {
          setMissingPrompt(tempPrompt);
          localStorage.setItem('prompt_missing', tempPrompt);
      }
      setShowSettings(false);
  };

  const getActionName = () => {
      if (mode === 'rename') return '开始生成文件名';
      if (mode === 'report') return '开始合并周报';
      return '开始核对名单';
  };

  const runProcess = () => {
      if (mode === 'rename') processRename();
      else if (mode === 'report') processReport();
      else processCheckMissing();
  };

  return (
    <div className="p-6 lg:p-12 max-w-[1440px] mx-auto min-h-full flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">多文档智能处理</h2>
        <p className="text-slate-500">批量命名整理 • 团队周报聚合 • 作业查缺补漏</p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 shadow-inner">
          <button
            onClick={() => { setMode('rename'); clearFiles(); }}
            className={`px-4 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'rename' ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📂 智能重命名
          </button>
          <button
            onClick={() => { setMode('report'); clearFiles(); }}
            className={`px-4 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'report' ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📊 周报整合
          </button>
          <button
            onClick={() => { setMode('missing'); clearFiles(); }}
            className={`px-4 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'missing' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📋 谁没交？(查缺)
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col min-h-[500px]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h3 className="text-xl font-bold text-slate-800">
                    {mode === 'rename' ? '文件批量重命名' : mode === 'report' ? '多文档内容聚合' : '作业提交核对'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    {mode === 'rename' && '上传多个命名混乱的文件，AI 将根据内容自动生成规范文件名。'}
                    {mode === 'report' && '上传多个成员的周报/文档，AI 将提取关键信息生成汇总报告。'}
                    {mode === 'missing' && '输入应交名单并上传文件，AI 自动核对谁还没交作业。'}
                </p>
            </div>
            <div className="flex space-x-3 w-full md:w-auto">
                 <button
                    onClick={openSettings}
                    className="flex-1 md:flex-none flex items-center justify-center px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                 >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     配置 Prompt
                 </button>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 md:flex-none bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center"
                 >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加文件
                 </button>
                 <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".docx,.txt,.md" />
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left/Top Area: Inputs */}
            <div className={`flex-1 flex flex-col ${mode === 'missing' ? 'lg:w-1/3 lg:flex-none' : 'w-full'}`}>
                
                {/* 1. Missing Mode: Roster Input */}
                {mode === 'missing' && (
                    <div className="mb-6 bg-rose-50 p-4 rounded-xl border border-rose-100 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-rose-600 uppercase tracking-wider">📋 应交名单 (Roster)</label>
                            <button 
                                onClick={() => rosterInputRef.current?.click()}
                                className="text-[10px] bg-white border border-rose-200 text-rose-500 px-2 py-1 rounded hover:bg-rose-100 font-bold transition-colors"
                            >
                                📂 导入名单文档
                            </button>
                            <input type="file" ref={rosterInputRef} className="hidden" onChange={handleRosterImport} accept=".txt,.docx" />
                        </div>
                        <textarea 
                            value={rosterText}
                            onChange={(e) => setRosterText(e.target.value)}
                            placeholder={"张三\n李四\n王五\n..."}
                            className="w-full flex-1 min-h-[150px] lg:min-h-0 p-3 rounded-lg border border-rose-200 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none bg-white text-slate-700"
                        />
                        <p className="text-[10px] text-rose-400 mt-2">* 每行一个名字，支持从 Word/Txt 导入</p>
                    </div>
                )}

                {/* 2. Rename Mode: Format Input */}
                {mode === 'rename' && (
                    <div className="mb-6 bg-[var(--primary-50)] p-4 rounded-xl border border-[var(--primary-color)] border-opacity-30">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center text-[var(--primary-color)] font-bold text-sm">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                目标格式参考:
                            </div>
                            <input
                                type="text"
                                value={renamePattern}
                                onChange={(e) => setRenamePattern(e.target.value)}
                                placeholder="例如: 20260101_张三_第一次作业_作业内容.docx"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--primary-color)] border-opacity-40 bg-white text-sm focus:ring-2 focus:ring-[var(--primary-color)] outline-none text-slate-900"
                            />
                            {/* Sample Pill */}
                            <div className="pt-1">
                                <button 
                                    onClick={() => setRenamePattern('20260101_张三_第一次作业_作业内容.docx')}
                                    className="text-[10px] bg-white border border-[var(--primary-color)] border-opacity-40 text-[var(--primary-color)] px-2 py-0.5 rounded hover:bg-[var(--primary-color)] hover:text-white transition-all"
                                >
                                    填充示例: 20260101_张三...
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. File List Area */}
                {files.length > 0 ? (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
                        <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-500 flex justify-between">
                            <span>已上传文件 ({files.length})</span>
                            <button onClick={clearFiles} className="text-red-400 hover:text-red-600">清空</button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar max-h-[300px] lg:max-h-[400px]">
                            <ul className="divide-y divide-slate-200">
                                {files.map((f, i) => (
                                    <li key={i} className="p-3 flex justify-between items-center hover:bg-white text-sm">
                                        <div className="truncate pr-4 flex-1">
                                            <div className="text-slate-700 font-mono truncate" title={f.file.name}>{f.file.name}</div>
                                            {mode === 'rename' && f.newName && (
                                                <div className="text-[var(--primary-color)] font-bold font-mono text-xs mt-0.5 truncate">➜ {f.newName}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {f.status === 'done' && <span className="text-green-500 text-xs">✔</span>}
                                            {f.status === 'processing' && <span className="text-[var(--primary-color)] text-xs animate-pulse">...</span>}
                                            <button onClick={() => handleDownloadFile(f)} className="text-slate-400 hover:text-[var(--primary-color)]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    // Empty State
                    <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 min-h-[200px] group hover:border-[var(--primary-color)] hover:bg-[var(--primary-50)] transition-all relative">
                         <div className="absolute inset-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}></div>
                         <svg className="w-10 h-10 mb-2 opacity-50 group-hover:text-[var(--primary-color)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                         <span className="text-xs">点击上传文件</span>
                         
                         <button 
                            onClick={(e) => { e.stopPropagation(); loadSampleFiles(); }}
                            className="mt-4 px-3 py-1.5 rounded-full bg-white text-[var(--primary-color)] text-xs font-bold border border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-all relative z-10"
                        >
                            加载测试数据 (Samples)
                        </button>
                    </div>
                )}
                
                {/* Action Button */}
                <div className="mt-6">
                    <button
                        onClick={runProcess}
                        disabled={files.length === 0 || isProcessing || (mode === 'missing' && !rosterText.trim())}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                            files.length === 0 || isProcessing || (mode === 'missing' && !rosterText.trim())
                            ? 'bg-slate-300 cursor-not-allowed' 
                            : 'bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] hover:scale-105'
                        }`}
                    >
                        {isProcessing ? 'AI 正在分析...' : getActionName()}
                    </button>

                    {/* NEW: Batch Download Button for Rename Mode */}
                    {mode === 'rename' && files.some(f => f.status === 'done') && (
                        <button
                            onClick={handleDownloadAll}
                            className="w-full mt-3 py-3 rounded-xl font-bold text-[var(--primary-color)] bg-[var(--primary-50)] border border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-all flex items-center justify-center shadow-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            📥 打包下载所有文件 (ZIP)
                        </button>
                    )}
                </div>

            </div>

            {/* Right/Bottom Area: Results */}
            {(mode === 'missing' || mode === 'report') && (
                <div className="flex-[2] flex flex-col min-h-[400px]">
                    {mode === 'missing' && (
                        <div className="h-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700">核对结果 (Check Result)</h4>
                                {checkResult && (
                                    <div className="text-xs space-x-2">
                                        <span className="text-green-600 font-bold">已交: {checkResult.submitted.length}</span>
                                        <span className="text-red-500 font-bold">未交: {checkResult.missing.length}</span>
                                    </div>
                                )}
                            </div>
                            
                            {!checkResult ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-sm">点击左侧“开始核对名单”查看结果</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Missing Column */}
                                    <div className="border border-red-100 bg-red-50/50 rounded-xl overflow-hidden flex flex-col">
                                        <div className="bg-red-100/80 px-4 py-2 text-red-700 font-bold text-xs uppercase tracking-wide flex justify-between">
                                            <span>❌ 未交人员 ({checkResult.missing.length})</span>
                                        </div>
                                        <div className="p-3 overflow-y-auto max-h-[300px] custom-scrollbar">
                                            {checkResult.missing.length === 0 ? (
                                                <div className="text-green-500 text-sm text-center py-4">全员已交！🎉</div>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {checkResult.missing.map((name, idx) => (
                                                        <li key={idx} className="bg-white border border-red-100 px-3 py-2 rounded text-red-600 font-bold text-sm shadow-sm">
                                                            {name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submitted Column */}
                                    <div className="border border-green-100 bg-green-50/50 rounded-xl overflow-hidden flex flex-col">
                                        <div className="bg-green-100/80 px-4 py-2 text-green-700 font-bold text-xs uppercase tracking-wide flex justify-between">
                                            <span>✅ 已交人员 ({checkResult.submitted.length})</span>
                                        </div>
                                        <div className="p-3 overflow-y-auto max-h-[300px] custom-scrollbar">
                                            <ul className="space-y-2">
                                                {checkResult.submitted.map((item, idx) => (
                                                    <li key={idx} className="bg-white border border-green-100 px-3 py-2 rounded text-slate-700 text-sm shadow-sm">
                                                        <span className="font-bold text-green-700 block">{item.name}</span>
                                                        <span className="text-[10px] text-slate-400 block truncate" title={item.fileName}>📄 {item.fileName}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Extras Column (Full width if needed, or part of grid) */}
                                    {checkResult.extras.length > 0 && (
                                        <div className="md:col-span-2 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden mt-2">
                                            <div className="bg-slate-200/50 px-4 py-2 text-slate-600 font-bold text-xs uppercase tracking-wide">
                                                ❓ 未知文件 / 无法匹配 ({checkResult.extras.length})
                                            </div>
                                            <div className="p-3">
                                                 <div className="flex flex-wrap gap-2">
                                                    {checkResult.extras.map((name, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-500 truncate max-w-[200px]" title={name}>
                                                            {name}
                                                        </span>
                                                    ))}
                                                 </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'report' && resultReport && (
                        <div className="h-full bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                             {/* Report Header with Download */}
                             <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                 <h4 className="font-bold text-slate-700">周报汇总 (Aggregated Report)</h4>
                                 <button 
                                    onClick={handleDownloadReport}
                                    className="text-xs bg-white border border-slate-300 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm flex items-center"
                                 >
                                     <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                     导出 Word
                                 </button>
                             </div>
                             <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50">
                                 <div className="prose prose-slate max-w-none text-sm bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <ReactMarkdown>{resultReport}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {mode === 'report' && !resultReport && (
                         <div className="h-full flex flex-col items-center justify-center text-slate-300 border border-slate-200 border-dashed rounded-xl">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-sm">生成的报告将显示在这里</p>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">
                        配置 Prompt ({mode === 'rename' ? '智能重命名' : mode === 'report' ? '周报整合' : '名单核对'})
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-xs text-slate-500 mb-2">定义 AI 如何处理您的文件。保持明确的 Input/Output 指令效果最佳。</p>
                    <textarea 
                        className="w-full h-64 p-4 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--primary-color)] outline-none resize-none font-mono bg-slate-50 text-slate-700 leading-relaxed shadow-inner"
                        value={tempPrompt}
                        onChange={(e) => setTempPrompt(e.target.value)}
                    ></textarea>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={saveSettings}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] rounded-xl shadow-lg"
                        >
                            保存配置
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MultiDocProcessor;
