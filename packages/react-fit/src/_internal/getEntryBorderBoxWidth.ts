/**
 * 读取 ResizeObserverEntry 的 border-box inline size。
 *
 * 优先使用观察器已经提供的 borderBoxSize；旧实现没有该字段时才同步读取
 * target 的 DOMRect。
 */
export const getEntryBorderBoxWidth = (
  entry: ResizeObserverEntry,
): number => {
  const borderBoxSizes = entry.borderBoxSize;

  if (borderBoxSizes) {
    const borderBoxSize = borderBoxSizes[0];

    if (borderBoxSize) {
      return borderBoxSize.inlineSize;
    }
  }

  return entry.target.getBoundingClientRect().width;
};
