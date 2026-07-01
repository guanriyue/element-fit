import { useCallback, useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { normalizeOptions } from '../vanilla/hub.ts';
import { observeElementResize } from '../vanilla/index.ts';

export type UseElementFitOptions<T> = ResizeObserverOptions & {
  eq?: (prev: T, next: T) => boolean;
};

type ElementFitStore<T> = {
  getSnapshot: () => T | undefined;
  subscribe: (listener: () => void) => () => void;
  setSelector: (selector: (entry: ResizeObserverEntry) => T) => void;
  setEqual: (equal: (prev: T, next: T) => boolean) => void;
  setBox: (box: ResizeObserverBoxOptions) => void;
  setTarget: (element: Element | null) => void;
  stopObserve: () => void;
  dispose: () => void;
};

const createElementFitStore = <T>(
  initialSelector: (entry: ResizeObserverEntry) => T,
  initialEqual: (prev: T, next: T) => boolean,
  initialBox: ResizeObserverBoxOptions,
): ElementFitStore<T> => {
  const listeners = new Set<() => void>();
  let selector = initialSelector;
  let equal = initialEqual;
  let box = initialBox;
  let hasSnapshot = false;
  let dataSnapshot: T | undefined;
  let targetElement: Element | null = null;
  let observedElement: Element | null = null;
  let observedBox: ResizeObserverBoxOptions | null = null;
  let disposeResize: (() => void) | null = null;

  const emit = () => {
    for (const listener of [...listeners]) {
      listener();
    }
  };

  const update = (entry: ResizeObserverEntry) => {
    const nextData = selector(entry);

    if (hasSnapshot && equal(dataSnapshot as T, nextData)) {
      return;
    }

    hasSnapshot = true;
    dataSnapshot = nextData;
    emit();
  };

  const stopObserve = () => {
    disposeResize?.();
    disposeResize = null;
    observedElement = null;
    observedBox = null;
  };

  const syncObserve = () => {
    if (targetElement === null) {
      stopObserve();
      return;
    }

    if (observedElement === targetElement && observedBox === box) {
      return;
    }

    stopObserve();

    observedElement = targetElement;
    observedBox = box;
    disposeResize = observeElementResize(targetElement, update, { box });
  };

  return {
    getSnapshot() {
      return dataSnapshot;
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    setSelector(nextSelector) {
      selector = nextSelector;
    },

    setEqual(nextEqual) {
      equal = nextEqual;
    },

    setBox(nextBox) {
      if (box !== nextBox) {
        box = nextBox;
      }

      syncObserve();
    },

    setTarget(nextElement) {
      if (targetElement === nextElement) {
        return;
      }

      targetElement = nextElement;
      syncObserve();
    },

    stopObserve,

    dispose() {
      stopObserve();
      targetElement = null;
    },
  };
};

const getServerSnapshot = () => undefined;

/**
 * 观察元素 resize，并通过 selector 将原生 `ResizeObserverEntry` 派生为组件需要的数据。
 *
 * Hook 返回 callback ref 和最新的派生数据。`data` 初始为 `undefined`，只有在原生
 * `ResizeObserver` 触发后才会根据 selector 更新。
 *
 * `selector` 和 `eq` 的变化只会影响后续 resize 事件，不会立即基于上一条 entry 重新计算。
 * `getSnapshot` 只返回最近一次 resize 后缓存的数据快照，不会执行 selector。
 *
 * @param selector - 接收原生 `ResizeObserverEntry`，返回派生数据。
 * @param options - 原生 `ResizeObserver` options，额外支持 `eq` 用于比较前后两次派生数据。
 * @returns 包含 callback ref 和最新派生数据的对象。
 *
 * @example
 * ```tsx
 * const { ref, data } = useElementFit(
 *   (entry) => Math.floor(entry.contentRect.width),
 *   {
 *     box: 'border-box',
 *     eq: Object.is,
 *   },
 * );
 *
 * return <div ref={ref}>{data}</div>;
 * ```
 */
export const useElementFit = <T>(
  selector: (entry: ResizeObserverEntry) => T,
  options?: UseElementFitOptions<T>,
): {
  ref: React.RefCallback<Element>;
  data: T | undefined;
} => {
  const box = normalizeOptions(options).box;

  const eq = options?.eq || Object.is;

  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅对初始化有影响
  const store = useMemo(() => {
    return createElementFitStore(selector, eq, box);
  }, []);

  store.setSelector(selector);
  store.setEqual(eq);

  const data = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);

  const ref = useCallback<React.RefCallback<Element>>(
    (element) => {
      store.setTarget(element);
    },
    [store],
  );

  useLayoutEffect(() => {
    store.setBox(box);
  }, [box, store]);

  useEffect(() => {
    return () => {
      store.dispose();
    };
  }, [store]);

  return {
    ref,
    data,
  };
};
