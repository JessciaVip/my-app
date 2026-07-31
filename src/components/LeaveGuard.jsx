import React, { useState, useCallback, useRef, useEffect, createContext, useContext, useMemo } from 'react';
import { Modal } from 'antd';
import './LeaveGuard.css';

// ==================== Context ====================

const LeaveGuardContext = createContext(null);

// ==================== Provider ====================

// guardSelector: 基座导航按钮的选择器，如 '.mfe-nav-guard'
function LeaveGuardProvider({ children, guardSelector }) {
  const [visible, setVisible] = useState(false);
  const [editorCount, setEditorCount] = useState(0);
  const pendingActionRef = useRef(null);
  const originalFnsRef = useRef({});

  // ==================== 注册/注销编辑器 ====================

  const registerEditor = useCallback(() => {
    setEditorCount((count) => count + 1);
  }, []);

  const unregisterEditor = useCallback(() => {
    setEditorCount((count) => Math.max(0, count - 1));
  }, []);

  // ==================== DOM 事件拦截（捕获阶段） ====================
  // 只拦截匹配 guardSelector 的元素的点击，确认后重新派发事件

  useEffect(() => {
    if (editorCount === 0 || !guardSelector) return;

    const handleClick = (e) => {
      if (e.__guarded) return;

      // 找到匹配 guardSelector 的最近祖先
      const target = e.target.closest(guardSelector);
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      pendingActionRef.current = () => {
        const newEvent = new MouseEvent('click', { bubbles: true });
        newEvent.__guarded = true;
        target.dispatchEvent(newEvent);
      };
      setVisible(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [editorCount, guardSelector]);

  // ==================== window 方法拦截（兜底，防止非点击触发的跳转） ====================

  useEffect(() => {
    if (editorCount === 0) {
      // 还原
      if (originalFnsRef.current.apolloMfeNavigate) {
        window.apolloMfeNavigate = originalFnsRef.current.apolloMfeNavigate;
        originalFnsRef.current.apolloMfeNavigate = null;
      }
      if (originalFnsRef.current.open) {
        window.open = originalFnsRef.current.open;
        originalFnsRef.current.open = null;
      }
      return;
    }

    // 劫持
    if (!originalFnsRef.current.apolloMfeNavigate) {
      originalFnsRef.current.apolloMfeNavigate = window.apolloMfeNavigate;
      window.apolloMfeNavigate = function (...args) {
        pendingActionRef.current = () => originalFnsRef.current.apolloMfeNavigate.apply(window, args);
        setVisible(true);
      };
    }

    if (!originalFnsRef.current.open) {
      originalFnsRef.current.open = window.open;
      window.open = function (...args) {
        pendingActionRef.current = () => originalFnsRef.current.open.apply(window, args);
        setVisible(true);
      };
    }
  }, [editorCount]);

  // ==================== Modal 操作 ====================

  const cancelLeave = useCallback(() => {
    setVisible(false);
    pendingActionRef.current = null;
  }, []);

  const proceedLeave = useCallback(() => {
    setVisible(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  }, []);

  // ==================== Context 值 ====================

  const value = useMemo(() => ({
    registerEditor,
    unregisterEditor,
  }), [registerEditor, unregisterEditor]);

  return (
    <LeaveGuardContext.Provider value={value}>
      {children}
      <LeaveGuardModal visible={visible} onCancel={cancelLeave} onConfirm={proceedLeave} />
    </LeaveGuardContext.Provider>
  );
}

// ==================== Modal ====================

function LeaveGuardModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal
      title="提示"
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="继续离开"
      cancelText="不离开"
      maskClosable={false}
      className="LeaveGuardModal"
    >
      <p className="LeaveGuardModal-message">当前页面有未保存的内容，确定要离开吗？</p>
    </Modal>
  );
}

// ==================== 编辑器注册 Hook ====================

function useLeaveGuardEditor() {
  const context = useContext(LeaveGuardContext);
  if (!context) {
    throw new Error('useLeaveGuardEditor 必须在 LeaveGuardProvider 内部使用');
  }
  const { registerEditor, unregisterEditor } = context;
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      registerEditor();
    }
    return () => {
      unregisterEditor();
      mountedRef.current = false;
    };
  }, [registerEditor, unregisterEditor]);
}

export { LeaveGuardProvider, useLeaveGuardEditor };
export default LeaveGuardProvider;
