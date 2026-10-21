import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import './PieChartWithLegend.css';

const DEFAULT_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b6', '#ea7ccc', '#c0504d',
];

/**
 * 饼图 + 原生图例(底部)
 *  - 图例为 echarts 原生组件:点击图例即联动显隐对应扇区
 *  - 图例 horizontal 会按宽度自动换行(一行/两行)
 *  - 饼图始终在「画布高度 − 图例高度」的剩余区域内上下居中:
 *      每次渲染后读取图例实际高度 legendH,把饼图 center 设为
 *      ['50%', (canvasH - legendH) / 2] 像素值,从而排除图例高度居中
 *  - ResizeObserver 监听容器尺寸,自动 resize + 重算中心(可缩放)
 *
 * @param {Object} props
 * @param {Array<{name:string, value:number}>} props.data   饼图数据
 * @param {string[]} props.colors                            颜色(按序分配)
 * @param {boolean} props.donut                             是否环形(默认 true)
 * @param {boolean} props.showPercentLabel                  是否显示百分比标签(默认 true)
 */
export default function PieChartWithLegend({
  data = [],
  colors = DEFAULT_COLORS,
  donut = true,
  showPercentLabel = true,
}) {
  const chartRef = useRef(null);
  const instanceRef = useRef(null);
  const lastCenterYRef = useRef(null);

  // 重算饼图中心:在「画布高度 − 图例高度」的剩余区域内上下居中
  const relayoutCenter = () => {
    const chart = instanceRef.current;
    if (!chart) return;
    const legendModel = chart.getModel().getComponent('legend', 0);
    const legendView =
      legendModel && chart.getViewOfComponentModel(legendModel);
    if (!legendView || !legendView.group) return;

    const legendH = legendView.group.getBoundingRect().height;
    const canvasH = chart.getHeight();
    if (!canvasH) return;

    const centerY = (canvasH - legendH) / 2;
    const last = lastCenterYRef.current;
    // 仅在中心变化时才 setOption,避免与 finished 事件互相递归
    if (last === null || Math.abs(last - centerY) > 0.5) {
      lastCenterYRef.current = centerY;
      chart.setOption({ series: [{ center: ['50%', centerY] }] });
    }
  };

  // 初始化 + 缩放监听(仅挂载)
  useEffect(() => {
    if (!chartRef.current) return;
    instanceRef.current = echarts.init(chartRef.current);
    const chart = instanceRef.current;

    // 渲染完成后重算中心(图例行数/容器尺寸变化都会触发)
    chart.on('finished', relayoutCenter);

    const ro = new ResizeObserver(() => {
      chart.resize();
      requestAnimationFrame(relayoutCenter);
    });
    ro.observe(chartRef.current);

    return () => {
      ro.disconnect();
      if (instanceRef.current) {
        instanceRef.current.dispose();
        instanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 数据 / 配置变更
  useEffect(() => {
    const chart = instanceRef.current;
    if (!chart) return;

    // 用上一次算好的中心做初值,减少切换瞬间的跳动
    const initCenter =
      lastCenterYRef.current != null ? lastCenterYRef.current : '50%';

    chart.setOption(
      {
        color: colors,
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: {
          orient: 'horizontal',
          bottom: 0,
          left: 'center',
          icon: 'circle',
          itemHeight: 10,
          itemGap: 14,
          textStyle: { fontSize: 13 },
          data: data.map((d) => d.name),
        },
        series: [
          {
            type: 'pie',
            radius: donut ? ['38%', '62%'] : '62%',
            center: ['50%', initCenter],
            avoidLabelOverlap: true,
            label: showPercentLabel
              ? { show: true, formatter: '{d}%', fontSize: 12 }
              : { show: false },
            labelLine: showPercentLabel
              ? { show: true, length: 8, length2: 8 }
              : { show: false },
            data,
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
          },
        ],
      },
      true,
    );

    // notMerge 重置后,交给 finished 重新把中心校正到「排除图例高度」
    lastCenterYRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, colors, donut, showPercentLabel]);

  return <div ref={chartRef} className="pie-with-legend" />;
}
