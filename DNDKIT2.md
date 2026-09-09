# dnd-kit 学习笔记（从概念到使用）

> 配套阅读：`DNDKIT.md`（以 TabsChangeBasicAntd.jsx 为教材的逐段讲解）
> 本文件是系统性的 API 学习笔记。

---

## 1. 核心思想

dnd-kit 是 React 生态最流行的拖拽库，核心设计哲学一句话：

> **拖拽过程只产生"位移假象"，数据真正的变化只在放下那一刻发生。**

它不帮你管业务数据（数组怎么排由你自己用 `arrayMove` / `splice` 处理），它只负责三件事：

1. **感知输入**（鼠标 / 触摸 / 键盘）—— Sensor
2. **判定命中**（拖的东西现在落在谁上面）—— Collision Detection
3. **计算位移**（被拖项和兄弟们该怎么动）—— Modifier + Strategy

---

## 2. 一条数据流（最重要的一张图）

```
传感器 Sensor 捕获输入
   ↓
DndContext 仲裁：算 collision → 得到 over（落在谁头上）
   ↓
useSortable / strategy 按 over 计算每个节点的 transform
   ↓
你（业务代码）把 transform 塞进 style.transform
   ↓
放下 → onDragEnd → arrayMove / splice 真正改数据
```

**记住这 4 环，其他全是细节。**

---

## 3. 环境与安装

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
```

| 包 | 职责 | 常用导出 |
|---|---|---|
| `@dnd-kit/core` | 底层引擎 | `DndContext`, `useDraggable`, `useDroppable`, `PointerSensor`, `MouseSensor`, `TouchSensor`, `KeyboardSensor`, `closestCenter`, `closestCorners`, `rectIntersection`, `pointerWithin` |
| `@dnd-kit/sortable` | 排序语义层 | `useSortable`, `SortableContext`, `arrayMove`, `sortableKeyboardCoordinates` |
| `@dnd-kit/utilities` | 工具 | `CSS.Transform/Translate/Scale.toString` |
| `@dnd-kit/modifiers` | 位移约束 | `restrictToHorizontalAxis`, `restrictToVerticalAxis`, `restrictToParentElement`, `restrictToFirstScrollableAncestor`, `restrictToWindowEdges`, `snapCenterToCursor`, `createSnapModifier` |

> 分界线：**sortable 包不自己工作，它站在 core 之上**。只用 `useDraggable` + `DragOverlay` 时不需要 sortable 包（TabsChangeBasicAntd2 就是例子）。

---

## 4. Sensors（传感器）—— 输入层

把不同类型的输入事件翻译成统一的拖拽事件。

| 传感器 | 适用场景 |
|---|---|
| `MouseSensor` | 仅鼠标 |
| `TouchSensor` | 仅触摸屏 |
| `PointerSensor` | 鼠标 + 触摸通用（**推荐**，一份代码两端通吃） |
| `KeyboardSensor` | 键盘无障碍拖拽 |

### 用法

```js
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 3 }, // 移动 3px 才激活拖拽
  })
);
<DndContext sensors={sensors}>...</DndContext>
```

### activationConstraint 常用配置

```js
{
  delay: 200,               // 按住 200ms 后才可拖
  distance: 5,              // 移动 5px 后才激活（推荐，避免误触）
  tolerance: 10,            // 与 delay 配合：允许指针小幅偏移
}
```

> 经验：列表/卡片拖拽用 `distance`，按钮类"按住拖"交互用 `delay`。

---

## 5. DndContext —— 整个拖拽的"大脑"

包住所有可拖拽区域的上下文。常用 props：

| prop | 作用 |
|---|---|
| `sensors` | 传入 `useSensors` 的结果 |
| `collisionDetection` | 判定"落在谁头上"，见第 7 节 |
| `onDragStart` | 拖拽开始 |
| `onDragMove` | 拖拽移动中（高频触发，别做重活） |
| `onDragOver` | `over` 发生变化时 |
| `onDragEnd` | 放下（**唯一该改数据的地方**） |
| `onDragCancel` | 拖拽取消（Esc、点击别处） |
| `modifiers` | 对位移的约束数组，见第 9 节 |
| `autoScroll` | 是否自动滚动（默认开） |
| `measuring` | 测量配置，见第 12 节 |
| `accessibility` | 无障碍提示，见第 13 节 |

### 生命周期事件顺序

```
onDragStart → onDragMove → onDragOver(可能多次) → onDragEnd / onDragCancel
```

> `onDragEnd` 的 `event` 里有 `active`（拖的是谁）和 `over`（落在谁上面，null 表示没命中）。**这里的 `over` 是排序依据的唯一来源。**

---

## 6. useDraggable / useDroppable —— 最底层的积木

### useDraggable（能拖）

```js
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

// 两个角色：
// setNodeRef → 绑在外层容器上，dnd-kit 量它尺寸
// listeners  → 绑在"拖拽起点"（手柄）上，点文本不触发拖
```

### useDroppable（能接）

```js
const { setNodeRef, isOver } = useDroppable({ id });
```

### 两者的关系

- `useDraggable` 只管"被拖的"。
- `useDroppable` 只管"目标区域"。
- 一个元素可以既是 draggable 又是 droppable（`useSortable` 就是这个组合的封装）。

> 对应 TabsChangeBasicAntd2：它只用了 `useDraggable` + `DragOverlay`，没有 droppable，命中逻辑全靠手动算插入位置。这就是"绕开 sortable"的自由——**API 越低层，自由度越高，要自己写的越多**。

---

## 7. Collision Detection（碰撞检测）—— 决定 `over`

dnd-kit 内置 4 种（都是**函数**，传函数引用，不是枚举）：

| 算法 | 判定方式 | 特点 |
|---|---|---|
| `closestCenter` | 比较活动项中心到每个 droppable 中心的距离 | 最常用，与"排序位"直觉一致；但宽项的中心可能够不到窄项边界 |
| `closestCorners` | 活动项任一角的距离 | 比 closestCenter"先到先得" |
| `rectIntersection` | 矩形相交即命中 | "覆盖即选中"手感 |
| `pointerWithin` | 指针坐标落在哪个矩形内 | 指针必须真的移进目标，最严格 |

### 自定义组合（无限种）

`collisionDetection` 只是普通函数，接收 args 返回按优先级排序的 `Collision[]`：

```js
function myDetection({ active, collisionRect, droppableContainers, droppableRects, pointerCoordinates }) {
  return [{ id: 'xxx', data: {} }]; // 顺序 = 优先级
}
```

四种常见拼法：

```js
// 1. 多策略回退（最常见）
const custom = (args) => pointerWithin(args).length
  ? pointerWithin(args)
  : closestCenter(args);

// 2. 先过滤再检测（只允许同组命中）
const groupCollision = (args) => {
  const filtered = args.droppableContainers.filter(
    c => c.data.current.group === args.active.data.current.group
  );
  return closestCenter({ ...args, droppableContainers: filtered });
};

// 3. 组合打分（指针命中加分 + 相交面积）
const scored = (args) => {
  const pointer = pointerWithin(args);
  const intersect = rectIntersection(args);
  return intersect.sort((a, b) =>
    (pointer.some(p => p.id === b.id) ? 2 : 1) - (pointer.some(p => p.id === a.id) ? 2 : 1));
};

// 4. 兜底落点（没命中时给个"末尾"虚拟位）
const withFallback = (args) => closestCenter(args)
  .concat([{ id: END_ID, data: { atEnd: true } }]);
```

> "无限种" = **怎么选（filter） + 怎么打分 + 怎么排序** 三段自由组合。

---

## 8. useSortable / SortableContext —— 排序语义层

### 职责分工

- `SortableContext`：声明"这一串 id 是一组、按什么策略排"。
- `useSortable({ id })`：给组内每个成员算位移。

```js
const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id });
```

| 返回值 | 用途 | 绑定位置 |
|---|---|---|
| `setNodeRef` | dnd-kit 量这个节点的尺寸 | 外层包裹元素 |
| `listeners` | 拖拽起点 | **手柄**（只拖手柄，不抢点击） |
| `attributes` | 无障碍属性 | 同手柄 |
| `transform` | 位移（含 scaleX/scaleY） | 转成 style.transform |
| `transition` | 回弹动画 | style.transition |
| `isDragging` | 是否正被拖 | 加 zIndex / 半透明 |
| `isOver` | 是否被别的项覆盖 | 高亮 |

### 用法骨架

```js
<SortableContext items={ids} strategy={horizontalListSortingStrategy}>
  {ids.map(id => <SortableItem key={id} id={id} />)}
</SortableContext>
```

### 常见问题：transform 怎么转成 CSS

```js
// dnd-kit 给的是 { x, y, scaleX, scaleY }
transform: CSS.Translate.toString(transform), // 只要位移（推荐：避免文字被 scale 压扁）
transform: CSS.Transform.toString(transform), // 位移 + 缩放
transform: CSS.Scale.toString(transform),     // 只缩放
```

> **坑**：dnd-kit 会按"被拖项尺寸 ÷ 目标项尺寸"生成 `scaleX/scaleY`（源码 `adjustScale`），宽页签拖到窄页签会 `scaleX < 1` 压扁文字。用 `CSS.Translate` 丢弃缩放即可。

---

## 9. Modifiers（修饰器）—— 位移约束

`modifiers` 接收变换前的坐标，返回约束后的坐标。**它改变的是"能拖到哪"**。

```js
modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
```

| 修饰器 | 作用 |
|---|---|
| `restrictToHorizontalAxis` | 只允许水平位移（纵向拖不动） |
| `restrictToVerticalAxis` | 只允许垂直位移 |
| `restrictToParentElement` | 不出父元素边界 |
| `restrictToFirstScrollableAncestor` | 限制在最近的"可滚动祖先"内 |
| `restrictToWindowEdges` | 不出窗口 |
| `snapCenterToCursor` | 中心吸附光标 |
| `createSnapModifier(gridSize)` | 网格吸附 |

> **坑**：`restrictToFirstScrollableAncestor` 依赖 dnd-kit 的 `isScrollable`（正则匹配 `auto|scroll|overlay`），**`overflow: hidden` 不被识别**。antd 的 `.ant-tabs-nav-wrap` 正是 `overflow: hidden`，所以它会被跳过、回落到 window，表现为"拖拽能拖出 tab 栏"。
>
> 另一坑：`restrictToParentElement` 会钳制中心点位移，当"宽的被拖项中心"永远够不到"末尾窄项中心"时，`closestCenter` 就永远命中不了最后一项 → 表现为"拖不到最后"。此时应**去掉钳制，只留方向约束**（sortable 策略本身会按插槽排布，自然不出界）。

---

## 10. Strategy（排序策略）—— 兄弟们怎么让位

传入 `SortableContext` 的 `strategy`，决定每个非拖拽项如何腾出空间。

| 策略 | 场景 |
|---|---|
| `horizontalListSortingStrategy` | 水平列表 / Tab 栏 |
| `verticalListSortingStrategy` | 垂直列表 |
| `rectSortingStrategy` | 网格 / 多行混合 |
| `rectSwappingStrategy` | 网格"交换"式（两个位置互换，非让位） |

> 注意：让出的插槽宽度 = **被拖项**的宽度。所以"目标区域自动变成被拖项的宽"是策略自带的，不需要额外代码。

---

## 11. DragOverlay —— 浮层预览

把被拖内容渲染到 body 顶层（Portal），跟随光标，不会挤占布局：

```js
const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

<DndContext onDragStart={...} onDragEnd={...}>
  <YourItem ref={setNodeRef} {...listeners} {...attributes} />  {/* 原位，拖时半透明 */}
  <DragOverlay>{isDragging ? <OverlayItem /> : null}</DragOverlay>
</DndContext>
```

### 与"transform 位移"两种模式的对比

| | transform 位移（sortable） | DragOverlay（浮层） |
|---|---|---|
| 原位节点 | 跟着 transform 走 | 原地不动（可做半透明） |
| 跟随光标 | 由 dnd-kit 计算 | Portal 渲染到顶层，天然不挤占 |
| 命中判定 | collisionDetection | 自己算（或也要 collision） |
| 文字缩放问题 | 有（CSS.Translate 规避） | 天然无 |
| 适用 | 列表/网格排序 | 跨区域拖放、需要"幽灵层"效果 |

> TabsChangeBasicAntd2 用 DragOverlay + 手动算插入位 + 蓝线，就是这套模式。

---

## 12. Measuring（测量）与性能

dnd-kit 默认在拖拽开始前测量一次所有 droppable 的矩形。常用配置：

```js
<DndContext
  measuring={{
    droppable: {
      strategy: MeasuringStrategy.WhileDragging, // 拖拽中持续测量（布局会变时用）
      frequency: MeasuringFrequency.Optimized,   // 优化频率
    },
  }}
>
```

- 布局稳定 → 默认测量一次即可。
- 拖拽中兄弟项会因 transform 移动 → 无需重新测量（transform 不占文档流）。
- 拖拽中 DOM 尺寸真的变化（如展开/收起）→ 用 `WhileDragging`。

---

## 13. Accessibility（无障碍）

- `KeyboardSensor` + `sortableKeyboardCoordinates`：键盘也能排序。
- `attributes` 提供 `aria-roledescription` 等。
- `DndContext` 的 `accessibility` prop 可自定义屏幕阅读器提示文案。

```js
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KeyboardSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

---

## 14. 实战套路总结（Decision Tree）

```
要拖什么？
├─ 单个拖放 / 跨区放置 / 要"幽灵层+插入线" → useDraggable + DragOverlay
└─ 列表/网格/Tab 排序
   ├─ 水平（Tab 栏）→ useSortable + horizontalListSortingStrategy + restrictToHorizontalAxis
   ├─ 垂直列表      → useSortable + verticalListSortingStrategy
   └─ 网格          → useSortable + rectSortingStrategy

排序判定用哪个 collision？
├─ 常规 → closestCenter
├─ 指针必须命中才换位 → pointerWithin
├─ 覆盖即选中 → rectIntersection
└─ 都不满足 → 自定义组合（过滤/打分/排序）

放下时怎么改数据？
├─ sortable → arrayMove(tabs, oldIndex, newIndex)
└─ overlay 手动 → splice 到插入位
```

---

## 15. 高频坑位速查

| 坑 | 原因 | 解法 |
|---|---|---|
| 数字 key 拖不动 / over 为 null | dnd-kit 用 Map 存 id，`1` ≠ `'1'` | 统一 `String(key)` |
| 文字被压扁 / 拉伸 | transform 带 scaleX/scaleY（adjustScale） | `CSS.Translate.toString` |
| 拖拽能拖出边界 | 约束不对 / scrollable 识别不了 hidden | 换 modifier 或去掉钳制 |
| 拖不到最后一个 | closestCenter + 钳制让中心够不到 | 去掉 restrictToParentElement |
| 点击和拖拽分不清 | 没有 activationConstraint | `distance: 3~5` |
| 拖拽时布局乱跳 | 没有 SortableContext / strategy | 补上 items + strategy |

---

## 16. 核心一句话总结

> **Sensor** 管"怎么开始拖"，**DndContext + collisionDetection** 管"拖到哪算哪"，**strategy + useSortable** 管"兄弟们怎么让位"，**modifiers** 管"能往哪走"，**arrayMove/splice** 管"放下的那一瞬间真正排序"。拖拽全程只是位移假象，数据只在 `onDragEnd` 变。
