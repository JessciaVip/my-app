import React, { useState } from 'react';
import TrimSelect from './TrimSelect';

const options = [
  { value: 'zhangsan', label: '张三' },
  { value: 'lisi', label: '李四' },
  { value: 'wangwu', label: '王五' },
  { value: 'zhaoliu', label: '赵六' },
  { value: 'sunqi', label: '孙七' },
  { value: 'zhouba', label: '周八' },
  { value: 'react', label: 'React' },
  { value: 'webpack', label: 'Webpack' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'ant-design', label: 'Ant Design' },
];

function TrimSelectDemo({ onBack }) {
  const [keyword, setKeyword] = useState('');

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>TrimSelect 演示（输入法友好自动去空格）</h2>
      <p style={{ color: '#888', marginBottom: 16 }}>
        用搜狗输入法在此输入中文试试：组合过程中首字母不会丢失，候选窗也不会跑到左上角；
        输入完成后自动去掉前后空格，纯空格会被清空，中间空格保留。
      </p>
      <h3>单选</h3>
      <TrimSelect
        style={{ width: 320 }}
        options={options}
        onSearch={setKeyword}
        placeholder="输入关键字过滤（自动去除前后空格）"
      />
      <h3 style={{ marginTop: 24 }}>多选（mode="multiple"）</h3>
      <TrimSelect
        style={{ width: 320 }}
        mode="multiple"
        options={options}
        onSearch={setKeyword}
        placeholder="支持多选，同样自动去空格"
      />
      <div style={{ marginTop: 24 }}>
        <p>过滤关键字（已 trim）：<code>{JSON.stringify(keyword)}</code></p>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>试一下这些输入</h3>
        <ul>
          <li>开头/结尾输入空格，看是否被自动去掉</li>
          <li>只输入空格，看输入框是否被清空</li>
          <li>输入「张 三」（中间空格），看是否保留中间空格过滤</li>
          <li>输入「zhang」拼音并用输入法选字</li>
        </ul>
      </div>
    </div>
  );
}

export default TrimSelectDemo;
