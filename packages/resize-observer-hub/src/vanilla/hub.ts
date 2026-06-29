import { createObserver, type SharedObserver } from './observer.ts';

export type Hub = {
  getObserver(options?: ResizeObserverOptions): SharedObserver;
};

export type NormalizedResizeObserverOptions = {
  readonly box: ResizeObserverBoxOptions;
};

export const normalizeOptions = (options?: unknown): NormalizedResizeObserverOptions => {
  if (options === null || typeof options !== 'object') {
    return { box: 'content-box' };
  }

  const box = (options as { readonly box?: unknown }).box;

  if (box === 'border-box' || box === 'device-pixel-content-box') {
    return { box };
  }

  return { box: 'content-box' };
};

const createHub = (): Hub => {
  const observers = new Map<ResizeObserverBoxOptions, SharedObserver>();

  const getObserver = (options?: ResizeObserverOptions): SharedObserver => {
    const normalizedOptions = normalizeOptions(options);
    const cachedObserver = observers.get(normalizedOptions.box);

    if (cachedObserver) {
      return cachedObserver;
    }

    const observer = createObserver(normalizedOptions);
    observers.set(normalizedOptions.box, observer);

    return observer;
  };

  return {
    getObserver,
  };
};

export const resizeObserverHub = createHub();
