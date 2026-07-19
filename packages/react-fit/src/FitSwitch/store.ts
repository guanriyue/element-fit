import { observeElementResize } from '@guanriyue/resize-observer-hub';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../_internal/getElementViewportProximity.ts';
import { viewportPriorityTaskScheduler } from '../_internal/viewportPriorityTaskScheduler.ts';

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
const FIT_SWITCH_VIEWPORT_MARGIN_RATIO = 1;
const FIT_SWITCH_CONTAINER_RESIZE_OPTIONS = {
  box: 'content-box',
} satisfies ResizeObserverOptions;
const FIT_SWITCH_VIEW_RESIZE_OPTIONS = {
  box: 'border-box',
} satisfies ResizeObserverOptions;

export const createFitSwitchStore = (): FitSwitchStore => {
  let collapsedElement: HTMLElement | null = null;
  let expandedElement: HTMLElement | null = null;
  let containerElement: HTMLElement | null = null;
  let observedExpandedElement: HTMLElement | null = null;
  let containerWidth: number | undefined;
  let expandedWidth: number | undefined;
  // 这是 Container Resize 时采样的任务优先级，不用于实时跟踪视窗位置。
  // 滚动不会更新该值，以避免引入滚动监听和额外的布局读取；滚动后的优先级允许暂时滞后，
  // 后续 Container Resize 会重新采样，已进入 far 队列的任务仍会在空闲期完成。
  // 这里也不使用 IntersectionObserver：待执行的都是能在短时间内完成的小型任务，
  // near/far 分级只是为了分片处理 Resize 突发产生的大量计算，降低短时间内的脚本和布局压力，
  // 而不是长期暂停远离视窗的任务，因此持续观察元素可见性的收益有限。
  let viewportProximity: ViewportProximity = 'near';
  let unobserveContainerResize: (() => void) | undefined;
  let unobserveExpandedResize: (() => void) | undefined;
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
    if (typeof containerWidth === 'undefined' || typeof expandedWidth === 'undefined') {
      setMode('collapsed');
      return;
    }

    setMode(expandedWidth <= containerWidth + FIT_SWITCH_EPSILON ? 'expanded' : 'collapsed');
  };

  const updateContainerWidth = (width: number) => {
    containerWidth = width;
    viewportPriorityTaskScheduler.schedule(commitMeasuredMode, viewportProximity);
  };

  const updateExpandedWidth = (width: number) => {
    expandedWidth = width;
    viewportPriorityTaskScheduler.schedule(commitMeasuredMode, viewportProximity);
  };

  const stopObservingContainer = () => {
    if (unobserveContainerResize) {
      unobserveContainerResize();
      unobserveContainerResize = undefined;
    }

    containerElement = null;
    containerWidth = undefined;
    viewportProximity = 'near';
    viewportPriorityTaskScheduler.cancel(commitMeasuredMode);
  };

  const stopObservingExpanded = () => {
    if (unobserveExpandedResize) {
      unobserveExpandedResize();
      unobserveExpandedResize = undefined;
    }

    observedExpandedElement = null;
    expandedWidth = undefined;
    viewportPriorityTaskScheduler.cancel(commitMeasuredMode);
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
    unobserveContainerResize = observeElementResize(
      nextContainer,
      (entry) => {
        viewportProximity = getElementViewportProximity(nextContainer, {
          verticalMargin: window.innerHeight * FIT_SWITCH_VIEWPORT_MARGIN_RATIO,
          horizontalMargin: window.innerWidth * FIT_SWITCH_VIEWPORT_MARGIN_RATIO,
        });
        updateContainerWidth(
          entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width,
        );
      },
      FIT_SWITCH_CONTAINER_RESIZE_OPTIONS,
    );
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
    unobserveExpandedResize = observeElementResize(
      expandedElement,
      (entry) => {
        updateExpandedWidth(
          entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width,
        );
      },
      FIT_SWITCH_VIEW_RESIZE_OPTIONS,
    );
  };

  const reconcileObservations = () => {
    reconcileContainerObservation();
    reconcileExpandedObservation();
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
