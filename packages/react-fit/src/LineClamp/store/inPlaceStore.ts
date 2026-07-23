import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { createIgnoredMutationSubtrees } from '../../_internal/createIgnoredMutationSubtrees.ts';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../../_internal/getElementViewportProximity.ts';
import { observeElementMutation } from '../../_internal/observeElementMutation';
import { viewportPriorityTaskScheduler } from '../../_internal/viewportPriorityTaskScheduler.ts';
import {
  getLineInlineWidth,
  hasBrBetweenLines,
  measureLineRects,
} from '../measureLineRects';
import {
  canReuseOverflowMeasurement,
  getContentOffsets,
  getEntryContentBoxSize,
  getRootContentBoxSize,
  LINE_CLAMP_MUTATION_OPTIONS,
  type LineClampMeasureParams,
  type OverflowMeasurement,
} from './measurement';
import { createLineClampStoreState } from './state';
import type { LineClampStore } from './types';

type InPlaceMeasureParams = LineClampMeasureParams & {
  hasFloatedSuffix: boolean;
};

const LINE_CLAMP_VIEWPORT_MARGIN_RATIO = 0.5;
const ignoredMutationSubtrees = createIgnoredMutationSubtrees();

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
  let rootElement: HTMLDivElement | null = null;
  let spacerElement: HTMLSpanElement | null = null;
  let suffixElement: HTMLSpanElement | null = null;
  let rootContentBoxWidth: number | undefined;
  let lastMeasurement: OverflowMeasurement | undefined;
  let unobserveRootResize: (() => void) | undefined;
  let unobserveRootMutation: (() => void) | undefined;

  const invalidateMeasurement = () => {
    lastMeasurement = undefined;
  };

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

    if (canReuseOverflowMeasurement(lastMeasurement, params.rootContentBoxWidth)) {
      return;
    }

    const overflow = measureInPlaceOverflow(params);

    lastMeasurement = {
      width: params.rootContentBoxWidth,
      overflow,
    };
    storeState.commitOverflow(overflow);
  };

  const getMeasureViewportProximity = (): ViewportProximity => {
    if (!rootElement) {
      return 'near';
    }

    return getElementViewportProximity(rootElement, {
      verticalMargin: window.innerHeight * LINE_CLAMP_VIEWPORT_MARGIN_RATIO,
    });
  };

  const scheduleMeasure = (proximity?: ViewportProximity) => {
    viewportPriorityTaskScheduler.schedule(
      measureAndCommit,
      proximity || getMeasureViewportProximity(),
    );
  };

  const cancelMeasure = () => {
    viewportPriorityTaskScheduler.cancel(measureAndCommit);
  };

  const stopRootObserve = () => {
    cancelMeasure();
    invalidateMeasurement();

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
      const reuseMeasurement =
        widthChanged && canReuseOverflowMeasurement(lastMeasurement, size.width);
      const proximity =
        widthChanged && !reuseMeasurement ? getMeasureViewportProximity() : undefined;

      rootContentBoxWidth = size.width;
      storeState.commit({ contentHeight: size.height });

      if (widthChanged) {
        if (reuseMeasurement) {
          cancelMeasure();
        } else {
          scheduleMeasure(proximity);
        }
      }
    });
    unobserveRootMutation = observeElementMutation(
      observedRoot,
      (records) => {
        if (!ignoredMutationSubtrees.hasRelevantMutation(records)) {
          return;
        }

        invalidateMeasurement();
        scheduleMeasure();
      },
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
      invalidateMeasurement();

      if (typeof nextLines === 'undefined') {
        cancelMeasure();
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
      const proximity = getMeasureViewportProximity();

      rootContentBoxWidth = size.width;
      storeState.commit({ contentHeight: size.height });
      observeRoot();
      scheduleMeasure(proximity);
    },
    setSpacerElement: (element) => {
      if (spacerElement === element) {
        return;
      }

      spacerElement = element;

      if (element) {
        ignoredMutationSubtrees.mark(element);
      }
    },
    setSuffixElement: (element) => {
      if (suffixElement === element) {
        return;
      }

      suffixElement = element;

      if (element) {
        ignoredMutationSubtrees.mark(element);
      }
    },
  };
};
