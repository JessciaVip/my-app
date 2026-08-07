import React, { useState } from 'react';
import { Tooltip } from 'antd';
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
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import './SortableList.css';

// ==================== 单个可排序项 ====================

/**
 * 可排序的列表项组件
 * 拖拽样式与 SortableCheckbox 保持一致（手柄 + 拖拽高亮 + 固定项置灰）
 *
 * @param {string} id - 唯一标识
 * @param {boolean} fixed - 是否为固定项（不可排序、始终置顶）
 * @param {ReactNode} children - 该项的任意 DOM 内容，由外部通过 renderItem 传入
 */
function SortableItem({ id, fixed, children }) {
  const {
    attributes,   // 无障碍属性（role、tabIndex 等），绑定到外层 div
    listeners,    // 拖拽事件监听器，仅绑定到 ⠿ 手柄（避免和内容交互冲突）
    setNodeRef,   // dnd-kit 需要的 DOM ref 回调
    transform,    // 拖拽时的位移变换
    transition,   // 拖拽结束后的过渡动画
    isDragging,   // 当前是否正在被拖拽
  } = useSortable({ id, disabled: fixed });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // 被拖拽时半透明显示，原位拖拽不脱离列表容器
    opacity: isDragging ? 0.5 : 1,
    // 被拖拽时提升层级，避免被下方 hover 的灰色背景行盖住
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'dragging' : ''} ${fixed ? 'fixed' : ''}`}
      // attributes（无障碍属性）绑定到整行
      {...(fixed ? {} : attributes)}
    >
      <Tooltip title={fixed ? '不可排序' : '按住拖拽可排序'}>
        {/*
          拖拽手柄：listeners（拖拽事件）仅绑定到此元素
          这样只有拖手柄才能触发排序，不影响 item 内的交互
        */}
        <span
          className={`drag-handle ${fixed ? 'fixed' : ''}`}
          {...(fixed ? {} : listeners)}
        >
          ⠿
        </span>
      </Tooltip>
      {/* 内容区：占据剩余空间，内容由外部 renderItem 渲染 */}
      <div className="sortable-item-content">{children}</div>
    </div>
  );
}

// ==================== 通用垂直拖拽排序列表 ====================

/**
 * 通用的垂直方向拖拽排序列表组件
 *
 * 功能：
 * - 通过 renderItem(item, index) 渲染每一项的任意 DOM 内容
 * - 拖拽排序，固定项始终置顶且不可排序
 * - 限制只能垂直方向拖拽
 * - 排序变化时通过 onChange 回调返回新的顺序
 *
 * @param {Array} items - 列表项 [{ id, fixed }]，id 必填，fixed 可选
 * @param {function} renderItem - 渲染函数 (item, index) => ReactNode
 * @param {function} onChange - 排序变化的回调 (newItems) => void
 * @param {function} onDragEnd - 可选，自定义拖拽结束处理；传入后覆盖默认排序逻辑
 * @param {string} className - 可选，追加到列表容器的 class
 */
function SortableList({ items, renderItem, onChange, onDragEnd, className }) {

  // 是否正在拖拽中：拖拽时禁用各行的 hover 背景，避免灰色背景盖住被拖拽项
  const [isSorting, setIsSorting] = useState(false);

  // PointerSensor 配置：移动 3px 后才激活拖拽，避免轻微点击误触拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  function handleDragStart() {
    setIsSorting(true);
  }

  function handleDragCancel() {
    setIsSorting(false);
  }

  /**
   * 拖拽结束回调
   * 允许外部传入 onDragEnd 完全接管；否则走默认排序逻辑
   * 默认禁止将非固定项拖到固定项上方，固定项始终保持在最前
   */
  function handleDragEnd(event) {
    setIsSorting(false);
    if (onDragEnd) {
      onDragEnd(event);
      return;
    }
    const { active, over } = event;
    if (active.id !== over?.id) {
      const overItem = items.find(item => item.id === over?.id);
      if (overItem?.fixed) return; // 不能拖到固定项上
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const movedItems = arrayMove(items, oldIndex, newIndex);
      // 固定项始终排在最前，非固定项按新顺序排列
      const fixedItems = items.filter(item => item.fixed);
      const nonFixedItems = movedItems.filter(item => !item.fixed);
      onChange?.([...fixedItems, ...nonFixedItems]);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
      // 只允许垂直方向拖拽，且被拖项不超出滚动容器边界
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={`sortable-list ${className || ''} ${isSorting ? 'sorting' : ''}`}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id} fixed={item.fixed}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableList;
