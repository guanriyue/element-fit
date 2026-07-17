export const reportTaskError = (error: unknown): void => {
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
