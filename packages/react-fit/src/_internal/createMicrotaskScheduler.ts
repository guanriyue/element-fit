export const createMicrotaskScheduler = (task: () => void): (() => void) => {
  let scheduled = false;

  return () => {
    if (scheduled) {
      return;
    }

    if (typeof globalThis.queueMicrotask !== 'function') {
      task();
      return;
    }

    scheduled = true;

    globalThis.queueMicrotask(() => {
      scheduled = false;
      task();
    });
  };
};
