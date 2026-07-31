import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Table, Button, Popover, Checkbox, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import './ResizableTable.css';
import './SortableCheckbox.css';

// ==================== 布局工具函数 ====================

function getOffsetLeft(el, ancestor) {
  let left = 0;
  let current = el;
  while (current && current !== ancestor) {
    left += current.offsetLeft;
    current = current.offsetParent;
  }
  return left;
}

// ==================== 缓存工具函数 ====================

function getCacheKey(cacheKey) {
  return `resizable-table-${cacheKey}`;
}

function loadCache(cacheKey) {
  try {
    const raw = localStorage.getItem(getCacheKey(cacheKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(cacheKey, data) {
  try {
    localStorage.setItem(getCacheKey(cacheKey), JSON.stringify(data));
  } catch {}
}

// ==================== 可拖拽表头单元格 ====================

function ResizableHeaderCell({ cellProps, onResizeStart, onResizeMove, onResizeEnd, onHoverEnter, onHoverLeave, ...restProps }) {
  const { id } = cellProps;
  const handleRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const resizingRef = useRef(false);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    function onMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = true;

      startXRef.current = e.clientX;
      const thEl = handle.closest('th');
      startWidthRef.current = thEl ? thEl.offsetWidth : 0;

      onResizeStart && onResizeStart(id, thEl);

      function onMouseMove(e) {
        const delta = e.clientX - startXRef.current;
        const newWidth = Math.max(60, startWidthRef.current + delta);
        if (thEl) {
          thEl.style.width = `${newWidth}px`;
          thEl.style.minWidth = `${newWidth}px`;
        }
        onResizeMove && onResizeMove(id, e.clientX);
      }

      function onMouseUp(e) {
        resizingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const delta = e.clientX - startXRef.current;
        const finalWidth = Math.max(60, startWidthRef.current + delta);
        onResizeEnd && onResizeEnd(id, finalWidth);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [id, onResizeStart, onResizeMove, onResizeEnd]);

  const { onHeaderCell, ...restPropsWithoutOnHeaderCell } = restProps;

  return (
    <th
      {...restPropsWithoutOnHeaderCell}
      data-column-id={id}
      style={{
        ...restPropsWithoutOnHeaderCell.style,
        userSelect: 'none',
      }}
      className="resizable-th"
    >
      {restPropsWithoutOnHeaderCell.children}
      <span
        ref={handleRef}
        className="resize-handle"
        onMouseEnter={() => !resizingRef.current && onHoverEnter && onHoverEnter(id)}
        onMouseLeave={() => !resizingRef.current && onHoverLeave && onHoverLeave()}
      />
    </th>
  );
}

// ==================== 可排序项 ====================

function SortableItem({ id, label, fixed, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: fixed });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleClick(e) {
    if (fixed) return;
    if (e.target.closest('.drag-handle') || e.target.closest('.ant-checkbox')) return;
    onToggle?.(id);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'dragging' : ''} ${fixed ? 'fixed' : ''}`}
      onClick={handleClick}
      {...(fixed ? {} : attributes)}
    >
      <Tooltip title={fixed ? '不可排序' : '按住拖拽可排序'}>
        <span
          className={`drag-handle ${fixed ? 'fixed' : ''}`}
          {...(fixed ? {} : listeners)}
        >
          ⠿
        </span>
      </Tooltip>
      <Checkbox value={id} onClick={(e) => e.stopPropagation()}>
        {label}
      </Checkbox>
    </div>
  );
}

// ==================== 列配置 Popover 内容 ====================

function ColumnConfigContent({ items, selectedValues, onDragEnd, onGroupChange, onToggle, sensors }) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="sortable-checkbox-list">
          <Checkbox.Group value={selectedValues} onChange={onGroupChange}>
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                label={item.label}
                fixed={item.fixed}
                onToggle={onToggle}
              />
            ))}
          </Checkbox.Group>
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ==================== 组合组件：可调列宽 + 列配置 ====================

function ResizableTableWithColumnConfig({
  columns: rawColumns,
  dataSource,
  cacheKey,
  columnConfigItems: initialColumnConfigItems,
  onColumnConfigChange,
  columnConfigCacheKey,
  ...restProps
}) {
  // ==================== 列配置状态 ====================

  /** 列配置缓存 key */
  const colConfigCacheKey = columnConfigCacheKey || (cacheKey ? `col-config-${cacheKey}` : null);

  /** 从 localStorage 读取列配置缓存 */
  const loadColConfigCache = useCallback(() => {
    if (!colConfigCacheKey) return null;
    try {
      const data = localStorage.getItem(colConfigCacheKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, [colConfigCacheKey]);

  const colConfigCached = useMemo(() => loadColConfigCache(), [loadColConfigCache]);

  /** 列配置项（排序 + 选中状态） */
  const [configItems, setConfigItems] = useState(() => {
    if (!initialColumnConfigItems) return [];
    if (colConfigCached) {
      const itemMap = Object.fromEntries(initialColumnConfigItems.map(i => [i.id, i]));
      const ordered = colConfigCached.orderedIds.map(id => itemMap[id]).filter(Boolean);
      const newItems = initialColumnConfigItems.filter(i => !colConfigCached.orderedIds.includes(i.id));
      return [...ordered, ...newItems];
    }
    return initialColumnConfigItems;
  });

  const [configOpen, setConfigOpen] = useState(false);

  /** 选中的列 ID 列表 */
  const [selectedValues, setSelectedValues] = useState(() => {
    if (colConfigCached) {
      const validIds = new Set(initialColumnConfigItems.map(i => i.id));
      return colConfigCached.selectedValues.filter(id => validIds.has(id));
    }
    return initialColumnConfigItems.filter((item) => item.checked).map((item) => item.id);
  });

  /** 缓存列配置到 localStorage */
  useEffect(() => {
    if (!colConfigCacheKey) return;
    localStorage.setItem(colConfigCacheKey, JSON.stringify({
      orderedIds: configItems.map(i => i.id),
      selectedValues,
    }));
  }, [configItems, selectedValues, colConfigCacheKey]);

  /** 拖拽排序传感器 */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  /** 拖拽结束回调 */
  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const overItem = configItems.find(item => item.id === over?.id);
      if (overItem?.fixed) return;
      const oldIndex = configItems.findIndex((item) => item.id === active.id);
      const newIndex = configItems.findIndex((item) => item.id === over.id);
      const movedItems = arrayMove(configItems, oldIndex, newIndex);
      const fixedItems = configItems.filter(item => item.fixed);
      const nonFixedItems = movedItems.filter(item => !item.fixed);
      const newItems = [...fixedItems, ...nonFixedItems];
      setConfigItems(newItems);
      emitColumnConfigChange(newItems, selectedValues);
    }
  }

  /** Checkbox.Group 选中变化回调 */
  function handleGroupChange(checkedValues) {
    setSelectedValues(checkedValues);
    emitColumnConfigChange(configItems, checkedValues);
  }

  /** 行点击切换 checkbox */
  function handleToggle(id) {
    setSelectedValues(prev => {
      const next = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
      emitColumnConfigChange(configItems, next);
      return next;
    });
  }

  /** 触发外部回调 */
  function emitColumnConfigChange(currentItems, currentValues) {
    if (!onColumnConfigChange) return;
    const allOrderedItems = currentItems.map((item) => ({
      id: item.id,
      label: item.label,
      checked: currentValues.includes(item.id),
      fixed: item.fixed,
    }));
    onColumnConfigChange(allOrderedItems, currentValues);
  }

  // ==================== 计算可见列 ====================

  /** 根据选中值过滤并排序列 */
  const visibleColumns = useMemo(() => {
    if (!initialColumnConfigItems || initialColumnConfigItems.length === 0) {
      return rawColumns;
    }

    // 构建列 key 到列配置的映射
    const colConfigMap = {};
    rawColumns.forEach(col => {
      const key = col.key || col.dataIndex;
      colConfigMap[key] = col;
    });

    // 按 configItems 的顺序，只保留 selectedValues 中的列
    const result = [];
    configItems.forEach(item => {
      if (selectedValues.includes(item.id) && colConfigMap[item.id]) {
        result.push(colConfigMap[item.id]);
      }
    });

    // 补充 rawColumns 中有但 configItems 中没有的列（比如固定列）
    rawColumns.forEach(col => {
      const key = col.key || col.dataIndex;
      if (!configItems.find(item => item.id === key) && colConfigMap[key]) {
        result.unshift(colConfigMap[key]);
      }
    });

    return result;
  }, [rawColumns, configItems, selectedValues, initialColumnConfigItems]);

  // ==================== 表格列宽状态 ====================

  const [currentColumns, setCurrentColumns] = useState(() => {
    if (!cacheKey) return visibleColumns;
    const cached = loadCache(cacheKey);
    if (cached && cached.columnWidths) {
      return visibleColumns.map((col) => {
        const key = col.key || col.dataIndex;
        const w = cached.columnWidths[key];
        return w ? { ...col, width: w } : col;
      });
    }
    return visibleColumns;
  });

  /** 当可见列变化时同步 currentColumns */
  const prevVisibleColumnsRef = useRef(visibleColumns);
  useEffect(() => {
    const prevKeys = prevVisibleColumnsRef.current.map(c => c.key || c.dataIndex).join(',');
    const newKeys = visibleColumns.map(c => c.key || c.dataIndex).join(',');

    if (prevKeys !== newKeys) {
      setCurrentColumns(prev => {
        if (!cacheKey) return visibleColumns;
        const cached = loadCache(cacheKey);
        if (cached && cached.columnWidths) {
          return visibleColumns.map((col) => {
            const key = col.key || col.dataIndex;
            const w = cached.columnWidths[key];
            return w ? { ...col, width: w } : col;
          });
        }
        return visibleColumns;
      });
    }

    prevVisibleColumnsRef.current = visibleColumns;
  }, [visibleColumns, cacheKey]);

  // ==================== 横向滚动位置修复 ====================

  /** 记录上一次的列 key 列表 */
  const prevColumnKeysRef = useRef('');

  /** 表格容器引用 */
  const tableRef = useRef(null);

  /**
   * 核心修复：当列配置变化时，重置横向滚动位置
   * 并强制同步表头和表体的滚动容器
   */
  useEffect(() => {
    const currentKeys = visibleColumns.map(c => c.key || c.dataIndex).join(',');
    const prevKeys = prevColumnKeysRef.current;

    if (prevKeys !== '' && prevKeys !== currentKeys && tableRef.current) {
      // 找到所有横向滚动容器（表头和表体）
      const scrollContainers = tableRef.current.querySelectorAll('.ant-table-content');

      scrollContainers.forEach(container => {
        container.scrollLeft = 0;
      });

      // 同时重置 ant-table-body 的 scrollLeft
      const tableBody = tableRef.current.querySelector('.ant-table-body');
      if (tableBody) {
        tableBody.scrollLeft = 0;
      }

      // 强制触发浏览器重新计算布局
      requestAnimationFrame(() => {
        if (tableRef.current) {
          const containers = tableRef.current.querySelectorAll('.ant-table-content');
          containers.forEach(container => {
            container.scrollLeft = 0;
          });
        }
      });
    }

    prevColumnKeysRef.current = currentKeys;
  }, [visibleColumns]);

  // ==================== 拖拽回调 ====================

  const indicatorRef = useRef(null);
  const resizingRef = useRef(false);

  const persistCache = useCallback((cols) => {
    if (!cacheKey) return;
    const widths = {};
    cols.forEach((col) => {
      if (col.width) widths[col.key || col.dataIndex] = col.width;
    });
    saveCache(cacheKey, { columnWidths: widths });
  }, [cacheKey]);

  const handleResizeStart = useCallback((colId, thEl) => {
    resizingRef.current = true;
    if (!indicatorRef.current || !tableRef.current || !thEl) return;
    const indicator = indicatorRef.current;
    indicator.style.display = 'block';
    const thRight = getOffsetLeft(thEl, tableRef.current) + thEl.offsetWidth;
    indicator.style.left = `${thRight}px`;
    const tableEl = tableRef.current.querySelector('table');
    indicator.style.height = `${tableEl ? tableEl.offsetHeight : tableRef.current.offsetHeight}px`;
  }, []);

  const handleResizeMove = useCallback((colId, clientX) => {
    if (!indicatorRef.current || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    indicatorRef.current.style.left = `${clientX - tableRect.left}px`;
  }, []);

  const handleResizeEnd = useCallback((colKey, newWidth) => {
    resizingRef.current = false;
    if (indicatorRef.current) {
      indicatorRef.current.style.display = 'none';
    }
    setCurrentColumns((prev) => {
      const newCols = prev.map((col) => {
        if ((col.key || col.dataIndex) === colKey) {
          return { ...col, width: newWidth };
        }
        return col;
      });
      persistCache(newCols);
      return newCols;
    });
  }, [persistCache]);

  const handleHoverEnter = useCallback((colId) => {
    if (resizingRef.current) return;
    if (!indicatorRef.current || !tableRef.current) return;
    const ths = tableRef.current.querySelectorAll('th[data-column-id]');
    for (let i = 0; i < ths.length; i++) {
      if (ths[i].getAttribute('data-column-id') === colId) {
        const indicator = indicatorRef.current;
        indicator.style.display = 'block';
        const thRight = getOffsetLeft(ths[i], tableRef.current) + ths[i].offsetWidth;
        indicator.style.left = `${thRight}px`;
        const tableEl = tableRef.current.querySelector('table');
        indicator.style.height = `${tableEl ? tableEl.offsetHeight : tableRef.current.offsetHeight}px`;
        return;
      }
    }
  }, []);

  const handleHoverLeave = useCallback(() => {
    if (resizingRef.current) return;
    if (indicatorRef.current) {
      indicatorRef.current.style.display = 'none';
    }
  }, []);

  // ==================== 渲染 ====================

  const mergedColumns = currentColumns.map((col) => ({
    ...col,
    onHeaderCell: (column) => ({
      cellProps: { id: column.key || column.dataIndex },
      onResizeStart: handleResizeStart,
      onResizeMove: handleResizeMove,
      onResizeEnd: handleResizeEnd,
      onHoverEnter: handleHoverEnter,
      onHoverLeave: handleHoverLeave,
    }),
  }));

  /** 列配置按钮 */
  const columnConfigButton = initialColumnConfigItems ? (
    <Popover
      content={
        <ColumnConfigContent
          items={configItems}
          selectedValues={selectedValues}
          onDragEnd={handleDragEnd}
          onGroupChange={handleGroupChange}
          onToggle={handleToggle}
          sensors={sensors}
        />
      }
      title="列配置"
      trigger="click"
      open={configOpen}
      onOpenChange={setConfigOpen}
      placement="bottomLeft"
    >
      <Button icon={<SettingOutlined />} style={{ marginBottom: 16 }}>
        列配置
      </Button>
    </Popover>
  ) : null;

  return (
    <div>
      {columnConfigButton}
      <div ref={tableRef} style={{ position: 'relative' }}>
        <Table
          {...restProps}
          columns={mergedColumns}
          dataSource={dataSource}
          components={{
            header: {
              cell: ResizableHeaderCell,
            },
          }}
        />
        <div ref={indicatorRef} className="resize-indicator" style={{ display: 'none' }} />
      </div>
    </div>
  );
}

export default ResizableTableWithColumnConfig;
