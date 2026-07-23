// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LineClamp } from './LineClamp.tsx';

class MockResizeObserver {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  vi.spyOn(document, 'createRange').mockReturnValue({
    getClientRects: () => [],
    setEnd: vi.fn(),
    setStart: vi.fn(),
  } as unknown as Range);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
});

describe('LineClamp', () => {
  it('renders a div with only the required collapsed styles', () => {
    render(
      <LineClamp data-testid="root" lines={2}>
        content
      </LineClamp>,
    );

    const root = screen.getByTestId('root');

    expect(root).toBeInstanceOf(HTMLDivElement);
    expect(root).toHaveAttribute('data-state', 'collapsed');
    expect(root.style.display).toBe('-webkit-box');
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.getPropertyValue('-webkit-box-orient')).toBe('vertical');
    expect(root.style.getPropertyValue('-webkit-line-clamp')).toBe('2');
    expect(root.style.wordBreak).toBe('');
  });

  it('removes the clamp styles while expanded', () => {
    const { rerender } = render(
      <LineClamp data-testid="root" lines={2}>
        content
      </LineClamp>,
    );

    rerender(
      <LineClamp data-testid="root" lines={2} expanded>
        content
      </LineClamp>,
    );

    const root = screen.getByTestId('root');

    expect(root).toHaveAttribute('data-state', 'expanded');
    expect(root.style.cssText).toBe('');
  });

  it('uses the unclamped state when lines is not a positive integer', () => {
    render(
      <LineClamp data-testid="root" lines={0}>
        content
      </LineClamp>,
    );

    const root = screen.getByTestId('root');

    expect(root).toHaveAttribute('data-state', 'unclamped');
    expect(root.style.cssText).toBe('');
  });

  it('lets the developer provide text styles and override a core style', () => {
    render(
      <LineClamp data-testid="root" lines={2} style={{ overflow: 'clip', wordBreak: 'normal' }}>
        content
      </LineClamp>,
    );

    const root = screen.getByTestId('root');

    expect(root.style.overflow).toBe('clip');
    expect(root.style.wordBreak).toBe('normal');
  });
});
