import { nodeTextLength, applyMaxLength } from './richTextLimit';

function createEditor(initialText) {
  let text = initialText || '';
  const editor = {
    getText: () => text,
    insertText: (s) => { text += s; },
    insertNode: (node) => { text += 'x'.repeat(nodeTextLength(node)); },
    insertFragment: (fragment) => { fragment.forEach((n) => editor.insertNode(n)); },
    dangerouslyInsertHtml: (html) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      text += div.textContent || '';
    },
    insertBreak: () => { text += '\n'; },
    removeLast: () => { text = text.slice(0, -1); },
  };
  return { editor, getText: () => text };
}

test('nodeTextLength：文本/图片/嵌套元素', () => {
  expect(nodeTextLength({ text: 'ab' })).toBe(2);
  expect(nodeTextLength({ type: 'image', src: 'x', children: [] })).toBe(0);
  expect(nodeTextLength({ type: 'paragraph', children: [{ text: 'a' }, { text: 'bc' }] })).toBe(3);
  expect(nodeTextLength(null)).toBe(0);
});

test('insertText 超限截断，删除后可继续输入', () => {
  const { editor, getText } = createEditor('');
  applyMaxLength(editor, () => 5);

  editor.insertText('abc');
  expect(getText()).toBe('abc');

  editor.insertText('defgh'); // 只剩 2 个额度，截断
  expect(getText()).toBe('abcde');

  editor.insertText('xyz'); // 已满，全部丢弃
  expect(getText()).toBe('abcde');

  editor.removeLast(); // 删除 1 个字符，恢复 1 个额度
  expect(getText()).toBe('abcd');

  editor.insertText('Z');
  expect(getText()).toBe('abcdZ');

  editor.insertText('Z'); // 又满了，丢弃
  expect(getText()).toBe('abcdZ');
});

test('换行占 1 个字符，满时回车被拦截', () => {
  const { editor, getText } = createEditor('');
  applyMaxLength(editor, () => 3);

  editor.insertText('ab');
  editor.insertBreak(); // 剩 1 个额度，允许
  expect(getText()).toBe('ab\n');

  editor.insertBreak(); // 已满，拦截
  expect(getText()).toBe('ab\n');
});

test('图片（无文本）不占额度，满时仍可插入', () => {
  const { editor, getText } = createEditor('');
  applyMaxLength(editor, () => 3);

  editor.insertText('abc');
  editor.insertNode({ type: 'image', src: 'x', children: [] });
  expect(getText()).toBe('abc');
});

test('粘贴 HTML 按可见纯文本校验，图片标签不计', () => {
  const { editor, getText } = createEditor('');
  applyMaxLength(editor, () => 5);

  editor.dangerouslyInsertHtml('<p>he</p>');
  expect(getText()).toBe('he');

  editor.dangerouslyInsertHtml('<p>llo</p><img src="x">'); // 剩 3，粘贴 llo 3 个，允许
  expect(getText()).toBe('hello');

  editor.dangerouslyInsertHtml('<p>xxxxx</p>'); // 已满，拦截
  expect(getText()).toBe('hello');

  // 满时粘贴纯图片允许
  const e2 = createEditor('abc');
  applyMaxLength(e2.editor, () => 3);
  e2.editor.dangerouslyInsertHtml('<img src="x">');
  expect(e2.getText()).toBe('abc');
});

test('粘贴片段逐节点校验，超出部分整体丢弃', () => {
  const { editor, getText } = createEditor('');
  applyMaxLength(editor, () => 4);

  editor.insertFragment([{ text: 'a' }, { text: 'b' }, { text: 'ccc' }]);
  expect(getText()).toBe('xx'); // 前两个各 1 字符，ccc 3 > 剩 2 被丢弃
});

test('maxLength 变化即时生效', () => {
  const { editor, getText } = createEditor('');
  let max = 3;
  applyMaxLength(editor, () => max);

  editor.insertText('abc');
  max = 5; // 外部把上限调到 5
  editor.insertText('de');
  expect(getText()).toBe('abcde');
});
