# dnd-kit 学习笔记

> 以 `src/components/TabsChangeBasicAntd.jsx` 为教材的逐段讲解。

## 总纲

这个文件其实只有两个"演员"：

- `SortableTabNode`（每个可拖的 tab 是谁）
- 主组件（拖完怎么重排）

其余全是脚手架。

---

## 第 1 段：imports

```js
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
```

四个包分工很清晰：

| 包 | 管什么 | 这里用到 |
|---|---|---|
| `@dnd-kit/core` | 底层引擎：谁拖、拖到哪、命中谁 | `DndContext` `closestCenter` `PointerSensor` |
| `@dnd-kit/sortable` | 在核心上叠加"排序"语义 | `useSortable` `SortableContext` `arrayMove` |
| `@dnd-kit/utilities` | 工具函数 | `CSS`（transform 转字符串） |
| `@dnd-kit/modifiers` | 位移约束 | `restrictToHorizontalAxis` |

> 记住这条分界线：**sortable 包不会自己工作，它站在 core 之上**。用 `useDraggable` 时（TabsChangeBasicAntd2 那个组件）就不需要 sortable 包了。

---

## 第 2 段：`toStrKey`

```js
const toStrKey = (key) => String(key);
```

一个 5 行的函数，却是**实战里最容易踩坑的地方**。antd 的 `tab.key` 可能是数字，dnd-kit 内部用 Map/Set 存 id，`1` 和 `'1'` 在 JS 里是**两个不同的键**。不统一转字符串，会出现"明明拖到它上面了，`over` 却是 null"。这一段省不了。

---

## 第 3 段：`SortableTabNode` —— 这个文件的灵魂

```js
const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
```

`useSortable` 一次给 6 样东西，**每一样都有严格的去处**：

| 返回值 | 用途 | 必须绑在哪 |
|---|---|---|
| `setNodeRef` | 告诉 dnd-kit"这个元素就是 id 对应的 DOM"，dnd-kit 要量它的宽高、算它的中心 | 包裹节点的**外层 span**（`ref={setNodeRef}`） |
| `listeners` | 拖拽的起点（pointerdown/move/up） | **只绑手柄**，这样点 tab 文本还是正常切换选中 |
| `attributes` | 无障碍属性（aria-role 等） | 同手柄，跟着 listeners 走 |
| `transform` | 拖拽时该节点要位移多少（`{x,y,scaleX,scaleY}`） | 转成 CSS 字符串塞进 `style.transform` |
| `transition` | 拖完后的回弹动画样式字符串 | 同 `style.transition` |
| `isDragging` | 当前是否正被拖 | 用来加 zIndex / 半透明样式 |

`transform` 是 dnd-kit 排的核心——**为什么是它，而不是"拖到哪就把 DOM 插到哪"**？因为拖的过程中 antd 的 DOM 结构**完全没变**，只是把当前 tab 用 `translate3d` 挪走，同时其他 tab 因为 strategy 算出各自的位移给它让位。排序是"视觉上的假象"，真的重排发生在 `handleDragEnd` 的 `arrayMove`。

`style` 的写法有个细节：

```js
transform: CSS.Translate.toString(transform)
```

dnd-kit 给的 `transform` 含 `scaleX/scaleY`（这就是最早文字被压扁的元凶），`CSS.Transform.toString` 会全部输出，`CSS.Translate.toString` 只要位移。

最后 `React.cloneElement(node, { children: [手柄, ...原children] })`：antd 已经把 tab 渲染好了，我们不重写它，只是**克隆一份、在手柄插进 children 最前面**。手柄和文本在同一个 `.ant-tabs-tab` 里，所以 antd 的 ink-bar 下划线照样对齐——这是**借 antd 的壳，不打破它**。

---

## 第 4 段：状态与传感器

```js
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));
```

`useSensor` 是把"传感器类型 + 配置"实例化，`useSensors` 把它们包成数组。`distance: 3` 意味着手指/鼠标动 3px 以内不算拖拽、算点击——所以 tab 切换正常，用力拖才触发排序。

`handleDragEnd` 是**唯一真正改数据的地方**：

```js
const oldIndex = tabs.findIndex(t => toStrKey(t.key) === toStrKey(active.id));
const newIndex = tabs.findIndex(t => toStrKey(t.key) === toStrKey(over.id));
const newTabs = arrayMove(tabs, oldIndex, newIndex);
setTabs(newTabs);
onChange?.(newTabs);
```

流程就是：找到"拖的是谁"（`active`）→ 找到"落在谁上面"（`over`）→ `arrayMove` 把 A 挪到 B 的位置 → 更新状态。**拖拽过程中看到的全部位移都只是动画，只有这一下才真正改变数组顺序**——这就是 dnd-kit 的整个设计哲学。

---

## 第 5 段：renderTabBar 接线 —— 和 antd 的"联姻"

```js
renderTabBar={(tabBarProps, DefaultTabBar) => (
  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToHorizontalAxis]}>
    <SortableContext items={tabs.map(t => toStrKey(t.key))} strategy={horizontalListSortingStrategy}>
      <DefaultTabBar {...tabBarProps}>
        {(node) => <SortableTabNode key={node.key} id={toStrKey(node.key)} node={node} />}
      </DefaultTabBar>
    </SortableContext>
  </DndContext>
)}
```

这层结构是 antd 4 特有的接缝：`DefaultTabBar` 的 children 传一个**渲染函数**，antd 内部（rc-tabs 的 TabNavList）会对每个 tab 调用它，把渲染好的节点交给你。在这里把每个节点"包"成 `SortableTabNode`。

三层的作用：

- `DndContext`：**整个拖拽的边界**。`collisionDetection` 定"谁算命中"，`modifiers` 定"位移能往哪走"，`sensors` 定"怎么才算拖"。（曾把 `restrictToParentElement` 塞在这，结果宽 tab 中心到不了最后——就是这层管的。）
- `SortableContext`：**告诉 dnd-kit"这一串是一组的、按水平排"**。`items` 列出所有成员，`strategy` 决定让位算法（水平的就水平让位）。没有它，useSortable 也能跑，但不会互相让位。
- `DefaultTabBar` + 渲染函数：antd 的默认栏。**让 antd 继续管选中、ink-bar、内容渲染，我们只管加拖拽**。

关键理解：`DndContext` 只有一个，`SortableContext` 可以有多个（嵌套分组），`useSortable` 每个节点一个。**越往里的越具体**。

---

## 一句话总结全文件

> `useSortable` 只负责"这个 tab 拖起来长什么样"；`SortableContext + strategy` 负责"兄弟们怎么让位"；`DndContext + closestCenter + modifiers` 负责"拖到哪算到哪"；`arrayMove` 负责"放下的那一瞬间真正排序"。
