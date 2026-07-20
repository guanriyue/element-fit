import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { createMicrotaskScheduler } from '../../_internal/createMicrotaskScheduler.ts';
import { observeElementMutation } from '../../_internal/observeElementMutation';
import {
  getLineInlineWidth,
  hasBrBetweenLines,
  measureLineRects,
} from '../measureLineRects';
import {
  getContentOffsets,
  getEntryContentBoxSize,
  getRootContentBoxSize,
  LINE_CLAMP_MUTATION_OPTIONS,
  type LineClampMeasureParams,
} from './measurement';
import { createLineClampStoreState } from './state';
import type { LineClampStore } from './types';

type InPlaceMeasureParams = LineClampMeasureParams & {
  hasFloatedSuffix: boolean;
};

const measureInPlaceOverflow = (params: InPlaceMeasureParams): boolean => {
  const {
    root,
    contentStartOffset,
    contentEndOffset,
    lines,
    rootContentBoxWidth,
    hasFloatedSuffix,
  } = params;
  const lineRects = measureLineRects(root, contentStartOffset, contentEndOffset);

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
  if (
    hasBrBetweenLines(
      root,
      contentStartOffset,
      contentEndOffset,
      lastDisplayLine,
      firstHiddenLine,
    )
  ) {
    return true;
  }

  const combinedWidth = getLineInlineWidth(lastDisplayLine) + getLineInlineWidth(firstHiddenLine);

  return combinedWidth >= rootContentBoxWidth;
};

export const createLineClampInPlaceStore = (
  initialLines: number | undefined,
): LineClampStore => {
  const storeState = createLineClampStoreState();
  let lines = initialLines;
  let rootElement: HTMLSpanElement | null = null;
  let spacerElement: HTMLSpanElement | null = null;
  let suffixElement: HTMLSpanElement | null = null;
  let rootContentBoxWidth: number | undefined;
  let unobserveRootResize: (() => void) | undefined;
  let unobserveRootMutation: (() => void) | undefined;

  const getMeasureParams = (): InPlaceMeasureParams | undefined => {
    if (rootElement === null || typeof rootContentBoxWidth === 'undefined') {
      return undefined;
    }

    if (typeof lines === 'undefined') {
      return undefined;
    }

    const contentOffsets = getContentOffsets(rootElement, spacerElement, suffixElement);

    return {
      root: rootElement,
      contentStartOffset: contentOffsets.start,
      contentEndOffset: contentOffsets.end,
      lines,
      rootContentBoxWidth,
      hasFloatedSuffix: spacerElement !== null && spacerElement.parentNode === rootElement,
    };
  };

  const measureAndCommit = () => {
    if (typeof lines === 'undefined') {
      storeState.commitOverflow(false);
      return;
    }

    const params = getMeasureParams();

    if (!params) {
      return;
    }

    storeState.commitOverflow(measureInPlaceOverflow(params));
  };

  const scheduleMeasure = createMicrotaskScheduler(measureAndCommit);

  const stopRootObserve = () => {
    if (unobserveRootResize) {
      unobserveRootResize();
      unobserveRootResize = undefined;
    }

    if (unobserveRootMutation) {
      unobserveRootMutation();
      unobserveRootMutation = undefined;
    }

    rootContentBoxWidth = undefined;
  };

  const observeRoot = () => {
    const observedRoot = rootElement;

    if (observedRoot === null) {
      return;
    }

    unobserveRootResize = observeElementResize(observedRoot, (entry) => {
      const size = getEntryContentBoxSize(entry);
      const widthChanged = rootContentBoxWidth !== size.width;

      rootContentBoxWidth = size.width;
      storeState.commit({ contentHeight: size.height });

      if (widthChanged) {
        scheduleMeasure();
      }
    });
    unobserveRootMutation = observeElementMutation(
      observedRoot,
      scheduleMeasure,
      LINE_CLAMP_MUTATION_OPTIONS,
    );
  };

  return {
    getState: storeState.getState,
    subscribe: storeState.subscribe,
    setLines: (nextLines) => {
      if (lines === nextLines) {
        return;
      }

      lines = nextLines;

      if (typeof nextLines === 'undefined') {
        storeState.commitOverflow(false);
        return;
      }

      // Keep the last trusted overflow while the new measurement is pending.
      scheduleMeasure();
    },
    setOnOverflowChange: storeState.setOnOverflowChange,
    setRootElement: (element) => {
      if (rootElement === element) {
        return;
      }

      stopRootObserve();
      rootElement = element;

      if (element === null) {
        return;
      }

      const size = getRootContentBoxSize(element);

      rootContentBoxWidth = size.width;
      storeState.commit({ contentHeight: size.height });
      observeRoot();
      scheduleMeasure();
    },
    setSpacerElement: (element) => {
      if (spacerElement === element) {
        return;
      }

      spacerElement = element;
      scheduleMeasure();
    },
    setSuffixElement: (element) => {
      if (suffixElement === element) {
        return;
      }

      suffixElement = element;
      scheduleMeasure();
    },
  };
};
