// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea.tsx';

vi.mock('./store.ts', () => {
  return {
    createTextareaStore: () => {
      return {
        getState: () => 80,
        subscribe: () => {
          return () => {};
        },
        requestMeasure: vi.fn(),
        setElement: vi.fn(),
        setOptions: vi.fn(),
      };
    },
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Textarea', () => {
  it('only overrides height when autosize is enabled', () => {
    render(<Textarea data-testid="textarea" autoSize style={{ height: 24, overflowY: 'clip' }} />);

    const textarea = screen.getByTestId('textarea');

    expect(textarea.style.height).toBe('80px');
    expect(textarea.style.overflowY).toBe('clip');
  });

  it('preserves developer sizing styles when autosize is disabled', () => {
    render(<Textarea data-testid="textarea" style={{ height: 24, overflowY: 'scroll' }} />);

    const textarea = screen.getByTestId('textarea');

    expect(textarea.style.height).toBe('24px');
    expect(textarea.style.overflowY).toBe('scroll');
  });
});
