import { resizeObserverHub } from './hub.ts';

const noop = () => {};

const isElement = (value: unknown): value is Element => {
  return typeof value === 'object' && value !== null && (value as Node).nodeType === 1;
};

/**
 * Observes resize changes for an element with a shared native `ResizeObserver`.
 *
 * The returned function disposes only this subscription and is safe to call multiple times.
 * The first callback timing follows native `ResizeObserver` behavior.
 *
 * @param element - The element to observe.
 * @param listener - Called with the native `ResizeObserverEntry` when the element resizes.
 * @param options - Native `ResizeObserver` options. Invalid or missing `box` values are
 * normalized to `'content-box'`.
 * @returns A dispose function for this subscription.
 * @throws {ReferenceError} When `ResizeObserver` is not available in the current runtime.
 * @throws {TypeError} When `element` is not a valid `Element`.
 *
 * @example
 * ```ts
 * const dispose = observeElementResize(
 *   element,
 *   (entry) => {
 *     console.log(entry.contentRect.width, entry.contentRect.height);
 *   },
 *   { box: 'border-box' },
 * );
 *
 * dispose();
 * ```
 */
export const observeElementResize = (
  element: Element,
  listener: (entry: ResizeObserverEntry) => void,
  options?: ResizeObserverOptions,
) => {
  if (typeof ResizeObserver === 'undefined') {
    throw new ReferenceError('ResizeObserver is not available.');
  }

  if (!isElement(element)) {
    throw new TypeError('observeElementResize expected element to be an Element.');
  }

  if (typeof listener !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[resize-observer-hub] observeElementResize expected listener to be a function.',
      );
    }

    return noop;
  }

  return resizeObserverHub.getObserver(options).observe(element, listener);
};
