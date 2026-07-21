import React from 'react';
import './LandingPage.css';

function LandingPage({ onNavigate }) {
  return (
    <div className="LandingPage">
      <div className="LandingPage-content">
        <h1 className="LandingPage-title">项目任务看板</h1>
        <p className="LandingPage-description">高效管理你的迭代任务与开发流程</p>
        <div className="LandingPage-nav">
          <button className="LandingPage-button" onClick={() => onNavigate('board')}>
            进入看板
          </button>
          <button className="LandingPage-button LandingPage-button-secondary" onClick={() => onNavigate('filter')}>
            任务筛选器
          </button>
          <button className="LandingPage-button LandingPage-button-secondary" onClick={() => onNavigate('table')}>
            拖拽表格
          </button>
          <button className="LandingPage-button LandingPage-button-secondary" onClick={() => onNavigate('resizable')}>
            调整列宽表格
          </button>
          <button className="LandingPage-button LandingPage-button-secondary" onClick={() => onNavigate('checkbox')}>
            拖拽 Checkbox
          </button>
          <button className="LandingPage-button LandingPage-button-secondary" onClick={() => onNavigate('tabsChangeIndex')}>
            Tabs 拖拽排序
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
