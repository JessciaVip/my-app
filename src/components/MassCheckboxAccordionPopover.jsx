import React, { useState } from 'react';
import { Button, Popover } from 'antd';
import MassCheckboxAccordion from './MassCheckboxAccordion';

function MassCheckboxAccordionPopover({ onBack }) {
  const [open, setOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>分组可展开 Popover（每组内部虚拟滚动）</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        30 组，每组 200~1200 个 checkbox，组容器原生 DOM，content 内部用 rc-virtual-list
      </p>
      <Popover
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        placement="bottomLeft"
        content={
          <MassCheckboxAccordion
            height={480}
            onSelectionChange={(checkedIds) => setSelectedCount(checkedIds.size)}
          />
        }
      >
        <Button type="primary">选择选项（已选 {selectedCount}）</Button>
      </Popover>
    </div>
  );
}

export default MassCheckboxAccordionPopover;
