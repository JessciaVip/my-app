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

/**
 * 可排序的单个 Tab 项
 *
 * 通过 useSortable hook 集成 @dnd-kit 的拖拽能力，
 * 每个 tab header 是一个独立的可排序元素。
 *
 * @param {string} id - 唯一标识，对应 tab.key
 * @param {string} label - tab 显示文本
 * @param {boolean} isActive - 是否为当前选中项
 * @param {function} onClick - 点击切换回调
 */
function SortableTabItem({ id, label, isActive, onClick }) {
  const {
    attributes,    // 无障碍属性
    listeners,     // 拖拽事件监听器
    setNodeRef,    // DOM ref 回调
    transform,     // 拖拽位移变换
    transition,    // 拖拽结束过渡动画
    isDragging,    // 是否正在被拖拽
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
      className={`tab-item ${isActive ? 'tab-item-active' : ''} ${isDragging ? 'tab-item-dragging' : ''}`}
      onClick={() => onClick(id)}
    >
      <span className="tab-item-drag-handle" {...listeners} {...attributes}>
        ⠿
      </span>
      <span className="tab-item-label">{label}</span>
    </div>
  );
}

/**
 * 可拖拽排序的 Tabs 组件
 *
 * 使用 @dnd-kit 实现 tab 拖拽排序，视觉风格与 Ant Design card tabs 一致。
 * 通过 props 接收数据，排序变化后通过 onChange 回调通知父组件。
 *
 * @param {Array}    tabs            - tab 数据数组，每项 { key, label, children }
 * @param {string}   defaultActiveKey - 默认选中的 tab key
 * @param {function} onChange         - 排序或切换时的回调，参数为新的 tabs 数组
 * @param {string}   className        - 额外的 CSS 类名
 */
function TabsChangeIndex({ tabs: initialTabs, defaultActiveKey, onChange, className }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeKey, setActiveKey] = useState(defaultActiveKey || initialTabs[0]?.key);
  const [activeId, setActiveId] = useState(null);

  /**
   * PointerSensor 配置：鼠标移动 5px 后才激活拖拽，
   * 避免点击 tab 切换时误触拖拽。
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /** 拖拽开始时记录当前被拖拽的 tab id */
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  /**
   * 拖拽结束时计算新的排序并更新状态，
   * 通过 onChange 回调通知父组件。
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
      {/* Tab 栏：包含可排序的 tab header 列表 */}
      <div className="tabs-change-index-nav">
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

          {/* 拖拽时的浮动预览层，跟随鼠标移动 */}
          <DragOverlay dropAnimation={null}>
            {draggingTab ? (
              <div className="tab-item tab-item-active tab-item-overlay">
                <span className="tab-item-drag-handle-overlay">⠿</span>
                <span className="tab-item-label">{draggingTab.label}</span>
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
