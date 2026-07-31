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
          <Link className="LandingPage-button LandingPage-button-secondary" to="/tabsChangeIndex">
            Tabs 拖拽排序
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/editor">
            WangEditor 全屏
          </Link>
          <Link className="LandingPage-button LandingPage-button-secondary" to="/route-confirm">
            路由跳转确认
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
