import React, { useState } from 'react';
import WangEditorLimit from './WangEditorLimit';

function WangEditorLimitDemo() {
  const [html, setHtml] = useState('');

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={() => window.history.back()} style={{ marginBottom: 16 }}>
        返回
      </button>
      <h2>WangEditor 字数上限（500）</h2>
      <p style={{ marginBottom: 16, color: '#666' }}>
        右下角实时显示字数；达到上限后无法再输入（原生拦截，光标不乱跳），删除后恢复输入。
        统计规则：换行、空格算 1 个字符；图片、html 标签不计入。
      </p>
      <div style={{ height: 400, border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
        <WangEditorLimit maxLength={500} value={html} onChange={setHtml} />
      </div>
      {html && (
        <div style={{ marginTop: 16 }}>
          <h3>HTML 输出：</h3>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{html}</pre>
        </div>
      )}
    </div>
  );
}

export default WangEditorLimitDemo;
