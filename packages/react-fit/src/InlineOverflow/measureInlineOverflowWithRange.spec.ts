// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureInlineOverflowWithRange } from './measureInlineOverflowWithRange.ts';

const setScrollWidth = (element: HTMLElement, scrollWidth: number) => {
  Object.defineProperty(element, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('measureInlineOverflowWithRange', () => {
  it('reports overflow when scroll width exceeds the Root content box width', () => {
    const content = document.createElement('span');
    content.textContent = 'content';
    setScrollWidth(content, 101);
    const createRange = vi.spyOn(content.ownerDocument, 'createRange');

    expect(
      measureInlineOverflowWithRange({
        content,
        rootContentBoxWidth: 100,
      }),
    ).toEqual({ overflow: true });
    expect(createRange).not.toHaveBeenCalled();
  });

  it('reports no overflow when scroll width is less than the Root content box width', () => {
    const content = document.createElement('span');
    content.textContent = 'content';
    setScrollWidth(content, 99);
    const createRange = vi.spyOn(content.ownerDocument, 'createRange');

    expect(
      measureInlineOverflowWithRange({
        content,
        rootContentBoxWidth: 100,
      }),
    ).toEqual({ overflow: false });
    expect(createRange).not.toHaveBeenCalled();
  });

  it('uses the Range width for equal-width plain text content', () => {
    const content = document.createElement('span');
    content.append('content', ' text');
    setScrollWidth(content, 100);
    const selectNodeContents = vi.fn();
    const getClientRects = vi.fn(() => {
      throw new Error('getClientRects must not be used');
    });
    vi.spyOn(content.ownerDocument, 'createRange').mockReturnValue({
      selectNodeContents,
      getBoundingClientRect: () => ({ width: 100.25 }),
      getClientRects,
    } as unknown as Range);

    expect(
      measureInlineOverflowWithRange({
        content,
        rootContentBoxWidth: 100,
      }),
    ).toEqual({ overflow: true });
    expect(selectNodeContents).toHaveBeenCalledWith(content);
    expect(getClientRects).not.toHaveBeenCalled();
  });

  it('uses a Range for equal-width content containing an element', () => {
    const content = document.createElement('span');
    content.append(document.createElement('span'));
    setScrollWidth(content, 100);
    const selectNodeContents = vi.fn();
    vi.spyOn(content.ownerDocument, 'createRange').mockReturnValue({
      selectNodeContents,
      getBoundingClientRect: () => ({ width: 101 }),
    } as unknown as Range);

    expect(
      measureInlineOverflowWithRange({
        content,
        rootContentBoxWidth: 100,
      }),
    ).toEqual({ overflow: true });
    expect(selectNodeContents).toHaveBeenCalledWith(content);
  });

  it('can disable the Range fallback for debug comparisons', () => {
    const content = document.createElement('span');
    content.textContent = 'content';
    setScrollWidth(content, 100);
    const createRange = vi.spyOn(content.ownerDocument, 'createRange');

    expect(
      measureInlineOverflowWithRange({
        content,
        rootContentBoxWidth: 100,
        disableRangeFallback: true,
      }),
    ).toEqual({ overflow: false });
    expect(createRange).not.toHaveBeenCalled();
  });

  it('does not use a Range when Content has no child nodes', () => {
    const content = document.createElement('span');
    setScrollWidth(content, 100);
    const createRange = vi.spyOn(content.ownerDocument, 'createRange');

    expect(
      measureInlineOverflowWithRange({
        content,
        rootContentBoxWidth: 100,
      }),
    ).toEqual({ overflow: false });
    expect(createRange).not.toHaveBeenCalled();
  });
});
