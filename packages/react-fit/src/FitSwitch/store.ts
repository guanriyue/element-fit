import { observeElementResize } from '@guanriyue/resize-observer-hub';

type FitSwitchListener = () => void;

export type FitSwitchMode = 'collapsed' | 'expanded' | 'overflow';

export type FitSwitchView = Exclude<FitSwitchMode, 'overflow'>;

export type FitSwitchState = {
  mode: FitSwitchMode;
};

export type FitSwitchStore = {
  getSnapshot: () => FitSwitchState;
  subscribe: (listener: FitSwitchListener) => () => void;
  setViewElement: (view: FitSwitchView, element: HTMLElement | null) => void;
};

const FIT_SWITCH_EPSILON = 1;

export const createFitSwitchStore = (): FitSwitchStore => {
  let collapsedElement: HTMLElement | null = null;
  let expandedElement: HTMLElement | null = null;
  let containerElement: HTMLElement | null = null;
  let observedExpandedElement: HTMLElement | null = null;
  let containerWidth: number | null = null;
  let expandedWidth: number | null = null;
  let unobserveContainerResize: (() => void) | null = null;
  let unobserveExpandedResize: (() => void) | null = null;
  let snapshot: FitSwitchState = {
    mode: 'collapsed',
  };
  const listeners = new Set<FitSwitchListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setMode = (mode: FitSwitchMode) => {
    if (snapshot.mode === mode) {
      return;
    }

    snapshot = {
      mode,
    };

    notify();
  };

  const commitMeasuredMode = () => {
    if (containerWidth === null || expandedWidth === null) {
      setMode('collapsed');
      return;
    }

    setMode(expandedWidth <= containerWidth + FIT_SWITCH_EPSILON ? 'expanded' : 'collapsed');
  };

  const updateContainerWidth = (width: number) => {
    containerWidth = width;
    commitMeasuredMode();
  };

  const updateExpandedWidth = (width: number) => {
    expandedWidth = width;
    commitMeasuredMode();
  };

  const stopObservingContainer = () => {
    if (unobserveContainerResize) {
      unobserveContainerResize();
      unobserveContainerResize = null;
    }

    containerElement = null;
    containerWidth = null;
  };

  const stopObservingExpanded = () => {
    if (unobserveExpandedResize) {
      unobserveExpandedResize();
      unobserveExpandedResize = null;
    }

    observedExpandedElement = null;
    expandedWidth = null;
  };

  const reconcileContainerObservation = () => {
    if (!collapsedElement || !expandedElement) {
      stopObservingContainer();
      commitMeasuredMode();
      return;
    }

    if (collapsedElement.parentElement !== expandedElement.parentElement) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[react-fit] FitSwitch expected Collapsed and Expanded to share the same parentElement.',
        );
      }

      stopObservingContainer();
      commitMeasuredMode();
      return;
    }

    const nextContainer = collapsedElement.parentElement;
    if (!nextContainer) {
      stopObservingContainer();
      commitMeasuredMode();
      return;
    }

    if (containerElement === nextContainer) {
      return;
    }

    stopObservingContainer();
    containerElement = nextContainer;
    unobserveContainerResize = observeElementResize(nextContainer, (entry) => {
      updateContainerWidth(entry.contentRect.width);
    });
  };

  const reconcileExpandedObservation = () => {
    if (observedExpandedElement === expandedElement) {
      return;
    }

    stopObservingExpanded();

    if (expandedElement === null) {
      commitMeasuredMode();
      return;
    }

    observedExpandedElement = expandedElement;
    unobserveExpandedResize = observeElementResize(expandedElement, (entry) => {
      updateExpandedWidth(entry.contentRect.width);
    });
  };

  const reconcileObservations = () => {
    reconcileExpandedObservation();
    reconcileContainerObservation();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setViewElement: (view, element) => {
      if (view === 'collapsed') {
        if (collapsedElement === element) {
          return;
        }

        collapsedElement = element;
      } else {
        if (expandedElement === element) {
          return;
        }

        expandedElement = element;
      }

      reconcileObservations();
    },
  };
};
