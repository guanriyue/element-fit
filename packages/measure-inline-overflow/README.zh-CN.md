# @guanriyue/measure-inline-overflow

[English](./README.md) | 简体中文

`measure-inline-overflow` 提供一个不依赖前端框架的同步 DOM 测量函数，用于判断元素是否发生单行横向溢出。

普通的 `scrollWidth > clientWidth` 判断在绝大多数情况下有效，但两者都以整数形式暴露。内容可能已经越过亚像素边界，JavaScript 读取到的尺寸却仍然相等。本包保留整数滚动几何作为快速路径，并在结果进入一像素的低置信度区间时使用 Range API 补充测量。

## 使用方式

```ts
import { measureInlineOverflow } from '@guanriyue/measure-inline-overflow';

const overflow = measureInlineOverflow(element);
```

未提供选项时，元素同时提供已渲染内容和可用空间。快速路径比较 `scrollWidth` 与 `clientWidth`，Range fallback 比较选中内容的宽度与元素自身的 content-box width，因此元素包含 inline padding 时，两条路径仍然保持相同的盒模型语义。

### 可用宽度

当可用的 content-box width 来自其他元素，或者布局 API 已经提供该尺寸时，可以传入 `availableWidth`：

```ts
const overflow = measureInlineOverflow(element, {
  availableWidth: resizeObserverEntry.contentBoxSize[0].inlineSize,
});
```

`availableWidth` 必须是有限的非负数，单位是未经过 transform 的 CSS 像素。它表示已渲染内容可使用的 content-box width。函数使用该值进行滚动尺寸比较前，会从元素的 `scrollWidth` 中移除 inline padding。

元素的 `scrollWidth` 不会小于自身的滚动视口。当 `availableWidth` 小于元素当前的 content box 时，这个最小值无法表达选中内容的实际宽度，因此默认测量会直接读取 Range 几何。

`availableWidth` 只改变比较阈值，不会让元素按照该宽度重新排版。Range 读取的是 DOM 当前已经形成的布局。测量同一子树在其他宽度下的排版结果，需要调用方先建立目标布局，或者使用独立的测量树。

### 跳过 Range Fallback

Range fallback 默认开启。只需要整数滚动几何时，可以跳过 Range：

```ts
const overflow = measureInlineOverflow(element, {
  disableRangeFallback: true,
});
```

禁用 Range 后，`availableWidth` 小于元素当前 content box 时也不会进入直接 Range 路径。结果只来自归一化后的 `scrollWidth`，并保留它的整数精度和滚动视口最小值。

## API

### `measureInlineOverflow(element, options?)`

测量内容超过可用宽度时返回 `true`。

| 参数 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `element` | `HTMLElement` | — | 提供当前已渲染内容的元素。 |
| `options.availableWidth` | `number` | 元素的 content-box width | 以未经过 transform 的 CSS 像素表示的可用 content-box width。 |
| `options.disableRangeFallback` | `boolean` | `false` | 跳过 Range 几何，只使用整数滚动几何。 |

## 测量逻辑

元素提供自身可用宽度时，初步比较为：

```ts
element.scrollWidth - element.clientWidth;
```

提供 `availableWidth` 时，函数先从 `scrollWidth` 中移除 inline padding，再完成比较。当提供的宽度小于元素当前 content box 时，默认路径会直接进入 Range，因为 `scrollWidth` 受到当前滚动视口的下限约束。

整数比较采用以下判定边界：

```text
difference >= 1      -> 溢出
difference <= -1     -> 未溢出
-1 < difference < 1 -> Range fallback
```

`1px` 只用于识别整数精度不足的结果，不是允许内容溢出的容差。Range 结果采用严格比较：

```ts
range.getBoundingClientRect().width > availableWidth;
```

Range 可以测量普通单行 flow 中的文本、元素和混合内容。它读取浏览器已经形成的布局，不会克隆、挂载或移除临时节点。几何读取仍可能要求浏览器同步更新布局，因此该函数应在明确的测量阶段调用。

## 能力边界

- 当前只支持 horizontal writing mode。
- 函数不会监听尺寸或内容变化，调用方负责决定重新测量的时机。
- `availableWidth` 使用布局 CSS 像素。Range rect 使用经过 transform 的视口坐标，因此 CSS transform 不属于 Range fallback 的可靠范围。
- Range bounding rect 不是任意 DOM 子树的 intrinsic width。
- `availableWidth` 不会让当前 DOM 在另一个宽度下重新排版。
- margin、伪元素、定位、transform 和多行布局不属于 Range fallback 的可靠测量范围。
- 调用方提供的 `availableWidth` 不会与当前布局进行时效性校验。
- 浏览器版本、系统字体和缩放比例仍可能影响临界位置的测量结果。

## 相关讨论

- [CSSWG issue #4123: It should be detectable whether an element ellipsized the text](https://github.com/w3c/csswg-drafts/issues/4123) 讨论了 ellipsis 已经出现，但尺寸取整导致 `scrollWidth`、`clientWidth` 或 DOMRect 仍然相等的问题。
- [Stack Overflow: Wrong ellipsis detection with scrollWidth when text length is close to width](https://stackoverflow.com/questions/71440290/wrong-elipsis-detection-with-scrollwidth-when-text-length-is-close-to-width) 提供了一种克隆内容、插入隐藏节点、测量后再移除的替代方案，同时指出了额外 DOM 操作带来的性能成本。
- [Chromium issue 41468858](https://issues.chromium.org/issues/41468858) 记录了 Chromium 对相关问题的讨论。
- [Mozilla bug 1250824: Scroll Width wrong on element with overflow:hidden + text-overflow: ellipsis](https://bugzilla.mozilla.org/show_bug.cgi?id=1250824) 记录了 Firefox 中 `scrollWidth` 与 ellipsis 组合产生的尺寸问题。
