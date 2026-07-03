# FitGrid

`FitGrid` 使用 CSS Grid 排列子项，并根据当前元素可用空间决定能够放下多少列。

它适用于过滤表单、设置面板、操作区、卡片列表等场景：每一项都有一个最小可用宽度，但外层容器可能出现在不同尺寸的空间中。

## 设计动机

`FitGrid` 通过 item 的最小宽度来管控响应式布局，而不是通过容器宽度或断点直接决定列数。

在某些情况下，这是一种更直观的逻辑：一个元素只需要关心当前空间是否“足够”放下自己，而不需要关心整个 Box 的
`padding`、`box-sizing` 或断点分配。这让关注点更加聚合，每个 item 只表达自己的最小可用尺寸。

在 grid 布局中，大多数情况下列宽会被均分，以获得相对协调的视觉效果。这也是 `minItemWidth` 使用单值的价值：
它给出每一列的最小可接受宽度，实际列宽仍然由 Grid 根据当前空间均分。

## Import

```tsx
import { FitGrid } from '@guanriyue/react-fit/fit-grid';
```

## Example

```tsx
<FitGrid minItemWidth="14rem" maxColumns={4} colGap="0.75rem" rowGap="1rem">
  <input />
  <input />
  <input />
  <FitGrid.Item pin="row-end">
    <button>Apply</button>
  </FitGrid.Item>
</FitGrid>
```

## Props

`minItemWidth` 是必填项。它定义每个 item 的最小可用宽度，也是 `FitGrid` 最核心的布局信号。

`minColumns` 和 `maxColumns` 是可选的正整数。非法值会被忽略，并在开发环境给出警告。当 `maxColumns` 小于
`minColumns` 时，组件会在开发环境给出警告，但保留原始输入，不做额外干涉。

`colGap` 是可选项。未传入时，布局公式会将列间距视为 `0px`。

`rowGap` 是可选项，未传入时默认等于 `colGap`。

其他合法的 `div` props 会透传给根元素。

## Item

`FitGrid.Item` 用于配置 grid child 的放置方式，也可以通过 `FitGridItem` 命名导出使用。

```tsx
import { FitGrid, FitGridItem } from '@guanriyue/react-fit/fit-grid';
```

`colSpan` 支持正整数和 `'full'`：

```tsx
<FitGrid.Item colSpan={2}>跨 2 列</FitGrid.Item>
<FitGrid.Item colSpan="full">占据整行</FitGrid.Item>
```

`pin` 目前支持 `'row-end'`，表示将当前 item 放在当前行的最后一列：

```tsx
<FitGrid.Item pin="row-end">
  <button>Search</button>
  <button>Reset</button>
</FitGrid.Item>
```

`pin="row-end"` 预期用于当前布局组的最后一个节点，例如查询表单中的 submit/reset 按钮。如果开发者对中间节点设置
`pin`，产生的布局结果由开发者自行负责。

当 `colSpan` 和 `pin` 同时传入时，开发环境会给出警告，并且 `pin` 优先。

## Layout

`FitGrid` 使用 `repeat(auto-fit, minmax(..., 1fr))`。当传入列数限制时，最小 track size 会根据
`minItemWidth`、`minColumns`、`maxColumns` 和 `colGap` 推导出来。

这使得组件响应的是元素周围的可用空间，而不是 viewport breakpoint。

核心布局样式会以内联样式写入根元素，包括 `display`、`gridTemplateColumns`、`columnGap` 和 `rowGap`。这些样式是
`FitGrid` 成立所需的结构条件，会覆盖外部传入的同名 `style`。

## Label 和 Value

如果 item 内部是 label + value 的结构，通常也会希望不同 item 的 label 能够对齐。

这种情况下，label + value 应该被视为一个整体来布局，而不是让 `FitGrid` 分别理解 label 和 value。后续可以通过
context 管理这类对齐关系，或者作为独立能力继续扩展。
