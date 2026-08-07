import React, { useEffect, useRef, useState } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { applyMaxLength } from './richTextLimit';
import '@wangeditor/editor/dist/css/style.css';
import './WangEditorLimit.css';

// ==================== 组件 ====================
// 字符上限逻辑在 richTextLimit.js（nodeTextLength / applyMaxLength），此处只做装配与计数条

export default function WangEditorLimit({
  maxLength = 500,
  value,
  onChange,
  toolbarConfig,
  editorConfig,
  style,
}) {
  const [editor, setEditor] = useState(null);
  const [count, setCount] = useState(0);
  const maxLengthRef = useRef(maxLength);
  const wrapperRef = useRef(null);

  useEffect(() => {
    maxLengthRef.current = maxLength;
  }, [maxLength]);

  useEffect(() => {
    if (!editor) return undefined;

    const countText = applyMaxLength(editor, () => maxLengthRef.current);

    const update = () => setCount(countText());
    update();
    editor.on('change', update);

    return () => {
      editor.off('change', update);
    };
  }, [editor]);

  useEffect(() => {
    if (editor) return () => editor.destroy();
  }, [editor]);

  return (
    <div ref={wrapperRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      <Toolbar
        editor={editor}
        config={toolbarConfig}
        style={{ borderBottom: '1px solid #ccc' }}
      />
      <Editor
        value={value}
        onCreated={setEditor}
        onChange={(ed) => {
          if (ed && typeof ed.getHtml === 'function') {
            onChange && onChange(ed.getHtml());
          }
        }}
        mode="default"
        style={{ flex: 1, overflow: 'auto', height: '100%' }}
      />
      <div className={`WangEditorLimit-count${count >= maxLength ? ' WangEditorLimit-count-full' : ''}`}>
        {count} / {maxLength}
      </div>
    </div>
  );
}
