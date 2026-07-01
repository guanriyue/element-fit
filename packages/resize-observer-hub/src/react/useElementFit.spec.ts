// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { createElement, type PropsWithChildren, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockEntry = Pick<ResizeObserverEntry, 'target' | 'contentRect'>;

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

const element = (): Element => {
  return document.createElement('div');
};

const entry = (target: Element, width: number): MockEntry => {
  return {
    target,
    contentRect: { width } as DOMRectReadOnly,
  };
};

const importHook = async () => {
  return await import('./useElementFit.ts');
};

const strictModeWrapper = ({ children }: PropsWithChildren) => {
  return createElement(StrictMode, null, children);
};

beforeEach(() => {
  vi.resetModules();
  MockResizeObserver.instances = [];
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
});

describe('useElementFit', () => {
  it('returns undefined data before ref is bound', async () => {
    const { useElementFit } = await importHook();
    const selector = vi.fn((resizeEntry: ResizeObserverEntry) => resizeEntry.contentRect.width);
    const { result } = renderHook(() => useElementFit(selector));

    expect(result.current.data).toBeUndefined();
    expect(selector).not.toHaveBeenCalled();
    expect(MockResizeObserver.instances).toHaveLength(0);
  });

  it('returns data selected from ResizeObserverEntry', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width),
    );

    act(() => {
      result.current.ref(target);
    });

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 120)]);
    });

    expect(result.current.data).toBe(120);
  });

  it('does not recompute when selector changes until the next resize', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const firstSelector = vi.fn(
      (resizeEntry: ResizeObserverEntry) => resizeEntry.contentRect.width,
    );
    const secondSelector = vi.fn(
      (resizeEntry: ResizeObserverEntry) => resizeEntry.contentRect.width * 2,
    );
    const { result, rerender } = renderHook(({ selector }) => useElementFit(selector), {
      initialProps: {
        selector: firstSelector,
      },
    });

    act(() => {
      result.current.ref(target);
    });

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 100)]);
    });

    expect(result.current.data).toBe(100);

    rerender({ selector: secondSelector });

    expect(result.current.data).toBe(100);
    expect(secondSelector).not.toHaveBeenCalled();

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 100)]);
    });

    expect(secondSelector).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe(200);
  });

  it('does not run the next eq until the next resize', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const firstEqual = vi.fn((prev: number, next: number) => prev === next);
    const secondEqual = vi.fn(() => true);
    const { result, rerender } = renderHook(
      ({ eq }) =>
        useElementFit((resizeEntry) => resizeEntry.contentRect.width, {
          eq,
        }),
      {
        initialProps: {
          eq: firstEqual,
        },
      },
    );

    act(() => {
      result.current.ref(target);
    });

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 100)]);
    });

    rerender({ eq: secondEqual });

    expect(result.current.data).toBe(100);
    expect(secondEqual).not.toHaveBeenCalled();

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 200)]);
    });

    expect(secondEqual).toHaveBeenCalledWith(100, 200);
    expect(result.current.data).toBe(100);
  });

  it('uses Object.is by default to skip equal selected data updates', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const selector = vi.fn((resizeEntry: ResizeObserverEntry) => resizeEntry.contentRect.width);
    const { result } = renderHook(() => useElementFit(selector));

    act(() => {
      result.current.ref(target);
    });

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 100)]);
    });

    const dataAfterFirstEmit = result.current.data;

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 100)]);
    });

    expect(result.current.data).toBe(dataAfterFirstEmit);
    expect(selector).toHaveBeenCalledTimes(2);
  });

  it('keeps the current snapshot when box changes and rebinds the current element', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result, rerender } = renderHook(
      ({ box }) => useElementFit((resizeEntry) => resizeEntry.contentRect.width, { box }),
      {
        initialProps: {
          box: 'content-box' as ResizeObserverBoxOptions,
        },
      },
    );

    act(() => {
      result.current.ref(target);
    });

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(target, 100)]);
    });

    const contentBoxObserver = MockResizeObserver.instances[0];

    rerender({ box: 'border-box' });

    const borderBoxObserver = MockResizeObserver.instances[1];

    expect(result.current.data).toBe(100);
    expect(contentBoxObserver?.unobserve).toHaveBeenCalledWith(target);
    expect(borderBoxObserver?.observe).toHaveBeenCalledWith(target, { box: 'border-box' });
  });

  it('keeps the current snapshot when target changes', async () => {
    const { useElementFit } = await importHook();
    const firstElement = element();
    const secondElement = element();
    const { result } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width),
    );

    act(() => {
      result.current.ref(firstElement);
    });

    act(() => {
      MockResizeObserver.instances[0]?.emit([entry(firstElement, 100)]);
    });

    act(() => {
      result.current.ref(secondElement);
    });

    expect(result.current.data).toBe(100);
    expect(MockResizeObserver.instances[0]?.unobserve).toHaveBeenCalledWith(firstElement);
    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledWith(secondElement, {
      box: 'content-box',
    });
  });

  it('unobserves when callback ref receives null', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width),
    );

    act(() => {
      result.current.ref(target);
    });

    act(() => {
      result.current.ref(null);
    });

    expect(MockResizeObserver.instances[0]?.unobserve).toHaveBeenCalledTimes(1);
    expect(MockResizeObserver.instances[0]?.unobserve).toHaveBeenCalledWith(target);
  });

  it('rebinds box changes in StrictMode', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result, rerender } = renderHook(
      ({ box }) => useElementFit((resizeEntry) => resizeEntry.contentRect.width, { box }),
      {
        initialProps: {
          box: 'content-box' as ResizeObserverBoxOptions,
        },
        wrapper: strictModeWrapper,
      },
    );

    act(() => {
      result.current.ref(target);
    });

    const contentBoxObserver = MockResizeObserver.instances[0];

    rerender({ box: 'border-box' });

    const borderBoxObserver = MockResizeObserver.instances[1];

    expect(contentBoxObserver?.unobserve).toHaveBeenCalledWith(target);
    expect(borderBoxObserver?.observe).toHaveBeenCalledWith(target, { box: 'border-box' });
  });

  it('does not observe twice on initial ref binding', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width),
    );

    act(() => {
      result.current.ref(target);
    });

    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledTimes(1);
    expect(MockResizeObserver.instances[0]?.unobserve).not.toHaveBeenCalled();
  });

  it('uses the initial box for the first ref binding without rebinding', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width, { box: 'border-box' }),
    );

    act(() => {
      result.current.ref(target);
    });

    expect(MockResizeObserver.instances).toHaveLength(1);
    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledTimes(1);
    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledWith(target, {
      box: 'border-box',
    });
    expect(MockResizeObserver.instances[0]?.unobserve).not.toHaveBeenCalled();
  });

  it('does not reobserve when rerendering with the same box', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result, rerender } = renderHook(
      ({ box }) => useElementFit((resizeEntry) => resizeEntry.contentRect.width, { box }),
      {
        initialProps: {
          box: 'content-box' as ResizeObserverBoxOptions,
        },
      },
    );

    act(() => {
      result.current.ref(target);
    });

    rerender({ box: 'content-box' });

    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledTimes(1);
    expect(MockResizeObserver.instances[0]?.unobserve).not.toHaveBeenCalled();
  });

  it('does not reobserve when the same ref target is passed again', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width),
    );

    act(() => {
      result.current.ref(target);
      result.current.ref(target);
    });

    expect(MockResizeObserver.instances[0]?.observe).toHaveBeenCalledTimes(1);
    expect(MockResizeObserver.instances[0]?.unobserve).not.toHaveBeenCalled();
  });

  it('unobserves the active target once on unmount', async () => {
    const { useElementFit } = await importHook();
    const target = element();
    const { result, unmount } = renderHook(() =>
      useElementFit((resizeEntry) => resizeEntry.contentRect.width),
    );

    act(() => {
      result.current.ref(target);
    });

    unmount();

    expect(MockResizeObserver.instances[0]?.unobserve).toHaveBeenCalledTimes(1);
    expect(MockResizeObserver.instances[0]?.unobserve).toHaveBeenCalledWith(target);
  });
});
