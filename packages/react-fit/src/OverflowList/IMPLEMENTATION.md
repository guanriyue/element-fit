# OverflowList Implementation

本文档记录 `OverflowList` 当前的内部测量模型和调度实现。面向组件使用者的 API、dataset 和布局边界请查看
[README.md](./README.md)。

## Modules

Store 按职责拆为以下模块：

- `store/index.ts`：组装状态、元素注册表和测量 Controller。
- `store/types.ts`：Store、React state、元素记录与几何缓存类型。
- `store/state.ts`：单一 React state、订阅器和测量结果提交。
- `store/elementRegistry.ts`：Item/Accessory 生命周期、DOM 引用和 ResizeObserver。
- `store/geometry.ts`：DOMRect 读取、Item 前缀宽度和可见边界计算。
- `store/measurement.ts`：Root 观察、完整测量事务、resize 快速路径和任务调度。

DOM 引用、ResizeObserver 清理函数和几何缓存不属于 React state。React 组件只订阅
`accessoryState`、`itemVisibility`、`overflow` 和 `overflowItemsData` 组成的单一快照。

## Measurement Transaction

一次完整测量使用真实 React 内容和浏览器布局：

1. 同步渲染全部已注册 Item，并让全部 Accessory 返回 `null`。
2. 读取 Root 可用宽度和 Item 实际位置，得到不考虑 Accessory 时的候选可见前缀。
3. 如果发生溢出，同步隐藏候选尾部，并以不可见状态挂载全部 Accessory。
4. 读取当前 Item 与 Accessory 的真实占用跨度，计算 Accessory 需要保留的空间。
5. 同步提交最终 Item 前缀、溢出数据和 Accessory 可见状态。

测量开始前会保存上一次 state、geometry 和 committed result。任务被取消或任意阶段抛出异常时，cleanup 会
恢复这些值，避免把中间测量状态作为稳定结果保留下来。

`measuring` 标记覆盖完整事务。标记存在期间，React ref 变化和 ResizeObserver 回调不会递归使当前几何缓存
失效。Accessory DOM 身份通过递增 revision 跟踪；如果最终写入阶段替换了已测量 Accessory，事务结束后会
安排新的完整测量。

## React Commits

测量计划提交给共享 `layoutTaskScheduler`。调度器在同一 stage 中先运行全部实例的 read，再运行全部 write。
包含 React 外部 Store 写入的 stage 标记为 `flushSync`，整个批次的 write 由一次 React `flushSync` 包裹，
确保下一 stage 读取 DOM 前 React 已经提交。

同一阶段中的多个 OverflowList 实例可以共享一次 flushSync，但一次完整事务仍可能包含多个同步 React 提交和
多个浏览器布局。没有溢出的快速路径可以在 Accessory 测量前结束后续计算，但调度器仍会遍历已声明的空 stage。

## Geometry

组件不假设固定 gap，也不累加单个 Item 的声明宽度。完整测量按 DOM 顺序读取每个 Item 的
`getBoundingClientRect()`，记录前 n 个 Item 的水平边界跨度：

```text
prefixWidths[n] = max(right of first n items) - min(left of first n items)
```

这个跨度会包含正常 flow 中反映到元素相对位置上的 flex/grid gap。最终结果始终选择 DOM 顺序前缀。

Accessory 挂载后，组件读取候选可见 Item 和全部 Accessory 的联合水平跨度，再减去候选 Item 的已有跨度，
得到 Accessory 及其布局间距实际占用的宽度。多个 Accessory 因此作为一个整体参与边界计算。

如果隐藏全部 Item 后 Accessory 仍然放不下，最终 `visibleCount` 保持为 0，Accessory 继续展示。

## Width Precision

`scrollWidth` 和 `clientWidth` 通常只暴露整数 CSS pixel。完整测量的第一轮 read 使用
`scrollWidth - clientWidth >= 1` 作为“明确存在 scrollable overflow”的快速判断。

差值小于 `1px` 时不会直接提交不溢出，而是继续读取首尾 Item 的 DOMRect。首尾跨度确认可以放入时，组件只
建立最小几何缓存；否则进入全部 Item DOMRect 测量。这里的 scroll width boundary 只决定读取成本，不决定
最终可见边界。

DOMRect 与 ResizeObserver 可以提供亚像素尺寸。几何计算独立使用 `0.5 CSS px` 的 layout epsilon：

```text
measuredWidth <= availableWidth + 0.5
```

该值用于完整 Item 宽度和每个可见前缀的最终判断。它是避免临界值抖动的容差，意味着不超过半个 CSS pixel
的实际溢出可以被视为放得下；它与 scroll width 的 `1px` 整数精度边界不是同一个概念。

OverflowList 不使用 Range。Range 适合测量一个容器内部的文本或混合 inline 内容；OverflowList 需要同时
保留独立元素、元素间 gap 和每个 Item 前缀的几何信息，DOMRect 更符合当前模型。

## Resize Observation

组件通过共享 ResizeObserver hub 监听：

- Root 的 content box，表示列表可用宽度。
- 当前挂载 Item 的 border box。
- 当前挂载 Accessory 的 border box。

Root、Item/Accessory 分别使用自己的 `0.5 CSS px` resize epsilon。尺寸变化没有超过阈值时不使缓存失效，
同时不更新最后一次有效比较基准；因此连续的小幅变化会累计，并在总变化超过阈值后触发重新测量。

测量事务期间收到的尺寸会更新基准，但不会立即 invalidate。隐藏 Item 已经卸载，无法继续被观察；这个限制及
调用方可以使用的重新测量触发方式记录在 README 的 Boundaries 中。

## Geometry Cache And Root Resize

完整测量完成后会缓存 Item 顺序、前缀宽度、完整 Item 跨度和 Accessory 占用宽度。Root resize 时，如果缓存
已经包含回答新宽度所需的信息，组件只执行纯计算并提交新的 `visibleCount`，不重新读取全部 Item DOMRect。

当全部 Item 在没有 Accessory 时放得下，最小缓存只保存首尾跨度，不建立完整 prefix widths。Root 缩小到
完整跨度以下时，这个缓存无法推导应隐藏多少 Item，因此会回到完整测量。

以下变化会使几何缓存失效：

- Item 或 Accessory 注册生命周期变化。
- Item 或 Accessory DOM 元素变化。
- `Item.data` 引用变化。
- 已观察 Item 或 Accessory 的有效 border-box resize。
- Accessory 在提交阶段发生未被当前测量覆盖的 DOM 身份变化。

## Viewport Priority Scheduling

完整测量和 Root resize 提交先进入包级 viewport-priority scheduler。Root 是优先级采样元素，水平和垂直
near margin 均为对应视窗尺寸的一半：

- near 任务进入 microtask 批次。
- far 任务优先通过 `requestIdleCallback` 执行，每批最多处理 30 个 OverflowList 任务。
- 不支持 `requestIdleCallback` 时依次回退到 `requestAnimationFrame` 和 timer。

同一个稳定任务引用在队列中会去重。新的 invalidation 会取消尚未执行的 resize 快速任务，并清空 geometry；
连续 Root resize 不会为每个历史宽度保留独立任务。

组件不使用 IntersectionObserver。视窗接近程度只在需要调度时采样，单独滚动页面不会持续更新已有实例的
优先级。far 任务使用 timeout 防止页面繁忙时无限饥饿。
