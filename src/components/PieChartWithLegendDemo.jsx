import { useState } from 'react';
import PieChartWithLegend from './PieChartWithLegend';

const ALL_DATA = [
  { name: '研发', value: 42 },
  { name: '销售', value: 28 },
  { name: '市场', value: 18 },
  { name: '运营', value: 12 },
  { name: '财务', value: 9 },
  { name: '行政', value: 7 },
  { name: '客服', value: 6 },
  { name: '法务', value: 4 },
];

const sliderStyle = {
  width: 220,
  verticalAlign: 'middle',
  marginLeft: 8,
};

export default function PieChartWithLegendDemo({ onBack }) {
  const [height, setHeight] = useState(440);
  const [count, setCount] = useState(4);

  const data = ALL_DATA.slice(0, count);

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2 style={{ margin: '0 0 8px' }}>饼图(图例底部 · 饼图上下居中 · 可缩放)</h2>
      <p style={{ color: '#666', fontSize: 13, margin: '0 0 16px' }}>
        原生图例(点击图例可联动显隐对应扇区)。饼图始终在「画布高度 − 图例高度」的剩余区域内上下居中:拖动高度滑块缩放容器、或调整图例项数让图例换行(1/2
        行),饼图都会自动重算中心并保持居中。
      </p>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 16,
          flexWrap: 'wrap',
          fontSize: 13,
        }}
      >
        <label>
          容器高度:{height}px
          <input
            type="range"
            min={240}
            max={720}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            style={sliderStyle}
          />
        </label>
        <label>
          图例项数:{count}
          <input
            type="range"
            min={1}
            max={ALL_DATA.length}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={sliderStyle}
          />
        </label>
      </div>

      <div
        style={{
          height,
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        <PieChartWithLegend data={data} />
      </div>
    </div>
  );
}
