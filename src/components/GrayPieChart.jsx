import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './GrayPieChart.css';

/**
 * 灰色饼图组件
 * 当所有数据值都为 0(或全部缺失)时,渲染一个灰色实心饼图占位,
 * 而不是 echarts 默认的「均分整个圆」。
 *
 * @param {Object}   props
 * @param {Array<{name: string, value: number, itemStyle?: Object}>} props.data   饼图数据
 * @param {number}   props.width    宽度(默认 400)
 * @param {number}   props.height   高度(默认 320)
 * @param {string}   props.title    标题(可选)
 * @param {string}   props.emptyColor  无数据时占位灰色(默认 #d9d9d9)
 * @param {string}   props.subtext    无数据时副标题文案(默认「暂无数据」)
 */
export default function GrayPieChart({
  data = [],
  width = 400,
  height = 320,
  title = '',
  emptyColor = '#d9d9d9',
  subtext = '暂无数据',
}) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current);
    }
    const chart = instanceRef.current;

    // 判断是否所有值都为 0 或无效
    const allZero = data.length === 0 || data.every((d) => !d.value || d.value === 0);

    const baseOption = {
      title: title
        ? { text: title, left: 'center', top: 10, textStyle: { fontSize: 15, fontWeight: 600 } }
        : undefined,
      tooltip: allZero ? undefined : { trigger: 'item', formatter: '{b}: {d}%' },
      legend: allZero
        ? undefined
        : {
            orient: 'horizontal',
            bottom: 0,
            data: data.map((d) => d.name),
          },
      series: [
        {
          type: 'pie',
          radius: allZero ? '70%' : ['40%', '70%'], // 无数据时实心圆;有数据时环形
          center: ['50%', '52%'],
          avoidLabelOverlap: true,
          label: allZero
            ? {
                show: true,
                position: 'center',
                formatter: subtext,
                fontSize: 14,
                color: '#999',
              }
            : { show: true, formatter: '{b}: {d}%' },
          labelLine: allZero ? { show: false } : { show: true },
          data: allZero
            ? [{ value: 1, name: subtext, itemStyle: { color: emptyColor } }]
            : data,
          itemStyle: allZero
            ? { color: emptyColor, borderColor: '#fff', borderWidth: 0 }
            : {
                borderColor: '#fff',
                borderWidth: 2,
              },
          emphasis: allZero
            ? { disabled: true } // 禁用 hover 放大
            : undefined,
          silent: allZero, // 无数据时不响应点击
        },
      ],
      // 无数据时禁用整个图表的交互
      animation: !allZero,
    };

    chart.setOption(baseOption, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, title, emptyColor, subtext]);

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className="gray-pie-chart"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
