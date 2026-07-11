import { isNil } from "../_internal/isNil";

/**
 * 描述 InlineOverflow 的单行横向溢出测量结果。
 */
export type InlineOverflowMeasure = {
  /**
   * Content 是否超出 Root 的 content box，并决定 Accessory 是否显示。
   */
  overflow: boolean;
};

const INLINE_OVERFLOW_EPSILON = 0.5;

export const EMPTY_INLINE_OVERFLOW_MEASURE: InlineOverflowMeasure = {
  overflow: false,
};

/**
 * 使用已知或回退计算的 Root content box width 测量横向溢出。
 */
export const measureInlineOverflowWithRootContentBoxWidth = (
  params: {
    root: HTMLElement | null;
    content: HTMLElement | null;
    rootContentBoxWidth: number | null;
  },
): InlineOverflowMeasure => {
  const { root, content } = params;

  if (root === null || content === null) {
    return { ...EMPTY_INLINE_OVERFLOW_MEASURE };
  }

  const rootWidth = root.clientWidth;
  let rootContentBoxWidth = params.rootContentBoxWidth;

  if (isNil(rootContentBoxWidth)) {
    const rootStyle = getComputedStyle(root);
    const paddingInlineStart = Number.parseFloat(rootStyle.paddingInlineStart) || 0;
    const paddingInlineEnd = Number.parseFloat(rootStyle.paddingInlineEnd) || 0;

    rootContentBoxWidth = Math.max(0, rootWidth - paddingInlineStart - paddingInlineEnd);
  }

  const contentScrollWidth = content.scrollWidth;
  const overflow = contentScrollWidth > rootContentBoxWidth + INLINE_OVERFLOW_EPSILON;

  return {
    overflow,
  };
};

/**
 * 测量 Content 是否横向超出 Root 的 content box。
 */
export const measureInlineOverflow = (params: {
  root: HTMLElement | null;
  content: HTMLElement | null;
}): InlineOverflowMeasure => {
  return measureInlineOverflowWithRootContentBoxWidth({
    ...params,
    rootContentBoxWidth: null,
  });
};
