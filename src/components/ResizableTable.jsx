import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Table } from 'antd';
import './ResizableTable.css';

// ==================== 布局工具函数 ====================

/**
 * 累加 el 到 ancestor 之间的 offsetLeft，得到 el 左边缘相对于 ancestor 内边距左边缘的距离
 * 相比 getBoundingClientRect()，offsetLeft 使用浏览器自身布局计算，
 * 不受 viewport 坐标 sub-pixel rounding 在缩放时的不一致影响
 */
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

/** 生成 localStorage 缓存 key */
function getCacheKey(cacheKey) {
  return `resizable-table-${cacheKey}`;
}

/** 从 localStorage 读取缓存的列宽数据 */
function loadCache(cacheKey) {
  try {
    const raw = localStorage.getItem(getCacheKey(cacheKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 将列宽数据持久化到 localStorage */
function saveCache(cacheKey, data) {
  try {
    localStorage.setItem(getCacheKey(cacheKey), JSON.stringify(data));
  } catch {}
}

// ==================== 可拖拽表头单元格 ====================

/**
 * 自定义表头单元格组件，替换 Ant Design 默认的 th
 * 通过 onHeaderCell 注入拖拽和 hover 回调，实现列宽调整和蓝线指示器
 *
 * 性能策略：拖拽过程中通过原生 DOM 操作更新 th 宽度和蓝线位置，
 * 仅在 mouseup 时触发一次 React 渲染提交最终列宽
 */
function ResizableHeaderCell({ cellProps, onResizeStart, onResizeMove, onResizeEnd, onHoverEnter, onHoverLeave, ...restProps }) {
  const { id } = cellProps; // 当前列的标识 key

  /** 拖拽手柄 DOM 引用 */
  const handleRef = useRef(null);
  /** 拖拽起始时的鼠标 X 坐标 */
  const startXRef = useRef(0);
  /** 拖拽起始时的列宽度 */
  const startWidthRef = useRef(0);
  /** 标记当前是否处于拖拽状态，防止拖拽过程中 hover 事件干扰蓝线 */
  const resizingRef = useRef(false);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    function onMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = true;

      // 记录拖拽起始状态
      startXRef.current = e.clientX;
      const thEl = handle.closest('th');
      startWidthRef.current = thEl ? thEl.offsetWidth : 0;

      // 通知父组件开始拖拽：显示蓝线指示器
      onResizeStart && onResizeStart(id, thEl);

      /**
       * 拖拽过程中：直接操作 DOM 更新 th 宽度，不触发 React 渲染
       * 这是性能优化的核心——避免每帧 re-render 导致的卡顿
       */
      function onMouseMove(e) {
        const delta = e.clientX - startXRef.current;
        const newWidth = Math.max(60, startWidthRef.current + delta);
        // 直接操作 DOM 设置列宽，绕过 React 状态更新
        if (thEl) {
          thEl.style.width = `${newWidth}px`;
          thEl.style.minWidth = `${newWidth}px`;
        }
        // 通知父组件更新蓝线位置（也是纯 DOM 操作）
        onResizeMove && onResizeMove(id, e.clientX);
      }

      /**
       * 拖拽结束：清理事件监听，提交最终列宽到 React 状态
       * 这里是唯一触发 React 渲染的地方（通过 onResizeEnd → setCurrentColumns）
       */
      function onMouseUp(e) {
        resizingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // 计算最终列宽，通知父组件提交状态
        const delta = e.clientX - startXRef.current;
        const finalWidth = Math.max(60, startWidthRef.current + delta);
        onResizeEnd && onResizeEnd(id, finalWidth);
      }

      // 在 document 上监听 mousemove/mouseup，确保鼠标移出表格区域也能正常拖拽
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    // 在拖拽手柄上监听 mousedown
    handle.addEventListener('mousedown', onMouseDown);
    return () => handle.removeEventListener('mousedown', onMouseDown);
  }, [id, onResizeStart, onResizeMove, onResizeEnd]);

  // 过滤掉 Ant Design 传入的 onHeaderCell，避免透传到 DOM
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
      {/*
        拖拽手柄：绝对定位在 th 右侧边缘
        hover 时显示蓝线，拖拽期间通过 resizingRef 阻止 hover 事件干扰
      */}
      <span
        ref={handleRef}
        className="resize-handle"
        onMouseEnter={() => !resizingRef.current && onHoverEnter && onHoverEnter(id)}
        onMouseLeave={() => !resizingRef.current && onHoverLeave && onHoverLeave()}
      />
    </th>
  );
}

// ==================== 可调列宽表格组件 ====================

/**
 * 可调列宽的 Ant Design Table 封装组件
 *
 * 功能：
 * - hover 列边线时显示贯穿全列高度的蓝色指示线
 * - 拖拽手柄可调整列宽，最小宽度 60px
 * - 列宽变更自动缓存到 localStorage，刷新后恢复
 *
 * 性能策略：
 * - 拖拽过程中：纯 DOM 操作（th 宽度 + 蓝线位置），零 React 渲染
 * - 拖拽结束时：仅触发一次 React 渲染提交最终列宽
 * - hover 显示蓝线：纯 DOM 操作，不触发 React 渲染
 */
function ResizableTable({ columns, dataSource, cacheKey, ...restProps }) {
  /** 当前列配置（含缓存恢复的列宽） */
  const [currentColumns, setCurrentColumns] = useState(() => {
    if (!cacheKey) return columns;
    const cached = loadCache(cacheKey);
    if (cached && cached.columnWidths) {
      return columns.map((col) => {
        const key = col.key || col.dataIndex;
        const w = cached.columnWidths[key];
        return w ? { ...col, width: w } : col;
      });
    }
    return columns;
  });

  /** 表格外层容器引用，用于计算蓝线的相对位置 */
  const tableRef = useRef(null);
  /** 蓝线指示器 DOM 引用，通过原生 style 操作避免 React 渲染 */
  const indicatorRef = useRef(null);
  /**
   * 共享的拖拽状态标记（跨所有 ResizableHeaderCell 实例共享）
   * 拖拽期间阻止任何 hover 回调干扰蓝线显示
   * 解决快速拖拽时鼠标划过其他列手柄导致蓝线消失的问题
   */
  const resizingRef = useRef(false);

  /** 将列宽变更持久化到 localStorage */
  const persistCache = useCallback((cols) => {
    if (!cacheKey) return;
    const widths = {};
    cols.forEach((col) => {
      if (col.width) widths[col.key || col.dataIndex] = col.width;
    });
    saveCache(cacheKey, { columnWidths: widths });
  }, [cacheKey]);

  // ==================== 拖拽回调（纯 DOM 操作，不触发 React 渲染） ====================

  /**
   * 拖拽开始：显示蓝线指示器并定位到列的右边缘
   * @param {string} colId - 被拖拽列的 key
   * @param {HTMLElement} thEl - 被拖拽列的 th DOM 元素
   */
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

  /**
   * 拖拽过程中：实时更新蓝线位置（跟随鼠标）
   * @param {string} colId - 被拖拽列的 key
   * @param {number} clientX - 当前鼠标 X 坐标
   */
  const handleResizeMove = useCallback((colId, clientX) => {
    if (!indicatorRef.current || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    // 纯 DOM 操作更新蓝线位置
    indicatorRef.current.style.left = `${clientX - tableRect.left}px`;
  }, []);

  /**
   * 拖拽结束：隐藏蓝线 + 提交最终列宽到 React 状态（唯一触发渲染的地方）
   * @param {string} colKey - 被拖拽列的 key
   * @param {number} newWidth - 最终列宽
   */
  const handleResizeEnd = useCallback((colKey, newWidth) => {
    resizingRef.current = false;
    // 隐藏蓝线（纯 DOM 操作）
    if (indicatorRef.current) {
      indicatorRef.current.style.display = 'none';
    }
    // 提交列宽到 React 状态，触发一次 re-render
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

  // ==================== Hover 回调（纯 DOM 操作，不触发 React 渲染） ====================

  /**
   * 鼠标 hover 到拖拽手柄时：显示蓝线指示器
   * 如果当前正在拖拽（resizingRef.current = true），则跳过，避免干扰
   * @param {string} colId - hover 到的列 key
   */
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

  /**
   * 鼠标离开拖拽手柄时：隐藏蓝线指示器
   * 如果当前正在拖拽（resizingRef.current = true），则跳过
   */
  const handleHoverLeave = useCallback(() => {
    if (resizingRef.current) return; // 拖拽中不响应 hover
    if (indicatorRef.current) {
      indicatorRef.current.style.display = 'none';
    }
  }, []);

  // ==================== 渲染 ====================

  /** 将列宽调整相关的回调通过 onHeaderCell 注入到每个表头单元格 */
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

  return (
    // 外层容器：position: relative 作为蓝线的定位基准
    <div ref={tableRef} style={{ position: 'relative' }}>
      <Table
        {...restProps}
        columns={mergedColumns}
        dataSource={dataSource}
        components={{
          header: {
            // 用自定义的 ResizableHeaderCell 替换默认表头单元格
            cell: ResizableHeaderCell,
          },
        }}
      />
      {/*
        蓝线指示器：常驻 DOM，通过 display 控制显隐
        始终渲染确保 indicatorRef 永远不为 null，支持纯 DOM 操作
      */}
      <div ref={indicatorRef} className="resize-indicator" style={{ display: 'none' }} />
    </div>
  );
}

export default ResizableTable;
