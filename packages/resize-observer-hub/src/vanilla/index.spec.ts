import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
const originalNodeEnv = process.env.NODE_ENV;

const element = (): Element => {
  return { nodeType: 1 } as Element;
};

const importEntry = async () => {
  return await import('./index.ts');
};

beforeEach(() => {
  vi.resetModules();
  MockResizeObserver.instances = [];
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
  process.env.NODE_ENV = originalNodeEnv;
});

describe('observeElementResize', () => {
  it('throws when ResizeObserver is not available', async () => {
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
    const { observeElementResize } = await importEntry();

    expect(() => observeElementResize(element(), vi.fn())).toThrow(ReferenceError);
  });

  it('throws when element is not a valid Element', async () => {
    const { observeElementResize } = await importEntry();

    expect(() => {
      observeElementResize({} as Element, vi.fn());
    }).toThrow(TypeError);
  });

  it('warns and returns a noop dispose for non-function listener in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { observeElementResize } = await importEntry();
    const dispose = observeElementResize(element(), undefined as never);

    dispose();

    expect(warn).toHaveBeenCalledWith(
      '[resize-observer-hub] observeElementResize expected listener to be a function.',
    );
    expect(MockResizeObserver.instances).toHaveLength(0);
  });

  it('does not warn for non-function listener in production', async () => {
    process.env.NODE_ENV = 'production';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { observeElementResize } = await importEntry();

    observeElementResize(element(), undefined as never);

    expect(warn).not.toHaveBeenCalled();
    expect(MockResizeObserver.instances).toHaveLength(0);
  });

  it('observes through the shared hub with normalized options', async () => {
    const { observeElementResize } = await importEntry();
    const target = element();
    const listener = vi.fn();

    observeElementResize(target, listener, { box: 'border-box' });
    MockResizeObserver.instances[0]?.emit([{ target }]);

    expect(MockResizeObserver.instances).toHaveLength(1);
    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledWith(target, {
      box: 'border-box',
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
