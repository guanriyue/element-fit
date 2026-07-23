# LineClamp

`LineClamp` 用于限制 inline 内容的可见行数，并在内容确实超过限制时渲染一个 suffix。
它适合文章摘要、描述文本、评论预览，以及需要“展开 / 收起”入口的多行文本区域。

组件负责 line-clamp、overflow 测量和 suffix 布局，不内置按钮样式，也不管理展开状态。

## Root 与样式职责

`LineClamp` 的 Root 渲染为 `div`。组件不设置常态下的 `display`、`word-break`、`overflow-wrap`、
`white-space` 或其他文本样式；开发者可以通过 `className`、`style` 或继承样式决定正文如何换行。

Root 会提供 `data-state`，可用于编写状态样式：

- `collapsed`：`lines` 是正整数，并且 `expanded={false}`。
- `expanded`：`lines` 是正整数，并且 `expanded={true}`。
- `unclamped`：`lines` 缺省或不是正整数，截断和测量均被禁用。

为了让组件在没有业务 CSS 时仍能完成核心截断，收起状态仍会内置 `display: -webkit-box`、
`-webkit-box-orient: vertical`、`overflow: hidden` 和动态的 `-webkit-line-clamp`。Spacer 与 Suffix 的
float 样式也是末行 suffix 布局的一部分。除此之外的视觉与文本折行策略由开发者控制。

```css
.description {
  overflow-wrap: anywhere;
}

.description[data-state='expanded'] {
  color: var(--expanded-color);
}
```

## Import

```tsx
import { LineClamp } from '@guanriyue/react-fit/line-clamp';
```

## 简单示例

```tsx
import { useState } from 'react';
import { LineClamp } from '@guanriyue/react-fit/line-clamp';

function Description({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <LineClamp
      lines={3}
      expanded={expanded}
      suffix={(
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    >
      {children}
    </LineClamp>
  );
}
```

## 预期效果

- 内容不超过三行时，完整显示正文，不渲染 suffix。
- 内容超过三行且 `expanded={false}` 时，正文限制为三行，并在最后一个可见行附近显示“展开”。
- 内容超过三行且 `expanded={true}` 时，完整显示正文，“收起”作为普通 inline 内容跟随在正文之后。
- 展开和收起时始终保留 `lines={3}`。组件继续使用它判断内容是否需要截断。
- `expanded` 是受控状态，按钮文案、点击行为和状态存储均由调用方负责。

## 测量策略

`LineClamp` 提供 `in-place` 和 `clone` 两种 overflow 测量策略，默认使用 `in-place`。

### in-place

```tsx
<LineClamp lines={3} measureStrategy="in-place">
  {content}
</LineClamp>
```

`in-place` 直接使用 `Range#getClientRects()` 读取当前正文的行信息，不创建额外的测量节点。
当收起状态下的 float suffix 已经影响最后一行宽度时，组件会结合最后可见行和首个隐藏行的 rect，
判断正文自身是否超过 `lines`。

该策略 DOM 开销较小，适合作为默认值。它依赖浏览器暴露的 Range rect，因此复杂 inline box、bidi、
ruby、`<br>`、atomic inline-level 元素和亚像素取整可能产生边界差异。

当前 `in-place` 只检测 `<br>` 形成的 hard line break。由保留的文本换行符、生成内容、block-level box
或其他 CSS 规则形成的 hard break 暂不支持；这些边界可能被误判为可以按宽度重新合并。

### clone

```tsx
<LineClamp lines={3} measureStrategy="clone">
  {content}
</LineClamp>
```

`clone` 使用 DOM API 临时创建一个不可见的固定定位节点，只克隆正文内容，并以 Root content box width
重新排版。测量完成后，该节点会立即移除。

该策略不增加额外的 React 渲染，并且测量不受可见 float suffix 直接干扰；代价是创建临时 DOM，并触发
一次额外布局。克隆节点也无法完整复现运行时表单状态、canvas 内容，以及依赖原始 DOM 层级的选择器。

两种策略都只消费最终的 boolean overflow。它们是针对不同布局成本和浏览器边界的可选方案，并不保证在
所有复杂 inline 内容中得到完全相同的结果。

如果 `in-place` 无法正确处理当前内容，可以尝试 `clone`。`clone` 也不是对任意 DOM、样式和浏览器布局的
完整模拟；如果两种策略都不能满足需求，开发者需要为对应场景提供自定义测量或截断实现。

## 调度与首次测量

LineClamp 使用包级的[视窗优先级测量调度](../../README.md#视窗优先级测量调度)。两种测量策略都以 Root
作为优先级采样元素，垂直方向的 near margin 为半屏高度；水平方向不额外扩展视窗范围。`in-place`
任务直接执行 Range 测量，`clone` 任务会在 viewport priority 之后进入分阶段 layout task。

首次可信测量完成前，`overflow` 默认为 `false`，因此不会渲染 suffix。视窗外节点可能等待 idle batch，
首次 suffix 展示和 `onOverflowChange` 回调也会相应延后。

运行时切换 `measureStrategy` 会切换到另一套独立 store。新策略需要重新观察 Root 并完成自己的首次测量，
切换期间可能短暂使用默认的非 overflow 状态。需要稳定视觉结果时，建议不要在动画过程中切换测量策略。

## 宽度缓存与单调性假设

两种策略都会缓存最近一次真实测量使用的 Root content-box width 和 overflow 结果。正文与 `lines` 不变时，
组件按普通 inline 内容的单调关系复用结果：

- 已在某个宽度测得 overflow 时，宽度继续减小会继续复用 `true`。
- 已在某个宽度测得不 overflow 时，宽度继续增大会继续复用 `false`。
- 宽度向无法推断的方向变化时，重新执行真实测量并更新缓存。

该机制主要用于跳过 Resize 动画越过 overflow 临界点之后的重复测量。例如从宽到窄时，suffix 首次展示后，
后续继续缩小的宽度不再重复读取 Range 或创建 clone。命中缓存时，已经排队但尚未执行的测量任务也会被
取消或在执行入口直接跳过。

Root 变化、`lines` 变化或正文 DOM mutation 会使缓存失效。Spacer、Suffix 和 clone 临时测量节点属于组件
自己的内部布局节点，它们的挂载、卸载和 subtree mutation 不会使缓存失效；suffix 本身不属于被测正文，
修改 suffix 内容也不会重新测量正文。

缓存依赖 overflow 随可用宽度单调变化。通过 container query、媒体查询或其他宽度相关规则改变正文内容、
字体、display、white-space、writing mode 或子元素尺寸时，这一假设可能不成立，组件不会为这些情况做额外
探测。此类场景需要由开发者保证内容仍满足单调关系，或者使用更符合业务布局规则的实现。

## CSS line-clamp 与 float

收起状态使用浏览器兼容性 line-clamp 样式截断正文，并使用 float 把 suffix 放到最后一个可见行附近。
内部布局顺序大致如下：

```tsx
<Root>
  <Spacer />
  <FloatSuffix />
  {children}
</Root>
```

Spacer 是一个宽度为 `0` 的右浮动元素。它根据 Root 的 content height 留出纵向距离；suffix 使用
`float: right` 和 `clear: both`，被推到接近容器底部的位置。正文随后围绕 suffix 排版，最后由
line-clamp 裁切超出可见行数的内容。

[MDN 的 Clearing floats](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/float#clearing_floats)
说明了 `clear` 可以强制一个元素移动到已有 float 的下方。在这里，suffix 的 `clear: both` 负责让它
移动到 Spacer 下方，而 Spacer 的计算高度决定“下方”对应的纵向位置。

Spacer 本身宽度为 `0`，不会直接占用正文的 inline 空间；它的高度大致取 Root content height 减去一行。
这样 Spacer 的底边位于最后一个可见行之前，suffix clear 到该底边下方后进入最后一行附近。如果不计算
Spacer 高度，suffix 仍然会执行 clear，但只能移动到一个接近容器顶部的零高度 float 下方，无法得到预期的
末行位置。

float 必须在正文之前出现才能影响后续 inline 内容，因此收起状态的 DOM 顺序与视觉阅读顺序不同。
展开时组件会移除 line-clamp，并把 suffix 放到正文之后，恢复普通 inline 排版。

CSS Overflow Module Level 4 的
[Line-clamp containers](https://drafts.csswg.org/css-overflow-4/#line-clamp-containers)
章节描述了 clamp point，以及 float 在 line-clamp container 中的裁切和 block size 行为。组件的
Spacer + Suffix 是建立在这些浏览器布局行为之上的实现方案，并不是规范规定的通用按钮结构。

收起状态使用 float suffix 参与最后一行布局。suffix 应保持紧凑，建议高度不超过一行；较高的 suffix
可能占据或推开多行正文。复杂 inline box、bidi、ruby、强制换行和不同浏览器的 Range rect 也可能产生
边界差异。

组件使用 MutationObserver 监听 Root subtree 中的子节点和文本变化，并重新调度测量。组件自己的 Spacer、
Suffix 和 clone 临时测量节点会通过 WeakSet 标记；即使节点移除后 mutation record 才延迟送达，也会被
正确过滤。若同一批 mutation 同时包含内部节点和正文变化，正文变化仍会使缓存失效并重新测量。

MutationObserver 不监听 attributes。仅修改 class、style、继承样式、字体、伪元素内容或外部样式表时，
如果没有引起 Root content-box width 变化，也没有其他可观察的正文 mutation，不保证重新测量。字体异步
加载、CSS 自定义属性变化和仅改变排版规则的主题切换也属于这一范围。需要覆盖这些情况时，开发者应在
外部保证重新挂载、产生可观察的正文变化，或使用自定义实现。

Root 的 `style` 会在内部样式之后合并。收起状态下覆盖 `display`、`overflow`、`WebkitLineClamp`、
`WebkitBoxOrient` 等关键属性可能破坏截断或测量假设。正文应以普通 inline 内容为主；block-level box、
复杂 bidi/ruby、宽度相关子布局以及较高的 suffix 都可能需要业务侧单独验证。

## 参考资料

- [CSS Overflow Module Level 4: Line-clamp containers](https://drafts.csswg.org/css-overflow-4/#line-clamp-containers)
- [CSS Overflow Module Level 4: Limiting visible lines](https://drafts.csswg.org/css-overflow-4/#line-clamp)
- [MDN: float - Clearing floats](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/float#clearing_floats)
- [MDN: clear](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clear)
- [Web Platform Tests: line-clamp](https://wpt.fyi/results/css/css-overflow/line-clamp/)
