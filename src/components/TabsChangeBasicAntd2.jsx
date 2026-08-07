import React, { useState, useRef, useCallback } from 'react';
import { Tabs } from 'antd';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import './TabsChangeBasicAntd2.css';

// dnd-kit 的 id 统一转成字符串，避免 number/string key 不一致
const toStrKey = (key) => String(key);

// ==================== 单个可拖拽 Tab 节点 ====================

/**
 * 可拖拽的 antd Tab 节点
 *
 * 与 DraggableTable 相同的模式（useDraggable，而非 useSortable）：
 * - 原始节点在拖拽时保持原位不动（半透明），拖拽中的"浮层"由 DragOverlay 提供
 * - 因此原始节点不会产生 transform，也就不会有文字宽度被缩放的问题
 * - listeners 仅绑定到 ⠿ 手柄，点击 tab 文本仍正常切换
 *
 * @param {string} id   - 唯一标识（tab.key）
 * @param {object} node - antd TabNode 渲染出的 tab 元素
 */
function DraggableTabNode({ id, node }) {
  const {
    attributes,    // 无障碍属性，绑定到手柄
    listeners,     // 拖拽事件监听器，仅绑定到手柄
    setNodeRef,    // dnd-kit 需要的 DOM ref 回调
    isDragging,    // 当前是否正在被拖拽
  } = useDraggable({ id });

  // 克隆 antd 的 tab 节点，把拖拽手柄插入到最前面
  const wrappedNode = React.cloneElement(node, {
    children: [
      <span key="drag-handle" className="antd2-tab-handle" {...listeners} {...attributes}>
        ⠿
      </span>,
      ...React.Children.toArray(node.props.children),
    ],
  });

  return (
    <span
      ref={setNodeRef}
      data-tab-node-key={id}
      className={`antd2-tab-node ${isDragging ? 'antd2-tab-node-dragging' : ''}`}
    >
      {wrappedNode}
    </span>
  );
}

// ==================== 主组件 ====================

/**
 * 基于 antd Tabs 的可拖拽排序组件（DraggableTable 模式）
 *
 * 拖拽效果与 DraggableTable 一致：
 * - DragOverlay 浮层跟随光标移动
 * - 蓝色插入线（insert-indicator）实时指示松手后的插入位置
 * - 松手后按插入线位置重排 tabs
 *
 * @param {Array}    tabs             - 每项 { key, label, children }
 * @param {string}   defaultActiveKey - 默认选中的 tab key
 * @param {function} onChange          - 排序变化回调，返回排序后的 tabs
 * @param {string}   className         - 额外 CSS 类名
 */
function TabsChangeBasicAntd2({ tabs: initialTabs, defaultActiveKey, onChange, className }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeKey, setActiveKey] = useState(defaultActiveKey || initialTabs[0]?.key);
  const [activeId, setActiveId] = useState(null);
  const [insertIndex, setInsertIndex] = useState(-1);
  const navRef = useRef(null);

  /**
   * PointerSensor 配置：移动 5px 后才激活拖拽，与 DraggableTable 一致
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const keyList = tabs.map(t => toStrKey(t.key));
  // 当前被拖拽的 tab 数据，用于渲染浮层
  const activeTab = tabs.find(t => toStrKey(t.key) === activeId);

  /** 拖拽开始：记录被拖拽的 tab id */
  function handleDragStart(event) {
    setActiveId(event.active.id);
    setInsertIndex(-1);
  }

  /**
   * 拖拽移动：根据光标位置计算插入下标，逻辑与 DraggableTable 的 handleDragMove 一致
   * - 光标 X = 按下时的 clientX + 累计位移 delta.x
   * - 依次比较光标 X 与每个 tab 中心，得到应插入的位置
   */
  const handleDragMove = useCallback((event) => {
    const { active, delta, activatorEvent } = event;
    if (!active || !navRef.current) {
      setInsertIndex(-1);
      return;
    }

    const activeEl = navRef.current.querySelector(`[data-tab-node-key="${active.id}"]`);
    if (!activeEl) return;

    const rect = activeEl.getBoundingClientRect();
    const startX = activatorEvent?.clientX ?? rect.left + rect.width / 2;
    const cursorX = startX + delta.x;

    const nodes = navRef.current.querySelectorAll('[data-tab-node-key]');
    const centers = Array.from(nodes).map((n) => {
      const r = n.getBoundingClientRect();
      return r.left + r.width / 2;
    });

    const activeIdx = keyList.indexOf(active.id);
    let newInsertIdx = keyList.length;
    for (let i = 0; i < centers.length; i++) {
      if (i === activeIdx) continue;
      if (cursorX < centers[i]) {
        newInsertIdx = i;
        break;
      }
    }
    // 未越过任何相邻 tab（回到原位置附近），不显示插入线
    if (newInsertIdx === activeIdx || newInsertIdx === activeIdx + 1) {
      setInsertIndex(-1);
    } else {
      setInsertIndex(newInsertIdx);
    }
  }, [keyList]);

  /**
   * 拖拽结束：按插入线位置重排，逻辑与 DraggableTable 的 handleDragEnd 一致
   */
  function handleDragEnd(event) {
    const { active } = event;
    setActiveId(null);
    setInsertIndex(-1);

    if (insertIndex === -1) return;

    const sourceIndex = keyList.indexOf(active.id);
    if (sourceIndex === -1) return;

    const newTabs = [...tabs];
    const [moved] = newTabs.splice(sourceIndex, 1);
    const targetIndex = sourceIndex < insertIndex ? insertIndex - 1 : insertIndex;
    newTabs.splice(targetIndex, 0, moved);

    setTabs(newTabs);
    onChange?.(newTabs);
  }

  /**
   * 蓝色插入线位置：相对 navRef 包裹层定位
   * - 插入到某个 tab 前：线位于该 tab 左边缘
   * - 插入到末尾：线位于最后一个 tab 右边缘
   */
  function getIndicatorStyle() {
    if (insertIndex === -1 || !navRef.current) return null;
    const nodes = navRef.current.querySelectorAll('[data-tab-node-key]');

    const wrapperRect = navRef.current.getBoundingClientRect();
    // 蓝线终点 = .ant-tabs-nav 底部（灰线位置），再让出 1px，避免盖住灰线
    const navEl = navRef.current.querySelector('.ant-tabs-nav');
    const navBottom = navEl ? navEl.getBoundingClientRect().bottom : wrapperRect.bottom;
    const height = navBottom - 1 - wrapperRect.top;

    if (insertIndex >= nodes.length) {
      const last = nodes[nodes.length - 1];
      if (!last) return null;
      const r = last.getBoundingClientRect();
      return { left: r.right - wrapperRect.left, height };
    }

    const node = nodes[insertIndex];
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { left: r.left - wrapperRect.left, height };
  }

  const indicatorStyle = getIndicatorStyle();

  return (
    <Tabs
      className={`tabs-change-basic-antd2 ${className || ''}`}
      activeKey={activeKey}
      onChange={setActiveKey}
      items={tabs.map(t => ({ key: toStrKey(t.key), label: t.label, children: t.children }))}
      renderTabBar={(tabBarProps, DefaultTabBar) => (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <div ref={navRef} className="antd2-tabs-nav">
            <DefaultTabBar {...tabBarProps}>
              {(node) => (
                <DraggableTabNode key={node.key} id={toStrKey(node.key)} node={node} />
              )}
            </DefaultTabBar>
            {/* 蓝色插入线 */}
            {activeId && indicatorStyle && (
              <div
                className="antd2-insert-indicator"
                style={{ left: indicatorStyle.left, height: indicatorStyle.height }}
              />
            )}
          </div>

          {/* 拖拽浮层：跟随光标，宽度由内容决定，不会被缩放 */}
          <DragOverlay dropAnimation={null}>
            {activeTab ? (
              <div className="ant-tabs-tab ant-tabs-tab-active antd2-overlay-tab">
                <span className="antd2-tab-handle antd2-tab-handle-overlay">⠿</span>
                <div className="ant-tabs-tab-btn">{activeTab.label}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    />
  );
}

export default TabsChangeBasicAntd2;
