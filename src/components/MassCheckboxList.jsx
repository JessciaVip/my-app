import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Checkbox, Button } from 'antd';
import './MassCheckboxList.css';

const ROW_HEIGHT = 32;
const OVERSCAN = 5;

const ALL_ITEMS = Array.from({ length: 2000 }, (_, i) => ({
  id: `item-${i + 1}`,
  label: `选项 ${i + 1}`,
}));

// 单行组件：React.memo 保证只有自身勾选状态变化时才重渲染
const CheckboxRow = React.memo(function CheckboxRow({ item, checked, onToggle }) {
  return (
    <div className="MassCheckboxList-row" style={{ height: ROW_HEIGHT }}>
      <Checkbox checked={checked} onChange={(e) => onToggle(item.id, e.target.checked)}>
        {item.label}
      </Checkbox>
    </div>
  );
});

/**
 * 虚拟滚动 Checkbox 列表（2000 项），可直接放进 Popover/Modal 等容器。
 * @param {number}  height            列表视口高度
 * @param {(checkedIds: Set<string>) => void} onSelectionChange 勾选变化回调
 */
function MassCheckboxList({ height = 320, onSelectionChange }) {
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const frameRef = useRef(null);

  const handleSelectAll = useCallback(() => {
    setCheckedIds(new Set(ALL_ITEMS.map((item) => item.id)));
  }, []);

  const handleClear = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  // rAF 节流滚动，避免 scroll 事件高频触发 setState
  const handleScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(() => setScrollTop(top));
  }, []);

  useEffect(() => () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  // 统一在 effect 里通知父组件，避免在 setState updater 中触发父组件更新
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(checkedIds);
    }
  }, [checkedIds, onSelectionChange]);

  // 稳定的引用，配合 React.memo 避免行级联重渲染
  const onToggle = useCallback((id, checked) => {
    setCheckedIds((prev) => {
      if (prev.has(id) === checked) return prev;
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // 只计算可视区间内的行，DOM 中始终只有 ~30 行
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const first = Math.floor(scrollTop / ROW_HEIGHT);
    const visibleCount = Math.ceil(height / ROW_HEIGHT);
    const start = Math.max(0, first - OVERSCAN);
    const end = Math.min(ALL_ITEMS.length, first + visibleCount + OVERSCAN);
    return { startIndex: start, endIndex: end, offsetY: start * ROW_HEIGHT };
  }, [scrollTop, height]);

  const visibleItems = ALL_ITEMS.slice(startIndex, endIndex);

  return (
    <div className="MassCheckboxList">
      <div className="MassCheckboxList-toolbar">
        <span>
          已选 {checkedIds.size} / {ALL_ITEMS.length}　·　实际渲染 {endIndex - startIndex} 行
        </span>
        <Button size="small" onClick={handleSelectAll}>
          全选
        </Button>
        <Button size="small" onClick={handleClear}>
          清空
        </Button>
      </div>
      <div
        className="MassCheckboxList-viewport"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: ALL_ITEMS.length * ROW_HEIGHT, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetY}px)`,
            }}
          >
            {visibleItems.map((item) => (
              <CheckboxRow
                key={item.id}
                item={item}
                checked={checkedIds.has(item.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MassCheckboxList;
