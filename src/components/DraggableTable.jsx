import React, { useState, useRef, useCallback } from 'react';
import { Table } from 'antd';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import './DraggableTable.css';

function DraggableHeaderCell({ cellProps, ...restProps }) {
  const { id } = cellProps;
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id });

  const { onHeaderCell, ...restPropsWithoutOnHeaderCell } = restProps;

  return (
    <th
      {...restPropsWithoutOnHeaderCell}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      data-column-id={id}
      style={{
        ...restPropsWithoutOnHeaderCell.style,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
      }}
      className="draggable-th"
    >
      {restPropsWithoutOnHeaderCell.children}
      <span className="drag-hint">⠿</span>
    </th>
  );
}

function DragOverlayContent({ column, thStyle, cellStyles }) {
  if (!column) return null;
  return (
    <table className="drag-overlay-table">
      <thead>
        <tr>
          <th
            className="drag-overlay-th"
            style={thStyle ? {
              width: thStyle.width,
              padding: thStyle.padding,
              fontSize: thStyle.fontSize,
              fontWeight: thStyle.fontWeight,
              background: thStyle.background,
              borderBottom: thStyle.borderBottom,
              border: '1px solid #f0f0f0',
              opacity: 0.8,
            } : undefined}
          >
            {column.title}
          </th>
        </tr>
      </thead>
      <tbody>
        {cellStyles.map((cell, i) => (
          <tr key={i}>
            <td
              className="drag-overlay-td"
              style={{
                padding: cell.padding,
                fontSize: cell.fontSize,
                fontWeight: cell.fontWeight,
                background: cell.background,
                borderBottom: cell.borderBottom,
                border: '1px solid #f0f0f0',
                opacity: 0.8,
                whiteSpace: 'nowrap',
              }}
            >
              {cell.text}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DraggableTable({ columns, dataSource, onColumnsChange, ...restProps }) {
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [activeId, setActiveId] = useState(null);
  const [activeThStyle, setActiveThStyle] = useState(null);
  const [activeCellStyles, setActiveCellStyles] = useState([]);
  const [insertIndex, setInsertIndex] = useState(-1);
  const tableRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const columnKeys = orderedColumns.map((col) => col.key || col.dataIndex);
  const activeColumn = orderedColumns.find((col) => (col.key || col.dataIndex) === activeId);

  function collectColumnCells(colIndex) {
    if (!tableRef.current) return [];
    const rows = tableRef.current.querySelectorAll('tbody tr');
    const cells = [];
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      const td = tds[colIndex];
      if (td) {
        const cs = window.getComputedStyle(td);
        cells.push({
          text: td.textContent,
          padding: cs.padding,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          background: cs.backgroundColor,
          borderBottom: cs.borderBottom,
        });
      }
    });
    return cells;
  }

  function handleDragStart(event) {
    const { active } = event;
    setActiveId(active.id);
    const idx = columnKeys.indexOf(active.id);
    if (idx === -1) return;

    const thEl = document.querySelector(`th[data-column-id="${active.id}"]`);
    if (thEl) {
      const cs = window.getComputedStyle(thEl);
      setActiveThStyle({
        width: thEl.offsetWidth + 'px',
        padding: cs.padding,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        background: cs.backgroundColor,
        borderBottom: cs.borderBottom,
      });
    }
    setActiveCellStyles(collectColumnCells(idx));
  }

  const handleDragMove = useCallback((event) => {
    const { active, delta } = event;
    if (!active || !tableRef.current) {
      setInsertIndex(-1);
      return;
    }
    const thEl = document.querySelector(`th[data-column-id="${active.id}"]`);
    if (!thEl) return;
    const rect = thEl.getBoundingClientRect();
    const cursorX = rect.left + rect.width / 2 + delta.x;

    const ths = tableRef.current.querySelectorAll('th[data-column-id]');
    const centers = Array.from(ths).map((th) => {
      const r = th.getBoundingClientRect();
      return r.left + r.width / 2;
    });

    const activeIdx = columnKeys.indexOf(active.id);
    let newInsertIdx = columnKeys.length;
    for (let i = 0; i < centers.length; i++) {
      if (i === activeIdx) continue;
      if (cursorX < centers[i]) {
        newInsertIdx = i;
        break;
      }
    }
    if (newInsertIdx === activeIdx || newInsertIdx === activeIdx + 1) {
      setInsertIndex(-1);
    } else {
      setInsertIndex(newInsertIdx);
    }
  }, [columnKeys]);

  function handleDragEnd(event) {
    const { active } = event;
    setActiveId(null);
    setActiveThStyle(null);
    setActiveCellStyles([]);
    setInsertIndex(-1);

    if (insertIndex === -1) return;

    const sourceIndex = columnKeys.indexOf(active.id);
    if (sourceIndex === -1) return;

    const newColumns = [...orderedColumns];
    const [moved] = newColumns.splice(sourceIndex, 1);
    const targetIndex = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex;
    newColumns.splice(targetIndex, 0, moved);

    setOrderedColumns(newColumns);
    onColumnsChange && onColumnsChange(newColumns);
  }

  function getIndicatorStyle() {
    if (insertIndex === -1 || !tableRef.current) return null;
    const ths = tableRef.current.querySelectorAll('th[data-column-id]');
    if (insertIndex >= ths.length) {
      const lastTh = ths[ths.length - 1];
      const rect = lastTh.getBoundingClientRect();
      const tableRect = tableRef.current.getBoundingClientRect();
      return { left: rect.right - tableRect.left, height: tableRef.current.offsetHeight };
    }
    const th = ths[insertIndex];
    if (!th) return null;
    const rect = th.getBoundingClientRect();
    const tableRect = tableRef.current.getBoundingClientRect();
    return { left: rect.left - tableRect.left, height: tableRef.current.offsetHeight };
  }

  const mergedColumns = orderedColumns.map((col) => ({
    ...col,
    onHeaderCell: (column) => ({
      cellProps: { id: column.key || column.dataIndex },
    }),
  }));

  const indicatorStyle = getIndicatorStyle();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div ref={tableRef} style={{ position: 'relative' }}>
        <Table
          {...restProps}
          columns={mergedColumns}
          dataSource={dataSource}
          components={{
            header: {
              cell: DraggableHeaderCell,
            },
          }}
        />
        {activeId && indicatorStyle && (
          <div className="insert-indicator" style={{ left: indicatorStyle.left, height: indicatorStyle.height }} />
        )}
      </div>
      <DragOverlay>
        <DragOverlayContent column={activeColumn} thStyle={activeThStyle} cellStyles={activeCellStyles} />
      </DragOverlay>
    </DndContext>
  );
}

export default DraggableTable;
