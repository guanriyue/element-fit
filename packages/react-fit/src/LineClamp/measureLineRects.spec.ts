// @vitest-environment jsdom
/** biome-ignore-all lint/style/noNonNullAssertion: for test */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { measureLineRects } from './measureLineRects';

const createRect = (
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect => {
  return new DOMRect(left, top, width, height);
};

const mockRangeRects = (rects: DOMRect[]) => {
  const range = document.createRange();

  Object.defineProperty(range, 'getClientRects', {
    configurable: true,
    value: () => rects,
  });
  vi.spyOn(document, 'createRange').mockReturnValue(range);
};

const createContainer = () => {
  const container = document.createElement('span');

  container.appendChild(document.createTextNode('content'));

  return container;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('measureLineRects', () => {
  it('groups vertically overlapping inline rects into one visual line', () => {
    mockRangeRects([
      createRect(0, 8, 100, 14),
      createRect(100, 4, 64, 22),
      createRect(110, 10, 44, 10),
      createRect(0, 32, 240, 14),
      createRect(0, 60, 220, 14),
    ]);

    const lines = measureLineRects(createContainer(), 0, 1);

    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({
      top: 4,
      bottom: 26,
    });
    expect(lines[0]!.intervals).toHaveLength(3);
  });

  it('keeps adjacent non-overlapping rects on separate lines', () => {
    mockRangeRects([
      createRect(0, 0, 100, 14),
      createRect(0, 14, 100, 14),
      createRect(0, 28, 100, 14),
    ]);

    const lines = measureLineRects(createContainer(), 0, 1);

    expect(lines).toHaveLength(3);
  });

  it('uses the line with the largest vertical overlap', () => {
    mockRangeRects([
      createRect(0, 0, 100, 10),
      createRect(0, 12, 100, 10),
      createRect(100, 8, 20, 7),
    ]);

    const lines = measureLineRects(createContainer(), 0, 1);

    expect(lines).toHaveLength(2);
    expect(lines[0]!.intervals).toHaveLength(1);
    expect(lines[1]!.intervals).toHaveLength(2);
  });

  it('ignores empty rects', () => {
    mockRangeRects([
      createRect(0, 0, 0, 0),
      createRect(0, 8, 100, 14),
    ]);

    const lines = measureLineRects(createContainer(), 0, 1);

    expect(lines).toHaveLength(1);
    expect(lines[0]!.intervals).toHaveLength(1);
  });
});
