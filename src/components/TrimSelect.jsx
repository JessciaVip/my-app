import React, { useRef, useState } from 'react';
import { Select } from 'antd';

function TrimSelect({ onSearch, onSelect, onClear, ...rest }) {
  const composing = useRef(false);
  const lastRaw = useRef('');
  const [inputVal, setInputVal] = useState('');

  const commit = raw => {
    const t = typeof raw === 'string' ? raw.trim() : '';
    setInputVal(t);
    if (onSearch) onSearch(t);
  };

  const clear = () => {
    composing.current = false;
    lastRaw.current = '';
    setInputVal('');
  };

  return (
    <Select
      {...rest}
      showSearch
      searchValue={inputVal}
      onSearch={raw => {
        lastRaw.current = raw;
        if (composing.current) {
          setInputVal(raw);
        } else {
          commit(raw);
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={e => {
        composing.current = false;
        const v = e && e.target && e.target.value;
        commit(typeof v === 'string' ? v : lastRaw.current);
      }}
      onSelect={(value, option) => {
        clear();
        if (onSelect) onSelect(value, option);
      }}
      onClear={() => {
        clear();
        if (onClear) onClear();
      }}
    />
  );
}

export default TrimSelect;
