import React, { useState } from 'react';
import KanbanBoard from './components/KanbanBoard';
import LandingPage from './components/LandingPage';
import TabsFilter from './components/TabsFilter';
import DraggableTable from './components/DraggableTable';
import ResizableTable from './components/ResizableTable';
import SortableCheckbox from './components/SortableCheckbox';
import TabsChangeIndex from './components/TabsChangeIndex';
import './App.css';

function CheckboxDemo({ onBack }) {
  const [selectedInfo, setSelectedInfo] = useState({ items: [], values: [] });

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>可拖拽排序的 Checkbox 列表</h2>
      <SortableCheckbox
        items={[
          { id: '1', label: '姓名', checked: true, fixed: true },
          { id: '2', label: '年龄', checked: true },
          { id: '3', label: '地址', checked: false },
          { id: '4', label: '职业', checked: true },
          { id: '5', label: '部门', checked: false },
          { id: '6', label: '入职日期', checked: true },
          { id: '7', label: '邮箱', checked: false },
          { id: '8', label: '电话', checked: false },
          { id: '9', label: '学历', checked: true },
          { id: '10', label: '工龄', checked: false },
          { id: '11', label: '薪资', checked: true },
          { id: '12', label: '状态', checked: false },
        ]}
        onChange={(items, values) => setSelectedInfo({ items, values })}
      />
      <div style={{ marginTop: 24 }}>
        <h3>选中值（按顺序）：</h3>
        <pre>{JSON.stringify(selectedInfo.items, null, 2)}</pre>
        <h3>选中 ID 列表：</h3>
        <pre>{JSON.stringify(selectedInfo.values, null, 2)}</pre>
      </div>
    </div>
  );
}

const demoColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name', fixed: 'left', width: 100 },
  { title: '年龄', dataIndex: 'age', key: 'age', fixed: 'left', width: 80 },
  { title: '地址', dataIndex: 'address', key: 'address', width: 180 },
  { title: '职业', dataIndex: 'occupation', key: 'occupation', width: 140 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
  { title: '入职日期', dataIndex: 'joinDate', key: 'joinDate', width: 120 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
  { title: '电话', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '学历', dataIndex: 'education', key: 'education', width: 100 },
  { title: '工龄', dataIndex: 'workYears', key: 'workYears', width: 80 },
  { title: '薪资', dataIndex: 'salary', key: 'salary', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
];

const demoData = [
  { key: '1', name: '张三', age: 28, address: '北京市朝阳区', occupation: '前端工程师', department: '技术部', joinDate: '2020-03-15', email: 'zhangsan@example.com', phone: '13800138001', education: '本科', workYears: 6, salary: '25000', status: '在职' },
  { key: '2', name: '李四', age: 32, address: '上海市浦东新区', occupation: '后端工程师', department: '技术部', joinDate: '2018-07-20', email: 'lisi@example.com', phone: '13800138002', education: '硕士', workYears: 8, salary: '32000', status: '在职' },
  { key: '3', name: '王五', age: 25, address: '广州市天河区', occupation: '产品经理', department: '产品部', joinDate: '2021-09-01', email: 'wangwu@example.com', phone: '13800138003', education: '本科', workYears: 4, salary: '22000', status: '在职' },
  { key: '4', name: '赵六', age: 30, address: '深圳市南山区', occupation: '设计师', department: '设计部', joinDate: '2019-11-10', email: 'zhaoliu@example.com', phone: '13800138004', education: '本科', workYears: 7, salary: '28000', status: '在职' },
  { key: '5', name: '孙七', age: 27, address: '杭州市西湖区', occupation: '测试工程师', department: '质量部', joinDate: '2022-01-05', email: 'sunqi@example.com', phone: '13800138005', education: '本科', workYears: 4, salary: '20000', status: '在职' },
  { key: '6', name: '周八', age: 35, address: '成都市武侯区', occupation: '架构师', department: '技术部', joinDate: '2016-04-18', email: 'zhouba@example.com', phone: '13800138006', education: '硕士', workYears: 10, salary: '45000', status: '在职' },
  { key: '7', name: '吴九', age: 24, address: '武汉市洪山区', occupation: '运维工程师', department: '运维部', joinDate: '2023-02-28', email: 'wujiu@example.com', phone: '13800138007', education: '本科', workYears: 2, salary: '18000', status: '在职' },
  { key: '8', name: '郑十', age: 29, address: '南京市鼓楼区', occupation: '数据分析师', department: '数据部', joinDate: '2020-08-12', email: 'zhengshi@example.com', phone: '13800138008', education: '硕士', workYears: 6, salary: '30000', status: '在职' },
  { key: '9', name: '陈一', age: 31, address: '重庆市渝中区', occupation: 'Java工程师', department: '技术部', joinDate: '2019-05-20', email: 'chenyi@example.com', phone: '13800138009', education: '本科', workYears: 7, salary: '28000', status: '在职' },
  { key: '10', name: '林二', age: 26, address: '西安市雁塔区', occupation: 'UI设计师', department: '设计部', joinDate: '2022-06-15', email: 'liner@example.com', phone: '13800138010', education: '本科', workYears: 3, salary: '20000', status: '在职' },
  { key: '11', name: '黄三', age: 33, address: '苏州市姑苏区', occupation: '测试主管', department: '质量部', joinDate: '2017-10-08', email: 'huangsan@example.com', phone: '13800138011', education: '硕士', workYears: 9, salary: '35000', status: '在职' },
  { key: '12', name: '杨四', age: 28, address: '天津市和平区', occupation: '前端工程师', department: '技术部', joinDate: '2021-03-22', email: 'yangsi@example.com', phone: '13800138012', education: '本科', workYears: 5, salary: '24000', status: '在职' },
  { key: '13', name: '刘五', age: 30, address: '青岛市市南区', occupation: '产品经理', department: '产品部', joinDate: '2020-11-30', email: 'liuwu@example.com', phone: '13800138013', education: '本科', workYears: 6, salary: '26000', status: '在职' },
  { key: '14', name: '何六', age: 27, address: '长沙市岳麓区', occupation: '后端工程师', department: '技术部', joinDate: '2022-04-10', email: 'heliu@example.com', phone: '13800138014', education: '本科', workYears: 4, salary: '22000', status: '在职' },
  { key: '15', name: '马七', age: 34, address: '宁波市鄞州区', occupation: 'DevOps', department: '运维部', joinDate: '2018-09-05', email: 'maqi@example.com', phone: '13800138015', education: '硕士', workYears: 8, salary: '38000', status: '在职' },
  { key: '16', name: '罗八', age: 25, address: '东莞市南城区', occupation: '前端工程师', department: '技术部', joinDate: '2023-01-15', email: 'luoba@example.com', phone: '13800138016', education: '本科', workYears: 2, salary: '18000', status: '在职' },
  { key: '17', name: '梁九', age: 29, address: '佛山市禅城区', occupation: '后端工程师', department: '技术部', joinDate: '2021-07-20', email: 'liangjiu@example.com', phone: '13800138017', education: '本科', workYears: 5, salary: '25000', status: '在职' },
  { key: '18', name: '宋十', age: 31, address: '郑州市金水区', occupation: '架构师', department: '技术部', joinDate: '2019-02-28', email: 'songshi@example.com', phone: '13800138018', education: '硕士', workYears: 7, salary: '40000', status: '在职' },
  { key: '19', name: '唐一', age: 26, address: '合肥市包河区', occupation: '测试工程师', department: '质量部', joinDate: '2022-09-12', email: 'tangyi@example.com', phone: '13800138019', education: '本科', workYears: 3, salary: '19000', status: '在职' },
  { key: '20', name: '韩二', age: 32, address: '福州市鼓楼区', occupation: '数据分析师', department: '数据部', joinDate: '2018-12-01', email: 'haner@example.com', phone: '13800138020', education: '硕士', workYears: 8, salary: '33000', status: '在职' },
  { key: '21', name: '冯三', age: 28, address: '厦门市思明区', occupation: 'UI设计师', department: '设计部', joinDate: '2021-05-18', email: 'fengsan@example.com', phone: '13800138021', education: '本科', workYears: 5, salary: '23000', status: '在职' },
  { key: '22', name: '曹四', age: 30, address: '昆明市五华区', occupation: '后端工程师', department: '技术部', joinDate: '2020-02-14', email: 'caosi@example.com', phone: '13800138022', education: '本科', workYears: 6, salary: '27000', status: '在职' },
  { key: '23', name: '彭五', age: 27, address: '贵阳市南明区', occupation: '前端工程师', department: '技术部', joinDate: '2022-08-20', email: 'pengwu@example.com', phone: '13800138023', education: '本科', workYears: 3, salary: '20000', status: '在职' },
  { key: '24', name: '曾六', age: 35, address: '南昌市东湖区', occupation: '运维工程师', department: '运维部', joinDate: '2017-06-10', email: 'zengliu@example.com', phone: '13800138024', education: '本科', workYears: 9, salary: '32000', status: '在职' },
  { key: '25', name: '萧七', age: 24, address: '太原市小店区', occupation: '测试工程师', department: '质量部', joinDate: '2023-04-05', email: 'xiaoqi@example.com', phone: '13800138025', education: '本科', workYears: 1, salary: '16000', status: '在职' },
  { key: '26', name: '田八', age: 29, address: '石家庄长安区', occupation: '产品经理', department: '产品部', joinDate: '2021-01-15', email: 'tianba@example.com', phone: '13800138026', education: '本科', workYears: 5, salary: '25000', status: '在职' },
  { key: '27', name: '董九', age: 33, address: '哈尔滨道里区', occupation: '后端工程师', department: '技术部', joinDate: '2018-03-20', email: 'dongjiu@example.com', phone: '13800138027', education: '硕士', workYears: 8, salary: '35000', status: '在职' },
  { key: '28', name: '潘十', age: 26, address: '长春市朝阳区', occupation: '前端工程师', department: '技术部', joinDate: '2022-11-08', email: 'panshi@example.com', phone: '13800138028', education: '本科', workYears: 3, salary: '19000', status: '在职' },
  { key: '29', name: '袁一', age: 31, address: '沈阳市和平区', occupation: '设计师', department: '设计部', joinDate: '2019-08-25', email: 'yuanyi@example.com', phone: '13800138029', education: '本科', workYears: 7, salary: '28000', status: '在职' },
  { key: '30', name: '蒋二', age: 28, address: '济南市历下区', occupation: '架构师', department: '技术部', joinDate: '2020-06-12', email: 'jianger@example.com', phone: '13800138030', education: '硕士', workYears: 6, salary: '42000', status: '在职' },
];

const initialData = {
  todo: {
    title: '迭代待办',
    subLanes: [
      { id: 'todo-xj', title: '新建状态', items: [
        { id: '1', content: 'Task 1', type: 'dev' },
        { id: '2', content: 'Task 2', type: 'affair' },
        { id: '3', content: 'Task 3', type: 'dev' },
        { id: '4', content: 'Task 4', type: 'affair' },
      ] },
    ],
  },
  dev: {
    title: '开发中',
    subLanes: [
      { id: 'dev-kf', title: '开发中', items: [] },
      { id: 'dev-cl', title: '处理中', items: [] },
    ],
  },
  test: {
    title: '测试',
    subLanes: [
      { id: 'test-sm', title: '冒烟测试', items: [] },
      { id: 'test-uat', title: 'uat测试', items: [] },
    ],
  },
  done: {
    title: '完成',
    subLanes: [
      { id: 'done-wc', title: '已完成', items: [] },
    ],
  },
};

function App() {
  const [page, setPage] = useState('home');

  switch (page) {
    case 'board':
      return (
        <div className="App">
          <KanbanBoard initialData={initialData} onBack={() => setPage('home')} />
        </div>
      );
    case 'filter':
      return (
        <div className="App">
          <TabsFilter onBack={() => setPage('home')} />
        </div>
      );
    case 'table':
      return (
        <div className="App" style={{ padding: 24 }}>
          <button onClick={() => setPage('home')} style={{ marginBottom: 16 }}>
            返回首页
          </button>
          <h2>可拖拽列排序表格</h2>
          <DraggableTable
            columns={demoColumns}
            dataSource={demoData}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1500 }}
            onColumnsChange={(cols) => console.log('columns changed:', cols)}
          />
        </div>
      );
    case 'resizable':
      return (
        <div className="App" style={{ padding: 24 }}>
          <button onClick={() => setPage('home')} style={{ marginBottom: 16 }}>
            返回首页
          </button>
          <h2>调整列宽表格（带缓存）</h2>
          <ResizableTable
            columns={demoColumns}
            dataSource={demoData}
            cacheKey="demo-table"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1500 }}
          />
        </div>
      );
    case 'checkbox':
      return <CheckboxDemo onBack={() => setPage('home')} />;
    case 'tabsChangeIndex':
      return (
        <div className="App" style={{ padding: 24 }}>
          <button onClick={() => setPage('home')} style={{ marginBottom: 16 }}>
            返回首页
          </button>
          <h2>Tabs 拖拽排序</h2>
          <TabsChangeIndex
            tabs={[
              { key: '1', label: '选项一', children: <div>选项一的内容</div> },
              { key: '2', label: '选项二', children: <div>选项二的内容</div> },
              { key: '3', label: '选项三', children: <div>选项三的内容</div> },
              { key: '4', label: '选项四', children: <div>选项四的内容</div> },
            ]}
            defaultActiveKey="1"
            onChange={(newTabs) => console.log('tabs order changed:', newTabs)}
          />
        </div>
      );
    default:
      return (
        <div className="App">
          <LandingPage onNavigate={(p) => setPage(p)} />
        </div>
      );
  }
}

export default App;