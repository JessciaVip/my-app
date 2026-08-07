import React, { useState } from 'react';
import { Button, Checkbox, Dropdown } from 'antd';
import { CheckOutlined, SettingOutlined } from '@ant-design/icons';
import SortableList from './SortableList';

const initialItems = [
  { id: '1', label: '姓名', fixed: true },
  { id: '2', label: '年龄' },
  { id: '3', label: '地址' },
  { id: '4', label: '职业' },
  { id: '5', label: '部门' },
  { id: '6', label: '入职日期' },
  { id: '7', label: '邮箱' },
  { id: '8', label: '电话' },
  { id: '9', label: '学历' },
  { id: '10', label: '工龄' },
  { id: '11', label: '薪资' },
  { id: '12', label: '状态' },
];

function SortableListDemo({ onBack }) {
  const [items, setItems] = useState(initialItems);
  const [selectedValues, setSelectedValues] = useState(['1', '2', '4', '6', '9', '11']);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ==================== Dropdown 的 menu 三属性 ====================

  /** items：菜单项列表（作为 SortableList 的数据源，可拖拽排序） */
  const menuItems = [
    { id: '1', key: '1', label: '姓名' },
    { id: '2', key: '2', label: '年龄' },
    { id: '3', key: '3', label: '地址' },
    { id: '4', key: '4', label: '职业' },
  ];

  /** 当前菜单项顺序，拖拽后由 SortableList.onChange 更新 */
  const [menuOrder, setMenuOrder] = useState(menuItems);

  /** selectedKeys：当前选中的 key 列表 */
  const [selectedKeys, setSelectedKeys] = useState(['1']);

  /** onClick：点击菜单项回调 */
  function handleMenuClick({ key }) {
    setSelectedKeys([key]);
    setDropdownOpen(false); // 模拟 Menu 点击后自动收起
  }

  /**
   * dropdownRender：Menu 里的每个菜单项都由 SortableList 渲染，
   * 这样菜单既能选中（selectedKeys / onClick），又能拖拽排序
   */
  const renderDropdown = () => (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 4,
        padding: 4,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      <SortableList
        items={menuOrder}
        onChange={setMenuOrder}
        renderItem={(item) => {
          const active = selectedKeys.includes(item.key);
          return (
            <div
              onClick={() => handleMenuClick({ key: item.key })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: active ? '#1890ff' : 'rgba(0, 0, 0, 0.85)',
                fontWeight: active ? 600 : 400,
              }}
            >
              <span>{item.label}</span>
              {active ? <CheckOutlined /> : null}
            </div>
          );
        }}
      />
    </div>
  );

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>通用垂直拖拽列表（传入 Checkbox）</h2>
      <p style={{ marginBottom: 16 }}>
        拖拽 ⠿ 手柄调整顺序；固定项始终置顶不可拖拽；点击 checkbox 切换选中。
      </p>
      <div style={{ marginBottom: 24 }}>
        <h3>Dropdown + dropdownRender 示例</h3>
        <p style={{ marginBottom: 8 }}>
          Menu 里的每个菜单项都由 SortableList 渲染：既能拖拽排序（拖动 ⠿ 手柄），又能通过 selectedKeys / onClick 选中。
        </p>
        <Dropdown
          trigger={['click']}
          open={dropdownOpen}
          onOpenChange={setDropdownOpen}
          placement="bottomLeft"
          // menu={{ items: menuItems, selectedKeys, onClick: handleMenuClick }}
          dropdownRender={renderDropdown}
        >
          <Button icon={<SettingOutlined />}>Dropdown click 拖拽</Button>
        </Dropdown>
        <p style={{ marginTop: 12, marginBottom: 0 }}>
          当前菜单顺序：{menuOrder.map((i) => i.label).join(' > ')}
        </p>
      </div>
      <Checkbox.Group value={selectedValues} onChange={setSelectedValues}>
        <SortableList
          items={items}
          onChange={setItems}
          renderItem={(item) => <Checkbox value={item.id}>{item.label}</Checkbox>}
        />
      </Checkbox.Group>
      <div style={{ marginTop: 24 }}>
        <h3>排序（按顺序）：</h3>
        <pre>{JSON.stringify(items.map(i => i.label), null, 2)}</pre>
        <h3>选中 ID 列表：</h3>
        <pre>{JSON.stringify(selectedValues, null, 2)}</pre>
      </div>
    </div>
  );
}

export default SortableListDemo;
