export const createRafScheduler = (task: () => void): (() => void) => {
  let frameId: number | null = null;

  return () => {
    if (frameId !== null) {
      return;
    }

    if (typeof globalThis.requestAnimationFrame !== 'function') {
      task();
      return;
    }

    frameId = globalThis.requestAnimationFrame(() => {
      frameId = null;
      task();
    });
  };
};
