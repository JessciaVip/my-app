import { createBrowserHistory } from 'history';
import { requestConfirmation } from './components/RouteNavigationConfirm';

// ==================== 路由 history（自定义路由确认弹窗） ====================
// 导航被 history.block 拦截后，会调用 getUserConfirmation，
// 这里转发给 RouteNavigationConfirm 组件展示自定义 Modal。

const history = createBrowserHistory({
  getUserConfirmation: (message, callback) => {
    console.log('------getUserConfirmation');
    requestConfirmation(message, callback);
  },
});

export default history;
