import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import './TabsChangeIndex.css';

// ==================== 单个可排序 Tab ====================

/**
 * 可排序的 Tab 项
 *
 * 与 SortableCheckbox 中的 SortableItem 同样的模式：
 * - useSortable 获取 transform / transition / isDragging
 * - CSS.Transform.toString(transform) 实现丝滑位移动画
 * - listeners 仅绑定到 ⠿ 手柄，不影响 tab 点击
 *
 * @param {string}  id       - 唯一标识（tab.key）
 * @param {string}  label    - 显示文本
 * @param {boolean} isActive - 是否为当前选中项
 * @param {function} onClick  - 点击切换回调
 */
function SortableTabItem({ id, label, isActive, onClick }) {
  const {
    attributes,    // 无障碍属性（role、tabIndex 等）
    listeners,     // 拖拽事件监听器，绑定到 ⠿ 手柄
    setNodeRef,    // dnd-kit 需要的 DOM ref 回调
    transform,     // 拖拽时的位移变换
    transition,    // 拖拽结束后的过渡动画
    isDragging,    // 当前是否正在被拖拽
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-tab ${isActive ? 'sortable-tab-active' : ''} ${isDragging ? 'sortable-tab-dragging' : ''}`}
      onClick={() => onClick(id)}
    >
      {/* 拖拽手柄：listeners 仅绑定到这里，点击 tab 文本不会触发拖拽 */}
      <span className="sortable-tab-handle" {...listeners} {...attributes}>
        ⠿
      </span>
      <span className="sortable-tab-label">{label}</span>
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * 可拖拽排序的 Tabs 组件
 *
 * 与 SortableCheckbox 相同的拖拽模式：
 * - SortableContext + useSortable + horizontalListSortingStrategy
 * - CSS.Transform.toString(transform) 实现丝滑位移
 * - DragOverlay 浮动预览
 *
 * @param {Array}    tabs             - 每项 { key, label, children }
 * @param {string}   defaultActiveKey - 默认选中的 tab key
 * @param {function} onChange          - 排序变化回调
 * @param {string}   className         - 额外 CSS 类名
 */
function TabsChangeIndex({ tabs: initialTabs, defaultActiveKey, onChange, className }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeKey, setActiveKey] = useState(defaultActiveKey || initialTabs[0]?.key);
  const [activeId, setActiveId] = useState(null);

  /**
   * PointerSensor 配置：移动 3px 后才激活拖拽
   * 与 SortableCheckbox 一致，避免轻微点击误触
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  /** 拖拽开始：记录被拖拽的 tab id */
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  /**
   * 拖拽结束：重排数组，与 SortableCheckbox 的 handleDragEnd 逻辑一致
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = tabs.findIndex(t => t.key === active.id);
      const newIndex = tabs.findIndex(t => t.key === over.id);
      const newTabs = arrayMove(tabs, oldIndex, newIndex);
      setTabs(newTabs);
      onChange?.(newTabs);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  /** 切换选中的 tab */
  const handleTabClick = (key) => {
    setActiveKey(key);
  };

  // 当前激活 tab 的数据
  const activeTab = tabs.find(t => t.key === activeKey);
  // 拖拽预览中显示的 tab 数据
  const draggingTab = activeId ? tabs.find(t => t.key === activeId) : null;

  return (
    <div className={`tabs-change-index ${className || ''}`}>
      {/* Tab 栏 */}
      <div className="tabs-change-index-bar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[restrictToHorizontalAxis]}
        >
          <SortableContext items={tabs.map(t => t.key)} strategy={horizontalListSortingStrategy}>
            <div className="tabs-change-index-list">
              {tabs.map(tab => (
                <SortableTabItem
                  key={tab.key}
                  id={tab.key}
                  label={tab.label}
                  isActive={tab.key === activeKey}
                  onClick={handleTabClick}
                />
              ))}
            </div>
          </SortableContext>

          {/* 拖拽浮动预览层 */}
          <DragOverlay dropAnimation={null}>
            {draggingTab ? (
              <div className="sortable-tab sortable-tab-active sortable-tab-overlay">
                <span className="sortable-tab-handle-overlay">⠿</span>
                <span className="sortable-tab-label">{draggingTab.label}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Tab 内容区域 */}
      <div className="tabs-change-index-content">
        {activeTab?.children}
      </div>
    </div>
  );
}

export default TabsChangeIndex;
