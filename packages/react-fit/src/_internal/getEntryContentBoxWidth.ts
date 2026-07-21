/**
 * 读取 `ResizeObserverEntry` 的 content-box inline size。
 *
 * 优先使用精度更高的 `contentBoxSize`，并兼容仅提供 `contentRect`
 * 的旧版 ResizeObserver 实现。
 */
export const getEntryContentBoxWidth = (entry: ResizeObserverEntry): number => {
  const contentBoxSizes = entry.contentBoxSize;

  if (contentBoxSizes) {
    const contentBoxSize = contentBoxSizes[0];

    if (contentBoxSize) {
      return contentBoxSize.inlineSize;
    }
  }

  return entry.contentRect.width;
};
