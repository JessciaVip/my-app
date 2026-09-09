import React, { useState } from 'react';
import { Button, Popover } from 'antd';
import MassCheckboxAccordionVirtuoso from './MassCheckboxAccordionVirtuoso';

function MassCheckboxAccordionVirtuosoPopover({ onBack }) {
  const [open, setOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>分组可展开 Popover（react-virtuoso，默认全展开）</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        300 组，每组 200~1200 个 checkbox，单一滚动容器，holder 高度自适应
      </p>
      <Popover
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        placement="bottomLeft"
        content={
          <MassCheckboxAccordionVirtuoso
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

export default MassCheckboxAccordionVirtuosoPopover;
