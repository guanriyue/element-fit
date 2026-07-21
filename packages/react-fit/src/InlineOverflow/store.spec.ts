// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineOverflowChangeHandler } from './store.ts';

type IdleRequest = {
  callback: IdleRequestCallback;
  options?: IdleRequestOptions;
};

type StoreSetup = {
  content: HTMLElement;
  readScrollWidth: ReturnType<typeof vi.fn>;
  root: HTMLElement;
  setContentWidth: (width: number) => void;
  store: ReturnType<typeof createInlineOverflowStore>;
};

class MockResizeObserver {
  readonly callback: ResizeObserverCallback;
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }

  emit(entries: ResizeObserverEntry[]): void {
    this.callback(entries, this as unknown as ResizeObserver);
  }
}

class MockMutationObserver {
  readonly callback: MutationCallback;
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn(() => []);

  constructor(callback: MutationCallback) {
    this.callback = callback;
    mutationObservers.push(this);
  }

  emit(records: MutationRecord[]): void {
    this.callback(records, this as unknown as MutationObserver);
  }
}

let createInlineOverflowStore: typeof import('./store.ts').createInlineOverflowStore;
let microtaskCallbacks: VoidFunction[];
let idleRequests: IdleRequest[];
let resizeObservers: MockResizeObserver[];
let mutationObservers: MockMutationObserver[];

const flushMicrotasks = () => {
  while (microtaskCallbacks.length > 0) {
    const callbacks = microtaskCallbacks;
    microtaskCallbacks = [];

    for (const callback of callbacks) {
      callback();
    }
  }
};

const runNextIdleCallback = () => {
  const request = idleRequests.shift();

  if (!request) {
    throw new Error('没有待执行的 Idle Callback。');
  }

  request.callback({
    didTimeout: false,
    timeRemaining: () => 50,
  });
};

const createResizeEntry = (target: Element, width: number): ResizeObserverEntry => {
  return {
    target,
    contentBoxSize: [
      {
        blockSize: 20,
        inlineSize: width,
      },
    ],
    contentRect: {
      height: 20,
      width,
    },
  } as ResizeObserverEntry;
};

const emitResize = (target: Element, width: number) => {
  const observer = resizeObservers[0];

  if (!observer) {
    throw new Error('ResizeObserver 尚未创建。');
  }

  observer.emit([createResizeEntry(target, width)]);
};

const emitContentMutation = () => {
  const observer = mutationObservers.at(-1);

  if (!observer) {
    throw new Error('MutationObserver 尚未创建。');
  }

  observer.emit([{} as MutationRecord]);
};

const createRect = (top = 0): DOMRect => {
  return {
    bottom: top + 20,
    height: 20,
    left: 0,
    right: 100,
    top,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
};

const setupStore = (params: {
  contentWidth: number;
  onOverflowChange?: InlineOverflowChangeHandler;
  rootTop?: number;
  rootWidth?: number;
}): StoreSetup => {
  const {
    contentWidth: initialContentWidth,
    onOverflowChange,
    rootTop = 0,
    rootWidth = 100,
  } = params;
  let contentWidth = initialContentWidth;
  const root = document.createElement('span');
  const content = document.createElement('span');
  const readScrollWidth = vi.fn(() => contentWidth);
  const store = createInlineOverflowStore(onOverflowChange);

  content.textContent = 'content';
  root.getBoundingClientRect = vi.fn(() => createRect(rootTop));
  Object.defineProperty(content, 'scrollWidth', {
    configurable: true,
    get: readScrollWidth,
  });

  store.setRootElement(root);
  store.setContentElement(content);
  emitResize(root, rootWidth);

  return {
    content,
    readScrollWidth,
    root,
    setContentWidth: (width) => {
      contentWidth = width;
    },
    store,
  };
};

beforeEach(async () => {
  vi.resetModules();
  microtaskCallbacks = [];
  idleRequests = [];
  resizeObservers = [];
  mutationObservers = [];

  vi.stubGlobal(
    'queueMicrotask',
    vi.fn((callback: VoidFunction) => {
      microtaskCallbacks.push(callback);
    }),
  );
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: IdleRequestCallback, options?: IdleRequestOptions) => {
      idleRequests.push({ callback, options });
      return idleRequests.length;
    }),
  );
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.stubGlobal('MutationObserver', MockMutationObserver);

  ({ createInlineOverflowStore } = await import('./store.ts'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createInlineOverflowStore', () => {
  it('按照宽度变化方向复用最近一次真实测量结果', () => {
    const { readScrollWidth, root, store } = setupStore({
      contentWidth: 120,
    });

    flushMicrotasks();
    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(1);

    emitResize(root, 90);
    flushMicrotasks();
    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(1);

    emitResize(root, 130);
    flushMicrotasks();
    expect(store.getOverflow()).toBe(false);
    expect(readScrollWidth).toHaveBeenCalledTimes(2);

    emitResize(root, 140);
    flushMicrotasks();
    expect(store.getOverflow()).toBe(false);
    expect(readScrollWidth).toHaveBeenCalledTimes(2);

    emitResize(root, 100);
    flushMicrotasks();
    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(3);
  });

  it('宽度回到可复用区间时取消尚未执行的测量', () => {
    const { readScrollWidth, root, store } = setupStore({
      contentWidth: 120,
    });

    flushMicrotasks();
    emitResize(root, 130);
    emitResize(root, 90);
    flushMicrotasks();

    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(1);
  });

  it('Content resize 复用缓存，正文 mutation 使缓存失效', () => {
    const { content, readScrollWidth, setContentWidth, store } = setupStore({
      contentWidth: 120,
    });

    flushMicrotasks();
    setContentWidth(80);
    emitResize(content, 80);
    flushMicrotasks();

    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(1);

    emitContentMutation();
    flushMicrotasks();

    expect(store.getOverflow()).toBe(false);
    expect(readScrollWidth).toHaveBeenCalledTimes(2);
  });

  it('替换 Content 后执行新的首次测量和回调', () => {
    const onOverflowChange = vi.fn();
    const { readScrollWidth, store } = setupStore({
      contentWidth: 120,
      onOverflowChange,
    });

    flushMicrotasks();
    const nextContent = document.createElement('span');
    const nextReadScrollWidth = vi.fn(() => 120);
    nextContent.textContent = 'next content';
    Object.defineProperty(nextContent, 'scrollWidth', {
      configurable: true,
      get: nextReadScrollWidth,
    });

    store.setContentElement(nextContent);
    flushMicrotasks();

    expect(readScrollWidth).toHaveBeenCalledTimes(1);
    expect(nextReadScrollWidth).toHaveBeenCalledTimes(1);
    expect(store.getOverflow()).toBe(true);
    expect(onOverflowChange.mock.calls.map(([overflow]) => overflow)).toEqual([true, true]);
  });

  it('测量配置变化时使缓存失效', () => {
    const { readScrollWidth, store } = setupStore({
      contentWidth: 120,
    });

    flushMicrotasks();
    store.setDisableRangeFallback(true);
    flushMicrotasks();

    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(2);
  });

  it('远视窗节点等待 idle batch 后再测量', () => {
    const { readScrollWidth, store } = setupStore({
      contentWidth: 120,
      rootTop: window.innerHeight * 3,
    });

    flushMicrotasks();
    expect(store.getOverflow()).toBe(false);
    expect(readScrollWidth).not.toHaveBeenCalled();
    expect(idleRequests).toHaveLength(1);
    expect(idleRequests[0]?.options).toEqual({ timeout: 300 });

    runNextIdleCallback();

    expect(store.getOverflow()).toBe(true);
    expect(readScrollWidth).toHaveBeenCalledTimes(1);
  });
});
