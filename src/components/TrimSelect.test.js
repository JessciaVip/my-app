import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import TrimSelect from './TrimSelect';

const getInput = () => screen.getByRole('combobox');

test('typing with composition events does not crash', () => {
  const onSearch = jest.fn();
  render(
    <TrimSelect
      mode="multiple"
      options={[{ value: 'a', label: 'a' }]}
      onSearch={onSearch}
    />
  );
  const input = getInput();
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'n' } });
  fireEvent.change(input, { target: { value: 'ni' } });
  fireEvent.compositionEnd(input, { target: { value: '你' } });
  fireEvent.change(input, { target: { value: '你' } });
  expect(onSearch).toHaveBeenCalledWith('你');
});

test('whitespace-only input is cleared', () => {
  const onSearch = jest.fn();
  render(
    <TrimSelect
      mode="multiple"
      options={[{ value: 'a', label: 'a' }]}
      onSearch={onSearch}
    />
  );
  fireEvent.change(getInput(), { target: { value: '  ' } });
  expect(onSearch).toHaveBeenLastCalledWith('');
});

test('leading and trailing spaces are trimmed, middle kept', () => {
  const onSearch = jest.fn();
  render(
    <TrimSelect
      mode="multiple"
      options={[{ value: 'a', label: 'a' }]}
      onSearch={onSearch}
    />
  );
  fireEvent.change(getInput(), { target: { value: '  张 三  ' } });
  expect(onSearch).toHaveBeenLastCalledWith('张 三');
});

test('selecting an option clears the search input', () => {
  const onSearch = jest.fn();
  render(
    <TrimSelect
      mode="multiple"
      options={[{ value: 'a', label: 'a' }]}
      onSearch={onSearch}
    />
  );
  const input = getInput();
  fireEvent.change(input, { target: { value: '张三' } });
  expect(input.value).toBe('张三');
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.click(screen.getByRole('option'));
  expect(input.value).toBe('');
});
