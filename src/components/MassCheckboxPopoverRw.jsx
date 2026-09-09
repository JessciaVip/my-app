import React, { useState } from 'react';
import { Button, Popover } from 'antd';
import MassCheckboxListRw from './MassCheckboxListRw';

function MassCheckboxPopoverRw({ onBack }) {
  const [open, setOpen] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  return (
    <div className="App" style={{ padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>
        返回首页
      </button>
      <h2>Popover 内渲染 2000 个 Checkbox（react-window 版）</h2>
      <Popover
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        placement="bottomLeft"
        content={
          <MassCheckboxListRw
            height={320}
            onSelectionChange={(checkedIds) => setSelectedCount(checkedIds.size)}
          />
        }
      >
        <Button type="primary">选择选项（已选 {selectedCount}）</Button>
      </Popover>
    </div>
  );
}

export default MassCheckboxPopoverRw;
