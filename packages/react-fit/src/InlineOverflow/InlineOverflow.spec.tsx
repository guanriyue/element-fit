// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InlineOverflow } from './InlineOverflow.tsx';
import {
  measureInlineOverflow,
  measureInlineOverflowWithRootContentBoxWidth,
} from './measureInlineOverflow.ts';

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
  vi.spyOn(document, 'createRange').mockReturnValue({
    selectNodeContents: vi.fn(),
    getBoundingClientRect: () => ({ width: 0 }),
  } as unknown as Range);
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
    content.textContent = 'content';
    setElementWidth(root, 120, 120);
    setElementWidth(content, 102, 90);
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      paddingInlineStart: '8px',
      paddingInlineEnd: '12px',
    } as CSSStyleDeclaration);

    expect(measureInlineOverflow({ root, content })).toBe(true);
  });

  it('uses the padding box when Root and Content are the same element', () => {
    const element = document.createElement('span');
    element.textContent = 'content';
    setElementWidth(element, 120, 120);

    expect(
      measureInlineOverflowWithRootContentBoxWidth({
        root: element,
        content: element,
        rootContentBoxWidth: 100,
      }),
    ).toBe(false);
  });

  it('uses the content box for the Range fallback when Root and Content are the same element', () => {
    const element = document.createElement('span');
    element.textContent = 'content';
    setElementWidth(element, 120, 120);
    vi.mocked(document.createRange).mockReturnValue({
      selectNodeContents: vi.fn(),
      getBoundingClientRect: () => ({ width: 100.25 }),
    } as unknown as Range);

    expect(
      measureInlineOverflowWithRootContentBoxWidth({
        root: element,
        content: element,
        rootContentBoxWidth: 100,
      }),
    ).toBe(true);
  });
});

describe('InlineOverflow', () => {
  it('does not provide presentation styles', () => {
    render(
      <InlineOverflow data-testid="root" style={{ display: 'block' }}>
        <InlineOverflow.Content data-testid="content">content</InlineOverflow.Content>
      </InlineOverflow>,
    );

    const root = screen.getByTestId('root');
    const content = screen.getByTestId('content');

    expect(root.style.display).toBe('block');
    expect(root.style.minWidth).toBe('');
    expect(content.style.cssText).toBe('');
  });

  it('preserves caller Content styles', () => {
    render(
      <InlineOverflow>
        <InlineOverflow.Content
          data-testid="content"
          style={{
            color: 'red',
            overflow: 'visible',
            textOverflow: 'clip',
            whiteSpace: 'normal',
          }}
        >
          content
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    const content = screen.getByTestId('content');

    expect(content.style.color).toBe('red');
    expect(content.style.whiteSpace).toBe('normal');
    expect(content.style.overflow).toBe('visible');
    expect(content.style.textOverflow).toBe('clip');
  });

  it('supports asChild, forwards the Content ref, and preserves child styles', () => {
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
    expect(button.style.whiteSpace).toBe('normal');
    expect(button.style.overflow).toBe('');
    expect(button.style.textOverflow).toBe('');
  });

  it('calls onOverflowChange for the first measurement and boolean changes only', async () => {
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

    await waitFor(() => {
      expect(onOverflowChange).toHaveBeenCalledTimes(1);
    });
    expect(onOverflowChange).toHaveBeenLastCalledWith(true);
    const overflowElement = screen.getByTestId('overflow');
    const contentElement = screen.getByTestId('content');

    expect(overflowElement).toHaveAttribute('data-overflow', '');

    setElementWidth(contentElement, 130, 100);
    await act(async () => {
      nativeResizeObserver?.emit([{ target: contentElement }]);
    });

    expect(onOverflowChange).toHaveBeenCalledTimes(1);

    setElementWidth(contentElement, 99, 99);
    await act(async () => {
      nativeResizeObserver?.emit([{ target: contentElement }]);
    });

    expect(onOverflowChange).toHaveBeenCalledTimes(2);
    expect(onOverflowChange).toHaveBeenLastCalledWith(false);
    expect(overflowElement).not.toHaveAttribute('data-overflow');
  });

  it('treats a replacement element as a fresh measurement', async () => {
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

    await waitFor(() => {
      expect(onOverflowChange).toHaveBeenCalledTimes(1);
    });

    rerender(
      <InlineOverflow onOverflowChange={onOverflowChange}>
        <InlineOverflow.Content asChild ref={registerWidth}>
          <a key="link" href="#content">
            content
          </a>
        </InlineOverflow.Content>
      </InlineOverflow>,
    );

    await waitFor(() => {
      expect(onOverflowChange).toHaveBeenCalledTimes(2);
    });
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

  it('shows Accessory when Content overflows its reserved space', async () => {
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

    const accessory = await screen.findByTestId('accessory');

    expect(onOverflowChange).toHaveBeenCalledWith(true);
    expect(accessory.style.display).toBe('');
    expect(accessory).not.toHaveAttribute('aria-hidden');
  });
});
