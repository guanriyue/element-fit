# InlineOverflow

`InlineOverflow` 用于测量单行内容是否发生横向溢出，并根据派生的 `overflow` 状态组合附属 UI。
它不内置 Tooltip、Popover、展开按钮、具体布局或内容裁剪样式。

它适合表格单元格、名称、路径和标签等宽度受限的单行内容。不适合多行截断、纵向书写模式、
复杂 transform 或需要反事实测量的场景。

## Import

```tsx
import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
```

## Basic Example

Root 和 Content 都不提供默认样式。下面使用 Tailwind 建立 inline flex 布局、允许 Content 收缩，
并由调用方选择单行省略样式：

```tsx
function NameCell({ name }: { name: string }) {
  return (
    <InlineOverflow className="inline-flex max-w-full min-w-0">
      <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
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
  <InlineOverflow.Content className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
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

Root、Content 和 Accessory 都支持 `asChild`。组件会将 ref、状态属性和行为连接到唯一 child，
但不会注入展示样式：

```tsx
<InlineOverflow asChild onOverflowChange={handleOverflowChange}>
  <div className="flex w-full min-w-0">
    <InlineOverflow.Content asChild>
      <a
        className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
        href={url}
      >
        {label}
      </a>
    </InlineOverflow.Content>

    <InlineOverflow.Accessory asChild>
      <button type="button">More</button>
    </InlineOverflow.Accessory>
  </div>
</InlineOverflow>
```

`asChild` 遵循 Radix Slot 的属性合并顺序。由于 Content 不提供默认样式，普通渲染和 `asChild`
都由调用方完整控制 `white-space`、`overflow`、`text-overflow` 等属性。

## Styles And Layout

组件不提供任何默认样式。Root 负责表达目标可用宽度，Content 是唯一的测量节点；如何排版和展示
Content 完全由调用方决定。

常见的单行省略策略可以写成：

```tsx
<InlineOverflow.Content
  style={{
    minWidth: 0,
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }}
>
  {label}
</InlineOverflow.Content>
```

如果业务希望直接裁剪，可以换成 `overflow: clip`；如果只需要读取 `overflow` 状态，也可以不裁剪内容。
`overflow` 和 `text-overflow` 不参与组件的状态控制，组件不会覆盖调用方的选择。

调用方需要让 Root 形成可测量的盒子并提供实际宽度约束，同时决定 Content 如何获得和收缩宽度。
可以使用 flex、grid、block 或其他符合 UI 设计的布局。

在文本场景中，调用方需要设置 `white-space: nowrap` 或用等价方式建立单行排版。如果允许换行，内容可能
通过换行消除横向 overflow，此时结果不再表示单行内容是否放得下。

在 flex 布局中，通常需要为 Content 设置 `min-width: 0`。在 grid 布局中，通常需要使用
`minmax(0, 1fr)`，或者同样为 Content 设置 `min-width: 0`。

Root padding 会参与测量。组件比较 Content 的 `scrollWidth` 与 Root 扣除 inline padding 后的
content box width。当两者的差值落在 1px 内的临界区间且 Content 非空时，组件会使用 Range width
进行高精度补充测量。Range 可以覆盖普通单行 flow 中的文本、元素和混合内容，但它不是任意 DOM
子树的 intrinsic width；margin、伪元素、定位、transform 和多行布局仍不属于可靠测量范围。

## Observation And Scheduling

组件使用共享 ResizeObserver 监听 Root 和 Content 的盒子尺寸，并使用 MutationObserver 监听 Content
subtree 中的文本和子节点变化。

InlineOverflow 使用包级的[视窗优先级测量调度](../../README.md#视窗优先级测量调度)。Root 作为优先级
采样元素，垂直和水平方向的 near margin 均为对应视窗尺寸的一半。near 任务在 microtask 中批量执行，
far 任务优先等待 idle batch。视窗外节点的首次 overflow 状态和 Accessory 展示可能因此延后。

优先级只在实际需要调度测量时采样，不会通过 IntersectionObserver 持续跟踪。单独滚动页面不会触发
重新测量；far 任务仍会在有限批次内继续完成。大量节点都位于 near 范围时，调度器无法消除这些节点自身的
DOM、文本布局和 Range 测量成本。

首次客户端测量前，内部 overflow 状态为 `false`，`data-overflow` 不存在，Accessory 不渲染。
当前不提供 `defaultOverflow`、受控 `overflow` 或手动 remeasure API。

## Width Cache

组件缓存最近一次真实测量使用的 Root content-box width 和 overflow 结果。在 Content 和测量条件不变时，
单行内容的 overflow 与可用宽度具有单调关系：

- 已在某个宽度测得 overflow 时，宽度继续减小会复用 `true`。
- 已在某个宽度测得不 overflow 时，宽度继续增大会复用 `false`。
- 宽度向无法推断的方向变化时，重新读取 Content 并更新缓存。

该缓存主要用于跳过 Resize 动画越过 overflow 临界点之后的重复测量。Accessory 显示或隐藏可能改变
Content 获得的布局宽度并再次触发 ResizeObserver，但 Accessory 按组件约定不参与溢出判定，因此 Content
resize 本身不会使缓存失效。命中缓存时，已经排队但尚未执行的测量也会被取消或在执行入口跳过。

Root 或 Content 元素替换，以及 Content subtree 中的文本或子节点变化，会使缓存失效。MutationObserver
不观察 attributes；仅修改 class、style、继承样式、字体、伪元素内容或外部样式表时，不保证缓存失效，
即使这些变化同时引起 Content resize，也可能继续复用已有结果。

缓存还依赖 overflow 随 Root 可用宽度单调变化。通过 container query、媒体查询或其他宽度相关规则改变
Content 的文本、字体、display、white-space、writing mode 或子元素尺寸时，这一假设可能不成立。
此类场景需要由开发者保证单调关系、重新挂载测量元素，或提供更符合业务布局规则的自定义实现。

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

Range fallback 可以覆盖部分尺寸取整造成的漏判，但不同浏览器的文本布局信息仍可能存在差异，因此当前无法保证
完全处理所有极限情况。
