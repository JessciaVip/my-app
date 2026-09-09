import React, { useState, useCallback, useEffect } from 'react';
import { Checkbox, Button } from 'antd';
import List from 'rc-virtual-list';
import './MassCheckboxList.css';

const ROW_HEIGHT = 32;

const ALL_ITEMS = Array.from({ length: 2000 }, (_, i) => ({
  id: `item-${i + 1}`,
  label: `选项 ${i + 1}`,
}));

/**
 * rc-virtual-list 版虚拟滚动 Checkbox 列表（2000 项）。
 * rc-virtual-list 是 antd 内部 Select / Tree / Cascader 使用的虚拟滚动库。
 * props 与手写版 / react-window 版完全一致，可直接放进 Popover/Modal 等容器。
 * @param {number}  height            列表视口高度
 * @param {(checkedIds: Set<string>) => void} onSelectionChange 勾选变化回调
 */
function MassCheckboxListRcvl({ height = 320, onSelectionChange }) {
  const [checkedIds, setCheckedIds] = useState(() => new Set());

  // 稳定的引用，避免行级联重渲染
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

  const handleSelectAll = useCallback(() => {
    setCheckedIds(new Set(ALL_ITEMS.map((item) => item.id)));
  }, []);

  const handleClear = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  // 统一在 effect 里通知父组件，避免在 setState updater 中触发父组件更新
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(checkedIds);
    }
  }, [checkedIds, onSelectionChange]);

  return (
    <div className="MassCheckboxList">
      <div className="MassCheckboxList-toolbar">
        <span>
          已选 {checkedIds.size} / {ALL_ITEMS.length}　·　rc-virtual-list
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
        style={{ height, width: 360 }}
      >
        <List
          data={ALL_ITEMS}
          height={height}
          itemHeight={ROW_HEIGHT}
          itemKey="id"
          virtual
        >
          {(item) => (
            <div className="MassCheckboxList-row" style={{ height: ROW_HEIGHT }}>
              <Checkbox
                checked={checkedIds.has(item.id)}
                onChange={(e) => onToggle(item.id, e.target.checked)}
              >
                {item.label}
              </Checkbox>
            </div>
          )}
        </List>
      </div>
    </div>
  );
}

export default MassCheckboxListRcvl;
