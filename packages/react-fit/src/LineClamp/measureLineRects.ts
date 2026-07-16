const LINE_POSITION_EPSILON = 0.5;

type InlineInterval = {
  start: number;
  end: number;
};

export type LineMeasure = {
  top: number;
  bottom: number;
  intervals: InlineInterval[];
};

const getBlockOverlap = (
  first: Pick<LineMeasure, 'top' | 'bottom'>,
  second: Pick<LineMeasure, 'top' | 'bottom'>,
): number => {
  return Math.min(first.bottom, second.bottom)
    - Math.max(first.top, second.top);
};

const findOverlappingLine = (
  lines: LineMeasure[],
  rect: DOMRect,
): LineMeasure | undefined => {
  let matchedLine: LineMeasure | undefined;
  let largestOverlap = LINE_POSITION_EPSILON;

  for (const line of lines) {
    const overlap = getBlockOverlap(line, rect);

    if (overlap <= largestOverlap) {
      continue;
    }

    matchedLine = line;
    largestOverlap = overlap;
  }

  return matchedLine;
};

const isSameVisualLine = (
  first: LineMeasure,
  second: LineMeasure,
): boolean => {
  return getBlockOverlap(first, second) > LINE_POSITION_EPSILON;
};

const measureRangeRects = (range: Range): LineMeasure[] => {
  const lines: LineMeasure[] = [];

  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }

    const currentLine = findOverlappingLine(lines, rect);
    const interval = {
      start: rect.left,
      end: rect.right,
    };

    if (typeof currentLine === 'undefined') {
      lines.push({
        top: rect.top,
        bottom: rect.bottom,
        intervals: [interval],
      });
      continue;
    }

    currentLine.top = Math.min(currentLine.top, rect.top);
    currentLine.bottom = Math.max(currentLine.bottom, rect.bottom);
    currentLine.intervals.push(interval);
  }

  lines.sort((left, right) => left.top - right.top);

  return lines;
};

export const measureLineRects = (
  container: HTMLElement,
  startOffset: number,
  endOffset: number,
): LineMeasure[] => {
  const range = container.ownerDocument.createRange();

  range.setStart(container, startOffset);
  range.setEnd(container, endOffset);

  return measureRangeRects(range);
};

export const hasBrBetweenLines = (
  container: HTMLElement,
  startOffset: number,
  endOffset: number,
  lineBefore: LineMeasure,
  lineAfter: LineMeasure,
): boolean => {
  const document = container.ownerDocument;
  const contentRange = document.createRange();

  contentRange.setStart(container, startOffset);
  contentRange.setEnd(container, endOffset);

  for (const breakElement of Array.from(container.querySelectorAll('br'))) {
    if (!contentRange.intersectsNode(breakElement)) {
      continue;
    }

    const beforeRange = document.createRange();
    const afterRange = document.createRange();

    beforeRange.setStart(container, startOffset);
    beforeRange.setEndBefore(breakElement);
    afterRange.setStartAfter(breakElement);
    afterRange.setEnd(container, endOffset);

    const linesBeforeBreak = measureRangeRects(beforeRange);
    const linesAfterBreak = measureRangeRects(afterRange);
    const previousLine = linesBeforeBreak[linesBeforeBreak.length - 1];
    const nextLine = linesAfterBreak[0];

    if (typeof previousLine === 'undefined') {
      continue;
    }

    if (typeof nextLine === 'undefined') {
      continue;
    }

    const matchesPreviousLine = isSameVisualLine(
      previousLine,
      lineBefore,
    );
    const matchesNextLine = isSameVisualLine(nextLine, lineAfter);

    if (matchesPreviousLine && matchesNextLine) {
      return true;
    }
  }

  return false;
};

export const getLineInlineWidth = (line: LineMeasure): number => {
  const intervals = [...line.intervals].sort((left, right) => {
    return left.start - right.start;
  });
  const firstInterval = intervals[0];

  if (typeof firstInterval === 'undefined') {
    return 0;
  }

  let width = 0;
  let currentStart = firstInterval.start;
  let currentEnd = firstInterval.end;

  for (let index = 1; index < intervals.length; index += 1) {
    const interval = intervals[index];

    if (typeof interval === 'undefined') {
      continue;
    }

    if (interval.start <= currentEnd) {
      currentEnd = Math.max(currentEnd, interval.end);
      continue;
    }

    width += currentEnd - currentStart;
    currentStart = interval.start;
    currentEnd = interval.end;
  }

  return width + currentEnd - currentStart;
};
