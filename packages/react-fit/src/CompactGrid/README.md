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
  <div>
    <Field name="keyword" />
  </div>

  <div>
    <Field name="owner" />
  </div>

  {showAmount && (
    <div className="field-with-actions">
      <Field name="amount" />
      <CompactGrid.ExtraSlot />
    </div>
  )}

  {showStatus && (
    <div className="field-with-actions">
      <Field name="status" />
      <CompactGrid.ExtraSlot />
    </div>
  )}

  {showExtra && (
    <CompactGrid.Extra>
      <button type="reset">Reset</button>
    </CompactGrid.Extra>
  )}
</CompactGrid>
```

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
- 普通 grid cell 的数量刚好填满当前列数。
- 最后一个普通 grid cell 包含 active `ExtraSlot`。

当前列数由根元素的 computed `grid-template-columns` 推导，并会在根元素 resize 时重新测量。

## 约定

`ExtraSlot` 应该放在普通 grid cell 内部。组件会检查最后一个普通 grid cell 是否包含 active slot。

`CompactGrid` 允许多个候选 `ExtraSlot`，但只支持一个 `Extra`。

如果没有 `ExtraSlot` 挂载，`Extra` 会保持默认位置，不会被移动或吞掉。

如果 `Extra` 卸载，内部保存的 extra 内容会被清空，`ExtraSlot` 也会隐藏。

## Props

`CompactGrid` 支持和 `FitGrid` 一致的布局参数：

- `minItemWidth`：必填，每个 grid item 在减少列数前应尽量保持的最小 inline size。
- `minColumns`：可选，Grid 应尝试保持的最小列数。
- `maxColumns`：可选，Grid 最多可创建的列数。
- `colGap`：可选，列间距。
- `rowGap`：可选，行间距；未传入时默认等于 `colGap`。
