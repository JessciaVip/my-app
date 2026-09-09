import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Checkbox, Button } from 'antd';
import List from 'rc-virtual-list';
import { CaretRightOutlined } from '@ant-design/icons';
import styles from './MassCheckboxAccordionVirtuoso.module.css';

const GROUP_HEIGHT = 40;
const ITEM_HEIGHT = 32;

// ─── Mock 数据：300 组，每组 200~1200 checkbox ───
const GROUP_COUNT = 300;
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

function MassCheckboxAccordionVirtuoso({ height = 480, onSelectionChange }) {
  // 默认全部展开
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(GROUPS.map((g) => g.id))
  );
  const [checkedIds, setCheckedIds] = useState(() => new Set());

  // ─── 扁平化：group 行 + 展开组的 item 行 ───
  const flatRows = useMemo(() => {
    const rows = [];
    GROUPS.forEach((g) => {
      rows.push({ type: 'group', gid: g.id });
      if (expandedIds.has(g.id)) {
        g.children.forEach((child) => {
          rows.push({ type: 'item', gid: g.id, id: child.id, label: child.label });
        });
      }
    });
    return rows;
  }, [expandedIds]);

  const rowKey = useCallback(
    (row) => (row.type === 'group' ? `g:${row.gid}` : `i:${row.id}`),
    []
  );

  // rc-virtual-list itemHeight 函数签名是 (item, index)
  const getRowHeight = useCallback(
    (item) => (item?.type === 'group' ? GROUP_HEIGHT : ITEM_HEIGHT),
    []
  );

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

  const handleSelectAllVisible = useCallback(() => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      flatRows.forEach((r) => {
        if (r.type === 'item') next.add(r.id);
      });
      return next;
    });
  }, [flatRows]);

  const handleClear = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(checkedIds);
    }
  }, [checkedIds, onSelectionChange]);

  // ─── 行渲染 ───
  const renderRow = useCallback(
    (row) => {
      const g = GROUPS.find((x) => x.id === row.gid);
      const expanded = expandedIds.has(row.gid);

      if (row.type === 'group') {
        return (
          <div className={styles.blockcollapse}>
            <div
              className={styles.title}
              onClick={() => onToggleGroup(row.gid)}
            >
              <CaretRightOutlined
                rotate={expanded ? 90 : 0}
                style={{ marginRight: 6, transition: 'transform 0.15s' }}
              />
              <strong>{g.label}</strong>
              <span className={styles.count}>（{g.children.length}）</span>
            </div>
          </div>
        );
      }

      return (
        <div className={styles.content}>
          <div className={styles.checkboxRow}>
            <Checkbox
              checked={checkedIds.has(row.id)}
              onChange={(e) => onToggleItem(row.id, e.target.checked)}
            >
              {row.label}
            </Checkbox>
          </div>
        </div>
      );
    },
    [expandedIds, checkedIds, onToggleGroup, onToggleItem]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span>
          已选 {checkedIds.size} / {TOTAL_CHECKBOXES}　·　展开 {expandedIds.size} / {GROUPS.length} 组　·　扁平行数 {flatRows.length}
        </span>
      </div>
      <div className={styles.toolbarBtns}>
        <Button size="small" onClick={handleExpandAll}>全部展开</Button>
        <Button size="small" onClick={handleCollapseAll}>全部收起</Button>
        <Button size="small" onClick={handleSelectAllVisible}>选可见项</Button>
        <Button size="small" onClick={handleClear}>清空</Button>
      </div>

      {/*
        单一滚动容器，group 标题行和 checkbox 行在同一层
        rc-virtual-list 自动计算 holder 总高度
      */}
      <List
        data={flatRows}
        height={height}
        itemHeight={getRowHeight}
        itemKey={rowKey}
        virtual
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          width: 420,
        }}
      >
        {renderRow}
      </List>
    </div>
  );
}

export default MassCheckboxAccordionVirtuoso;
