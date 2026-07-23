// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureInlineOverflowWithRange } from './measureInlineOverflowWithRange.ts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('measureInlineOverflowWithRange', () => {
  it('reports overflow when the Range width exceeds the available content width', () => {
    const content = document.createElement('span');
    content.textContent = 'content';
    vi.spyOn(content.ownerDocument, 'createRange').mockReturnValue({
      selectNodeContents: vi.fn(),
      getBoundingClientRect: () => ({ width: 100.25 }),
    } as unknown as Range);

    expect(
      measureInlineOverflowWithRange({
        content,
        availableContentWidth: 100,
      }),
    ).toBe(true);
  });

  it('reports no overflow when the Range width fits the available content width', () => {
    const content = document.createElement('span');
    content.textContent = 'content';
    vi.spyOn(content.ownerDocument, 'createRange').mockReturnValue({
      selectNodeContents: vi.fn(),
      getBoundingClientRect: () => ({ width: 99.75 }),
    } as unknown as Range);

    expect(
      measureInlineOverflowWithRange({
        content,
        availableContentWidth: 100,
      }),
    ).toBe(false);
  });

  it('selects all plain text content', () => {
    const content = document.createElement('span');
    content.append('content', ' text');
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
        availableContentWidth: 100,
      }),
    ).toBe(true);
    expect(selectNodeContents).toHaveBeenCalledWith(content);
    expect(getClientRects).not.toHaveBeenCalled();
  });

  it('uses a Range for content containing an element', () => {
    const content = document.createElement('span');
    content.append(document.createElement('span'));
    const selectNodeContents = vi.fn();
    vi.spyOn(content.ownerDocument, 'createRange').mockReturnValue({
      selectNodeContents,
      getBoundingClientRect: () => ({ width: 101 }),
    } as unknown as Range);

    expect(
      measureInlineOverflowWithRange({
        content,
        availableContentWidth: 100,
      }),
    ).toBe(true);
    expect(selectNodeContents).toHaveBeenCalledWith(content);
  });

  it('does not create a Range when Content has no child nodes', () => {
    const content = document.createElement('span');
    const createRange = vi.spyOn(content.ownerDocument, 'createRange');

    expect(
      measureInlineOverflowWithRange({
        content,
        availableContentWidth: 100,
      }),
    ).toBe(false);
    expect(createRange).not.toHaveBeenCalled();
  });
});
