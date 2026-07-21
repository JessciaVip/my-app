import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dropdown, Menu, Modal, Input } from 'antd';
import {
  LeftCircleFilled,
  RightCircleFilled,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
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
import './TabsFilter.css';

let nextKey = 3;

const initialTabs = [
  { key: '1', title: '筛选条件一' },
  { key: '2', title: '筛选条件二' },
];

function EditableInput({ value, onChange, onSubmit, onCancel }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.focus === 'function') el.focus();
    if (typeof el.select === 'function') el.select();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <Input
      ref={inputRef}
      size="small"
      value={value}
      onChange={e => onChange(e.target.value.slice(0, 20))}
      onPressEnter={handleSubmit}
      onBlur={handleSubmit}
      onClick={e => e.stopPropagation()}
      maxLength={20}
      style={{ width: 120 }}
    />
  );
}

function SortableTab({ tab, isActive, editingKey, editingValue, setEditingValue, startEditing, confirmRename, cancelRename, showDeleteConfirm, tabsCount, onActiveChange, listeners, attributes, setNodeRef, style, isDragging }) {
  const isEditing = editingKey === tab.key;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`custom-tab ${isActive ? 'custom-tab-active' : ''} ${isDragging ? 'custom-tab-dragging' : ''}`}
      onClick={() => onActiveChange(tab.key)}
    >
      <span className="custom-tab-drag-handle" {...listeners} {...attributes}>
        ⠿
      </span>
      {isEditing ? (
        <EditableInput
          value={editingValue}
          onChange={setEditingValue}
          onSubmit={confirmRename}
          onCancel={cancelRename}
        />
      ) : (
        <>
          <span className="custom-tab-label">{tab.title}</span>
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item
                  key="rename"
                  onClick={(e) => {
                    e.domEvent.stopPropagation();
                    startEditing(tab.key, tab.title);
                  }}
                >
                  重命名
                </Menu.Item>
                <Menu.Item
                  key="delete"
                  onClick={(e) => {
                    e.domEvent.stopPropagation();
                    showDeleteConfirm(tab.key);
                  }}
                  disabled={tabsCount <= 1}
                >
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <MoreOutlined
              className="custom-tab-more"
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        </>
      )}
    </div>
  );
}

function TabsFilter({ onBack }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [activeKey, setActiveKey] = useState('1');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetKey, setDeleteTargetKey] = useState(null);
  const [showArrows, setShowArrows] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageOffsets, setPageOffsets] = useState([0]);
  const [activeId, setActiveId] = useState(null);
  const pageRef = useRef(0);
  const pageOffsetsRef = useRef(pageOffsets);
  pageOffsetsRef.current = pageOffsets;
  const tabsWrapperRef = useRef(null);
  const tabBarRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    const wrapper = tabBarRef.current;
    if (!wrapper) return;

    const recalc = () => {
      const containerWidth = wrapper.clientWidth;
      const tabNodes = wrapper.querySelectorAll('.custom-tab');

      if (tabNodes.length === 0) {
        setPageOffsets([0]);
        setTotalPages(1);
        setShowArrows(false);
        pageRef.current = 0;
        setCurrentPage(0);
        return;
      }

      const offsets = [0];
      let currentWidth = 0;

      tabNodes.forEach(tab => {
        const tw = tab.offsetWidth;
        if (currentWidth + tw > containerWidth && currentWidth > 0) {
          offsets.push(tab.offsetLeft);
          currentWidth = tw;
        } else {
          currentWidth += tw;
        }
      });

      setPageOffsets(offsets);
      setTotalPages(offsets.length);
      const overflowing = offsets.length > 1;
      setShowArrows(overflowing);
      if (!overflowing) {
        pageRef.current = 0;
        setCurrentPage(0);
      } else {
        const clamped = Math.min(pageRef.current, offsets.length - 1);
        if (clamped !== pageRef.current) {
          pageRef.current = clamped;
          setCurrentPage(clamped);
        }
      }
    };

    let rafId = requestAnimationFrame(recalc);
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recalc);
    });
    ro.observe(wrapper);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [tabs]);

  const goToPage = useCallback((page) => {
    const offset = pageOffsets[page];
    if (offset === undefined) return;

    const list = tabBarRef.current;
    if (!list) return;

    list.style.transition = 'transform 0.3s ease';
    list.style.transform = `translateX(-${offset}px)`;
    pageRef.current = page;
    setCurrentPage(page);
  }, [pageOffsets]);

  const startEditing = (key, title) => {
    setEditingKey(key);
    setEditingValue(title);
  };

  const confirmRename = (newTitle) => {
    if (!editingKey) return;
    setTabs(prev => prev.map(t =>
      t.key === editingKey ? { ...t, title: newTitle } : t
    ));
    setEditingKey(null);
    setEditingValue('');
  };

  const cancelRename = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const showDeleteConfirm = (key) => {
    setDeleteTargetKey(key);
    setDeleteModalVisible(true);
  };

  const handleDelete = () => {
    if (!deleteTargetKey) return;
    if (tabs.length <= 1) {
      setDeleteModalVisible(false);
      setDeleteTargetKey(null);
      return;
    }
    const newTabs = tabs.filter(t => t.key !== deleteTargetKey);
    setTabs(newTabs);
    if (activeKey === deleteTargetKey) {
      setActiveKey(newTabs[0]?.key);
    }
    setDeleteModalVisible(false);
    setDeleteTargetKey(null);
  };

  const handleAdd = () => {
    const newKey = String(++nextKey);
    const newTitle = '新标签';
    setTabs(prev => [...prev, { key: newKey, title: newTitle }]);
    setActiveKey(newKey);
    setEditingKey(newKey);
    setEditingValue(newTitle);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (active.id !== over?.id) {
      const oldIndex = tabs.findIndex(t => t.key === active.id);
      const newIndex = tabs.findIndex(t => t.key === over.id);
      setTabs(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTab = tabs.find(t => t.key === activeKey);
  const draggingTab = activeId ? tabs.find(t => t.key === activeId) : null;

  return (
    <div className="tabs-filter">
      <div className="tabs-filter-header">
        <h2>任务筛选器</h2>
        <button className="back-button" onClick={onBack}>返回首页</button>
      </div>
      <div className="tabs-filter-tabs-wrapper" ref={tabsWrapperRef}>
        <div className="custom-tabs-bar">
          {showArrows && (
            <button
              className={`scroll-arrow scroll-arrow-left ${currentPage === 0 ? 'scroll-arrow-disabled' : ''}`}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <LeftCircleFilled />
            </button>
          )}
          <div className="custom-tabs-viewport">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              modifiers={[restrictToHorizontalAxis]}
            >
              <SortableContext items={tabs.map(t => t.key)} strategy={horizontalListSortingStrategy}>
                <div className="custom-tabs-list" ref={tabBarRef}>
                  {tabs.map(tab => (
                    <SortableTabItem
                      key={tab.key}
                      tab={tab}
                      isActive={tab.key === activeKey}
                      editingKey={editingKey}
                      editingValue={editingValue}
                      setEditingValue={setEditingValue}
                      startEditing={startEditing}
                      confirmRename={confirmRename}
                      cancelRename={cancelRename}
                      showDeleteConfirm={showDeleteConfirm}
                      tabsCount={tabs.length}
                      onActiveChange={setActiveKey}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {draggingTab ? (
                  <div className="custom-tab custom-tab-active custom-tab-overlay">
                    <span className="custom-tab-drag-handle-overlay">⠿</span>
                    <span className="custom-tab-label">{draggingTab.title}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
          <div className="custom-tabs-extra">
            {showArrows && (
              <>
                <span className="page-indicator">{currentPage + 1}/{totalPages}</span>
                <button
                  className={`scroll-arrow scroll-arrow-right ${currentPage >= totalPages - 1 ? 'scroll-arrow-disabled' : ''}`}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  <RightCircleFilled />
                </button>
              </>
            )}
            <div className="add-tab-trigger" onClick={handleAdd}>
              <PlusOutlined />
            </div>
          </div>
        </div>
        <div className="tab-content">
          {activeTab && (
            <div className="tab-content-inner">
              <p>标签 <strong>"{activeTab.title}"</strong> 的内容区域</p>
            </div>
          )}
        </div>
      </div>
      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => { setDeleteModalVisible(false); setDeleteTargetKey(null); }}
        okText="删除"
        okType="danger"
        cancelText="取消"
        okButtonProps={{ disabled: tabs.length <= 1 }}
      >
        <p>
          确定要删除标签 <strong>"{tabs.find(t => t.key === deleteTargetKey)?.title}"</strong> 吗？
        </p>
      </Modal>
    </div>
  );
}

function SortableTabItem({ tab, isActive, editingKey, editingValue, setEditingValue, startEditing, confirmRename, cancelRename, showDeleteConfirm, tabsCount, onActiveChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <SortableTab
      tab={tab}
      isActive={isActive}
      editingKey={editingKey}
      editingValue={editingValue}
      setEditingValue={setEditingValue}
      startEditing={startEditing}
      confirmRename={confirmRename}
      cancelRename={cancelRename}
      showDeleteConfirm={showDeleteConfirm}
      tabsCount={tabsCount}
      onActiveChange={onActiveChange}
      listeners={listeners}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
    />
  );
}

export default TabsFilter;
