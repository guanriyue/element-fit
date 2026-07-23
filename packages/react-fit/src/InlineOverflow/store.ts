import { observeElementResize } from '@guanriyue/resize-observer-hub';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../_internal/getElementViewportProximity.ts';
import { getEntryContentBoxWidth } from '../_internal/getEntryContentBoxWidth.ts';
import { observeElementMutation } from '../_internal/observeElementMutation.ts';
import { viewportPriorityTaskScheduler } from '../_internal/viewportPriorityTaskScheduler.ts';
import { measureInlineOverflowWithRootContentBoxWidth } from './measureInlineOverflow.ts';

type InlineOverflowStoreListener = () => void;

const INLINE_OVERFLOW_CONTENT_MUTATION_OPTIONS = {
  subtree: true,
  childList: true,
  characterData: true,
} satisfies MutationObserverInit;

const INLINE_OVERFLOW_VIEWPORT_MARGIN_RATIO = 0.5;

/**
 * 接收最新派生 overflow 状态的回调。
 */
export type InlineOverflowChangeHandler = (overflow: boolean) => void;

export type InlineOverflowStore = {
  getOverflow: () => boolean;
  subscribe: (listener: InlineOverflowStoreListener) => () => void;
  setRootElement: (element: HTMLElement | null) => void;
  setContentElement: (element: HTMLElement | null) => void;
  setOnOverflowChange: (handler: InlineOverflowChangeHandler | undefined) => void;
  setDisableRangeFallback: (disabled: boolean) => void;
};

type InlineOverflowInnerData = {
  rootElement: HTMLElement | null;
  contentElement: HTMLElement | null;
  rootContentBoxWidth: number | null;
  measuredRootElement: HTMLElement | null;
  measuredContentElement: HTMLElement | null;
  disableRangeFallback: boolean;
};

type InlineOverflowMeasurement = {
  width: number;
  overflow: boolean;
};

const createInitialInnerData = (
  disableRangeFallback: boolean,
): InlineOverflowInnerData => {
  return {
    rootElement: null,
    contentElement: null,
    rootContentBoxWidth: null,
    measuredRootElement: null,
    measuredContentElement: null,
    disableRangeFallback,
  };
};

export const createInlineOverflowStore = (
  initialOnOverflowChange?: InlineOverflowChangeHandler,
  initialDisableRangeFallback = false,
): InlineOverflowStore => {
  let overflow = false;
  const innerData = createInitialInnerData(initialDisableRangeFallback);
  let onOverflowChange = initialOnOverflowChange;
  let unobserveRootResize: (() => void) | null = null;
  let unobserveContentResize: (() => void) | null = null;
  let unobserveContentMutation: (() => void) | null = null;
  let lastMeasurement: InlineOverflowMeasurement | undefined;
  const listeners = new Set<InlineOverflowStoreListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commitOverflow = (nextOverflow: boolean) => {
    if (overflow === nextOverflow) {
      return;
    }

    overflow = nextOverflow;
    notify();
  };

  const resetMeasurement = () => {
    lastMeasurement = undefined;
    innerData.measuredRootElement = null;
    innerData.measuredContentElement = null;
    commitOverflow(false);
  };

  const canReuseMeasurement = (width: number | null): boolean => {
    if (!lastMeasurement || typeof width !== 'number') {
      return false;
    }

    // For unchanged content and measurement options, overflow remains true
    // at narrower widths, while a fitting result remains false at wider widths.
    return lastMeasurement.overflow
      ? width <= lastMeasurement.width
      : width >= lastMeasurement.width;
  };

  const measureAndCommit = () => {
    const { rootElement, contentElement, rootContentBoxWidth } = innerData;

    if (rootElement === null || contentElement === null) {
      return;
    }

    if (canReuseMeasurement(rootContentBoxWidth)) {
      return;
    }

    const nextOverflow = measureInlineOverflowWithRootContentBoxWidth({
      root: rootElement,
      content: contentElement,
      rootContentBoxWidth,
      disableRangeFallback: innerData.disableRangeFallback,
    });
    const elementsChanged =
      innerData.measuredRootElement !== rootElement ||
      innerData.measuredContentElement !== contentElement;
    const overflowChanged = overflow !== nextOverflow;

    innerData.measuredRootElement = rootElement;
    innerData.measuredContentElement = contentElement;

    if (typeof rootContentBoxWidth === 'number') {
      lastMeasurement = {
        width: rootContentBoxWidth,
        overflow: nextOverflow,
      };
    } else {
      lastMeasurement = undefined;
    }

    commitOverflow(nextOverflow);

    if (elementsChanged || overflowChanged) {
      onOverflowChange?.(nextOverflow);
    }
  };

  const getMeasureViewportProximity = (): ViewportProximity => {
    const { rootElement } = innerData;

    if (rootElement === null) {
      return 'near';
    }

    return getElementViewportProximity(rootElement, {
      verticalMargin: window.innerHeight * INLINE_OVERFLOW_VIEWPORT_MARGIN_RATIO,
      horizontalMargin: window.innerWidth * INLINE_OVERFLOW_VIEWPORT_MARGIN_RATIO,
    });
  };

  const scheduleMeasure = (proximity?: ViewportProximity) => {
    if (canReuseMeasurement(innerData.rootContentBoxWidth)) {
      viewportPriorityTaskScheduler.cancel(measureAndCommit);
      return;
    }

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

    if (unobserveRootResize) {
      unobserveRootResize();
      unobserveRootResize = null;
    }

    innerData.rootContentBoxWidth = null;
  };

  const stopContentObserve = () => {
    cancelMeasure();

    if (unobserveContentResize) {
      unobserveContentResize();
      unobserveContentResize = null;
    }

    if (unobserveContentMutation) {
      unobserveContentMutation();
      unobserveContentMutation = null;
    }
  };

  const observeRoot = () => {
    const { rootElement } = innerData;

    if (rootElement === null) {
      return;
    }

    unobserveRootResize = observeElementResize(rootElement, (entry) => {
      const width = getEntryContentBoxWidth(entry);

      if (innerData.rootContentBoxWidth === width) {
        return;
      }

      innerData.rootContentBoxWidth = width;
      scheduleMeasure();
    });
  };

  const observeContent = () => {
    const { contentElement } = innerData;

    if (contentElement === null) {
      return;
    }

    unobserveContentResize = observeElementResize(contentElement, () => {
      scheduleMeasure();
    });
    unobserveContentMutation = observeElementMutation(
      contentElement,
      () => {
        lastMeasurement = undefined;
        scheduleMeasure();
      },
      INLINE_OVERFLOW_CONTENT_MUTATION_OPTIONS,
    );
  };

  return {
    getOverflow: () => overflow,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setRootElement: (element) => {
      if (innerData.rootElement === element) {
        return;
      }

      stopRootObserve();
      innerData.rootElement = element;
      resetMeasurement();
      observeRoot();
      scheduleMeasure();
    },
    setContentElement: (element) => {
      if (innerData.contentElement === element) {
        return;
      }

      stopContentObserve();
      innerData.contentElement = element;
      resetMeasurement();
      observeContent();
      scheduleMeasure();
    },
    setOnOverflowChange: (handler) => {
      onOverflowChange = handler;
    },
    setDisableRangeFallback: (disabled) => {
      if (innerData.disableRangeFallback === disabled) {
        return;
      }

      innerData.disableRangeFallback = disabled;
      lastMeasurement = undefined;
      scheduleMeasure();
    },
  };
};
