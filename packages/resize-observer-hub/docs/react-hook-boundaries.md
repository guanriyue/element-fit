# React Hook 边界

状态：草稿

## 适用范围

本文档描述 `useElementResize` 的行为边界。

`useElementResize` 是 React 层的 selector-first resize 数据 hook。它基于
`observeElementResize` 建立元素监听，并通过 selector 将原生 `ResizeObserverEntry` 派生为
组件使用的数据。

```ts
const { ref, data } = useElementResize(selector, options);
```

## API 形状

```ts
export const useElementResize: <T>(
  selector: (entry: ResizeObserverEntry) => T,
  options?: ResizeObserverOptions & {
    eq?: (prev: T, next: T) => boolean;
  },
) => {
  ref: React.RefCallback<Element>;
  data: T | undefined;
};
```

`data` 初始为 `undefined`。只有在原生 `ResizeObserver` 触发后，才会通过 selector 计算并更新。

## Snapshot

`useElementResize` 内部使用 `useSyncExternalStore`。

store 保存最近一次 resize 后的 `dataSnapshot`。`getSnapshot` 只返回缓存的
`dataSnapshot`，不会执行 selector。

selector 只在 resize callback 中执行：

```ts
const nextData = selector(entry);
```

如果已经存在 snapshot，并且 `eq(prev, next)` 返回 `true`，则不会通知 React 更新。

## Selector 和 Eq

`selector` 变化不会立即重新计算当前 `data`。新的 selector 只影响后续 resize 事件。

`eq` 变化不会立即重新比较当前 `data`。新的 eq 只影响后续 resize 事件。

默认 eq 是 `Object.is`。

当前类型将 `eq` 定义为：

```ts
(prev: T, next: T) => boolean
```

首次 resize 时没有 previous snapshot，因此不会调用 eq。

## Ref 和监听生命周期

`ref` 是 React callback ref。

当 ref 收到新的 element：

- 如果 element 未变化，不重复 observe。
- 如果 element 变化，停止旧 element 的 observe，并 observe 新 element。
- 如果 element 为 `null`，停止当前 observe。

切换 element 不会清空当前 `dataSnapshot`。旧 snapshot 会保留到下一次 resize 产生新数据。

## Box

`options.box` 会被归一化为合法的 `ResizeObserverBoxOptions`。

初始 box 会传入 store，避免首次 ref 绑定时使用默认 box 后再二次绑定。

当 box 变化：

- 当前 element 会使用新的 box 重新 observe。
- 如果 box 未变化，不重复 observe。
- box 变化不会清空当前 `dataSnapshot`。

## StrictMode

实现需要兼容 React StrictMode。

effect cleanup 只停止当前 observe，不应清空当前 target。否则 StrictMode 的 effect 重放可能导致
target 丢失，无法重新 observe。

真正的 hook dispose 会停止 observe，并清空 target。

## 非目标

当前 hook 不做：

- 初始测量
- selector 变化后的立即重新计算
- eq 变化后的立即重新比较
- box 或 target 变化后的 data reset
- computed style 监听
- DOM 写入
- enabled/disabled 控制

`enabled` 可以后续通过 store 的 `syncObserve` 统一接入。
