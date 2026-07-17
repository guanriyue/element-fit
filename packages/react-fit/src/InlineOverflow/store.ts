import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { batchedDoubleRafScheduler } from '../_internal/batchedDoubleRafScheduler.ts';
import { observeElementMutation } from '../_internal/observeElementMutation.ts';
import { measureInlineOverflowWithRootContentBoxWidth } from './measureInlineOverflow.ts';

type InlineOverflowStoreListener = () => void;

const INLINE_OVERFLOW_CONTENT_MUTATION_OPTIONS = {
  subtree: true,
  childList: true,
  characterData: true,
} satisfies MutationObserverInit;

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
    innerData.measuredRootElement = null;
    innerData.measuredContentElement = null;
    commitOverflow(false);
  };

  const measureAndCommit = () => {
    const { rootElement, contentElement } = innerData;

    if (rootElement === null || contentElement === null) {
      return;
    }

    const nextMeasure = measureInlineOverflowWithRootContentBoxWidth({
      root: rootElement,
      content: contentElement,
      rootContentBoxWidth: innerData.rootContentBoxWidth,
      disableRangeFallback: innerData.disableRangeFallback,
    });
    const elementsChanged =
      innerData.measuredRootElement !== rootElement ||
      innerData.measuredContentElement !== contentElement;
    const overflowChanged = overflow !== nextMeasure.overflow;

    innerData.measuredRootElement = rootElement;
    innerData.measuredContentElement = contentElement;
    commitOverflow(nextMeasure.overflow);

    if (elementsChanged || overflowChanged) {
      onOverflowChange?.(nextMeasure.overflow);
    }
  };

  const scheduleMeasure = () => {
    batchedDoubleRafScheduler.schedule(measureAndCommit);
  };

  const stopRootObserve = () => {
    if (unobserveRootResize) {
      unobserveRootResize();
      unobserveRootResize = null;
    }

    innerData.rootContentBoxWidth = null;
  };

  const stopContentObserve = () => {
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
      if (entry.target !== innerData.rootElement) {
        return;
      }

      innerData.rootContentBoxWidth =
        entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width;
      scheduleMeasure();
    });
  };

  const observeContent = () => {
    const { contentElement } = innerData;

    if (contentElement === null) {
      return;
    }

    unobserveContentResize = observeElementResize(contentElement, scheduleMeasure);
    unobserveContentMutation = observeElementMutation(
      contentElement,
      scheduleMeasure,
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
      scheduleMeasure();
    },
  };
};
