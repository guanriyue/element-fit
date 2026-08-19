import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { getElementContentBoxWidth } from '../../_internal/getElementContentBoxWidth.ts';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../../_internal/getElementViewportProximity.ts';
import { getEntryContentBoxWidth } from '../../_internal/getEntryContentBoxWidth.ts';
import { isDef } from '../../_internal/isDef.ts';
import { isUndefined } from '../../_internal/isUndefined.ts';
import { type LayoutTask, layoutTaskScheduler } from '../../_internal/layoutTaskScheduler.ts';
import { createViewportPriorityTaskScheduler } from '../../_internal/viewportPriorityTaskScheduler.ts';
import {
  doesOverflowListWidthFit,
  getVisibleCount,
  measureFittingItemGeometry,
  measureItemGeometry,
  measureOccupiedWidth,
  resolveMeasureResult,
} from './geometry.ts';
import type { OverflowListStateStore } from './state.ts';
import type {
  OverflowListAccessoryRecord,
  OverflowListGeometry,
  OverflowListItemRecord,
  OverflowListMeasureResult,
} from './types.ts';

const OVERFLOW_LIST_FAR_TASK_BATCH_SIZE = 30;
/** Root content-box 的有效 resize 阈值。 */
const OVERFLOW_LIST_ROOT_RESIZE_EPSILON = 0.5;
/** scrollWidth/clientWidth 的整数结果相差至少 1px 才视为明确溢出。 */
const OVERFLOW_LIST_SCROLL_WIDTH_PRECISION_BOUNDARY = 1;
const OVERFLOW_LIST_VIEWPORT_MARGIN_RATIO = 0.5;

const overflowListViewportPriorityTaskScheduler = createViewportPriorityTaskScheduler({
  farTaskBatchSize: OVERFLOW_LIST_FAR_TASK_BATCH_SIZE,
});

type OverflowListMeasurementOptions = {
  getAccessoryElementRevision: () => number;
  getMountedAccessories: (root: HTMLElement) => readonly OverflowListAccessoryRecord[];
  getOrderedItems: (root: HTMLElement) => readonly OverflowListItemRecord[];
  getRegisteredItems: () => readonly OverflowListItemRecord[];
  stateStore: OverflowListStateStore;
};

export type OverflowListMeasurementController = {
  invalidate: () => void;
  isMeasuring: () => boolean;
  setRootElement: (element: HTMLElement | null) => void;
};

const getRootViewportProximity = (root: HTMLElement): ViewportProximity => {
  return getElementViewportProximity(root, {
    verticalMargin: window.innerHeight * OVERFLOW_LIST_VIEWPORT_MARGIN_RATIO,
    horizontalMargin: window.innerWidth * OVERFLOW_LIST_VIEWPORT_MARGIN_RATIO,
  });
};

/**
 * 管理一个 OverflowList 的几何缓存、布局任务和 Root ResizeObserver。
 * React 状态写入委托给 stateStore，元素发现委托给 element registry。
 */
export const createOverflowListMeasurementController = (
  options: OverflowListMeasurementOptions,
): OverflowListMeasurementController => {
  let rootElement: HTMLElement | null = null;
  let unobserveRootResize: (() => void) | undefined;
  let observedRootWidth: number | undefined;
  let viewportProximity: ViewportProximity = 'near';
  let geometry: OverflowListGeometry | undefined;
  let committedResult: OverflowListMeasureResult | undefined;
  let measuring = false;

  const getMeasuredRootWidth = (root: HTMLElement) => {
    if (!isUndefined(observedRootWidth)) {
      return observedRootWidth;
    }

    return getElementContentBoxWidth(root);
  };

  const enqueueMeasure = () => {
    layoutTaskScheduler.schedule(measureTask);
  };

  const enqueueResize = () => {
    layoutTaskScheduler.schedule(resizeTask);
  };

  const scheduleMeasure = () => {
    if (!rootElement) {
      return;
    }

    overflowListViewportPriorityTaskScheduler.schedule(enqueueMeasure, viewportProximity);
  };

  const invalidate = () => {
    overflowListViewportPriorityTaskScheduler.cancel(enqueueResize);
    layoutTaskScheduler.cancel(resizeTask);
    geometry = undefined;
    committedResult = undefined;
    scheduleMeasure();
  };

  const measureTask: LayoutTask = () => {
    if (!rootElement) {
      return undefined;
    }

    const measuredRoot = rootElement;
    const previousGeometry = geometry;
    const previousResult = committedResult;
    const previousState = options.stateStore.getSnapshot();

    measuring = true;
    geometry = undefined;
    committedResult = undefined;

    let measuredGeometry: OverflowListGeometry;
    let measuredResult: OverflowListMeasureResult;
    let measuredRootWidth = 0;
    let candidateVisibleCount = 0;
    let measuredAccessoryRevision: number | undefined;
    let committed = false;

    const commit = () => {
      geometry = measuredGeometry;
      committedResult = measuredResult;
      committed = true;
    };

    return {
      stages: [
        {
          flushSync: true,
          write: () => {
            const registeredItems = options.getRegisteredItems();

            options.stateStore.applyResult(
              registeredItems,
              {
                overflow: false,
                visibleCount: registeredItems.length,
              },
              'hidden',
            );
          },
        },
        {
          read: () => {
            const orderedItems = options.getOrderedItems(measuredRoot);

            measuredRootWidth = getMeasuredRootWidth(measuredRoot);
            const rootHasDefiniteScrollableOverflow =
              measuredRoot.scrollWidth - measuredRoot.clientWidth
              >= OVERFLOW_LIST_SCROLL_WIDTH_PRECISION_BOUNDARY;

            if (!rootHasDefiniteScrollableOverflow) {
              const fittingGeometry = measureFittingItemGeometry(orderedItems);

              if (
                doesOverflowListWidthFit(
                  fittingGeometry.fullItemsWidth,
                  measuredRootWidth,
                )
              ) {
                measuredGeometry = fittingGeometry;
                candidateVisibleCount = orderedItems.length;
                measuredResult = {
                  overflow: false,
                  visibleCount: candidateVisibleCount,
                };
                return;
              }
            }

            measuredGeometry = measureItemGeometry(orderedItems);
            candidateVisibleCount = getVisibleCount(
              measuredGeometry.prefixWidths,
              measuredRootWidth,
            );
            measuredResult = {
              overflow: candidateVisibleCount < orderedItems.length,
              visibleCount: candidateVisibleCount,
            };
          },
          flushSync: true,
          write: () => {
            if (!measuredResult.overflow) {
              options.stateStore.applyResult(
                measuredGeometry.orderedItems,
                measuredResult,
                'hidden',
              );
              commit();
              return;
            }

            options.stateStore.applyResult(
              measuredGeometry.orderedItems,
              measuredResult,
              'measuring',
            );
          },
        },
        {
          read: () => {
            if (committed) {
              return;
            }

            const accessories = options.getMountedAccessories(measuredRoot);
            const visibleItems = measuredGeometry.orderedItems.slice(0, candidateVisibleCount);
            const occupiedWidth = measureOccupiedWidth(visibleItems, accessories);
            const candidateItemsWidth = measuredGeometry.prefixWidths[candidateVisibleCount];

            measuredGeometry.accessoryWidth = Math.max(0, occupiedWidth - candidateItemsWidth);
            measuredAccessoryRevision = options.getAccessoryElementRevision();
            measuredResult = resolveMeasureResult(
              measuredGeometry,
              measuredRootWidth,
            ) as OverflowListMeasureResult;
          },
          flushSync: true,
          write: () => {
            if (committed) {
              return;
            }

            options.stateStore.applyResult(
              measuredGeometry.orderedItems,
              measuredResult,
              'visible',
            );
            commit();
          },
        },
      ],
      cleanup: () => {
        if (committed) {
          measuring = false;

          if (
            isDef(measuredAccessoryRevision) &&
            measuredAccessoryRevision !== options.getAccessoryElementRevision()
          ) {
            invalidate();
          }

          return;
        }

        options.stateStore.setState(previousState);
        geometry = previousGeometry;
        committedResult = previousResult;
        measuring = false;
      },
    };
  };

  const resizeTask: LayoutTask = () => {
    if (!rootElement || !geometry) {
      return undefined;
    }

    const currentGeometry = geometry;
    const nextResult = resolveMeasureResult(currentGeometry, getMeasuredRootWidth(rootElement));

    if (
      !nextResult ||
      (committedResult &&
        committedResult.overflow === nextResult.overflow &&
        committedResult.visibleCount === nextResult.visibleCount)
    ) {
      return undefined;
    }

    measuring = true;
    const previousAccessoryRevision = options.getAccessoryElementRevision();

    return {
      stages: [
        {
          flushSync: true,
          write: () => {
            options.stateStore.applyResult(
              currentGeometry.orderedItems,
              nextResult,
              nextResult.overflow ? 'visible' : 'hidden',
            );
            committedResult = nextResult;
          },
        },
      ],
      cleanup: () => {
        measuring = false;

        if (
          nextResult.overflow &&
          previousAccessoryRevision !== options.getAccessoryElementRevision()
        ) {
          invalidate();
        }
      },
    };
  };

  const scheduleRootResize = () => {
    if (!geometry || !rootElement) {
      scheduleMeasure();
      return;
    }

    const nextResult = resolveMeasureResult(geometry, getMeasuredRootWidth(rootElement));

    if (!nextResult) {
      scheduleMeasure();
      return;
    }

    overflowListViewportPriorityTaskScheduler.schedule(enqueueResize, viewportProximity);
  };

  const cancelMeasure = () => {
    overflowListViewportPriorityTaskScheduler.cancel(enqueueMeasure);
    overflowListViewportPriorityTaskScheduler.cancel(enqueueResize);
    layoutTaskScheduler.cancel(measureTask);
    layoutTaskScheduler.cancel(resizeTask);
  };

  const stopObservingRoot = () => {
    cancelMeasure();

    if (unobserveRootResize) {
      unobserveRootResize();
      unobserveRootResize = undefined;
    }

    observedRootWidth = undefined;
    viewportProximity = 'near';
  };

  const setRootElement = (element: HTMLElement | null) => {
    if (rootElement === element) {
      return;
    }

    stopObservingRoot();
    rootElement = element;
    geometry = undefined;
    committedResult = undefined;

    if (!rootElement) {
      return;
    }

    const observedRoot = rootElement;

    viewportProximity = getRootViewportProximity(observedRoot);
    unobserveRootResize = observeElementResize(
      observedRoot,
      (entry) => {
        const width = getEntryContentBoxWidth(entry);

        if (
          !isUndefined(observedRootWidth) &&
          Math.abs(observedRootWidth - width)
            <= OVERFLOW_LIST_ROOT_RESIZE_EPSILON
        ) {
          return;
        }

        observedRootWidth = width;
        viewportProximity = getRootViewportProximity(observedRoot);

        if (!measuring) {
          scheduleRootResize();
        }
      },
      { box: 'content-box' },
    );
    invalidate();
  };

  return {
    invalidate,
    isMeasuring: () => measuring,
    setRootElement,
  };
};
