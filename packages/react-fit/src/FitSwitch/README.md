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

`FitSwitch` 不为 view 注入展示或布局样式，只在当前未选中的 view 上添加空值的
`data-fit-inactive` attribute，并通过 `inert` 阻止它的交互和焦点进入。当前展示的 view 不带该
attribute。

当当前展示的 Expanded 因自身观测宽度变化而放不下时，Expanded 会在切换为 inactive 的同时短暂获得
空值的 `data-fit-invalidated` attribute，并至少保留一个绘制帧。它表示 Expanded 已经更新，不适合再
作为旧内容执行退出动画。调用方可以用它关闭这一次 transition，同时保留 Collapsed 的进入动画。
Collapsed 切换到 Expanded 以及 Container 宽度变化都不会添加该 attribute，因此仍可执行正常的双向
切换动画。

调用方需要让 inactive view 脱离常规流并在视觉上隐藏它。普通场景可以根据 dataset 设置
`position: absolute` 和 `opacity: 0`；动画场景也可以使用 transform 将 view 移到裁切容器外。不能使用
`display: none`，否则组件无法继续测量它的 border box。

```tsx
const viewClassName =
  'data-fit-inactive:absolute data-fit-inactive:opacity-0 data-fit-invalidated:transition-none';
```

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

Expanded 的 border-box 变化不进入该调度队列，而是在 ResizeObserver 回调中立即重新判定 mode。
这使动态内容产生的最终 mode 可以在当前绘制前提交；如果当前展示的 Expanded 因此切换为 Collapsed，
`data-fit-invalidated` 会在最终布局至少完成一次绘制后移除。

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
- inactive view 不能使用 `display: none`，否则 ResizeObserver 无法得到有效的所需宽度。

这些边界通过文档约束，不增加运行时样式分析、DOM 克隆或同步布局兼容。此类兼容实现工作量和性能成本较高，
但在常规后台管理页面中的收益通常有限。如果页面无法满足上述布局约定，开发者应为该场景实现自定义切换或
测量逻辑。
