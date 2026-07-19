export type ViewportProximity = 'near' | 'far';

export type ElementViewportProximityOptions = {
  verticalMargin?: number;
  horizontalMargin?: number;
};

/**
 * 判断元素位于视窗附近还是远离视窗。
 *
 * 此函数会同步调用 `getBoundingClientRect()`。`verticalMargin` 和
 * `horizontalMargin` 使用 CSS 像素，并在对应方向扩展视窗判定范围。
 *
 * @param element - 需要判断位置的元素。
 * @param options - 视窗判定范围的扩展距离。
 * @returns 元素与视窗的接近程度。
 */
export const getElementViewportProximity = (
  element: Element,
  options: ElementViewportProximityOptions = {},
): ViewportProximity => {
  const { verticalMargin = 0, horizontalMargin = 0 } = options;
  const rect = element.getBoundingClientRect();

  const nearViewport =
    rect.bottom >= -verticalMargin &&
    rect.top <= window.innerHeight + verticalMargin &&
    rect.right >= -horizontalMargin &&
    rect.left <= window.innerWidth + horizontalMargin;

  return nearViewport ? 'near' : 'far';
};
