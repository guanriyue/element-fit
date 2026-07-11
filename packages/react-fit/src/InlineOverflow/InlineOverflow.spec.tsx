// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InlineOverflow } from './InlineOverflow.tsx';
import { measureInlineOverflow } from './measureInlineOverflow.ts';

type MockEntry = Pick<ResizeObserverEntry, 'target'>;

class MockResizeObserver {
  readonly callback: ResizeObserverCallback;
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    nativeResizeObserver = this;
  }

  emit(entries: MockEntry[]): void {
    this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

const originalResizeObserver = globalThis.ResizeObserver;
let nativeResizeObserver: MockResizeObserver | null = null;

const setElementWidth = (element: HTMLElement, scrollWidth: number, clientWidth: number) => {
  Object.defineProperty(element, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(element, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  });
};

beforeEach(() => {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  vi.stubGlobal('requestAnimationFrame', undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  globalThis.ResizeObserver = originalResizeObserver;
});

describe('measureInlineOverflow', () => {
  it('measures overflow against the Root content box', () => {
    const root = document.createElement('span');
    const content = document.createElement('span');
    setElementWidth(root, 120, 120);
    setElementWidth(content, 100.5, 90);
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      paddingInlineStart: '8px',
      paddingInlineEnd: '12px',
    } as CSSStyleDeclaration);

    expect(measureInlineOverflow({ root, content })).toEqual({
      overflow: false,
    });
  });
});

describe('InlineOverflow', () => {
  it('preserves Root layout styles and protects Content overflow styles', () => {
    render(
      <InlineOverflow data-testid="root" style={{ display: 'block' }}>
        <InlineOverflow.Content
          data-testid="content"
          style={{ color: 'red', whiteSpace: 'normal' }}
        >
          content
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    const root = screen.getByTestId('root');
    const content = screen.getByTestId('content');

    expect(root.style.display).toBe('block');
    expect(root.style.minWidth).toBe('');
    expect(content.style.color).toBe('red');
    expect(content.style.whiteSpace).toBe('nowrap');
    expect(content.style.overflow).toBe('hidden');
    expect(content.style.textOverflow).toBe('ellipsis');
  });

  it('supports asChild and forwards the Content ref', () => {
    let element: HTMLElement | null = null;

    render(
      <InlineOverflow>
        <InlineOverflow.Content
          asChild
          ref={(node) => {
            element = node;
          }}
        >
          <button type="button" style={{ color: 'blue', whiteSpace: 'normal' }}>
            content
          </button>
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    const button = screen.getByRole('button');

    expect(element).toBe(button);
    expect(button.style.color).toBe('blue');
    expect(button.style.whiteSpace).toBe('nowrap');
    expect(button.style.overflow).toBe('hidden');
    expect(button.style.textOverflow).toBe('ellipsis');
  });

  it('calls onOverflowChange for the first measurement and boolean changes only', () => {
    const onOverflowChange = vi.fn();

    render(
      <InlineOverflow
        data-testid="overflow"
        ref={(node) => {
          if (node !== null) {
            setElementWidth(node, 100, 100);
          }
        }}
        onOverflowChange={onOverflowChange}
      >
        <InlineOverflow.Content
          data-testid="content"
          ref={(node) => {
            if (node !== null) {
              setElementWidth(node, 120, 100);
            }
          }}
        >
          content
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    expect(onOverflowChange).toHaveBeenCalledTimes(1);
    expect(onOverflowChange).toHaveBeenLastCalledWith(true);
    const overflowElement = screen.getByTestId('overflow');
    const contentElement = screen.getByTestId('content');

    expect(overflowElement).toHaveAttribute('data-overflow', '');

    setElementWidth(contentElement, 130, 100);
    act(() => {
      nativeResizeObserver?.emit([{ target: contentElement }]);
    });

    expect(onOverflowChange).toHaveBeenCalledTimes(1);

    setElementWidth(contentElement, 100, 100);
    act(() => {
      nativeResizeObserver?.emit([{ target: contentElement }]);
    });

    expect(onOverflowChange).toHaveBeenCalledTimes(2);
    expect(onOverflowChange).toHaveBeenLastCalledWith(false);
    expect(overflowElement).not.toHaveAttribute('data-overflow');
  });

  it('treats a replacement element as a fresh measurement', () => {
    const onOverflowChange = vi.fn();
    const registerWidth = (node: HTMLElement | null) => {
      if (node !== null) {
        setElementWidth(node, 120, 100);
      }
    };
    const { rerender } = render(
      <InlineOverflow onOverflowChange={onOverflowChange}>
        <InlineOverflow.Content asChild ref={registerWidth}>
          <button key="button" type="button">
            content
          </button>
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    rerender(
      <InlineOverflow onOverflowChange={onOverflowChange}>
        <InlineOverflow.Content asChild ref={registerWidth}>
          <a key="link" href="#content">
            content
          </a>
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    expect(onOverflowChange).toHaveBeenCalledTimes(2);
    expect(onOverflowChange.mock.calls.map(([overflow]) => overflow)).toEqual([true, true]);
  });

  it('does not render Accessory when Content does not overflow', () => {
    render(
      <InlineOverflow data-testid="root">
        <InlineOverflow.Content>content</InlineOverflow.Content>
        <InlineOverflow.Accessory data-testid="accessory">detail</InlineOverflow.Accessory>
      </InlineOverflow>,
    );

    expect(screen.getByTestId('root')).toBeInTheDocument();
    expect(screen.queryByTestId('accessory')).not.toBeInTheDocument();
  });

  it('shows Accessory when Content overflows its reserved space', () => {
    const onOverflowChange = vi.fn();

    render(
      <InlineOverflow
        ref={(node) => {
          if (node !== null) {
            setElementWidth(node, 100, 100);
          }
        }}
        onOverflowChange={onOverflowChange}
      >
        <InlineOverflow.Content
          ref={(node) => {
            if (node !== null) {
              setElementWidth(node, 120, 100);
            }
          }}
        >
          content
        </InlineOverflow.Content>
        <InlineOverflow.Accessory data-testid="accessory">detail</InlineOverflow.Accessory>
      </InlineOverflow>,
    );

    const accessory = screen.getByTestId('accessory');

    expect(onOverflowChange).toHaveBeenCalledWith(true);
    expect(accessory.style.display).toBe('');
    expect(accessory).not.toHaveAttribute('aria-hidden');
  });
});
