type ResizeListener = (entry: ResizeObserverEntry) => void;

type Subscription = {
  readonly listener: ResizeListener;
  disposed: boolean;
};

export type SharedObserver = {
  observe(element: Element, listener: ResizeListener): () => void;
};

const reportListenerError = (error: unknown): void => {
  const runtime = globalThis as typeof globalThis & {
    reportError?: (error: unknown) => void;
  };

  if (typeof runtime.reportError === 'function') {
    runtime.reportError(error);
    return;
  }

  setTimeout(() => {
    throw error;
  }, 0);
};

export const createObserver = (options: ResizeObserverOptions): SharedObserver => {
  const subscriptionsByElement = new WeakMap<Element, Set<Subscription>>();

  const nativeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const subscriptions = subscriptionsByElement.get(entry.target);

      if (!subscriptions) {
        continue;
      }

      const snapshot = [...subscriptions];

      for (const subscription of snapshot) {
        if (subscription.disposed) {
          continue;
        }

        try {
          subscription.listener(entry);
        } catch (error) {
          reportListenerError(error);
        }
      }
    }
  });

  const observe = (element: Element, listener: (entry: ResizeObserverEntry) => void) => {
    let subscriptions = subscriptionsByElement.get(element);

    if (!subscriptions) {
      subscriptions = new Set();
      subscriptionsByElement.set(element, subscriptions);
      nativeObserver.observe(element, options);
    }

    const subscription: Subscription = {
      listener,
      disposed: false,
    };

    subscriptions.add(subscription);

    const unobserve = () => {
      if (subscription.disposed) {
        return;
      }

      subscription.disposed = true;
      subscriptions.delete(subscription);

      if (subscriptions.size === 0) {
        subscriptionsByElement.delete(element);
        nativeObserver.unobserve(element);
      }
    };

    return unobserve;
  };

  return {
    observe,
  };
};
