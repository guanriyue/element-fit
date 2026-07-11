/**
 * 测量 Content 是否超出 Root 的 content box width。
 *
 * 当整数精度的 scroll width 位于边界时，使用 Range width 进行高精度补充测量。
 * Range 会包含文本片段以及被完整选中的顶层元素 border area，因此可以处理
 * 普通单行 flow 中的文本、元素和混合内容。
 *
 * Range bounding rect 不是任意 DOM 子树的 intrinsic width。margin、伪元素、定位、
 * transform 和多行布局仍不属于该 fallback 的可靠测量范围。
 */
export const measureInlineOverflowWithRange = (params: {
  content: HTMLElement;
  rootContentBoxWidth: number;
  disableRangeFallback?: boolean;
}): { overflow: boolean } => {
  const { content, rootContentBoxWidth } = params;
  const contentScrollWidth = content.scrollWidth;

  if (contentScrollWidth > rootContentBoxWidth) {
    return { overflow: true };
  }

  if (
    contentScrollWidth < rootContentBoxWidth ||
    params.disableRangeFallback === true ||
    content.childNodes.length === 0
  ) {
    return { overflow: false };
  }

  const range = content.ownerDocument.createRange();
  range.selectNodeContents(content);

  return {
    overflow: range.getBoundingClientRect().width > rootContentBoxWidth,
  };
};
