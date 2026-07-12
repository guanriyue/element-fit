# @guanriyue/measure-inline-overflow

[English](./README.md) | 简体中文

`measure-inline-overflow` 提供一个不依赖前端框架的同步 DOM 测量函数，用于判断元素是否发生单行横向溢出。

普通的 `scrollWidth > clientWidth` 判断在绝大多数情况下有效，但浏览器公开的尺寸可能经过整数取整。在 `text-overflow: ellipsis` 刚好出现的临界位置，页面已经隐藏了部分内容，JavaScript 却仍可能读到相等的 `scrollWidth` 和可用宽度。

本包保留普通尺寸比较作为快速路径，并在两个尺寸严格相等时使用 Range API 读取更高精度的内容宽度。

## 使用方式

```ts
import { measureInlineOverflow } from '@guanriyue/measure-inline-overflow';

const overflow = measureInlineOverflow(contentElement);
```

默认情况下，可用宽度来自 Content 自身的 `clientWidth`。

### 容器

当 Content 的可用空间由另一个容器决定时，可以传入 `container`：

```ts
const overflow = measureInlineOverflow(contentElement, {
  container: rootElement,
});
```

函数会使用 Container 的 `clientWidth`，扣除 `padding-inline-start` 和 `padding-inline-end`，得到 content box width。

### 已知宽度

如果 ResizeObserver 或其他布局系统已经提供了可用宽度，可以直接复用，避免再次读取 computed style：

```ts
const overflow = measureInlineOverflow(contentElement, {
  container: rootElement,
  availableWidth: resizeObserverEntry.contentBoxSize[0].inlineSize,
});
```

`availableWidth` 的优先级高于 `container`。未提供这两个选项时，函数使用 Content 自身的 `clientWidth`。

### 跳过 Range Fallback

Range fallback 默认开启。需要对比普通判断或排查浏览器差异时，可以跳过：

```ts
const overflow = measureInlineOverflow(contentElement, {
  skipRangeFallback: true,
});
```

## 测量逻辑

函数首先比较 Content 的 `scrollWidth` 与解析后的可用宽度：

```text
scrollWidth > availableWidth  -> true
scrollWidth < availableWidth  -> false
scrollWidth = availableWidth  -> Range fallback
```

当两个尺寸严格相等、Content 非空并且未设置 `skipRangeFallback` 时，函数选择 Content 的所有内容，并比较 `range.getBoundingClientRect().width` 与可用宽度。

Range 可以测量普通单行 flow 中的文本、元素和混合内容。与克隆节点、插入文档、测量后再移除的方案相比，Range 不会为了测量额外修改 DOM，也不会引入由临时节点挂载产生的额外渲染。不过，读取 DOM 几何信息仍可能要求浏览器同步刷新布局，因此该函数应在明确的测量阶段调用。

## 能力边界

- 当前只支持 horizontal writing mode。
- 函数不会监听尺寸或内容变化，调用方负责决定重新测量的时机。
- Range bounding rect 不是任意 DOM 子树的 intrinsic width。
- margin、伪元素、定位、transform 和多行布局不属于 Range fallback 的可靠测量范围。
- 当前不单独修正 Content padding 对不同测量模型造成的差异。
- `availableWidth` 由调用方提供时，函数不会验证该缓存是否仍与当前布局一致。
- 浏览器版本、系统字体和缩放比例仍可能影响临界位置的测量结果。

## 相关讨论

- [CSSWG issue #4123: It should be detectable whether an element ellipsized the text](https://github.com/w3c/csswg-drafts/issues/4123) 讨论了 ellipsis 已经出现，但尺寸取整导致 `scrollWidth`、`clientWidth` 或 DOMRect 仍然相等的问题。
- [Stack Overflow: Wrong ellipsis detection with scrollWidth when text length is close to width](https://stackoverflow.com/questions/71440290/wrong-elipsis-detection-with-scrollwidth-when-text-length-is-close-to-width) 提供了一种克隆内容、插入隐藏节点、测量后再移除的替代方案，同时指出了额外 DOM 操作带来的性能成本。
- [Chromium issue 41468858](https://issues.chromium.org/issues/41468858) 记录了 Chromium 对相关问题的讨论。
- [Mozilla bug 1250824: Scroll Width wrong on element with overflow:hidden + text-overflow: ellipsis](https://bugzilla.mozilla.org/show_bug.cgi?id=1250824) 记录了 Firefox 中 `scrollWidth` 与 ellipsis 组合产生的尺寸问题。

## 当前状态

目前还没有公开 demo 和完整测试。
