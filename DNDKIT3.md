# dnd-kit 学习笔记

> 写给自己的笔记：怎么理解、怎么上手、踩过哪些坑。
> 不讲教条，讲"我当时是怎么想明白的"。

---

## 1. 这库到底在解决什么问题

说白了我折腾这么多天，dnd-kit 帮我干的事就三件：

1. **监听鼠标/手指**，告诉我"从哪开始拖了、拖到哪了、松手了"
2. **判断**我拖的这个东西现在"压在谁上面"
3. **算出一堆位移**，让我把视觉动效做出来

而**最重要的数据（数组排序）完全是我自己管的**。这跟我一开始想的"拖拽库应该直接帮我排好序"不一样——但它设计得对，因为它不知道我的业务数据长啥样。

第一次豁然开朗的时刻：**拖拽过程中你看到的"排序"，只是位移假象，DOM 一个都没动过。真正重新排列，是松手那一瞬间我自己调 `arrayMove` 干的。**

---

## 2. 一张图记住整个框架

```
传感器 Sensor（谁来拖、怎么算开始）
   ↓
DndContext（老大，仲裁一切）
   ├─ collisionDetection：拖的东西落在谁头上 → over
   ├─ modifiers：只能往哪动
   └─ onDragEnd：松手了，改数据！
   ↓
useSortable / useDraggable（每个节点的"手"）
   ↓
transform / transition → style
```

之后看任何 dnd-kit 代码，我都会在脑子里往这张图里放。放得进去 = 看懂了。

---

## 3. 上手第一课：先分清"两套模式"

我走了弯路，是因为一开始没分清 dnd-kit 有两套完全不同的玩法：

**模式 A：transform 位移（sortable 那套）**
- 被拖的节点本身跟着鼠标移动，兄弟节点自动让位
- 用 `useSortable` + `SortableContext` + `strategy`
- 适合：列表、Tab 栏、网格排序

**模式 B：DragOverlay 浮层**
- 原节点原地不动（做半透明），另外渲染一个"幽灵层"跟在鼠标后面
- 用 `useDraggable` + `<DragOverlay>`
- 适合：跨区域拖放、要"插入线"那种效果

我的 Tab 排序组件两个版本就是这两套模式的对照实验：
- `TabsChangeBasicAntd.jsx` = 模式 A
- `TabsChangeBasicAntd2.jsx` = 模式 B（antd 蓝线那个）

模式 B 有个天然好处：浮层是 Portal 渲染到 body 顶层的，**它和原 DOM 完全分离**，所以不存在"文字被 scale 压扁"那种问题——后面会讲这个坑。

---

## 4. Sensor：它就是个"翻译官"

我的理解：dnd-kit 不想为鼠标、触摸、键盘各写一套逻辑，所以整了个 Sensor 概念，把不同的输入都翻译成统一的拖拽事件。

```js
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 3 },  // 移动3px才算拖，否则算点击
  })
);
```

`PointerSensor` 一个顶俩（鼠标+触摸），移动端也能用。

**activationConstraint 是我最常用的配置**，不配它的话，你点一下 tab 都会触发拖拽，很烦。`distance: 3` 就是"手抖 3px 以内不算拖"。之前试过 `delay`（按住 0.2 秒才激活），对"点一下"的场景反而迟钝，最后还是回到 `distance`。

---

## 5. DndContext：所有属性都是"规定"

`DndContext` 是老大，它一开口，下面全得听。我常用就这几个属性：

```jsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={...}
  onDragMove={...}
  onDragEnd={handleDragEnd}
  modifiers={[restrictToHorizontalAxis]}
>
```

理解方式：**`collisionDetection` 是裁判，`modifiers` 是画红线，`onDragEnd` 是交答卷**。改数据只准在 `onDragEnd` 里改，其他回调里改容易出灵异 bug。

`onDragMove` 注意：它是高频事件，别在里面做重活（我那个蓝线版就是在里面算插入位置，所以计算量很小，没卡）。

---

## 6. collisionDetection：决定"落在谁头上"

这 4 个算法的差别，我用大白话记：

| 算法 | 大白话 | 什么时候用 |
|---|---|---|
| `closestCenter` | 谁的中心离我近，就算我压着谁 | **默认首选**，排序都用它 |
| `closestCorners` | 我任何一个角够着谁就算谁 | 宽的块拖到边界想要更灵敏时 |
| `rectIntersection` | 我俩矩形碰到就算 | "覆盖即选中"的直觉 |
| `pointerWithin` | 我的指针真在谁身上才算 | 要求很严格时才用 |

**我踩过的真实坑**（记录一下）：第一个 Tab 很宽，我拖它想去最后面，结果怎么都拖不过去，鼠标移到最后才勉强触发。原因是 `closestCenter` 比的是**中心点**，而我还加了 `restrictToParentElement` 把位移钳住了——宽 tab 的中心永远够不到最后一个窄 tab 的中心。

我的解法：**去掉 `restrictToParentElement`，只留 `restrictToHorizontalAxis`**。为什么去掉钳制后不会拖出界？因为 sortable 的策略会让被拖项在插槽间"跳跃排位"，它的右边缘会跟着目标插槽走，本来就在栏内。**钳制反而把正确的事做坏了。**

这个坑让我彻底明白：`collisionDetection` 和 `modifiers` 是一对，要一起想，不能各调各的。

---

## 7. useSortable 返回的东西往哪绑，背下来就行

```js
const {
  attributes,    // 无障碍属性 → 绑手柄
  listeners,     // 拖拽监听 → 绑手柄（千万别绑整个节点，否则点都点不了）
  setNodeRef,    // dnd-kit 要量你 → 绑最外层
  transform,     // 位移 → style.transform
  transition,    // 回弹动画 → style.transition
  isDragging,    // 是否在拖 → 加 zIndex/半透明
} = useSortable({ id });
```

分配逻辑其实很好记：
- **listeners 只绑"拖拽起点"（手柄）**。因为点击 tab 文本要正常切换，拖拽只能从手柄开始。
- **setNodeRef 绑最外层**。因为 dnd-kit 要量这个节点的真实宽高，量错了位移全乱。

---

## 8. 最大的坑：文字为什么会被压扁（记重点）

dnd-kit 有个"贴心"功能：会自动给 transform 加 `scaleX/scaleY`，数值 = 被拖项宽度 ÷ 目标项宽度。也就是说**你把宽的拖到窄的上面，它会帮你把被拖的压扁**——这设计本来是想让大小不同的元素切换时更平滑。

问题来了：我的 Tab 栏第一个 label 特别长，拖到短 label 的位置，浮层文字当场被压成条。用了两三个小时才定位到：

```js
// 之前：会把 scaleX/scaleY 一起输出 → 文字被压扁
transform: CSS.Transform.toString(transform),
// 之后：只要位移，丢掉缩放 → 文字永远原样
transform: CSS.Translate.toString(transform),
```

`CSS` 是 `@dnd-kit/utilities` 里的工具，负责把 `{ x, y, scaleX, scaleY }` 这个对象拼成 CSS 字符串。三个方法：

- `CSS.Transform.toString` → `translate3d(...) scaleX(...) scaleY(...)`
- `CSS.Translate.toString` → 只 `translate3d(...)`
- `CSS.Scale.toString` → 只缩放

**凡是排序组件，无脑用 `CSS.Translate` 就对了**，除非你真的想要缩放效果。

---

## 9. DragOverlay：另一种思路

模式 B 的核心代码（简版）：

```jsx
const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });

<DndContext onDragStart={setActiveId} onDragEnd={handleDrop}>
  <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'ghost' : ''}>
    {content}   {/* 拖的时候只是变半透明，不移动 */}
  </div>

  <DragOverlay>
    {activeId ? <FloatingContent /> : null}  {/* 幽灵层，自己渲染一份 */}
  </DragOverlay>
</DndContext>
```

心得：
- **`useDraggable` 比 `useSortable` 更底层**，它什么都不帮你算，连"落在谁头上"都要自己搞（我那个蓝线版就是 `onDragMove` 里拿坐标手动算插入位置的）。
- **好处是自由**：可以搞出"插入线"这种 sortable 做不出来的效果。
- 浮层里的内容要**自己再渲染一份**，所以如果内容很重，得注意性能。

一句话：**追求省事用 sortable，追求效果用 DragOverlay。** 两个我都写过了，心里有数。

---

## 10. 松手那一下：数据怎么改

sortable 版：

```js
const oldIndex = tabs.findIndex(t => String(t.key) === String(active.id));
const newIndex = tabs.findIndex(t => String(t.key) === String(over.id));
const newTabs = arrayMove(tabs, oldIndex, newIndex);
setTabs(newTabs);
```

**两个不起眼但致命的细节：**

1. **key 必须统一转字符串**。antd 的 key 可能是数字，dnd-kit 内部用 Map 存 id，`1` 和 `'1'` 是两个东西，不统一你会遇到"拖到它上面了但 over 是 null"这种鬼问题。
2. `over` 可能是 `null`（拖到没人的地方松手），先判空再算。

DragOverlay 版（插入线逻辑）：

```js
// 算出插入位置后
newTabs.splice(sourceIndex < insertIndex ? insertIndex - 1 : insertIndex, 0, moved);
```

---

## 11. 我的排查流程（以后照这个走）

遇到拖拽 bug，按顺序问自己：

1. **是不是 id 没统一转字符串？**（数字 key 最常见的坑）
2. **transform 是用 CSS.Translate 还是 CSS.Transform？**（文字变样 = 缩放没丢）
3. **collisionDetection 和 modifiers 是不是互相打架？**（拖不到某处 = 大概率这俩冲突）
4. **是不是没包 SortableContext / strategy 不对？**（兄弟不主动让位）
5. **数据是不是在 onDragEnd 之外改了？**（拖一半布局乱跳 = 改早了）

---

## 12. 结尾的一点感悟

学 dnd-kit 最容易被绕晕的地方，是它"什么都不帮你做"——排序自己写、浮层自己渲染、连落点都可以自己算。但这恰恰是它的优点：**它只做好"拖"这一件事，剩下的全是你的。** 想通这点，用起来反而心里踏实：出 bug 的时候，你知道问题要么出在"传感器/仲裁"（dnd-kit 负责），要么出在"我改数据的时机和位置"（我负责），一目了然。
