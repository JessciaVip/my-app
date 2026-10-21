import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="LandingPage">
      <div className="LandingPage-content">
        <h1 className="LandingPage-title">项目任务看板</h1>
        <p className="LandingPage-description">高效管理你的迭代任务与开发流程</p>
        <div className="LandingPage-nav">
          <Link className="LandingPage-button" to="/board">
            进入看板
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/filter">
            任务筛选器
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/table">
            拖拽表格
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/resizable">
            调整列宽表格
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/checkbox">
            拖拽 Checkbox
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/sortable-list">
            通用拖拽列表
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/tabsChangeIndex">
            Tabs 拖拽排序
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/tabsChangeBasicAntd">
            Tabs 拖拽排序（antd）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/tabsChangeBasicAntd2">
            Tabs 拖拽排序（antd 蓝线）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/editor">
            WangEditor 全屏
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/editor-limit">
            富文本字数上限
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/route-confirm">
            路由跳转确认
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/intercept-onclick">
            拦截 onclick 跳转
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/trim-select">
            TrimSelect 输入法友好
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/mass-checkbox">
            Popover 2000 Checkbox
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/mass-checkbox-rw">
            Popover 2000 Checkbox（react-window）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/mass-checkbox-rcvl">
            Popover 2000 Checkbox（rc-virtual-list）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/mass-accordion-rcvl">
            分组可展开（300组·扁平化·默认全展开）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/mass-accordion">
            分组可展开（嵌套 DOM + 组内虚拟）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/mass-accordion-virtuoso">
            分组可展开（react-virtuoso）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/gray-pie">
            灰色饼图（全 0 占位）
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/pie-legend">
            饼图（图例底部·居中·可缩放）
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
