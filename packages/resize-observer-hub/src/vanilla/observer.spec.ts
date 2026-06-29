import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createObserver } from './observer.ts';

type MockEntry = Pick<ResizeObserverEntry, 'target'>;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  readonly callback: ResizeObserverCallback;
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  emit(entries: MockEntry[]): void {
    this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

const originalResizeObserver = globalThis.ResizeObserver;
const originalReportError = globalThis.reportError;

const element = (name: string): Element => {
  return { nodeType: 1, nodeName: name } as Element;
};

beforeEach(() => {
  MockResizeObserver.instances = [];
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
  globalThis.reportError = originalReportError;
});

describe('createObserver', () => {
  it('observes each element once for the same shared observer', () => {
    const options = { box: 'border-box' } as const;
    const observer = createObserver(options);
    const target = element('target');

    const disposeA = observer.observe(target, vi.fn());
    const disposeB = observer.observe(target, vi.fn());
    const nativeObserver = MockResizeObserver.instances[0];

    expect(nativeObserver?.observe).toHaveBeenCalledTimes(1);
    expect(nativeObserver?.observe).toHaveBeenCalledWith(target, options);

    disposeA();

    expect(nativeObserver?.unobserve).not.toHaveBeenCalled();

    disposeB();

    expect(nativeObserver?.unobserve).toHaveBeenCalledTimes(1);
    expect(nativeObserver?.unobserve).toHaveBeenCalledWith(target);
  });

  it('treats repeated listener registration as independent subscriptions', () => {
    const observer = createObserver({ box: 'content-box' });
    const target = element('target');
    const listener = vi.fn();

    const disposeA = observer.observe(target, listener);
    observer.observe(target, listener);

    MockResizeObserver.instances[0]?.emit([{ target }]);

    expect(listener).toHaveBeenCalledTimes(2);

    disposeA();
    MockResizeObserver.instances[0]?.emit([{ target }]);

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('keeps dispose idempotent', () => {
    const observer = createObserver({ box: 'content-box' });
    const target = element('target');
    const dispose = observer.observe(target, vi.fn());
    const nativeObserver = MockResizeObserver.instances[0];

    dispose();
    dispose();

    expect(nativeObserver?.unobserve).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch to subscriptions added during the current delivery', () => {
    const observer = createObserver({ box: 'content-box' });
    const target = element('target');
    const addedListener = vi.fn();

    observer.observe(target, () => {
      observer.observe(target, addedListener);
    });

    MockResizeObserver.instances[0]?.emit([{ target }]);

    expect(addedListener).not.toHaveBeenCalled();

    MockResizeObserver.instances[0]?.emit([{ target }]);

    expect(addedListener).toHaveBeenCalledTimes(1);
  });

  it('skips subscriptions disposed before their turn in the current delivery', () => {
    const observer = createObserver({ box: 'content-box' });
    const target = element('target');
    const skippedListener = vi.fn();
    let disposeSkipped = () => {};

    observer.observe(target, () => {
      disposeSkipped();
    });
    disposeSkipped = observer.observe(target, skippedListener);

    MockResizeObserver.instances[0]?.emit([{ target }]);

    expect(skippedListener).not.toHaveBeenCalled();
  });

  it('reports listener errors and continues dispatching listeners and entries', () => {
    const reportError = vi.fn();
    globalThis.reportError = reportError;

    const observer = createObserver({ box: 'content-box' });
    const targetA = element('target-a');
    const targetB = element('target-b');
    const error = new Error('listener failed');
    const listenerA = vi.fn(() => {
      throw error;
    });
    const listenerB = vi.fn();
    const listenerC = vi.fn();

    observer.observe(targetA, listenerA);
    observer.observe(targetA, listenerB);
    observer.observe(targetB, listenerC);

    MockResizeObserver.instances[0]?.emit([{ target: targetA }, { target: targetB }]);

    expect(reportError).toHaveBeenCalledWith(error);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerC).toHaveBeenCalledTimes(1);
  });
});
