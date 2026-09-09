import React, { useState, useCallback, useEffect } from 'react';
import { Checkbox } from 'antd';
import List from 'rc-virtual-list';
import { CaretRightOutlined } from '@ant-design/icons';
import styles from './MassCheckboxAccordion.module.css';

const ROW_HEIGHT = 32;
const CONTENT_HEIGHT = 300; // 每组 content 的虚拟列表视口高度

// ─── Mock 数据：N 组，每组随机几百到一两千 checkbox ───
const GROUP_COUNT = 30;
const MIN_PER_GROUP = 200;
const MAX_PER_GROUP = 1200;

const GROUPS = Array.from({ length: GROUP_COUNT }, (_, gi) => {
  const count = MIN_PER_GROUP + Math.floor(Math.random() * (MAX_PER_GROUP - MIN_PER_GROUP));
  return {
    id: `group-${gi + 1}`,
    label: `分组 ${gi + 1}`,
    children: Array.from({ length: count }, (_, ci) => ({
      id: `g${gi + 1}-item-${ci + 1}`,
      label: `选项 ${gi + 1}.${ci + 1}`,
    })),
  };
});

const TOTAL_CHECKBOXES = GROUPS.reduce((sum, g) => sum + g.children.length, 0);

// 单行 checkbox，React.memo 避免勾选时全量重渲染
const CheckboxRow = React.memo(function CheckboxRow({ item, checked, onToggle }) {
  return (
    <div className={styles.checkboxRow} style={{ height: ROW_HEIGHT }}>
      <Checkbox
        checked={checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      >
        {item.label}
      </Checkbox>
    </div>
  );
});

function MassCheckboxAccordion({ height, onSelectionChange }) {
  // expandedIds: 哪些组展开
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  // checkedIds: 所有勾选的 item id（跨组）
  const [checkedIds, setCheckedIds] = useState(() => new Set());

  // ─── 交互回调（引用稳定）───
  const onToggleGroup = useCallback((gid) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) {
        next.delete(gid);
      } else {
        next.add(gid);
      }
      return next;
    });
  }, []);

  const onToggleItem = useCallback((id, checked) => {
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

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(GROUPS.map((g) => g.id)));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleClear = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  // 统一在 effect 里通知父组件
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(checkedIds);
    }
  }, [checkedIds, onSelectionChange]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span>
          已选 {checkedIds.size} / {TOTAL_CHECKBOXES}　·　展开 {expandedIds.size} / {GROUPS.length} 组
        </span>
        <button className={styles.btn} onClick={handleExpandAll}>全部展开</button>
        <button className={styles.btn} onClick={handleCollapseAll}>全部收起</button>
        <button className={styles.btn} onClick={handleClear}>清空</button>
      </div>

      <div
        className={styles.scrollWrap}
        style={height ? { maxHeight: height, overflowY: 'auto' } : undefined}
      >
        {GROUPS.map((g) => {
          const expanded = expandedIds.has(g.id);
          return (
            <div key={g.id} className={styles.blockcollapse}>
              <div
                className={styles.title}
                onClick={() => onToggleGroup(g.id)}
              >
                <CaretRightOutlined
                  rotate={expanded ? 90 : 0}
                  style={{ marginRight: 6, transition: 'transform 0.15s' }}
                />
                <strong>{g.label}</strong>
                <span className={styles.count}>（{g.children.length}）</span>
              </div>
              {expanded && (
                <div className={styles.content}>
                  {/* 单组内部虚拟滚动：只渲染可视区间，保留嵌套 DOM 结构 */}
                  <List
                    data={g.children}
                    height={CONTENT_HEIGHT}
                    itemHeight={ROW_HEIGHT}
                    itemKey="id"
                    virtual
                  >
                    {(item) => (
                      <CheckboxRow
                        item={item}
                        checked={checkedIds.has(item.id)}
                        onToggle={onToggleItem}
                      />
                    )}
                  </List>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MassCheckboxAccordion;
