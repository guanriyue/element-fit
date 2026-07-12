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
   * A known width available to Content.
   *
   * This value takes precedence over `container` and can reuse a size supplied
   * by ResizeObserver or another external layout source.
   *
   * @zh
   * 已知的可用宽度。
   *
   * 该值优先于 `container`，适合复用 ResizeObserver 等外部来源提供的尺寸。
   */
  availableWidth?: number;

  /**
   * @en
   * The container element that defines the width available to Content.
   *
   * When `availableWidth` is not provided, the function uses the Container's
   * content box width after subtracting inline padding. When no Container is
   * provided, the function uses Content's own `clientWidth`.
   *
   * @zh
   * 为 Content 提供可用宽度的容器元素。
   *
   * 未提供 `availableWidth` 时，使用该元素扣除 inline padding 后的
   * content box width。未提供容器时，使用 Content 自身的 `clientWidth`。
   */
  container?: HTMLElement;

  /**
   * @en
   * Whether to skip the high-precision Range fallback when the integer
   * dimensions are equal.
   *
   * @zh
   * 是否跳过整数尺寸相等时的 Range 高精度补充测量。
   *
   * @default `false`
   */
  skipRangeFallback?: boolean;
};

const EMPTY_MEASURE_INLINE_OVERFLOW_OPTIONS: MeasureInlineOverflowOptions = {};

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

const getAvailableWidth = (
  content: HTMLElement,
  options: MeasureInlineOverflowOptions,
): number => {
  if (typeof options.availableWidth !== 'undefined') {
    return options.availableWidth;
  }

  if (typeof options.container !== 'undefined') {
    return getContainerContentBoxWidth(options.container);
  }

  return content.clientWidth;
};

const getRangeWidth = (content: HTMLElement): number => {
  const range = content.ownerDocument.createRange();
  range.selectNodeContents(content);

  return range.getBoundingClientRect().width;
};

/**
 * @en
 * Measures whether Content has single-line horizontal overflow.
 *
 * The function first compares `scrollWidth` with the available width. When the
 * integer dimensions are strictly equal, non-empty Content uses its Range width
 * to detect boundary overflow caused by subpixel browser layout.
 *
 * A Range bounding rect supports text, elements, and mixed content in a regular
 * single-line flow, but it is not the intrinsic width of an arbitrary DOM
 * subtree. Margins, pseudo-elements, positioning, transforms, and multiline
 * layouts are outside the reliable scope of this fallback.
 *
 * @zh
 * 测量 Content 是否发生单行横向溢出。
 *
 * 默认使用 `scrollWidth` 与可用宽度进行快速比较。当两个整数尺寸严格相等时，
 * 非空 Content 会使用 Range width 补充判断浏览器亚像素布局造成的边界溢出。
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
  const availableWidth = getAvailableWidth(content, resolvedOptions);
  const contentScrollWidth = content.scrollWidth;

  if (contentScrollWidth > availableWidth) {
    return true;
  }

  if (contentScrollWidth < availableWidth) {
    return false;
  }

  if (resolvedOptions.skipRangeFallback) {
    return false;
  }

  if (!content.hasChildNodes()) {
    return false;
  }

  return getRangeWidth(content) > availableWidth;
};
