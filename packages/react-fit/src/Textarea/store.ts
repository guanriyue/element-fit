import { observeElementResize } from '@guanriyue/resize-observer-hub';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../_internal/getElementViewportProximity.ts';
import { getEntryContentBoxWidth } from '../_internal/getEntryContentBoxWidth.ts';
import { observeElementMutation } from '../_internal/observeElementMutation.ts';
import { viewportPriorityTaskScheduler } from '../_internal/viewportPriorityTaskScheduler.ts';
import {
  scheduleTextareaAutosizeMeasure,
  type TextareaAutosizeHeight,
} from './measure/index.ts';

const TEXTAREA_VIEWPORT_MARGIN_RATIO = 1;

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

const TEXTAREA_RESIZE_OPTIONS = {
  box: 'border-box',
} satisfies ResizeObserverOptions;

type TextareaStoreListener = () => void;

export type TextareaStoreState = TextareaAutosizeHeight | null;

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
  let contentBoxWidth: number | undefined;
  let measureToken: object | undefined;
  let cancelMeasure: (() => void) | undefined;
  let unobserveResize: (() => void) | null = null;
  let unobserveMutation: (() => void) | null = null;
  const listeners = new Set<TextareaStoreListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commitState = (nextState: TextareaStoreState) => {
    if (state === nextState) {
      return;
    }

    state = nextState;
    notify();
  };

  const enqueueMeasure = () => {
    const measuredElement = element;
    const measuredOptions = options;

    if (!measuredOptions.enabled || measuredElement === null) {
      return;
    }

    if (cancelMeasure) {
      cancelMeasure();
    }

    const nextMeasureToken = {};

    measureToken = nextMeasureToken;
    measuredAttributeSignature = getAttributeSignature(measuredElement);
    cancelMeasure = scheduleTextareaAutosizeMeasure(
      measuredElement,
      measuredOptions.minRows,
      measuredOptions.maxRows,
      (height) => {
        if (
          measureToken !== nextMeasureToken
          || element !== measuredElement
          || options !== measuredOptions
          || !measuredOptions.enabled
        ) {
          return;
        }

        measureToken = undefined;
        cancelMeasure = undefined;

        if (height === null) {
          return;
        }

        commitState(height);
      },
    );
  };

  const cancelEnqueuedMeasure = () => {
    measureToken = undefined;

    if (cancelMeasure) {
      cancelMeasure();
      cancelMeasure = undefined;
    }
  };

  const getMeasureViewportProximity = (): ViewportProximity => {
    if (element === null) {
      return 'near';
    }

    return getElementViewportProximity(element, {
      verticalMargin: window.innerHeight * TEXTAREA_VIEWPORT_MARGIN_RATIO,
    });
  };

  const scheduleMeasure = () => {
    cancelEnqueuedMeasure();

    if (!options.enabled || element === null) {
      return;
    }

    viewportPriorityTaskScheduler.schedule(
      enqueueMeasure,
      getMeasureViewportProximity(),
    );
  };

  const stopMeasure = () => {
    viewportPriorityTaskScheduler.cancel(enqueueMeasure);
    cancelEnqueuedMeasure();
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

    contentBoxWidth = undefined;
  };

  const observeElement = () => {
    const observedElement = element;

    if (!options.enabled || observedElement === null) {
      return;
    }

    measuredAttributeSignature = getAttributeSignature(observedElement);
    unobserveResize = observeElementResize(observedElement, (entry) => {
      const nextWidth = getEntryContentBoxWidth(entry);

      if (nextWidth === contentBoxWidth) {
        return;
      }

      contentBoxWidth = nextWidth;
      scheduleMeasure();
    }, TEXTAREA_RESIZE_OPTIONS);
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

        scheduleMeasure();
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
    requestMeasure: scheduleMeasure,
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
