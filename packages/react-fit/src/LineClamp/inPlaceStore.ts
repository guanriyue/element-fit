import {
  getLineInlineWidth,
  hasBrBetweenLines,
  measureLineRects,
} from './measureLineRects';
import { createLineClampStore, type LineClampMeasureParams, type LineClampStore } from './store';

const measureInPlaceOverflow = (params: LineClampMeasureParams): boolean => {
  const {
    root,
    contentStartOffset,
    contentEndOffset,
    lines,
    rootContentBoxWidth,
    hasFloatedSuffix,
  } = params;
  const lineRects = measureLineRects(
    root,
    contentStartOffset,
    contentEndOffset,
  );

  if (!hasFloatedSuffix) {
    return lineRects.length > lines;
  }

  // The float suffix narrows the final visible line and can push part of that
  // line onto one additional rect. Recombine the affected lines to determine
  // whether the content itself exceeds the configured line limit.
  if (lineRects.length <= lines) {
    return false;
  }

  if (lineRects.length > lines + 1) {
    return true;
  }

  const lastDisplayLine = lineRects[lines - 1];
  const firstHiddenLine = lineRects[lines];

  if (typeof lastDisplayLine === 'undefined' || typeof firstHiddenLine === 'undefined') {
    return true;
  }

  // Widths can only be recombined across a soft wrap. A BR between these
  // lines keeps them separate even when their combined width would fit.
  if (hasBrBetweenLines(
    root,
    contentStartOffset,
    contentEndOffset,
    lastDisplayLine,
    firstHiddenLine,
  )) {
    return true;
  }

  const combinedWidth = getLineInlineWidth(lastDisplayLine) + getLineInlineWidth(firstHiddenLine);

  return combinedWidth >= rootContentBoxWidth;
};

export const createLineClampInPlaceStore = (
  initialLines: number | undefined,
): LineClampStore => {
  return createLineClampStore(initialLines, measureInPlaceOverflow);
};
