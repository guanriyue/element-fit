import { isNil } from '../_internal/isNil';
import { measureInlineOverflowWithRange } from './measureInlineOverflowWithRange.ts';

const SCROLL_WIDTH_PRECISION_BOUNDARY = 1;

type InlineOverflowMeasureParams = {
  root: HTMLElement;
  content: HTMLElement;
  rootContentBoxWidth: number | null;
  disableRangeFallback?: boolean;
};

/**
 * 解析整数精度的 scroll width 比较。
 *
 * 返回 null 表示结果位于临界区间，需要使用 Range 继续测量。
 */
const resolveScrollWidthOverflow = (params: {
  content: HTMLElement;
  widthDifference: number;
  disableRangeFallback?: boolean;
}): boolean | null => {
  const { content, widthDifference } = params;

  if (params.disableRangeFallback === true) {
    return widthDifference > 0;
  }

  if (widthDifference >= SCROLL_WIDTH_PRECISION_BOUNDARY) {
    return true;
  }

  if (
    widthDifference <= -SCROLL_WIDTH_PRECISION_BOUNDARY ||
    content.childNodes.length === 0
  ) {
    return false;
  }

  return null;
};

/**
 * 优先使用 ResizeObserver 已提供的 content-box width。
 *
 * 没有观测值时，clientWidth 已排除 border，但仍包含 padding，因此只需要
 * 减去 inline padding。该同步 computed style 读取仅作为回退路径。
 */
const resolveRootContentBoxWidth = (
  root: HTMLElement,
  observedRootContentBoxWidth: number | null,
): number => {
  if (!isNil(observedRootContentBoxWidth)) {
    return observedRootContentBoxWidth;
  }

  const rootStyle = getComputedStyle(root);
  const paddingInlineStart = Number.parseFloat(rootStyle.paddingInlineStart) || 0;
  const paddingInlineEnd = Number.parseFloat(rootStyle.paddingInlineEnd) || 0;

  return Math.max(0, root.clientWidth - paddingInlineStart - paddingInlineEnd);
};

/**
 * Root 是 Content 容器时，Content 按约定不包含 border 和 padding。
 *
 * content.scrollWidth 是低精度内容宽度，Root content-box width 是固定的
 * 可用宽度。临界区间内，Range width 继续与同一个可用宽度比较。
 */
const measureWithContainerRoot = (params: InlineOverflowMeasureParams): boolean => {
  const { root, content } = params;
  const availableContentWidth = resolveRootContentBoxWidth(root, params.rootContentBoxWidth);
  const scrollWidthDifference = content.scrollWidth - availableContentWidth;
  const scrollWidthMeasure = resolveScrollWidthOverflow({
    content,
    widthDifference: scrollWidthDifference,
    disableRangeFallback: params.disableRangeFallback,
  });

  if (scrollWidthMeasure !== null) {
    return scrollWidthMeasure;
  }

  return measureInlineOverflowWithRange({
    content,
    availableContentWidth,
  });
};

/**
 * Root 与 Content 是同一个元素时，元素允许包含 border 和 padding。
 *
 * scrollWidth 和 clientWidth 都采用 padding-box 语义，可以直接完成低精度
 * 比较并让 padding 自然抵消。只有结果位于临界区间时，才解析 content-box
 * 可用宽度并使用 Range 继续测量。
 */
const measureWithSharedRootAndContent = (
  params: InlineOverflowMeasureParams,
): boolean => {
  const { root: element } = params;
  const scrollWidthDifference = element.scrollWidth - element.clientWidth;
  const scrollWidthMeasure = resolveScrollWidthOverflow({
    content: element,
    widthDifference: scrollWidthDifference,
    disableRangeFallback: params.disableRangeFallback,
  });

  if (scrollWidthMeasure !== null) {
    return scrollWidthMeasure;
  }

  const availableContentWidth = resolveRootContentBoxWidth(
    element,
    params.rootContentBoxWidth,
  );

  return measureInlineOverflowWithRange({
    content: element,
    availableContentWidth,
  });
};

/**
 * 使用已知或回退计算的 Root content box width 测量横向溢出。
 */
export const measureInlineOverflowWithRootContentBoxWidth = (
  params: {
    root: HTMLElement | null;
    content: HTMLElement | null;
    rootContentBoxWidth: number | null;
    disableRangeFallback?: boolean;
  },
): boolean => {
  const { root, content } = params;

  if (root === null || content === null) {
    return false;
  }

  const measureParams: InlineOverflowMeasureParams = {
    root,
    content,
    rootContentBoxWidth: params.rootContentBoxWidth,
    disableRangeFallback: params.disableRangeFallback,
  };

  return root === content
    ? measureWithSharedRootAndContent(measureParams)
    : measureWithContainerRoot(measureParams);
};

/**
 * 测量 Content 是否横向超出 Root 的 content box。
 */
export const measureInlineOverflow = (params: {
  root: HTMLElement | null;
  content: HTMLElement | null;
}): boolean => {
  return measureInlineOverflowWithRootContentBoxWidth({
    ...params,
    rootContentBoxWidth: null,
  });
};
