import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { createDoubleRafScheduler } from '../_internal/createDoubleRafScheduler';
import { observeElementMutation } from '../_internal/observeElementMutation';
import { isLineClampMeasurementMutation } from './measurementNode';

const LINE_CLAMP_MUTATION_OPTIONS = {
  subtree: true,
  childList: true,
  characterData: true,
} satisfies MutationObserverInit;

type LineClampStoreListener = () => void;
type LineClampOverflowChangeListener = (overflow: boolean) => void;

export type LineClampStoreState = {
  overflow: boolean;
  contentHeight: number;
};

export type LineClampStore = {
  getState: () => LineClampStoreState;
  subscribe: (listener: LineClampStoreListener) => () => void;
  setLines: (lines: number | undefined) => void;
  setOnOverflowChange: (
    listener: LineClampOverflowChangeListener | undefined,
  ) => void;
  setRootElement: (element: HTMLSpanElement | null) => void;
  setSpacerElement: (element: HTMLSpanElement | null) => void;
  setSuffixElement: (element: HTMLSpanElement | null) => void;
};

export type LineClampMeasureParams = {
  /**
   * Root containing the content and LineClamp's optional layout nodes.
   */
  root: HTMLSpanElement;

  /**
   * Inclusive child-node offset of the content. Collapsed layout nodes are
   * rendered before this boundary and must not be measured as content.
   */
  contentStartOffset: number;

  /**
   * Exclusive child-node offset of the content. The expanded inline suffix is
   * rendered after this boundary and must not contribute to overflow.
   */
  contentEndOffset: number;

  /**
   * Explicit line limit used as the stable measurement baseline, including
   * while the controlled UI is expanded.
   */
  lines: number;

  /**
   * Cached Root content-box width. Passing it avoids another computed-style
   * read and gives clone measurement the same available inline size.
   */
  rootContentBoxWidth: number;

  /**
   * Whether current line rects are affected by the collapsed float suffix.
   * Range measurement needs a different comparison for this layout.
   */
  hasFloatedSuffix: boolean;
};

type LineClampMeasure = (params: LineClampMeasureParams) => boolean;

type RootContentBoxSize = {
  width: number;
  height: number;
};

type ContentOffsets = {
  start: number;
  end: number;
};

const getContentOffsets = (
  root: HTMLSpanElement,
  spacer: HTMLSpanElement | null,
  suffix: HTMLSpanElement | null,
): ContentOffsets => {
  const childNodes = Array.from(root.childNodes);
  const end = childNodes.length;

  // Float layout requires Spacer and Suffix to precede the content.
  if (spacer !== null && spacer.parentNode === root) {
    const boundary = suffix !== null ? suffix : spacer;
    const boundaryIndex = childNodes.indexOf(boundary);

    if (boundaryIndex >= 0) {
      return {
        start: boundaryIndex + 1,
        end,
      };
    }
  }

  if (suffix === null || suffix.parentNode !== root) {
    return {
      start: 0,
      end,
    };
  }

  const suffixIndex = childNodes.indexOf(suffix);

  if (suffixIndex < 0) {
    return {
      start: 0,
      end,
    };
  }

  // Expanded layout places Suffix after the content in normal inline order.
  return {
    start: 0,
    end: suffixIndex,
  };
};

const getRootContentBoxSize = (root: HTMLElement): RootContentBoxSize => {
  const view = root.ownerDocument.defaultView;
  const style = view
    ? view.getComputedStyle(root)
    : getComputedStyle(root);
  const paddingInlineStart = Number.parseFloat(style.paddingInlineStart) || 0;
  const paddingInlineEnd = Number.parseFloat(style.paddingInlineEnd) || 0;
  const paddingBlockStart = Number.parseFloat(style.paddingBlockStart) || 0;
  const paddingBlockEnd = Number.parseFloat(style.paddingBlockEnd) || 0;

  return {
    width: Math.max(
      0,
      root.clientWidth - paddingInlineStart - paddingInlineEnd,
    ),
    height: Math.max(
      0,
      root.clientHeight - paddingBlockStart - paddingBlockEnd,
    ),
  };
};

const getEntryContentBoxSize = (
  entry: ResizeObserverEntry,
): RootContentBoxSize => {
  const contentBoxSize = entry.contentBoxSize[0];

  if (typeof contentBoxSize !== 'undefined') {
    return {
      width: contentBoxSize.inlineSize,
      height: contentBoxSize.blockSize,
    };
  }

  return {
    width: entry.contentRect.width,
    height: entry.contentRect.height,
  };
};

export const createLineClampStore = (
  initialLines: number | undefined,
  measure: LineClampMeasure,
): LineClampStore => {
  let state: LineClampStoreState = {
    overflow: false,
    contentHeight: 0,
  };
  let lines = initialLines;
  let rootElement: HTMLSpanElement | null = null;
  let spacerElement: HTMLSpanElement | null = null;
  let suffixElement: HTMLSpanElement | null = null;
  let rootContentBoxWidth: number | null = null;
  let unobserveRootResize: (() => void) | null = null;
  let unobserveRootMutation: (() => void) | null = null;
  let onOverflowChange: LineClampOverflowChangeListener | undefined;
  let hasMeasuredOverflow = false;
  let measuredOverflow = false;
  const listeners = new Set<LineClampStoreListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commitState = (nextState: LineClampStoreState) => {
    if (
      state.overflow === nextState.overflow
      && state.contentHeight === nextState.contentHeight
    ) {
      return;
    }

    state = nextState;
    notify();
  };

  const dispatchOverflowChange = (overflow: boolean) => {
    const changed = !hasMeasuredOverflow || measuredOverflow !== overflow;

    hasMeasuredOverflow = true;
    measuredOverflow = overflow;

    if (!changed || typeof onOverflowChange === 'undefined') {
      return;
    }

    onOverflowChange(overflow);
  };

  const measureAndCommit = () => {
    if (typeof lines === 'undefined') {
      commitState({
        ...state,
        overflow: false,
      });
      dispatchOverflowChange(false);
      return;
    }

    if (rootElement === null) {
      return;
    }

    if (rootContentBoxWidth === null) {
      return;
    }

    const contentOffsets = getContentOffsets(
      rootElement,
      spacerElement,
      suffixElement,
    );
    const hasFloatedSuffix = spacerElement !== null
      && spacerElement.parentNode === rootElement;
    const overflow = measure({
      root: rootElement,
      contentStartOffset: contentOffsets.start,
      contentEndOffset: contentOffsets.end,
      lines,
      rootContentBoxWidth,
      hasFloatedSuffix,
    });

    commitState({
      ...state,
      overflow,
    });
    dispatchOverflowChange(overflow);
  };

  const scheduleMeasure = createDoubleRafScheduler(measureAndCommit);

  const stopRootObserve = () => {
    if (unobserveRootResize) {
      unobserveRootResize();
      unobserveRootResize = null;
    }

    if (unobserveRootMutation) {
      unobserveRootMutation();
      unobserveRootMutation = null;
    }

    rootContentBoxWidth = null;
  };

  const observeRoot = () => {
    const observedRoot = rootElement;

    if (observedRoot === null) {
      return;
    }

    unobserveRootResize = observeElementResize(observedRoot, (entry) => {
      if (entry.target !== rootElement) {
        return;
      }

      const size = getEntryContentBoxSize(entry);
      const widthChanged = rootContentBoxWidth !== size.width;

      rootContentBoxWidth = size.width;
      commitState({
        ...state,
        contentHeight: size.height,
      });

      if (widthChanged) {
        scheduleMeasure();
      }
    });
    unobserveRootMutation = observeElementMutation(
      observedRoot,
      (records) => {
        const contentChanged = records.some((record) => {
          return !isLineClampMeasurementMutation(record);
        });

        if (contentChanged) {
          scheduleMeasure();
        }
      },
      LINE_CLAMP_MUTATION_OPTIONS,
    );
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setLines: (nextLines) => {
      if (lines === nextLines) {
        return;
      }

      lines = nextLines;

      if (typeof nextLines === 'undefined') {
        commitState({
          ...state,
          overflow: false,
        });
        dispatchOverflowChange(false);
        return;
      }

      // Keep the last trusted overflow while the new measurement is pending.
      // Resetting it here would unmount Suffix, alter layout, and create a
      // visible false -> true cycle when the content still overflows.
      scheduleMeasure();
    },
    setOnOverflowChange: (listener) => {
      onOverflowChange = listener;
    },
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
      commitState({
        ...state,
        contentHeight: size.height,
      });
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
