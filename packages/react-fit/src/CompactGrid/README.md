# CompactGrid

`CompactGrid` 使用和 `FitGrid` 相同的自适应 grid 布局，并在满足紧凑条件时，把 `Extra`
渲染到当前有效的 `ExtraSlot` 中，避免 extra 单独占据新的一整行。

它适合查询表单、工具栏、筛选区等场景：主体字段按可用空间自动排列，额外操作在空间不足以独立放置时，
可以收进最后一个字段附近的插槽里。

## Import

```tsx
import { CompactGrid } from '@guanriyue/react-fit/compact-grid';
```

## Example

```tsx
<CompactGrid minItemWidth="14rem" maxColumns={3} colGap="0.75rem" rowGap="1rem">
  <CompactGrid.Item>
    <Field name="keyword" />
  </CompactGrid.Item>

  <CompactGrid.Item>
    <Field name="owner" />
  </CompactGrid.Item>

  {showAmount && (
    <CompactGrid.Item colSpan={2} className="field-with-actions">
      <Field name="amount" />
      <CompactGrid.ExtraSlot />
    </CompactGrid.Item>
  )}

  {showStatus && (
    <CompactGrid.Item className="field-with-actions">
      <Field name="status" />
      <CompactGrid.ExtraSlot />
    </CompactGrid.Item>
  )}

  {showExtra && (
    <CompactGrid.Extra>
      <button type="reset">Reset</button>
    </CompactGrid.Extra>
  )}
</CompactGrid>
```

## Item

`CompactGrid.Item` 用来声明一个参与紧凑计算的 grid item。推荐使用 `Item` 包裹主体字段，因为它的语义更清晰，
并且是唯一值得信赖的跨列组件。

普通元素也可以直接作为 `CompactGrid` 的子节点使用。它的优势是少一层 DOM；但在内部计算中，普通元素总是被视为
`span: 1` 的 item。即使普通元素自己设置了 `grid-column`，`CompactGrid` 也不会读取它的跨列结果。
如果因此导致视觉布局和内部紧凑计算存在差异，需要由开发者自己负责。

```tsx
<CompactGrid.Item colSpan={2}>
  <Field name="range" />
</CompactGrid.Item>
```

`colSpan` 支持正整数和 `'full'`：

- `colSpan={2}`：当前 item 跨 2 列。
- `colSpan="full"`：当前 item 占据整行。
- 未传入 `colSpan`：按 1 列计算。

当数字 `colSpan` 大于当前显式列数时，组件会按整行处理。比如当前只有 1 列时，`colSpan={2}`
等价于 `colSpan="full"`。这可以避免 CSS Grid 为越界 span 创建可见的隐式列，并保持列数判断稳定。

`ExtraSlot` 可以放在 `Item` 内部任意位置。`colSpan="full"` 的 `Item` 也可以包含 active `ExtraSlot`；
它的语义是当前 grid cell 占据整行，而不是禁止在内部渲染额外内容。

## Extra

`CompactGrid.Extra` 用来声明额外内容的默认位置。

非紧凑模式下，它会作为一个普通 grid cell 渲染。紧凑模式下，它自身不会渲染，children 会移动到当前有效的
`ExtraSlot` 中。

一个 `CompactGrid` 中只应存在一个 `Extra`。如果需要控制额外内容是否出现，直接条件渲染这个 `Extra`。

`Extra` 的内容为 `null`、`undefined` 或 `false` 时，会被视为没有 extra。此时 `CompactGrid` 不会进入紧凑模式，
所有 `ExtraSlot` 都会隐藏。

## ExtraSlot

`CompactGrid.ExtraSlot` 用来声明额外内容在紧凑模式下可以移动到哪里。

一个 `CompactGrid` 中可以存在多个 `ExtraSlot`。组件会使用当前 DOM 顺序中的最后一个有效插槽作为 active slot。
这样可以配合条件渲染：当靠后的字段被隐藏时，额外内容会回退到仍然存在的最后一个插槽。

非紧凑模式下，或者当前插槽不是 active slot 时，`ExtraSlot` 会通过 `hidden` 隐藏，避免空的 `span`
影响布局。

## 紧凑条件

`CompactGrid` 只有在以下条件同时满足时才会进入紧凑模式：

- 存在有效的 `Extra` 内容。
- 存在 active `ExtraSlot`。
- 最后一个有效 item 包含 active `ExtraSlot`。
- 按 item 的 span 计算后，最后一个有效 item 刚好填满当前行。

当前列数由根元素的 computed `grid-template-columns` 推导，并会在根元素 resize 时重新测量。
为了避免数字 `colSpan` 越界时污染列数判断，`CompactGrid` 会把隐式列压到 0 宽，并在统计列数时忽略这些不可见 track。

`CompactGrid` 会把根元素下非 `Extra` 的元素子节点合并成一个 layout item 列表。普通元素按 `span: 1`
计算；`CompactGrid.Item` 按自己的 `colSpan` 计算。需要跨列时，应使用 `CompactGrid.Item`，因为普通 DOM
节点的跨列结果难以稳定观测。

## 约定

`ExtraSlot` 应该放在普通直接子节点或 `CompactGrid.Item` 内部。组件会检查最后一个有效 item 是否包含
active slot。

`CompactGrid` 允许多个候选 `ExtraSlot`，但只支持一个 `Extra`。

`CompactGrid.Item` 和 `CompactGrid.Extra` 应作为同级节点使用，不应互相嵌套。

`CompactGrid.Item` 不应嵌套另一个 `CompactGrid.Item`。当前紧凑计算只处理同一层级的 item registry。

不要在 `CompactGrid` 根节点下直接放置文本节点。当前实现只会测量元素节点，文本节点无法被注册或稳定测量。

如果没有 `ExtraSlot` 挂载，`Extra` 会保持默认位置，不会被移动或吞掉。

如果 `Extra` 卸载，内部保存的 extra 内容会被清空，`ExtraSlot` 也会隐藏。

## Props

`CompactGrid` 支持和 `FitGrid` 一致的布局参数：

- `minItemWidth`：必填，每个 grid item 在减少列数前应尽量保持的最小 inline size。
- `minColumns`：可选，Grid 应尝试保持的最小列数。
- `maxColumns`：可选，Grid 最多可创建的列数。
- `colGap`：可选，列间距。
- `rowGap`：可选，行间距；未传入时默认等于 `colGap`。

`CompactGrid.Item` 支持：

- `colSpan`：可选，正整数或 `'full'`。用于声明当前 item 在布局和紧凑计算中占据的列数。
  数字值超过当前显式列数时会按整行处理。
