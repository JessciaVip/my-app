import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { withRouter } from 'react-router-dom';
import './RouteNavigationConfirm.css';

// ==================== 全局确认函数 ====================
// 由 history 的 getUserConfirmation 调用，转发给当前挂载的组件

let confirmationHandler = null;

export function requestConfirmation(message, callback) {
  if (confirmationHandler) {
    confirmationHandler(message, callback);
  } else {
    callback(true);
  }
}

// ==================== 默认判断：页面存在 wangEditor 才弹窗 ====================

const defaultShouldConfirm = () =>
  document.querySelectorAll('.w-e-text-container').length > 0;

// ==================== 组件 ====================
// 包裹在页面外层，页面内任何跳转（Link、history.push、浏览器前进后退）都会被拦截，
// 弹出确认框：取消则不跳转，确定则继续跳转。

function RouteNavigationConfirmBase({
  history,
  when = true,
  title = '提示',
  message = '确定要离开当前页面吗？',
  okText = '确定离开',
  cancelText = '取消',
  shouldConfirm = defaultShouldConfirm,
  children,
}) {
  const [visible, setVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState(message);
  const pendingActionRef = useRef(null);

  // 注册 history 拦截：shouldConfirm 为真才进 getUserConfirmation 弹窗，
  // 为假时返回 true 直接放行（不触发弹窗链路）
  useEffect(() => {
    if (!when) return undefined;
    const unblock = history.block((location, action) => {
      if (!shouldConfirm()) return true;
      return message;
    });
    return unblock;
  }, [when, history, message, shouldConfirm]);

  // 劫持 window.open：同样先走 shouldConfirm 判断
  useEffect(() => {
    if (!when) return undefined;
    const originalOpen = window.open;
    window.open = function (...args) {
      if (!shouldConfirm()) {
        originalOpen.apply(window, args);
        return;
      }
      pendingActionRef.current = { type: 'open', fn: () => originalOpen.apply(window, args) };
      setModalMessage(message);
      setVisible(true);
    };
    return () => {
      window.open = originalOpen;
    };
  }, [when, message, shouldConfirm]);

  // 注册全局确认处理器
  useEffect(() => {
    if (!when) return undefined;
    const handler = (msg, callback) => {
      setModalMessage(msg || message);
      pendingActionRef.current = { type: 'history', callback };
      setVisible(true);
    };
    confirmationHandler = handler;
    return () => {
      if (confirmationHandler === handler) {
        confirmationHandler = null;
      }
    };
  }, [when, message]);

  // 用户操作：result 为 true 放行跳转，false 取消跳转
  const resolve = useCallback((result) => {
    setVisible(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (!action) return;
    if (action.type === 'history') {
      action.callback(result);
    } else if (action.type === 'open' && result) {
      action.fn();
    }
  }, []);

  return (
    <>
      {children}
      <Modal
        title={title}
        open={visible}
        onOk={() => resolve(true)}
        onCancel={() => resolve(false)}
        okText={okText}
        cancelText={cancelText}
        maskClosable={false}
        className="RouteNavigationConfirmModal"
        destroyOnClose
      >
        <p className="RouteNavigationConfirmModal-message">{modalMessage}</p>
      </Modal>
    </>
  );
}

const RouteNavigationConfirm = withRouter(RouteNavigationConfirmBase);

export default RouteNavigationConfirm;
