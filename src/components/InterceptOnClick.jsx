import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import './InterceptOnClick.css';

// ==================== 工具函数 ====================

// 获取元素上绑定的 click 回调（兼容原生 onclick 和 React 内部 props）
function getClickHandler(el) {
  // 先查 React 内部属性：React 16 会把带 onClick 元素的 el.onclick 设为 noop 陷阱，
  // 直接读 el.onclick 会拿到 noop 而不是真正的回调
  for (const key of Object.keys(el)) {
    if (key.startsWith('__reactProps$') || key.startsWith('__reactEventHandlers$')) {
      const props = el[key];
      if (props && typeof props.onClick === 'function') return props.onClick;
    }
    if (key.startsWith('__reactInternalInstance$')) {
      const fiber = el[key];
      if (fiber && fiber.memoizedProps && typeof fiber.memoizedProps.onClick === 'function') {
        return fiber.memoizedProps.onClick;
      }
    }
  }

  // 非 React 元素：原生 onclick
  if (typeof el.onclick === 'function') return el.onclick;

  return null;
}

// 判断回调源码里是否调用了 window.open / apolloMfeNavigate / push('字符串')
// push 只匹配裸调用（push 前面不是点，避免误伤 arr.push 等）
function handlerUsesNavigation(fn) {
  const source = fn.toString();
  return /window\.open|apolloMfeNavigate|(^|[^.\w])push\s*\(\s*['"`]/.test(source);
}

// 默认判断：页面存在 wangEditor 才弹窗
const defaultShouldConfirm = () =>
  document.querySelectorAll('.w-e-text-container').length > 0;

// ==================== 拦截 onclick 页面跳转 ====================
// 包裹页面后，监听指定容器（container）内部的所有点击。
// container 支持单个选择器（'#a'）、逗号分隔（'#a, #b'）或选择器数组（['#a', '#b']）。
// 只有当点击元素的 onclick 回调里调用了 window.open / push 时才拦截弹窗：
// 取消则不执行，确定则重新派发 click 执行。页面无 wangEditor（shouldConfirm 为假）直接放行。

function InterceptOnClick({
  container = '[data-intercept-container]',
  title = '提示',
  message = '确定要执行该操作并离开当前页面吗？',
  okText = '确定',
  cancelText = '取消',
  shouldConfirm = defaultShouldConfirm,
  children,
}) {
  const [visible, setVisible] = useState(false);
  const pendingRef = useRef(null);

  // 捕获阶段监听：先于页面所有 onclick 执行
  useEffect(() => {
    if (!container) return undefined;

    const handleClick = (e) => {
      if (e.__intercepted) return;
      if (!(e.target instanceof Element)) return;

      const selectors = Array.isArray(container) ? container : [container];
      let box = null;
      for (const sel of selectors) {
        const matched = document.querySelectorAll(sel);
        for (let i = 0; i < matched.length; i += 1) {
          if (matched[i].contains(e.target)) {
            box = matched[i];
            break;
          }
        }
        if (box) break;
      }
      if (!box) return;

      // 从实际点击元素向上找最近绑定了 click 回调的元素
      let node = e.target;
      let handler = null;
      while (node && box.contains(node)) {
        handler = getClickHandler(node);
        if (handler) break;
        if (node === box) break;
        node = node.parentElement;
      }

      // 无回调，或回调源码里没有 window.open / push → 放行
      if (!handler || !handlerUsesNavigation(handler)) return;

      // 页面无 wangEditor 时直接放行，不弹窗
      if (!shouldConfirm()) return;

      // 阻止默认行为，并阻止事件到达目标节点，onclick 不执行
      e.preventDefault();
      e.stopPropagation();

      // 记住确认后要重新派发 click 的实际点击元素
      const clicked = e.target;
      pendingRef.current = () => {
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
        ev.__intercepted = true;
        clicked.dispatchEvent(ev);
      };
      setVisible(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [container, shouldConfirm]);

  // 用户操作：确定才重新派发 click 执行 onclick，取消则丢弃
  const resolve = useCallback((result) => {
    setVisible(false);
    const fn = pendingRef.current;
    pendingRef.current = null;
    if (!fn) return;
    if (result) fn();
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
        className="InterceptOnClickModal"
        destroyOnClose
      >
        <p className="InterceptOnClickModal-message">{message}</p>
      </Modal>
    </>
  );
}

export default InterceptOnClick;
