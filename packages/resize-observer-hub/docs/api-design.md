# Resize Observer Hub API 设计

状态：草稿

## 目标

`@guanriyue/resize-observer-hub` 为原生 `ResizeObserver` 提供一个很小的共享
observer 层。

这个包的目标是让应用和库代码尽量贴近单例 `ResizeObserver` 的使用模式，同时仍然支持彼此
独立的订阅。这个设计受到原生 API 形状，以及
[WICG/resize-observer#59](https://github.com/WICG/resize-observer/issues/59)
中性能讨论的启发。

## 第一个公开 API

第一个确定的公开 API 是 `observeElementResize`。

```ts
export const observeElementResize: (
  element: Element,
  listener: (entry: ResizeObserverEntry) => void,
  options?: ResizeObserverOptions,
) => () => void;
```

当前只公开 `observeElementResize`，不额外导出辅助类型。

示例：

```ts
import { observeElementResize } from '@guanriyue/resize-observer-hub';

const dispose = observeElementResize(
  element,
  (entry) => {
    console.log(entry.contentRect.width, entry.contentRect.height);
  },
  { box: 'border-box' },
);

dispose();
```

## 选项

`options` 直接使用原生 `ResizeObserverOptions` 类型。

当前 observer 身份由 `options.box` 决定。

Resize Observer 规范将默认 `box` 值定义为 `'content-box'`。省略 `options`、省略
`options.box`、`{ box: undefined }`、`null`、以及其他未提供有效 `box` 的 options 值，
都按 `'content-box'` 处理。

## 订阅语义

每次调用 `observeElementResize` 都会创建一个订阅。

使用相同的 `element`、`listener` 和 `options` 多次调用 `observeElementResize`，会创建多个
彼此独立的订阅。返回的 dispose 函数只释放当前这次调用创建的订阅。

dispose 函数必须是幂等的。调用多次和调用一次效果相同。

只有当共享 observer 中某个元素已经没有剩余订阅时，才应该调用原生 `unobserve`。

## 回调语义

listener 接收原生 `ResizeObserverEntry`。

这个包不转换 entry，也不安排初始测量。首次回调时机完全遵循原生 `ResizeObserver` 行为。

listener 会在原生 `ResizeObserver` 分发期间同步调用。

如果某个 listener 抛出异常，同一次原生分发中的其他 listener 仍然必须被调用。抛出的异常不能
被吞掉，应该统一通过运行时 `reportError` 报告。

## 运行环境

这个包要求运行环境提供原生 `ResizeObserver`。

如果 `ResizeObserver` 不可用，`observeElementResize` 必须抛出异常。

如果传入的 `element` 不是合法 `Element`，`observeElementResize` 必须抛出异常。

## 参考

- Resize Observer 规范：https://drafts.csswg.org/resize-observer/
- WICG 性能讨论：https://github.com/WICG/resize-observer/issues/59
