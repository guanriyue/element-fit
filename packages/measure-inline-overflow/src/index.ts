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
   * The container element that defines the width available to Content.
   *
   * When omitted, Content itself is used as the Container.
   *
   * @zh
   * 为 Content 提供可用宽度的容器元素。
   *
   * 未提供时，使用 Content 自身作为 Container。
   */
  container?: HTMLElement;

  /**
   * @en
   * A known content-box width for the resolved Container.
   *
   * It can reuse a size supplied by ResizeObserver or another external layout
   * source and avoid reading computed style when the content-box width is
   * needed. The value must be finite and non-negative.
   *
   * @zh
   * 已知的 Container content-box width。
   *
   * 可以复用 ResizeObserver 等外部来源提供的尺寸，并在需要 content-box
   * width 时避免读取 computed style。该值必须是有限的非负数。
   */
  containerContentBoxWidth?: number;

  /**
   * @en
   * Whether to skip the high-precision Range fallback within the integer
   * precision boundary.
   *
   * When disabled, the function uses the direct `scrollWidth > availableWidth`
   * comparison without applying the precision boundary as an epsilon.
   *
   * @zh
   * 是否跳过整数精度临界区间内的 Range 高精度补充测量。
   *
   * 禁用后，函数直接使用 `scrollWidth > availableWidth`，不会把整数精度
   * 临界值作为 epsilon 应用到普通比较。
   *
   * @default `false`
   */
  disableRangeFallback?: boolean;
};

const EMPTY_MEASURE_INLINE_OVERFLOW_OPTIONS: MeasureInlineOverflowOptions = {};
const SCROLL_WIDTH_PRECISION_BOUNDARY = 1;

const getContainerContentBoxWidth = (container: HTMLElement): number => {
  const view = container.ownerDocument.defaultView;
  const style = view
    ? view.getComputedStyle(container)
    : getComputedStyle(container);
  const paddingInlineStart = Number.parseFloat(style.paddingInlineStart) || 0;
  const paddingInlineEnd = Number.parseFloat(style.paddingInlineEnd) || 0;

  return Math.max(
    0,
    container.clientWidth - paddingInlineStart - paddingInlineEnd,
  );
};

const getRangeWidth = (content: HTMLElement): number => {
  const range = content.ownerDocument.createRange();
  range.selectNodeContents(content);

  return range.getBoundingClientRect().width;
};

const resolveContainerContentBoxWidth = (
  container: HTMLElement,
  observedWidth: number | undefined,
): number => {
  if (typeof observedWidth === 'undefined') {
    return getContainerContentBoxWidth(container);
  }

  if (!Number.isFinite(observedWidth) || observedWidth < 0) {
    throw new RangeError(
      'containerContentBoxWidth must be a finite, non-negative number.',
    );
  }

  return observedWidth;
};

/**
 * Resolves the low-precision comparison.
 *
 * `null` means the result is within the integer precision boundary and should
 * be measured with Range.
 */
const resolveScrollWidthOverflow = (
  content: HTMLElement,
  widthDifference: number,
  disableRangeFallback: boolean | undefined,
): boolean | null => {
  // The precision boundary only selects when Range should take over. It is not
  // a tolerance for the regular scrollWidth comparison.
  if (disableRangeFallback === true) {
    return widthDifference > 0;
  }

  if (widthDifference >= SCROLL_WIDTH_PRECISION_BOUNDARY) {
    return true;
  }

  if (
    widthDifference <= -SCROLL_WIDTH_PRECISION_BOUNDARY ||
    !content.hasChildNodes()
  ) {
    return false;
  }

  return null;
};

const measureWithSharedContainer = (
  content: HTMLElement,
  options: MeasureInlineOverflowOptions,
): boolean => {
  const scrollWidthOverflow = resolveScrollWidthOverflow(
    content,
    content.scrollWidth - content.clientWidth,
    options.disableRangeFallback,
  );

  if (scrollWidthOverflow !== null) {
    return scrollWidthOverflow;
  }

  const availableContentWidth = resolveContainerContentBoxWidth(
    content,
    options.containerContentBoxWidth,
  );

  return getRangeWidth(content) > availableContentWidth;
};

const measureWithSeparateContainer = (
  content: HTMLElement,
  container: HTMLElement,
  options: MeasureInlineOverflowOptions,
): boolean => {
  const availableContentWidth = resolveContainerContentBoxWidth(
    container,
    options.containerContentBoxWidth,
  );
  const scrollWidthOverflow = resolveScrollWidthOverflow(
    content,
    content.scrollWidth - availableContentWidth,
    options.disableRangeFallback,
  );

  if (scrollWidthOverflow !== null) {
    return scrollWidthOverflow;
  }

  return getRangeWidth(content) > availableContentWidth;
};

/**
 * @en
 * Measures whether Content has single-line horizontal overflow.
 *
 * The function first compares `scrollWidth` with the available width. When the
 * result is within the one-pixel integer precision boundary, non-empty Content
 * uses its Range width to detect boundary overflow caused by subpixel browser
 * layout.
 *
 * A Range bounding rect supports text, elements, and mixed content in a regular
 * single-line flow, but it is not the intrinsic width of an arbitrary DOM
 * subtree. Margins, pseudo-elements, positioning, transforms, and multiline
 * layouts are outside the reliable scope of this fallback.
 *
 * @zh
 * 测量 Content 是否发生单行横向溢出。
 *
 * 默认使用 `scrollWidth` 与可用宽度进行快速比较。当结果位于一像素的整数精度
 * 临界区间内时，非空 Content 会使用 Range width 补充判断浏览器亚像素布局造成的
 * 边界溢出。
 *
 * Range bounding rect 适用于普通单行 flow 中的文本、元素和混合内容，但不是
 * 任意 DOM 子树的 intrinsic width。margin、伪元素、定位、transform 和多行布局
 * 不属于该 fallback 的可靠测量范围。
 */
export const measureInlineOverflow = (
  content: HTMLElement,
  options?: MeasureInlineOverflowOptions,
): boolean => {
  const resolvedOptions = typeof options === 'undefined'
    ? EMPTY_MEASURE_INLINE_OVERFLOW_OPTIONS
    : options;
  const container = resolvedOptions.container ?? content;

  return container === content
    ? measureWithSharedContainer(content, resolvedOptions)
    : measureWithSeparateContainer(content, container, resolvedOptions);
};
