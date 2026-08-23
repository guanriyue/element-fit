import { measureInlineOverflow } from '@guanriyue/measure-inline-overflow';
import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { getElementContentBoxWidth } from '../_internal/getElementContentBoxWidth.ts';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../_internal/getElementViewportProximity.ts';
import { getEntryBorderBoxWidth } from '../_internal/getEntryBorderBoxWidth.ts';
import { getEntryContentBoxWidth } from '../_internal/getEntryContentBoxWidth.ts';
import { isNumber } from '../_internal/isNumber.ts';
import { isUndefined } from '../_internal/isUndefined.ts';
import { type LayoutTask, layoutTaskScheduler } from '../_internal/layoutTaskScheduler.ts';
import { observeElementMutation } from '../_internal/observeElementMutation.ts';
import { viewportPriorityTaskScheduler } from '../_internal/viewportPriorityTaskScheduler.ts';

export type FitListMode = 'compact' | 'expanded';

type FitListItemId = unknown;

type FitListItemRecord = {
  element: HTMLElement;
  observedWidth: number | undefined;
  unobserveResize: (() => void) | undefined;
};

type FitListRuntimeState = {
  rootElement: HTMLElement | null;
  observedRootWidth: number | undefined;
  revision: number;
  measuring: boolean;
  dirty: boolean;
  viewportProximity: ViewportProximity;
};

type FitListMeasureContext = {
  rootElement: HTMLElement;
  revision: number;
  originMode: FitListMode;
  resultMode: FitListMode | undefined;
  finalized: boolean;
};

type FitListListener = () => void;

export type FitListState = {
  mode: FitListMode;
};

export type FitListStore = {
  getSnapshot: () => FitListState;
  setItemElement: (id: FitListItemId, element: HTMLElement | null) => void;
  setModeElement: (mode: FitListMode, id: FitListItemId, element: HTMLElement | null) => void;
  setRootElement: (element: HTMLElement | null) => void;
  subscribe: (listener: FitListListener) => () => void;
};

const FIT_LIST_RESIZE_EPSILON = 0.5;
const FIT_LIST_VIEWPORT_MARGIN_RATIO = 0.2;
export const FIT_LIST_INACTIVE_ATTRIBUTE = 'data-inactive';
const FIT_LIST_MEASURING_ATTRIBUTE = 'data-measuring';

const FIT_LIST_MUTATION_OPTIONS = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
} satisfies MutationObserverInit;

const setElementMeasuring = (element: HTMLElement, measuring: boolean) => {
  element.toggleAttribute(FIT_LIST_MEASURING_ATTRIBUTE, measuring);
};

const getRootViewportProximity = (root: HTMLElement) => {
  return getElementViewportProximity(root, {
    verticalMargin: window.innerHeight * FIT_LIST_VIEWPORT_MARGIN_RATIO,
    horizontalMargin: window.innerWidth * FIT_LIST_VIEWPORT_MARGIN_RATIO,
  });
};

export const createFitListStore = (): FitListStore => {
  const runtimeState: FitListRuntimeState = {
    rootElement: null,
    observedRootWidth: undefined,
    revision: 0,
    measuring: false,
    dirty: false,
    viewportProximity: 'near',
  };
  let snapshot: FitListState = {
    mode: 'expanded',
  };
  let unobserveRootMutation: (() => void) | undefined;
  let unobserveRootResize: (() => void) | undefined;
  const itemRecords = new Map<FitListItemId, FitListItemRecord>();
  const expandedElements = new Map<FitListItemId, HTMLElement>();
  const compactElements = new Map<FitListItemId, HTMLElement>();
  const listeners = new Set<FitListListener>();

  const isModeElement = (target: Node) => {
    for (const element of expandedElements.values()) {
      if (element === target) {
        return true;
      }
    }

    for (const element of compactElements.values()) {
      if (element === target) {
        return true;
      }
    }

    return false;
  };

  const hasRelevantMutation = (records: readonly MutationRecord[], rootElement: HTMLElement) => {
    return records.some((record) => {
      if (record.type !== 'attributes') {
        return true;
      }

      if (record.attributeName === FIT_LIST_MEASURING_ATTRIBUTE && record.target === rootElement) {
        return false;
      }

      if (record.attributeName === FIT_LIST_INACTIVE_ATTRIBUTE && isModeElement(record.target)) {
        return false;
      }

      return true;
    });
  };

  const setMode = (mode: FitListMode) => {
    if (snapshot.mode === mode) {
      return;
    }

    snapshot = { mode };

    for (const listener of listeners) {
      listener();
    }
  };

  const setMeasureMode = (mode: FitListMode) => {
    for (const element of expandedElements.values()) {
      element.toggleAttribute(FIT_LIST_INACTIVE_ATTRIBUTE, mode === 'compact');
    }

    for (const element of compactElements.values()) {
      element.toggleAttribute(FIT_LIST_INACTIVE_ATTRIBUTE, mode === 'expanded');
    }
  };

  const getRootWidth = (root: HTMLElement) => {
    if (isNumber(runtimeState.observedRootWidth)) {
      return runtimeState.observedRootWidth;
    }

    return getElementContentBoxWidth(root);
  };

  const measureTask: LayoutTask = () => {
    if (!runtimeState.rootElement) {
      return undefined;
    }

    const context: FitListMeasureContext = {
      rootElement: runtimeState.rootElement,
      revision: runtimeState.revision,
      originMode: snapshot.mode,
      resultMode: undefined,
      finalized: false,
    };

    runtimeState.measuring = true;
    runtimeState.dirty = false;

    return {
      stages: [
        {
          write: () => {
            setElementMeasuring(context.rootElement, true);

            if (context.originMode === 'compact') {
              setMeasureMode('expanded');
            }
          },
        },
        {
          read: () => {
            if (
              runtimeState.rootElement !== context.rootElement ||
              runtimeState.revision !== context.revision
            ) {
              runtimeState.dirty = true;
              return;
            }

            const overflow = measureInlineOverflow(context.rootElement, {
              availableWidth: getRootWidth(context.rootElement),
            });

            context.resultMode = overflow ? 'compact' : 'expanded';
          },
          write: () => {
            if (!context.resultMode || runtimeState.revision !== context.revision) {
              setMeasureMode(context.originMode);
              context.finalized = true;
              runtimeState.dirty = true;
              return;
            }

            setMeasureMode(context.originMode);
            setMode(context.resultMode);
            context.finalized = true;
          },
        },
      ],
      cleanup: () => {
        if (!context.finalized) {
          setMeasureMode(context.originMode);
        }

        setElementMeasuring(context.rootElement, false);
        runtimeState.measuring = false;
        const shouldMeasureAgain = runtimeState.dirty || runtimeState.revision !== context.revision;

        runtimeState.dirty = false;

        if (shouldMeasureAgain) {
          scheduleMeasure();
        }
      },
    };
  };

  const enqueueMeasure = () => {
    layoutTaskScheduler.schedule(measureTask);
  };

  const scheduleMeasure = () => {
    if (runtimeState.rootElement) {
      layoutTaskScheduler.cancel(measureTask);
      viewportPriorityTaskScheduler.schedule(enqueueMeasure, runtimeState.viewportProximity);
    }
  };

  const invalidate = () => {
    runtimeState.revision += 1;

    if (runtimeState.measuring) {
      runtimeState.dirty = true;
      return;
    }

    scheduleMeasure();
  };

  const stopObservingRoot = () => {
    viewportPriorityTaskScheduler.cancel(enqueueMeasure);
    layoutTaskScheduler.cancel(measureTask);

    if (unobserveRootMutation) {
      unobserveRootMutation();
      unobserveRootMutation = undefined;
    }

    if (unobserveRootResize) {
      unobserveRootResize();
      unobserveRootResize = undefined;
    }

    runtimeState.observedRootWidth = undefined;
    runtimeState.viewportProximity = 'near';
  };

  const stopObservingItem = (record: FitListItemRecord) => {
    if (record.unobserveResize) {
      record.unobserveResize();
      record.unobserveResize = undefined;
    }
  };

  return {
    getSnapshot: () => snapshot,
    setItemElement: (id, element) => {
      const previousRecord = itemRecords.get(id);

      if (previousRecord && previousRecord.element === element) {
        return;
      }

      if (previousRecord) {
        stopObservingItem(previousRecord);
        itemRecords.delete(id);
      }

      if (element) {
        const record: FitListItemRecord = {
          element,
          observedWidth: undefined,
          unobserveResize: undefined,
        };

        record.unobserveResize = observeElementResize(
          element,
          (entry) => {
            const width = getEntryBorderBoxWidth(entry);
            const previousWidth = record.observedWidth;

            record.observedWidth = width;

            if (
              isUndefined(previousWidth) ||
              Math.abs(previousWidth - width) <= FIT_LIST_RESIZE_EPSILON
            ) {
              return;
            }

            invalidate();
          },
          { box: 'border-box' },
        );
        itemRecords.set(id, record);
      }

      invalidate();
    },
    setModeElement: (mode, id, element) => {
      const elements = mode === 'expanded' ? expandedElements : compactElements;

      if (elements.get(id) === element) {
        return;
      }

      elements.delete(id);

      if (element) {
        elements.set(id, element);
      }

      invalidate();
    },
    setRootElement: (element) => {
      if (runtimeState.rootElement === element) {
        return;
      }

      stopObservingRoot();
      runtimeState.rootElement = element;

      if (!runtimeState.rootElement) {
        return;
      }

      const observedRoot = runtimeState.rootElement;

      runtimeState.viewportProximity = getRootViewportProximity(observedRoot);
      unobserveRootMutation = observeElementMutation(
        observedRoot,
        (records) => {
          if (hasRelevantMutation(records, observedRoot)) {
            invalidate();
          }
        },
        FIT_LIST_MUTATION_OPTIONS,
      );
      unobserveRootResize = observeElementResize(
        observedRoot,
        (entry) => {
          const width = getEntryContentBoxWidth(entry);
          const previousWidth = runtimeState.observedRootWidth;

          runtimeState.observedRootWidth = width;
          runtimeState.viewportProximity = getRootViewportProximity(observedRoot);

          if (
            isUndefined(previousWidth) ||
            Math.abs(previousWidth - width) <= FIT_LIST_RESIZE_EPSILON
          ) {
            return;
          }

          invalidate();
        },
        { box: 'content-box' },
      );
      invalidate();
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
