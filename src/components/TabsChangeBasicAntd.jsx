import React, { useState } from 'react';
import { Tabs } from 'antd';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import './TabsChangeBasicAntd.css';

// dnd-kit 的 id 统一转成字符串，避免 number/string key 不一致
const toStrKey = (key) => String(key);

// ==================== 单个可排序 Tab 节点 ====================

/**
 * 可排序的 antd Tab 节点
 *
 * 当前 antd 4.24（rc-tabs 12.5）没有 itemRender，
 * 因此通过 renderTabBar 给 DefaultTabBar 传入 children 渲染函数，
 * 由 TabNavList 内部作为 renderWrapper 应用到每个 TabNode 上。
 *
 * 这里把 antd 渲染好的 tab 节点克隆，在开头插入 ⠿ 拖拽手柄：
 * - 手柄位于 .ant-tabs-tab 内部，不影响 antd ink-bar 下划线对齐
 * - listeners 仅绑定到手柄，点击 tab 文本仍正常切换
 *
 * @param {string} id   - 唯一标识（tab.key）
 * @param {object} node - antd TabNode 渲染出的 tab 元素
 */
function SortableTabNode({ id, node }) {
  const {
    attributes,    // 无障碍属性，绑定到手柄
    listeners,     // 拖拽事件监听器，仅绑定到手柄
    setNodeRef,    // dnd-kit 需要的 DOM ref 回调
    transform,     // 拖拽时的位移变换
    transition,    // 拖拽结束后的过渡动画
    isDragging,    // 当前是否正在被拖拽
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
  };

  // 克隆 antd 的 tab 节点，把拖拽手柄插入到最前面
  const wrappedNode = React.cloneElement(node, {
    children: [
      <span key="drag-handle" className="antd-sortable-tab-handle" {...listeners} {...attributes}>
        ⠿
      </span>,
      ...React.Children.toArray(node.props.children),
    ],
  });

  return (
    <span
      ref={setNodeRef}
      style={style}
      className={`antd-sortable-tab-node ${isDragging ? 'antd-sortable-tab-node-dragging' : ''}`}
    >
      {wrappedNode}
    </span>
  );
}

// ==================== 主组件 ====================

/**
 * 基于 antd Tabs 的可拖拽排序组件
 *
 * 与 TabsChangeIndex 相同的拖拽模式（@dnd-kit）：
 * - renderTabBar 把 DndContext + SortableContext 包裹在 antd Tab 栏外层
 * - children 渲染函数（TabNavList 的 renderWrapper）给每个 tab 注入拖拽手柄
 * - antd 自身负责 tab 选中、内容渲染、ink-bar 下划线
 *
 * @param {Array}    tabs             - 每项 { key, label, children }
 * @param {string}   defaultActiveKey - 默认选中的 tab key
 * @param {function} onChange          - 排序变化回调，返回排序后的 tabs
 * @param {string}   className         - 额外 CSS 类名
 */
function TabsChangeBasicAntd({ tabs: initialTabs, defaultActiveKey, onChange, className }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeKey, setActiveKey] = useState(defaultActiveKey || initialTabs[0]?.key);

  /**
   * PointerSensor 配置：移动 3px 后才激活拖拽
   * 与 TabsChangeIndex 一致，避免轻微点击误触
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  /**
   * 拖拽结束：重排数组，逻辑与 TabsChangeIndex 一致
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || toStrKey(active.id) === toStrKey(over.id)) return;

    const oldIndex = tabs.findIndex(t => toStrKey(t.key) === toStrKey(active.id));
    const newIndex = tabs.findIndex(t => toStrKey(t.key) === toStrKey(over.id));
    const newTabs = arrayMove(tabs, oldIndex, newIndex);
    setTabs(newTabs);
    onChange?.(newTabs);
  };

  return (
    <Tabs
      className={`tabs-change-basic-antd ${className || ''}`}
      activeKey={activeKey}
      onChange={setActiveKey}
      items={tabs.map(t => ({ key: toStrKey(t.key), label: t.label, children: t.children }))}
      renderTabBar={(tabBarProps, DefaultTabBar) => (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <SortableContext items={tabs.map(t => toStrKey(t.key))} strategy={horizontalListSortingStrategy}>
            <DefaultTabBar {...tabBarProps}>
              {(node) => (
                <SortableTabNode key={node.key} id={toStrKey(node.key)} node={node} />
              )}
            </DefaultTabBar>
          </SortableContext>
        </DndContext>
      )}
    />
  );
}

export default TabsChangeBasicAntd;
