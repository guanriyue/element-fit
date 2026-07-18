import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { observeElementMutation } from '../_internal/observeElementMutation.ts';
import {
  scheduleTextareaAutosizeMeasure,
  type TextareaAutosizeMeasure,
} from './measure/index.ts';

const TEXTAREA_MEASUREMENT_ATTRIBUTES = [
  'class',
  'cols',
  'dir',
  'id',
  'lang',
  'placeholder',
  'rows',
  'wrap',
] as const;

const TEXTAREA_MUTATION_OPTIONS = {
  attributes: true,
  attributeFilter: [...TEXTAREA_MEASUREMENT_ATTRIBUTES],
} satisfies MutationObserverInit;

type TextareaStoreListener = () => void;

export type TextareaStoreState = TextareaAutosizeMeasure | null;

export type TextareaStoreOptions = {
  enabled: boolean;
  minRows?: number;
  maxRows?: number;
};

export type TextareaStore = {
  getState: () => TextareaStoreState;
  subscribe: (listener: TextareaStoreListener) => () => void;
  requestMeasure: () => void;
  setElement: (element: HTMLTextAreaElement | null) => void;
  setOptions: (options: TextareaStoreOptions) => void;
};

const getBorderBoxInlineSize = (entry: ResizeObserverEntry): number => {
  const borderBoxSize = entry.borderBoxSize[0];

  if (typeof borderBoxSize !== 'undefined') {
    return borderBoxSize.inlineSize;
  }

  return entry.target.getBoundingClientRect().width;
};

const getAttributeSignature = (element: HTMLTextAreaElement): string => {
  const values = TEXTAREA_MEASUREMENT_ATTRIBUTES.map((attribute) => {
    return element.getAttribute(attribute);
  });

  return JSON.stringify(values);
};

export const createTextareaStore = (
  initialOptions: TextareaStoreOptions,
): TextareaStore => {
  let state: TextareaStoreState = null;
  let options = initialOptions;
  let element: HTMLTextAreaElement | null = null;
  let measuredAttributeSignature = '';
  let borderBoxInlineSize = 0;
  let cancelMeasure: (() => void) | null = null;
  let remeasureRequested = false;
  let unobserveResize: (() => void) | null = null;
  let unobserveMutation: (() => void) | null = null;
  const listeners = new Set<TextareaStoreListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commitState = (nextState: TextareaStoreState) => {
    if (state === null && nextState === null) {
      return;
    }

    if (state !== null && nextState !== null) {
      const heightUnchanged = state.height === nextState.height;
      const overflowUnchanged = state.overflowY === nextState.overflowY;

      if (heightUnchanged && overflowUnchanged) {
        return;
      }
    }

    state = nextState;
    notify();
  };

  const measureAndCommit = () => {
    if (!options.enabled) {
      commitState(null);
      return;
    }

    if (element === null) {
      return;
    }

    if (cancelMeasure !== null) {
      remeasureRequested = true;
      return;
    }

    measuredAttributeSignature = getAttributeSignature(element);
    const measuredElement = element;
    cancelMeasure = scheduleTextareaAutosizeMeasure(
      measuredElement,
      options.minRows,
      options.maxRows,
      (measure, measuredInlineSize) => {
        cancelMeasure = null;

        if (element === measuredElement && options.enabled) {
          if (measure !== null) {
            borderBoxInlineSize = measuredInlineSize;
            commitState(measure);
          }
        }

        if (remeasureRequested) {
          remeasureRequested = false;
          measureAndCommit();
        }
      },
    );
  };

  const stopMeasure = () => {
    remeasureRequested = false;

    if (cancelMeasure) {
      cancelMeasure();
      cancelMeasure = null;
    }
  };

  const stopObserve = () => {
    if (unobserveResize) {
      unobserveResize();
      unobserveResize = null;
    }

    if (unobserveMutation) {
      unobserveMutation();
      unobserveMutation = null;
    }
  };

  const observeElement = () => {
    const observedElement = element;

    if (!options.enabled || observedElement === null) {
      return;
    }

    borderBoxInlineSize = observedElement.getBoundingClientRect().width;
    measuredAttributeSignature = getAttributeSignature(observedElement);
    unobserveResize = observeElementResize(observedElement, (entry) => {
      if (entry.target !== element) {
        return;
      }

      const nextInlineSize = getBorderBoxInlineSize(entry);

      if (nextInlineSize === borderBoxInlineSize) {
        return;
      }

      borderBoxInlineSize = nextInlineSize;
      measureAndCommit();
    });
    unobserveMutation = observeElementMutation(
      observedElement,
      () => {
        if (observedElement !== element) {
          return;
        }

        const nextAttributeSignature = getAttributeSignature(observedElement);

        if (nextAttributeSignature === measuredAttributeSignature) {
          return;
        }

        measureAndCommit();
      },
      TEXTAREA_MUTATION_OPTIONS,
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
    requestMeasure: measureAndCommit,
    setElement: (nextElement) => {
      if (element === nextElement) {
        return;
      }

      stopMeasure();
      stopObserve();
      element = nextElement;

      if (nextElement === null) {
        return;
      }

      observeElement();
    },
    setOptions: (nextOptions) => {
      const enabledChanged = options.enabled !== nextOptions.enabled;

      options = nextOptions;

      if (!enabledChanged) {
        return;
      }

      stopMeasure();
      stopObserve();

      if (!nextOptions.enabled) {
        commitState(null);
        return;
      }

      observeElement();
    },
  };
};
