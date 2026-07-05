import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { createRafScheduler } from '../_internal/createRafScheduler.ts';
import { isUndefined } from '../_internal/isUndefined.ts';

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

const createSnapshot = (mode: FitSwitchMode): FitSwitchState => {
  return {
    mode,
  };
};

const getCommonParent = (
  collapsedElement: HTMLElement | null,
  expandedElement: HTMLElement | null,
): HTMLElement | null | undefined => {
  if (collapsedElement === null || expandedElement === null) {
    return undefined;
  }

  if (
    collapsedElement.parentElement !== null &&
    collapsedElement.parentElement === expandedElement.parentElement
  ) {
    return collapsedElement.parentElement;
  }

  return null;
};

export const createFitSwitchStore = (): FitSwitchStore => {
  let collapsedElement: HTMLElement | null = null;
  let expandedElement: HTMLElement | null = null;
  let containerElement: HTMLElement | null = null;
  let containerWidth: number | null = null;
  let expandedWidth: number | null = null;
  let unobserveContainerResize: (() => void) | null = null;
  let unobserveExpandedResize: (() => void) | null = null;
  let warnedMissingContainer = false;
  let snapshot = createSnapshot('collapsed');
  const listeners = new Set<FitSwitchListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commit = (nextSnapshot: FitSwitchState) => {
    if (snapshot.mode === nextSnapshot.mode) {
      return;
    }

    snapshot = nextSnapshot;
    notify();
  };

  const syncMode = () => {
    if (containerWidth === null || expandedWidth === null) {
      commit(createSnapshot('collapsed'));
      return;
    }

    commit(
      createSnapshot(
        expandedWidth <= containerWidth + FIT_SWITCH_EPSILON ? 'expanded' : 'collapsed',
      ),
    );
  };

  const setContainerWidth = (width: number) => {
    if (containerWidth === width) {
      return;
    }

    containerWidth = width;
    scheduleModeSync();
  };

  const setExpandedWidth = (width: number) => {
    if (expandedWidth === width) {
      return;
    }

    expandedWidth = width;
    scheduleModeSync();
  };

  const stopContainerObserve = () => {
    if (unobserveContainerResize) {
      unobserveContainerResize();
      unobserveContainerResize = null;
    }

    containerElement = null;
    containerWidth = null;
  };

  const stopExpandedObserve = () => {
    if (unobserveExpandedResize) {
      unobserveExpandedResize();
      unobserveExpandedResize = null;
    }

    expandedWidth = null;
  };

  const syncContainerObserve = () => {
    const commonParent = getCommonParent(collapsedElement, expandedElement);

    if (isUndefined(commonParent)) {
      stopContainerObserve();
      scheduleModeSync();
      return;
    }

    if (commonParent === null) {
      stopContainerObserve();

      if (process.env.NODE_ENV !== 'production' && !warnedMissingContainer) {
        warnedMissingContainer = true;
        console.warn(
          '[react-fit] FitSwitch expected Collapsed and Expanded to share the same parentElement.',
        );
      }

      scheduleModeSync();
      return;
    }

    warnedMissingContainer = false;

    if (containerElement === commonParent) {
      return;
    }

    stopContainerObserve();
    containerElement = commonParent;
    setContainerWidth(containerElement.getBoundingClientRect().width);
    unobserveContainerResize = observeElementResize(containerElement, (entry) => {
      setContainerWidth(entry.contentRect.width);
    });
  };

  const syncExpandedObserve = () => {
    stopExpandedObserve();

    if (expandedElement === null) {
      scheduleModeSync();
      return;
    }

    setExpandedWidth(expandedElement.getBoundingClientRect().width);
    unobserveExpandedResize = observeElementResize(expandedElement, (entry) => {
      setExpandedWidth(entry.contentRect.width);
    });
  };

  const syncLayout = () => {
    syncExpandedObserve();
    syncContainerObserve();
    scheduleModeSync();
  };

  const scheduleModeSync = createRafScheduler(syncMode);
  const scheduleLayoutSync = createRafScheduler(syncLayout);

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
        collapsedElement = element;
      } else {
        expandedElement = element;
      }

      scheduleLayoutSync();
    },
  };
};
