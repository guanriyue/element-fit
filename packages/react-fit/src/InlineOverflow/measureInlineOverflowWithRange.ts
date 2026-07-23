export const measureInlineContentWidthWithRange = (content: HTMLElement): number => {
  if (content.childNodes.length === 0) {
    return 0;
  }

  const range = content.ownerDocument.createRange();
  range.selectNodeContents(content);

  return range.getBoundingClientRect().width;
};

/**
 * 使用 Range width 高精度测量 Content 是否超出可用的 content-box width。
 *
 * Range 会包含文本片段以及被完整选中的顶层元素 border area，因此可以处理
 * 普通单行 flow 中的文本、元素和混合内容。
 *
 * Range bounding rect 不是任意 DOM 子树的 intrinsic width。margin、伪元素、定位、
 * transform 和多行布局仍不属于该 fallback 的可靠测量范围。
 */
export const measureInlineOverflowWithRange = (params: {
  content: HTMLElement;
  availableContentWidth: number;
}): boolean => {
  const { content, availableContentWidth } = params;

  return measureInlineContentWidthWithRange(content) > availableContentWidth;
};
