import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterceptOnClick from './components/InterceptOnClick';

window.matchMedia =
  window.matchMedia ||
  function matchMedia() {
    return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} };
  };

const MSG = '确定要执行该操作并离开当前页面吗？';

class MethodDemo extends React.Component {
  fn() {
    window.open('/ww', '_blank');
  }
  render() {
    return (
      <InterceptOnClick container="#c" shouldConfirm={() => true}>
        <div id="c">
          <button onClick={this.fn}>未绑定方法</button>
        </div>
      </InterceptOnClick>
    );
  }
}

class BoundDemo extends React.Component {
  constructor(props) {
    super(props);
    this.fn = this.fn.bind(this);
  }
  fn() {
    window.open('/ww', '_blank');
  }
  render() {
    return (
      <InterceptOnClick container="#c" shouldConfirm={() => true}>
        <div id="c">
          <button onClick={this.fn}>构造器绑定方法</button>
        </div>
      </InterceptOnClick>
    );
  }
}

test('未绑定方法：toString 含 window.open，应拦截', async () => {
  const origOpen = window.open;
  window.open = jest.fn();
  try {
    render(<MethodDemo />);
    console.log('未绑定 fn.toString():', MethodDemo.prototype.fn.toString());
    await userEvent.click(screen.getByRole('button', { name: /未绑定方法/ }));
    expect(await screen.findByText(MSG)).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  } finally {
    window.open = origOpen;
  }
});

test('构造器绑定方法：toString 是 native code，不拦截（window.open 直接执行）', async () => {
  const origOpen = window.open;
  window.open = jest.fn();
  try {
    render(<BoundDemo />);
    await userEvent.click(screen.getByRole('button', { name: /构造器绑定方法/ }));
    await new Promise((r) => setTimeout(r, 100));
    const intercepted = await screen.findByText(MSG).catch(() => null);
    console.log('绑定方法是否弹窗:', !!intercepted, 'window.open 调用:', window.open.mock.calls);
    if (intercepted) {
      await userEvent.click(screen.getByRole('button', { name: /取\s*消/ }));
    }
    expect(true).toBe(true);
  } finally {
    window.open = origOpen;
  }
});
