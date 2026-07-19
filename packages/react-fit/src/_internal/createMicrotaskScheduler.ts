const resolvedPromise = Promise.resolve();

export const createMicrotaskScheduler = (task: () => void): (() => void) => {
  let scheduled = false;

  return () => {
    if (scheduled) {
      return;
    }

    scheduled = true;

    const flush = () => {
      scheduled = false;
      task();
    };

    if (typeof globalThis.queueMicrotask === 'function') {
      globalThis.queueMicrotask(flush);
      return;
    }

    resolvedPromise.then(flush);
  };
};
