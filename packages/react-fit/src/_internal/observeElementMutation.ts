export type ElementMutationListener = (records: MutationRecord[]) => void;

/**
 * 观察元素的 DOM mutation，并返回一个可重复调用的清理函数。
 */
export const observeElementMutation = (
  element: Element,
  listener: ElementMutationListener,
  options: MutationObserverInit,
): (() => void) => {
  let disposed = false;
  const observer = new MutationObserver((records) => {
    if (disposed) {
      return;
    }

    listener(records);
  });

  observer.observe(element, options);

  return () => {
    if (disposed) {
      return;
    }

    disposed = true;
    observer.disconnect();
  };
};
