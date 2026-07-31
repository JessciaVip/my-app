import React, { useState, useRef, useEffect } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { useLeaveGuardEditor } from './LeaveGuard';
import '@wangeditor/editor/dist/css/style.css';

const TOP_BAR_HEIGHT = 50;
const STYLE_ID = 'w-e-fullscreen-topbar-style';

function injectFullscreenStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .w-e-full-screen-container {
      top: ${TOP_BAR_HEIGHT}px !important;
      height: calc(100% - ${TOP_BAR_HEIGHT}px) !important;
    }
  `;
  document.head.appendChild(style);
}

function removeFullscreenStyle() {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

export default function WangEditorFullscreen({ value, onChange, toolbarConfig, editorConfig, style, topBarContent }) {
  const [editor, setEditor] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [topBarValue, setTopBarValue] = useState('');
  const wrapperRef = useRef(null);

  // 注册编辑器，让 LeaveGuard 知道当前页面有富文本
  useLeaveGuardEditor();

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new MutationObserver(() => {
      const fs = wrapperRef.current?.querySelector('.w-e-full-screen-container');
      const hasFs = !!fs;
      setIsFullscreen((prev) => {
        if (prev !== hasFs) {
          if (hasFs) injectFullscreenStyle();
          else removeFullscreenStyle();
        }
        return hasFs;
      });
    });
    observer.observe(wrapperRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => {
      observer.disconnect();
      removeFullscreenStyle();
    };
  }, []);

  useEffect(() => {
    if (editor) return () => editor.destroy();
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const updateTooltip = (isFs) => {
      setTimeout(() => {
        const fsBtn = wrapperRef.current?.querySelector('button[data-menu-key="fullScreen"]');
        if (!fsBtn) return;
        const text = isFs ? '退出全屏' : '全屏';
        fsBtn.setAttribute('data-tooltip', text);
        fsBtn.setAttribute('title', text);
      }, 0);
    };
    const onFs = () => updateTooltip(true);
    const onUnFs = () => updateTooltip(false);
    editor.on('fullScreen', onFs);
    editor.on('unFullScreen', onUnFs);
    return () => {
      editor.off('fullScreen', onFs);
      editor.off('unFullScreen', onUnFs);
    };
  }, [editor]);

  return (
    <div ref={wrapperRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      {isFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: TOP_BAR_HEIGHT,
          zIndex: 9999,
          background: '#f5f5f5',
          borderBottom: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          boxSizing: 'border-box',
        }}>
          {topBarContent
            ? topBarContent({ value: topBarValue, onChange: setTopBarValue })
            : (
              <input
                value={topBarValue}
                onChange={(e) => setTopBarValue(e.target.value)}
                placeholder="在这里填写内容..."
                style={{
                  flex: 1,
                  height: 32,
                  padding: '0 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  outline: 'none',
                  fontSize: 14,
                }}
              />
            )
          }
        </div>
      )}
      <Toolbar
        editor={editor}
        config={toolbarConfig}
        style={{ borderBottom: '1px solid #ccc' }}
      />
      <Editor
        value={value}
        onCreated={setEditor}
        onChange={(editor) => {
          if (editor && typeof editor.getHtml === 'function') {
            onChange && onChange(editor.getHtml());
          }
        }}
        mode="default"
        style={{ flex: 1, overflow: 'auto', height: '100%' }}
      />
    </div>
  );
}
