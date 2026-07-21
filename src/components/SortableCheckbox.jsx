import React, { useState, useEffect } from 'react';
import { Button, Popover, Checkbox, Tooltip } from 'antd';
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
import './SortableCheckbox.css';

// ==================== 单个可排序项 ====================

/**
 * 可排序的列表项组件
 * 集成 @dnd-kit 的拖拽能力，支持排序和 checkbox 选中
 *
 * @param {string} id - 唯一标识
 * @param {string} label - 显示文本
 * @param {boolean} fixed - 是否为固定项（不可排序、始终置顶）
 * @param {function} onToggle - 行点击切换 checkbox 的回调
 */
function SortableItem({ id, label, fixed, onToggle }) {
  const {
    attributes,   // 无障碍属性（role、tabIndex 等），绑定到外层 div
    listeners,    // 拖拽事件监听器，仅绑定到 ⠿ 手柄（避免和 checkbox 点击冲突）
    setNodeRef,   // dnd-kit 需要的 DOM ref 回调
    transform,    // 拖拽时的位移变换
    transition,   // 拖拽结束后的过渡动画
    isDragging,   // 当前是否正在被拖拽
  } = useSortable({ id, disabled: fixed });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  /**
   * 行点击切换 checkbox 状态
   * 排除手柄和 checkbox 自身的点击，避免重复触发
   */
  function handleClick(e) {
    if (fixed) return;
    // 点击手柄只拖拽，点击 checkbox 走原生逻辑，点行空白区域走 toggle
    if (e.target.closest('.drag-handle') || e.target.closest('.ant-checkbox')) return;
    onToggle?.(id);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'dragging' : ''} ${fixed ? 'fixed' : ''}`}
      onClick={handleClick}
      // attributes（无障碍属性）绑定到整行
      {...(fixed ? {} : attributes)}
    >
      <Tooltip title={fixed ? '不可排序' : '按住拖拽可排序'}>
        {/*
          拖拽手柄：listeners（拖拽事件）仅绑定到此元素
          这样只有拖手柄才能触发排序，不影响 checkbox 点击
        */}
        <span
          className={`drag-handle ${fixed ? 'fixed' : ''}`}
          {...(fixed ? {} : listeners)}
        >
          ⠿
        </span>
      </Tooltip>
      {/*
        Checkbox 使用 value 由 Checkbox.Group 统一管理状态
        stopPropagation 防止点击 checkbox 冒泡到行的 handleClick
      */}
      <Checkbox value={id} onClick={(e) => e.stopPropagation()}>
        {label}
      </Checkbox>
    </div>
  );
}

// ==================== 可排序复选框列表组件 ====================

/**
 * 可排序的复选框列表组件
 *
 * 功能：
 * - 通过 Popover 弹出可排序的 checkbox 列表
 * - 拖拽排序，固定项始终置顶且不可排序
 * - 排序和选中状态自动缓存到 localStorage，刷新后恢复
 * - 支持受控模式（外部通过 value/onChange 控制）
 * - 点击行空白区域即可切换 checkbox 状态
 *
 * @param {Array} items - 列表项 [{ id, label, checked, fixed }]
 * @param {function} onChange - 排序或选中变化的回调 (allOrderedItems, checkedValues)
 * @param {Array} value - 受控模式下的选中值列表
 * @param {object} buttonProps - 透传给触发按钮的属性
 * @param {boolean|string} saveLocal - 是否缓存到 localStorage，传字符串可自定义 cache key
 */
function SortableCheckbox({ items: initialItems, onChange, value: controlledValue, buttonProps, saveLocal = true }) {

  // ==================== 缓存逻辑 ====================

  /** 生成缓存 key：saveLocal 为字符串时直接作为 key，为 true 时按 items id 拼接 */
  const cacheKey = typeof saveLocal === 'string' ? saveLocal
    : saveLocal ? `sortable-checkbox-${initialItems.map(i => i.id).join('-')}` : null;

  /** 从 localStorage 读取缓存的排序和选中状态 */
  function loadCache() {
    if (!cacheKey) return null;
    try {
      const data = localStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  const cached = loadCache();

  // ==================== 状态管理 ====================

  /**
   * items: 当前所有项的排序
   * 有缓存时优先从缓存恢复排序，新增项追加到末尾
   */
  const [items, setItems] = useState(() => {
    if (!cached) return initialItems;
    const itemMap = Object.fromEntries(initialItems.map(i => [i.id, i]));
    const ordered = cached.orderedIds.map(id => itemMap[id]).filter(Boolean);
    const newItems = initialItems.filter(i => !cached.orderedIds.includes(i.id));
    return [...ordered, ...newItems];
  });

  const [open, setOpen] = useState(false);

  /**
   * selectedValues: 当前选中的值列表
   * 优先从缓存恢复，过滤掉已不存在的项
   */
  const [selectedValues, setSelectedValues] = useState(() => {
    if (cached) {
      const validIds = new Set(initialItems.map(i => i.id));
      return cached.selectedValues.filter(id => validIds.has(id));
    }
    if (controlledValue !== undefined) return controlledValue;
    return initialItems.filter((item) => item.checked).map((item) => item.id);
  });

  // 受控模式下同步外部 value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setSelectedValues(controlledValue);
    }
  }, [controlledValue]);

  // 缓存变更到 localStorage（items 或 selectedValues 变化时触发）
  useEffect(() => {
    if (!cacheKey) return;
    localStorage.setItem(cacheKey, JSON.stringify({
      orderedIds: items.map(i => i.id),
      selectedValues,
    }));
  }, [items, selectedValues, cacheKey]);

  // ==================== 拖拽配置 ====================

  /**
   * PointerSensor 配置：移动 3px 后才激活拖拽
   * 避免轻微点击误触拖拽
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  // ==================== 事件处理 ====================

  /**
   * 拖拽结束回调
   * 禁止将非固定项拖到固定项上方，固定项始终保持在最前
   */
  function handleDragEnd(event) {
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
      const newItems = [...fixedItems, ...nonFixedItems];
      setItems(newItems);
      emitChange(newItems, selectedValues);
    }
  }

  /** Checkbox.Group 选中变化回调 */
  function handleGroupChange(checkedValues) {
    setSelectedValues(checkedValues);
    emitChange(items, checkedValues);
  }

  /**
   * 触发外部 onChange 回调
   * 返回排序后的完整列表，每项包含 id、label、checked、fixed
   */
  function emitChange(currentItems, currentValues) {
    if (!onChange) return;
    const allOrderedItems = currentItems.map((item) => ({
      id: item.id,
      label: item.label,
      checked: currentValues.includes(item.id),
      fixed: item.fixed,
    }));
    onChange(allOrderedItems, currentValues);
  }

  /**
   * 行点击切换 checkbox 状态
   * 点击行空白区域时调用，切换对应项的选中/未选中
   */
  function handleToggle(id) {
    setSelectedValues(prev => {
      const next = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
      emitChange(items, next);
      return next;
    });
  }

  // ==================== 渲染 ====================

  /** Popover 弹出的可排序 checkbox 列表内容 */
  const content = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]} // 限制只能垂直方向拖拽，防止水平拖拽撑开容器
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="sortable-checkbox-list">
          <Checkbox.Group value={selectedValues} onChange={handleGroupChange}>
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                label={item.label}
                fixed={item.fixed}
                onToggle={handleToggle}
              />
            ))}
          </Checkbox.Group>
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <Popover
      content={content}
      title="选项配置"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Button icon={<SettingOutlined />} {...buttonProps}>
        列配置
      </Button>
    </Popover>
  );
}

export default SortableCheckbox;
