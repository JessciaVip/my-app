import { useState } from 'react';
import GrayPieChart from './GrayPieChart';
import './GrayPieChart.css';

/**
 * 灰色饼图 Demo
 * 展示:数据全为 0 时灰色占位饼图;有数据时正常环形饼图
 */
export default function GrayPieChartDemo({ onBack }) {
  const [scenario, setScenario] = useState('allZero');

  const SCENARIOS = {
    allZero: {
      label: '全 0 数据(灰色占位)',
      data: [
        { name: '分类A', value: 0 },
        { name: '分类B', value: 0 },
        { name: '分类C', value: 0 },
      ],
    },
    someZero: {
      label: '部分为 0',
      data: [
        { name: '分类A', value: 50 },
        { name: '分类B', value: 0 },
        { name: '分类C', value: 0 },
      ],
    },
    hasData: {
      label: '有数据',
      data: [
        { name: '分类A', value: 40 },
        { name: '分类B', value: 30 },
        { name: '分类C', value: 30 },
      ],
    },
    empty: {
      label: '空数组',
      data: [],
    },
  };

  const current = SCENARIOS[scenario];

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>灰色饼图 GrayPieChart</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        数据全为 0% 时,echarts 默认会均分整个圆;本组件检测全 0 后用灰色实心圆 + "暂无数据"占位。
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(SCENARIOS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setScenario(key)}
            style={{
              padding: '6px 14px',
              border: `1px solid ${scenario === key ? '#1677ff' : '#d9d9d9'}`,
              background: scenario === key ? '#1677ff' : '#fff',
              color: scenario === key ? '#fff' : '#333',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {val.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>当前场景:{current.label}</h3>
          <GrayPieChart data={current.data} title="销售占比" width={380} height={320} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>原始数据</h3>
          <pre
            style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              lineHeight: 1.6,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(current.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
