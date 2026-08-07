import React, { useState } from 'react';
import history from '../history';
import InterceptOnClick from './InterceptOnClick';

// ==================== 示例页 ====================
// 演示：只监听 #intercept-container 内部的所有点击，onclick 里照常写逻辑

function InterceptOnClickDemo() {
  const [hasEditor, setHasEditor] = useState(true);

  return (
    <InterceptOnClick container="#intercept-container" shouldConfirm={() => hasEditor}>
      <div className="App" style={{ padding: 24 }}>
        <button onClick={() => history.push('/')} style={{ marginBottom: 16 }}>
          返回首页（在容器外，不受拦截）
        </button>
        <h2>拦截 onclick 页面跳转</h2>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={hasEditor}
            onChange={(e) => setHasEditor(e.target.checked)}
          />
          模拟页面存在 wangEditor（勾选才弹确认框）
        </label>
        <p style={{ marginBottom: 16 }}>
          容器内点击会检查 onclick 回调源码：含 window.open / push 才拦截；
          "保存"（console.log）不含则直接放行。
        </p>
        <div
          id="intercept-container"
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', border: '1px dashed #ccc', padding: 16 }}
        >
          <button onClick={() => history.push('/table')}>
            跳转拖拽表格（history.push）
          </button>
          <button onClick={() => history.push('/board')}>
            跳转看板（history.push）
          </button>
          <button onClick={() => window.open('https://example.com', '_blank')}>
            打开新窗口（window.open）
          </button>
          <button onClick={() => {
            window.apolloMfeNavigate();
            console.log('执行了保存逻辑');
          }}>
            保存（console.log）
          </button>
        </div>
      </div>
    </InterceptOnClick>
  );
}

export default InterceptOnClickDemo;
