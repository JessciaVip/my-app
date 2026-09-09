import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Checkbox, Button } from 'antd';
import List from 'rc-virtual-list';
import { CaretRightOutlined } from '@ant-design/icons';
import styles from './MassCheckboxAccordionRcvl.module.css';

const ITEM_HEIGHT = 32;

// ─── Mock 数据：N 组，每组随机几百到一两千 checkbox ───
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

// ─── 扁平化行类型 ───
// 'group'  → 组标题行（渲染 .blockcollapse > .title）
// 'item'   → checkbox 行（渲染 .content 内部）
// 每行还带 gid，用于样式归属和组级操作

function MassCheckboxAccordionRcvl({ height = 480, onSelectionChange }) {
  // 默认全部展开
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(GROUPS.map((g) => g.id))
  );
  const [checkedIds, setCheckedIds] = useState(() => new Set());

  // ─── 扁平化：根据展开状态生成行序列 ───
  // 用可变数组 push 代替 spread，减少 GC 压力
  const flatRows = useMemo(() => {
    const rows = new Array(GROUPS.length);
    let idx = 0;
    for (let gi = 0; gi < GROUPS.length; gi++) {
      const g = GROUPS[gi];
      rows[idx++] = { type: 'group', gid: g.id, label: g.label, count: g.children.length };
      if (expandedIds.has(g.id)) {
        for (let ci = 0; ci < g.children.length; ci++) {
          rows[idx++] = { type: 'item', gid: g.id, id: g.children[ci].id, label: g.children[ci].label };
        }
      }
    }
    rows.length = idx;
    return rows;
  }, [expandedIds]);

  // ─── 给 rc-virtual-list 用的 itemKey / itemHeight ───
  // 注意:rc-virtual-list 的 itemHeight 必须是「数字」,不能是函数。
  // 它内部做 `itemHeight * data.length`、`height / itemHeight` 等算术,
  // 传函数会让结果变 NaN,虚拟滚动直接失效。
  // 混合行高的真实值由它内部的 useHeights hook 测量 DOM(offsetHeight+margin)得到,
  // itemHeight 只是未测量到时的兜底估值,所以取最常见的行高即可。
  const rowKey = useCallback(
    (row) => (row.type === 'group' ? `g:${row.gid}` : `i:${row.id}`),
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

  // 统一在 effect 里通知父组件
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(checkedIds);
    }
  }, [checkedIds, onSelectionChange]);

  // ─── 行渲染：group 行渲染组标题，item 行渲染 checkbox ───
  // 行数据里已带 label/count，不需要 find
  const renderRow = useCallback(
    (row) => {
      const expanded = expandedIds.has(row.gid);

      if (row.type === 'group') {
        return (
          <div className={styles.blockcollapse} key={`g:${row.gid}`}>
            <div
              className={styles.title}
              onClick={() => onToggleGroup(row.gid)}
            >
              <CaretRightOutlined
                rotate={expanded ? 90 : 0}
                style={{ marginRight: 6, transition: 'transform 0.15s' }}
              />
              <strong>{row.label}</strong>
              <span className={styles.count}>（{row.count}）</span>
            </div>
          </div>
        );
      }

      return (
        <div className={styles.content} key={`i:${row.id}`}>
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

      {/* 单一滚动容器：List 自己管理滚动和 holder 高度 */}
      <List
        data={flatRows}
        height={height}
        itemHeight={ITEM_HEIGHT}
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

export default MassCheckboxAccordionRcvl;
