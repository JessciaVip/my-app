// ==================== 富文本字符上限（纯逻辑，不依赖 wangEditor） ====================

// 只统计可见纯文本：text 节点算长度，元素递归 children；
// 图片等 void 元素没有文字，始终为 0，不计入长度

export function nodeTextLength(node) {
  if (!node) return 0;
  if (typeof node.text === 'string') return node.text.length;
  if (Array.isArray(node.children)) {
    return node.children.reduce((sum, child) => sum + nodeTextLength(child), 0);
  }
  return 0;
}

// 包装编辑器方法，超过 maxLength 时直接丢弃输入，光标位置不受影响；
// 删除文字后剩余额度恢复，可继续输入，交互与 textarea maxLength 一致。
// 统计口径与计数一致：换行、空格都算 1 个字符，图片/html 标签不计。

export function applyMaxLength(editor, getMaxLength) {
  const countText = () => editor.getText().length;

  const original = {
    insertText: editor.insertText,
    insertNode: editor.insertNode,
    insertFragment: editor.insertFragment,
    dangerouslyInsertHtml: editor.dangerouslyInsertHtml,
    insertBreak: editor.insertBreak,
  };

  // 输入文字（打字 / 空格 / IME 上屏），超出部分截断
  editor.insertText = (text) => {
    const left = getMaxLength() - countText();
    if (left <= 0) return;
    if (typeof text === 'string' && text.length > left) text = text.slice(0, left);
    original.insertText(text);
  };

  // 插入节点（图片、链接、表格、粘贴富文本节点等）
  editor.insertNode = (node) => {
    const nodeLen = nodeTextLength(node);
    if (nodeLen === 0) return original.insertNode(node); // 图片等不计字符，始终允许
    const left = getMaxLength() - countText();
    if (left <= 0 || nodeLen > left) return;
    original.insertNode(node);
  };

  // 粘贴片段：逐个节点走 insertNode 校验，超出部分整体丢弃
  editor.insertFragment = (fragment) => {
    const list = Array.isArray(fragment) ? fragment : [fragment];
    for (let i = 0; i < list.length; i += 1) {
      editor.insertNode(list[i]);
    }
  };

  // 粘贴 HTML：按可见纯文本长度校验
  editor.dangerouslyInsertHtml = (html, insertToEnd) => {
    if (!html) return original.dangerouslyInsertHtml(html, insertToEnd);
    const div = document.createElement('div');
    div.innerHTML = html;
    const textLen = (div.textContent || '').length;
    const left = getMaxLength() - countText();
    if (left <= 0 || textLen > left) return;
    original.dangerouslyInsertHtml(html, insertToEnd);
  };

  // 回车换行占 1 个字符
  editor.insertBreak = () => {
    const left = getMaxLength() - countText();
    if (left <= 0) return;
    original.insertBreak();
  };

  return countText;
}
