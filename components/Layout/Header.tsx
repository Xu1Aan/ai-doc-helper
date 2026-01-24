
import React, { useState, useEffect } from 'react';
import { AppView } from '../../types';
import UserCenter from './UserCenter';
import AboutModal from './AboutModal';
import HistoryPanel from './HistoryPanel';
import { getModelConfig } from '../../utils/settings';
import { UnifiedHistoryItem } from '../../utils/historyManager';
import { useI18n } from '../../utils/i18n';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const { t } = useI18n();
  const [showAbout, setShowAbout] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 初始化配置
  const activeConfig = getModelConfig(currentView === AppView.AI_VISION ? 'ocr' : 'text');
  
  // 监听 user-settings-change 事件，当设置变化时重新渲染
  useEffect(() => {
    const handleSettingsChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('user-settings-change', handleSettingsChange);
    
    return () => {
      window.removeEventListener('user-settings-change', handleSettingsChange);
    };
  }, []);
  
  // 当 refreshKey 变化时，无需重新计算 activeConfig
  // 因为 getModelConfig 是纯函数，每次重新渲染时会自动调用

  const handleHistoryItemClick = (item: UnifiedHistoryItem) => {
    setShowHistory(false);
    // 根据历史记录类型切换到相应页面
    switch (item.module) {
      case 'ocr':
        setView(AppView.AI_VISION);
        break;
      case 'multidoc':
        setView(AppView.MULTI_DOC);
        break;
      case 'research':
        setView(AppView.AI_RESEARCH);
        break;
    }
  };

  const tabs = [
    { id: AppView.EDITOR, name: t('header.tabs.editor'), icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: AppView.AI_VISION, name: t('header.tabs.vision'), icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: AppView.MULTI_DOC, name: t('header.tabs.batch'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: AppView.AI_RESEARCH, name: t('header.tabs.research'), icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm relative">
        <div className="flex items-center space-x-3 group cursor-pointer z-10" onClick={() => window.location.reload()}>
          {/* Logo 区域 */}
          <div className="w-8 h-8 relative flex items-center justify-center">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105" style={{ background: 'linear-gradient(to top right, var(--primary-color), var(--primary-hover))' }}>
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
              </div>
            )}
          </div>
          
          <h1 className="text-lg font-bold tracking-tight text-slate-800 hidden md:block hover:text-[var(--primary-color)] transition-colors font-mono">AI Doc Helper</h1>
          
          {/* GitHub 图标链接 */}
          <a
            href="https://github.com/cenzihan/ai-doc-helper"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-all"
            title="GitHub Repository"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        {/* 居中导航栏 - 使用绝对定位确保完美居中 */}
        <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto custom-scrollbar max-w-[60vw]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                currentView === tab.id 
                  ? 'bg-white shadow-sm text-[var(--primary-color)] ring-1 ring-slate-100' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-3 z-10">
          <div className="hidden lg:flex items-center px-3 py-1 bg-[var(--primary-50)] border border-[var(--primary-50)] rounded-full mr-1">
             <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] mr-2 animate-pulse"></span>
             <span className="text-[10px] font-bold text-[var(--primary-color)] whitespace-nowrap">{t('header.currentEngine', { model: activeConfig.modelName })}</span>
          </div>

          {/* 历史记录按钮 - 移到右边 */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[var(--primary-color)] transition-all relative"
            title={t('header.history')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={() => setShowAbout(true)}
            className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-[var(--primary-color)] hover:border-[var(--primary-50)] hover:bg-[var(--primary-50)] flex items-center justify-center transition-all font-bold text-sm"
            title={t('header.about')}
          >
            ?
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <UserCenter />
        </div>
      </header>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} onItemClick={handleHistoryItemClick} />
    </>
  );
};

export default Header;
