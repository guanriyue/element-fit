# FitSwitch

`FitSwitch` 在同一个横向可用空间内，根据 Expanded view 是否能放下，在 Collapsed 和 Expanded
两个 view 之间切换。两个 view 始终保持挂载，组件不内置具体视觉样式。

## Import

```tsx
import { FitSwitch } from '@guanriyue/react-fit/fit-switch';
```

## Example

```tsx
<div className="min-w-0">
  <FitSwitch>
    <FitSwitch.Collapsed className="inline-flex max-w-none">
      <CompactActions />
    </FitSwitch.Collapsed>

    <FitSwitch.Expanded className="inline-flex max-w-none">
      <FullActions />
    </FitSwitch.Expanded>
  </FitSwitch>
</div>
```

## Styles And Measurement

`FitSwitch` 只为当前不可见的测量 view 设置 `position: absolute`、`opacity: 0` 和
`pointer-events: none`，并通过 `inert` 阻止交互和焦点进入。组件不会设置 `inline-size` 或
`max-inline-size`。

调用方必须保证 Expanded 的 border box 能表达完整内容所需宽度，并且在 visible 和 measuring
状态之间保持相同的宽度语义。通常可以使用 `inline-flex`、`inline-block` 或等价的内在宽度样式。
如果 Expanded 使用默认块级拉伸、`width: 100%` 或其他受 Container 约束的宽度，它的 border box
可能只表示当前分配宽度，而不是完整内容所需宽度，FitSwitch 可能因此无法正确切换。

Collapsed 和 Expanded 必须是同一个 parent element 下的 sibling。该共同 parent 的 content box
被视为全部可用宽度；Expanded 的 border box 被视为所需宽度。测量不包含 view margin。

Container 使用 ResizeObserver 的 `content-box`，Expanded 使用 `border-box`。对于不提供
`borderBoxSize` 的旧实现，组件会降级到 `contentRect.width`；该值不包含 padding 和 border，结果可能
存在偏差，但避免了额外的同步布局读取。

## Scheduling

Container Resize 时，组件会采样元素与视窗的距离。视窗附近的任务在微任务中批量执行，远离视窗的任务
通过 `requestIdleCallback` 分批执行，以降低短时间内大量计算和浏览器布局造成的压力。

Idle Callback 使用 300ms timeout 防止页面持续繁忙时任务无限饥饿。这个 timeout 只是兜底策略，
不代表 300ms 对所有页面负载和任务规模都是合适的延迟或执行预算。

组件不使用 IntersectionObserver，也不持续跟踪滚动后的可见性。FitSwitch 的测量任务通常很小，
near/far 分级的目标是削平 Resize 突发，而不是长期暂停离屏任务。滚动导致的优先级暂时滞后属于预期取舍，
远处任务仍会在空闲期完成。

## Boundaries

- 共同 parent 的 content box 应完整表达 FitSwitch 可以使用的宽度。其他常规流子元素、flex/grid 分配或
  gap 额外占用空间时，测量结果可能不准确。
- 不计算 view margin、视觉 transform、outline、box-shadow，以及没有反映到观测 box 中的视觉变化。
- Container 和 Expanded 应使用一致的横向书写模式。不同 writing mode 下的 `inlineSize` 不可直接比较。
- 绝对定位内容、`contain: size`、`display: contents` 或其他不参与元素内在尺寸计算的布局，不属于可靠
  测量范围。
- 测量 view 不能使用 `display: none`，否则 ResizeObserver 无法得到有效的所需宽度。

这些边界通过文档约束，不增加运行时样式分析、DOM 克隆或同步布局兼容。此类兼容实现工作量和性能成本较高，
但在常规后台管理页面中的收益通常有限。如果页面无法满足上述布局约定，开发者应为该场景实现自定义切换或
测量逻辑。
