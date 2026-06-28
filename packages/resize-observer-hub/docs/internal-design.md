# Resize Observer Hub 内部设计

状态：草稿

## Observer Key

共享 observer 按 `ResizeObserverOptions.box` 建立 key。有效 key 只有：

```ts
'content-box';
'border-box';
'device-pixel-content-box';
```

无效的 `box` 值统一归一为 `'content-box'`。省略 `options`、省略 `options.box`、
`{ box: undefined }`、`null`、大小写不匹配的字符串、以及其他未提供有效 `box` 的 options
值，都归一为 `'content-box'`。默认 TypeScript 使用者会遵循 `ResizeObserverOptions` 类型
约束，运行时归一化只作为兜底。

读取 `options.box` 时如果发生异常，不做特殊处理；调用者应自行保证 options 可正常读取。

调用原生 `ResizeObserver.observe` 时，始终传入归一化后的 options：

```ts
nativeObserver.observe(element, { box: observerKey });
```

## 运行时输入

`observeElementResize` 调用时先检查运行环境是否存在 `ResizeObserver`。如果不存在，直接抛出
异常。

Hub 在注册 subscription 前必须校验 `element` 是否为合法 `Element`。判断方式使用
`nodeType === 1`。如果传入的 `element` 不是合法 `Element`，直接抛出异常。

这个校验由 Hub 自己完成，因为内部需要使用 element 作为 `WeakMap` key 和订阅集合索引。

`listener` 如果不是函数，注册时在开发期通过 `console.warn` 提示调用者传入了无效 listener，
并直接返回 no-op dispose，不创建 subscription，也不调用原生 `observe`。

开发期判断使用 `process.env.NODE_ENV !== 'production'`。

## 内部 API 形状

包内部应该有一个 Hub。

Hub 负责按照 options 获取共享 Observer：

```ts
type ObserverKey = 'content-box' | 'border-box' | 'device-pixel-content-box';

type Hub = {
  getObserver(options?: ResizeObserverOptions): SharedObserver;
};
```

`Hub.getObserver(options)` 内部先根据 options 计算 `ObserverKey`，再检查是否已经存在对应的
`SharedObserver` 实例。若实例不存在，则创建并缓存；若实例已存在，则直接返回。

`SharedObserver` 是内部实现，不作为当前公开 API 暴露：

```ts
type SharedObserver = {
  observe(
    element: Element,
    listener: (entry: ResizeObserverEntry) => void,
  ): () => void;
};
```

`SharedObserver.observe(element, listener)` 创建一个 subscription，并返回只负责释放该
subscription 的 dispose 函数。

公开 API `observeElementResize(element, listener, options)` 是 convenience API，内部等价于：

```ts
hub.getObserver(options).observe(element, listener);
```

## Subscription

每次调用 `observeElementResize` 都创建一个独立 subscription。

即使传入相同的 `element`、`listener` 和 `options`，多次调用也代表多个独立 subscription。
每个 subscription 由对应调用返回的 dispose 函数释放。

一种可行的数据结构：

```ts
type Subscription = {
  listener: (entry: ResizeObserverEntry) => void;
  disposed: boolean;
};

const subscriptionsByElement: WeakMap<Element, Set<Subscription>>;
```

dispose 函数必须幂等：

- 第一次调用时标记当前 subscription 已释放，并从所属元素的订阅集合中移除。
- 后续调用不产生额外行为。
- 当某个元素的订阅集合为空时，调用原生 `unobserve(element)`。

对于特定 box 对应的 shared observer，每个 element 只应该调用一次原生
`ResizeObserver.observe`。如果同一个 element 已经存在 subscription，后续新增 subscription
只加入内部 event-emitter-like 订阅集合，不重复调用原生 `observe`。

dispose 后允许重新 observe 同一个 element。如果某个 element 的订阅集合已经清空并调用过
`unobserve(element)`，后续再次 observe 该 element 时，应重新调用原生
`observe(element, { box })`。

实现默认原生 `observe` 和 `unobserve` 不会抛出异常，不做额外捕获或回滚处理。

## 分发

原生 `ResizeObserver` callback 可能一次传入多个 `ResizeObserverEntry`。

每个 entry 按 `entry.target` 找到对应元素的 subscription 集合。

如果某个 entry 的 `target` 没有对应 subscription，直接忽略。

分发前必须复制一份 subscription 快照。当前轮分发只遍历快照，避免 listener 内部调用
`dispose` 或再次 `observeElementResize` 时影响正在进行的分发。

listener 按 subscription 添加顺序调用。

listener 内部新增的 subscription 不参与当前 entry 分发，只参与后续分发。

已在快照中但分发前被释放的 subscription 不应再收到当前 entry。

调用 listener 时直接调用：

```ts
subscription.listener(entry);
```

## 异常报告

listener 抛出异常时，必须继续分发同一次原生 callback 中的其他 listener，也必须继续分发同
一次原生 callback 中的其他 entry。

异常统一通过运行时 `reportError` 报告。在浏览器中，这通常对应 `window.reportError`。

如果运行环境没有 `reportError`，使用以下 fallback：

```ts
setTimeout(() => {
  throw error;
}, 0);
```

## Observer 生命周期

shared observer 按需懒创建。

即使当前没有任何 subscription，也保留已经创建的 shared observer 和原生 `ResizeObserver`
实例，不从缓存中删除，也不调用 `disconnect`。

后续新订阅可以复用同一个 shared observer。
