# InlineOverflow

`InlineOverflow` 用于测量单行内容是否发生横向溢出，并根据派生的 `overflow` 状态组合附属 UI。
它不内置 Tooltip、Popover、展开按钮或具体布局。

它适合表格单元格、名称、路径和标签等宽度受限的单行内容。不适合多行截断、纵向书写模式、
复杂 transform 或需要反事实测量的场景。

## Import

```tsx
import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
```

## Basic Example

Root 不提供默认布局样式。下面使用 Tailwind 建立 inline flex 布局，并允许 Content 收缩：

```tsx
function NameCell({ name }: { name: string }) {
  return (
    <InlineOverflow className="inline-flex max-w-full min-w-0">
      <InlineOverflow.Content className="min-w-0 flex-1">
        {name}
      </InlineOverflow.Content>

      <InlineOverflow.Accessory asChild>
        <button type="button" aria-label={`Show ${name}`}>
          More
        </button>
      </InlineOverflow.Accessory>
    </InlineOverflow>
  );
}
```

首次可信测量完成后，`onOverflowChange` 一定会调用。之后仅在布尔状态发生变化，或者 Root、Content
元素发生替换并完成新的首次测量时调用。

溢出时，Root 带有空值的 `data-overflow` attribute。未溢出时，该 attribute 不存在。Content 和
Accessory 不重复暴露 overflow dataset。

## Accessory Layout

Accessory 只根据 `overflow` 状态显示或隐藏，不参与溢出判定，也不要求与 Content 位于同一行。
一个 Root 可以包含多个 Accessory。

以下示例将 Accessory 放在 Content 的下一行：

```tsx
<InlineOverflow className="grid w-64 min-w-0 gap-1">
  <InlineOverflow.Content className="min-w-0">
    {description}
  </InlineOverflow.Content>

  <InlineOverflow.Accessory asChild>
    <button type="button" onClick={openDetails}>
      Show details
    </button>
  </InlineOverflow.Accessory>
</InlineOverflow>
```

未溢出时，Accessory 不渲染 DOM 节点。溢出后，Accessory 才会挂载并进入调用方定义的布局。
因此 Accessory 内部状态会在隐藏时销毁，ref 也会收到 `null`。

## As Child

Root、Content 和 Accessory 都支持 `asChild`。组件会将 ref、状态属性和核心行为样式合并到唯一 child：

```tsx
<InlineOverflow asChild onOverflowChange={handleOverflowChange}>
  <div className="flex w-full min-w-0">
    <InlineOverflow.Content asChild>
      <a className="min-w-0 flex-1" href={url}>
        {label}
      </a>
    </InlineOverflow.Content>

    <InlineOverflow.Accessory asChild>
      <button type="button">More</button>
    </InlineOverflow.Accessory>
  </div>
</InlineOverflow>
```

## Styles And Layout

组件只内置与行为直接相关的样式：

- Content 强制使用 `white-space: nowrap`、`overflow: hidden` 和 `text-overflow: ellipsis`。
- Root 不提供默认样式。

调用方需要让 Root 形成可测量的盒子并提供实际宽度约束，同时决定 Content 如何获得和收缩宽度。
可以使用 flex、grid、block 或其他符合 UI 设计的布局。

在 flex 布局中，通常需要为 Content 设置 `min-width: 0`。在 grid 布局中，通常需要使用
`minmax(0, 1fr)`，或者同样为 Content 设置 `min-width: 0`。

Root padding 会参与测量。组件比较 Content 的 `scrollWidth` 与 Root 扣除 inline padding 后的
content box width，并使用固定的 `0.5px` EPSILON 减少临界值抖动。

## Observation

组件使用共享 ResizeObserver 监听 Root 和 Content 的盒子尺寸，并使用 MutationObserver 监听 Content
subtree 中的文本和子节点变化。所有观察结果通过 double requestAnimationFrame 合并测量。

MutationObserver 不观察 attributes。仅修改 class、style、继承样式、已加载字体或伪元素内容时，如果 Root
和 Content 的盒子尺寸都没有变化，组件不保证重新测量。当前不提供手动 remeasure API。

首次客户端测量前，内部 overflow 状态为 `false`，`data-overflow` 不存在，Accessory 不渲染。
当前不提供 `defaultOverflow` 或受控 `overflow`。

## Boundaries

- 只支持 horizontal writing mode，不支持 `vertical-rl`、`vertical-lr` 或 sideways writing mode。
- `direction: ltr` 和 `direction: rtl` 都可以使用；浏览器负责文本方向和省略号位置。
- 一个 Root 只应包含一个 Content。Content 是唯一的测量节点。
- Accessory 必须位于对应 Root 的 React context 中，但其 DOM 布局位置不需要与 Content 相邻或同行。
- Content 的目标可用宽度应由 Root 的 content box 表达；额外的人为 Content 宽度限制不属于当前测量模型。
- 不支持多行截断、复杂 transform 和浏览器未反映到观测尺寸中的视觉变化。

### Ellipsis Precision

浏览器的文本布局和 ellipsis 绘制可以使用亚像素精度，但 JavaScript 暴露的 `scrollWidth` 和
`clientWidth` 无法提供等价的高精度信息。

在极限临界范围内，即使 Root 中只有 Content，且 JavaScript 读取到
`content.scrollWidth === content.clientWidth`，浏览器仍可能已经触发 ellipsis。此时组件可能报告
`overflow: false`，但页面上已经出现省略号。在很小范围内连续调整 Content 宽度时，这种差异尤其容易出现。

CSSWG 的 [issue #4123: It should be detectable whether an element ellipsized the text](https://github.com/w3c/csswg-drafts/issues/4123)
记录了同一个浏览器平台问题：在 ellipsis 出现的像素临界点，尺寸取整可能使 `scrollWidth`、`clientWidth`
甚至 DOMRect 的查询结果相同。

固定的 `0.5px` EPSILON 用于减少数值比较抖动，但无法恢复浏览器没有暴露的亚像素 scroll width，
因此当前没有可靠方式完全处理该极限情况。
