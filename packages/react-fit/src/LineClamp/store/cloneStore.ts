import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { createIgnoredMutationSubtrees } from '../../_internal/createIgnoredMutationSubtrees.ts';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../../_internal/getElementViewportProximity.ts';
import {
  type LayoutTask,
  type LayoutTaskPlan,
  layoutTaskScheduler,
} from '../../_internal/layoutTaskScheduler.ts';
import { observeElementMutation } from '../../_internal/observeElementMutation';
import { viewportPriorityTaskScheduler } from '../../_internal/viewportPriorityTaskScheduler.ts';
import { measureLineRects } from '../measureLineRects';
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

const LINE_CLAMP_VIEWPORT_MARGIN_RATIO = 0.5;
const ignoredMutationSubtrees = createIgnoredMutationSubtrees();

const applyMeasureRootStyle = (measureRoot: HTMLDivElement, width: number) => {
  measureRoot.style.position = 'fixed';
  measureRoot.style.top = '0';
  measureRoot.style.left = '0';
  measureRoot.style.display = 'block';
  measureRoot.style.boxSizing = 'content-box';
  measureRoot.style.width = `${width}px`;
  measureRoot.style.height = 'auto';
  measureRoot.style.minHeight = '0';
  measureRoot.style.maxHeight = 'none';
  measureRoot.style.margin = '0';
  measureRoot.style.padding = '0';
  measureRoot.style.border = '0';
  measureRoot.style.overflow = 'visible';
  measureRoot.style.visibility = 'hidden';
  measureRoot.style.opacity = '0';
  measureRoot.style.pointerEvents = 'none';
  measureRoot.style.zIndex = '-2147483648';
};

const createCloneLayoutTaskPlan = (
  params: LineClampMeasureParams,
  listener: (overflow: boolean) => void,
): LayoutTaskPlan => {
  const {
    root,
    contentStartOffset,
    contentEndOffset,
    lines,
    rootContentBoxWidth,
  } = params;
  let measureRoot: HTMLDivElement | undefined;
  let overflow: boolean | undefined;

  return {
    stages: [
      {
        read: () => {
          const document = root.ownerDocument;
          const nextMeasureRoot = document.createElement('div');
          const contentNodes = Array.from(root.childNodes).slice(
            contentStartOffset,
            contentEndOffset,
          );

          // Clone only content nodes. Including Spacer or Suffix would make
          // the measurement depend on the currently rendered UI.
          ignoredMutationSubtrees.mark(nextMeasureRoot);
          applyMeasureRootStyle(nextMeasureRoot, rootContentBoxWidth);
          nextMeasureRoot.setAttribute('aria-hidden', 'true');
          nextMeasureRoot.setAttribute('inert', '');

          for (const contentNode of contentNodes) {
            nextMeasureRoot.appendChild(contentNode.cloneNode(true));
          }

          measureRoot = nextMeasureRoot;
        },
        write: () => {
          if (measureRoot) {
            root.appendChild(measureRoot);
          }
        },
      },
      {
        read: () => {
          if (!measureRoot) {
            return;
          }

          overflow = measureLineRects(measureRoot, 0, measureRoot.childNodes.length).length > lines;
        },
        write: () => {
          measureRoot?.remove();
          measureRoot = undefined;

          if (typeof overflow !== 'undefined') {
            listener(overflow);
          }
        },
      },
    ],
    cleanup: () => {
      measureRoot?.remove();
      measureRoot = undefined;
    },
  };
};

export const createLineClampCloneStore = (
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

  const canReuseMeasurement = (width: number): boolean => {
    return canReuseOverflowMeasurement(lastMeasurement, width);
  };

  const invalidateMeasurement = () => {
    lastMeasurement = undefined;
  };

  const getMeasureParams = (): LineClampMeasureParams | undefined => {
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
    };
  };

  const layoutMeasureTask: LayoutTask = () => {
    if (typeof lines === 'undefined') {
      return {
        stages: [
          {
            write: () => {
              storeState.commitOverflow(false);
            },
          },
        ],
      };
    }

    const params = getMeasureParams();

    if (!params) {
      return undefined;
    }

    return createCloneLayoutTaskPlan(params, (overflow) => {
      lastMeasurement = {
        width: params.rootContentBoxWidth,
        overflow,
      };
      storeState.commitOverflow(overflow);
    });
  };

  const enqueueLayoutMeasure = () => {
    layoutTaskScheduler.schedule(layoutMeasureTask);
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
    layoutTaskScheduler.cancel(layoutMeasureTask);
    viewportPriorityTaskScheduler.schedule(
      enqueueLayoutMeasure,
      proximity || getMeasureViewportProximity(),
    );
  };

  const cancelMeasure = () => {
    viewportPriorityTaskScheduler.cancel(enqueueLayoutMeasure);
    layoutTaskScheduler.cancel(layoutMeasureTask);
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
      const reuseMeasurement = widthChanged && canReuseMeasurement(size.width);
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
