import { isUndefined } from '../../_internal/isUndefined.ts';
import type {
  OverflowListAccessoryRecord,
  OverflowListGeometry,
  OverflowListItemRecord,
  OverflowListMeasureResult,
} from './types.ts';

const OVERFLOW_LIST_LAYOUT_EPSILON = 0.5;

/** DOMRect 布局结果在半个 CSS pixel 内视为可以放入。 */
export const doesOverflowListWidthFit = (
  width: number,
  availableWidth: number,
) => {
  return width <= availableWidth + OVERFLOW_LIST_LAYOUT_EPSILON;
};

export const getVisibleCount = (
  prefixWidths: readonly number[],
  availableWidth: number,
  maximumCount = prefixWidths.length - 1,
) => {
  for (let count = maximumCount; count >= 0; count -= 1) {
    if (doesOverflowListWidthFit(prefixWidths[count], availableWidth)) {
      return count;
    }
  }

  return 0;
};

/** 读取全部 Item 的真实位置并建立每个可见前缀的宽度。 */
export const measureItemGeometry = (
  orderedItems: readonly OverflowListItemRecord[],
): OverflowListGeometry => {
  const prefixWidths = [0];
  let inlineStart = 0;
  let inlineEnd = 0;

  for (const [index, item] of orderedItems.entries()) {
    const rect = (item.element as HTMLElement).getBoundingClientRect();

    if (index === 0) {
      inlineStart = rect.left;
      inlineEnd = rect.right;
    } else {
      inlineStart = Math.min(inlineStart, rect.left);
      inlineEnd = Math.max(inlineEnd, rect.right);
    }

    prefixWidths.push(inlineEnd - inlineStart);
  }

  return {
    accessoryWidth: undefined,
    fullItemsWidth: prefixWidths[prefixWidths.length - 1],
    orderedItems,
    prefixWidths,
  };
};

/**
 * 全部 Item 已经放得下时，只读取首尾元素建立用于 Root resize 的最小缓存。
 * Root 缩小到 fullItemsWidth 以下时会转为完整测量。
 */
export const measureFittingItemGeometry = (
  orderedItems: readonly OverflowListItemRecord[],
): OverflowListGeometry => {
  const firstItem = orderedItems[0];

  if (!firstItem) {
    return {
      accessoryWidth: undefined,
      fullItemsWidth: 0,
      orderedItems,
      prefixWidths: [0],
    };
  }

  const firstRect = (firstItem.element as HTMLElement).getBoundingClientRect();
  const lastItem = orderedItems[orderedItems.length - 1];
  const lastRect = lastItem === firstItem
    ? firstRect
    : (lastItem.element as HTMLElement).getBoundingClientRect();

  firstItem.observedWidth = firstRect.width;
  lastItem.observedWidth = lastRect.width;

  return {
    accessoryWidth: undefined,
    fullItemsWidth: Math.max(firstRect.right, lastRect.right)
      - Math.min(firstRect.left, lastRect.left),
    orderedItems,
    prefixWidths: [0],
  };
};

export const resolveMeasureResult = (
  geometry: OverflowListGeometry,
  rootWidth: number,
): OverflowListMeasureResult | undefined => {
  const itemCount = geometry.orderedItems.length;

  if (
    !itemCount
    || doesOverflowListWidthFit(geometry.fullItemsWidth, rootWidth)
  ) {
    return {
      overflow: false,
      visibleCount: itemCount,
    };
  }

  if (isUndefined(geometry.accessoryWidth)) {
    return undefined;
  }

  return {
    overflow: true,
    visibleCount: getVisibleCount(
      geometry.prefixWidths,
      rootWidth - geometry.accessoryWidth,
      itemCount - 1,
    ),
  };
};

/** 读取当前可见 Item 与全部 Accessory 的真实水平跨度。 */
export const measureOccupiedWidth = (
  items: readonly OverflowListItemRecord[],
  accessories: readonly OverflowListAccessoryRecord[],
) => {
  const records: Array<
    OverflowListItemRecord | OverflowListAccessoryRecord
  > = [];

  for (const item of items) {
    if (item.element) {
      records.push(item);
    }
  }

  for (const accessory of accessories) {
    if (accessory.element) {
      records.push(accessory);
    }
  }

  const firstRecord = records[0];

  if (!firstRecord) {
    return 0;
  }

  const firstRect = (firstRecord.element as HTMLElement)
    .getBoundingClientRect();

  firstRecord.observedWidth = firstRect.width;

  let inlineStart = firstRect.left;
  let inlineEnd = firstRect.right;

  for (let index = 1; index < records.length; index += 1) {
    const record = records[index];
    const rect = (record.element as HTMLElement).getBoundingClientRect();

    record.observedWidth = rect.width;
    inlineStart = Math.min(inlineStart, rect.left);
    inlineEnd = Math.max(inlineEnd, rect.right);
  }

  return inlineEnd - inlineStart;
};
