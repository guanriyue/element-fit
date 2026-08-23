/**
 * @en
 * Options for measuring single-line horizontal overflow.
 *
 * @zh
 * 单行横向溢出测量选项。
 */
export type MeasureInlineOverflowOptions = {
  /**
   * @en
   * The content-box width available to the element's rendered content.
   *
   * The value uses untransformed CSS pixels. When omitted, the element's own
   * content-box width is derived from its current layout.
   *
   * @zh
   * 元素已渲染内容可使用的 content-box 宽度。
   *
   * 该值使用未经过 transform 的 CSS 像素。未提供时，从元素当前布局派生
   * 自身的 content-box 宽度。
   */
  availableWidth?: number;

  /**
   * @en
   * Whether to skip the high-precision Range fallback within the integer
   * precision boundary.
   *
   * @zh
   * 是否跳过整数精度临界区间内的 Range 高精度补充测量。
   *
   * @default `false`
   */
  disableRangeFallback?: boolean;
};

const EMPTY_MEASURE_INLINE_OVERFLOW_OPTIONS: MeasureInlineOverflowOptions = {};
const SCROLL_WIDTH_PRECISION_BOUNDARY = 1;

const getElementComputedStyle = (element: HTMLElement): CSSStyleDeclaration => {
  const view = element.ownerDocument.defaultView;

  return view ? view.getComputedStyle(element) : getComputedStyle(element);
};

const getCSSPixelValue = (
  style: CSSStyleDeclaration,
  property: keyof CSSStyleDeclaration,
): number => {
  const value = Number.parseFloat(String(style[property]));

  return Number.isFinite(value) ? value : 0;
};

const getInlinePaddingWidth = (style: CSSStyleDeclaration): number => {
  return (
    getCSSPixelValue(style, 'paddingInlineStart') + getCSSPixelValue(style, 'paddingInlineEnd')
  );
};

const getElementContentBoxWidth = (element: HTMLElement, inlinePaddingWidth: number): number => {
  return Math.max(0, element.clientWidth - inlinePaddingWidth);
};

const getRangeWidth = (element: HTMLElement): number => {
  const range = element.ownerDocument.createRange();

  range.selectNodeContents(element);

  return range.getBoundingClientRect().width;
};

const resolveAvailableWidth = (availableWidth: number): number => {
  if (!Number.isFinite(availableWidth) || availableWidth < 0) {
    throw new RangeError('availableWidth must be a finite, non-negative number.');
  }

  return availableWidth;
};

/**
 * Resolves the low-precision comparison.
 *
 * `null` means the result is within the integer precision boundary and should
 * be measured with Range.
 */
const resolveScrollWidthOverflow = (
  element: HTMLElement,
  widthDifference: number,
  disableRangeFallback: boolean | undefined,
): boolean | null => {
  if (disableRangeFallback === true) {
    return widthDifference > 0;
  }

  if (widthDifference >= SCROLL_WIDTH_PRECISION_BOUNDARY) {
    return true;
  }

  if (widthDifference <= -SCROLL_WIDTH_PRECISION_BOUNDARY || !element.hasChildNodes()) {
    return false;
  }

  return null;
};

const measureWithElementWidth = (
  element: HTMLElement,
  options: MeasureInlineOverflowOptions,
): boolean => {
  const scrollWidthOverflow = resolveScrollWidthOverflow(
    element,
    element.scrollWidth - element.clientWidth,
    options.disableRangeFallback,
  );

  if (scrollWidthOverflow !== null) {
    return scrollWidthOverflow;
  }

  const style = getElementComputedStyle(element);
  const availableWidth = getElementContentBoxWidth(element, getInlinePaddingWidth(style));

  return getRangeWidth(element) > availableWidth;
};

const measureWithAvailableWidth = (
  element: HTMLElement,
  availableWidth: number,
  options: MeasureInlineOverflowOptions,
): boolean => {
  const style = getElementComputedStyle(element);
  const inlinePaddingWidth = getInlinePaddingWidth(style);
  const elementContentBoxWidth = getElementContentBoxWidth(element, inlinePaddingWidth);
  const contentScrollWidth = Math.max(0, element.scrollWidth - inlinePaddingWidth);

  if (options.disableRangeFallback !== true && availableWidth < elementContentBoxWidth) {
    return getRangeWidth(element) > availableWidth;
  }

  const scrollWidthOverflow = resolveScrollWidthOverflow(
    element,
    contentScrollWidth - availableWidth,
    options.disableRangeFallback,
  );

  if (scrollWidthOverflow !== null) {
    return scrollWidthOverflow;
  }

  return getRangeWidth(element) > availableWidth;
};

/**
 * @en
 * Measures whether an element's rendered content has single-line horizontal
 * overflow.
 *
 * The function first uses integer scroll geometry. Results within the
 * one-pixel precision boundary use a Range bounding rect to detect subpixel
 * overflow. `availableWidth` uses untransformed layout CSS pixels, and the
 * Range fallback assumes that transforms do not change its coordinate space.
 *
 * A Range bounding rect supports text, elements, and mixed content in a regular
 * single-line flow, but it is not the intrinsic width of an arbitrary DOM
 * subtree. Margins, pseudo-elements, positioning, transforms, and multiline
 * layouts are outside the reliable scope of this fallback.
 *
 * @zh
 * 测量元素已渲染内容是否发生单行横向溢出。
 *
 * 函数首先使用整数滚动几何。结果位于一像素精度临界区间内时，使用 Range
 * bounding rect 检测亚像素溢出。`availableWidth` 使用未经过 transform 的布局
 * CSS 像素，Range fallback 假定 transform 不会改变其坐标空间。
 *
 * Range bounding rect 适用于普通单行 flow 中的文本、元素和混合内容，但不是
 * 任意 DOM 子树的 intrinsic width。margin、伪元素、定位、transform 和多行布局
 * 不属于该 fallback 的可靠测量范围。
 */
export const measureInlineOverflow = (
  element: HTMLElement,
  options?: MeasureInlineOverflowOptions,
): boolean => {
  const resolvedOptions =
    typeof options === 'undefined' ? EMPTY_MEASURE_INLINE_OVERFLOW_OPTIONS : options;
  const availableWidth = resolvedOptions.availableWidth;

  return typeof availableWidth === 'undefined'
    ? measureWithElementWidth(element, resolvedOptions)
    : measureWithAvailableWidth(element, resolveAvailableWidth(availableWidth), resolvedOptions);
};
