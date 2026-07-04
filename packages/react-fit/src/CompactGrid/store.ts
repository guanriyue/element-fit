import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { getColumnCount } from '../_internal/getColumnCount.ts';
import { isDef } from '../_internal/isDef.ts';

type CompactGridListener = () => void;

/**
 * `CompactGrid.Item` 可以声明的跨列数量。
 */
export type CompactGridItemColSpan = number | 'full';

type CompactGridItemOptions = {
  colSpan: CompactGridItemColSpan | undefined;
};

type CompactGridLayoutItem = {
  element: Element;
  colSpan: CompactGridItemColSpan | undefined;
};

/**
 * `CompactGrid` 的状态快照。
 */
export type CompactGridState = {
  /**
   * `Extra` 注册的内容。
   */
  extra: React.ReactNode;
  /**
   * 当前 DOM 顺序中最后一个有效的 `ExtraSlot`。
   */
  activeSlot: HTMLElement | null;
  /**
   * 当前布局是否满足紧凑条件。
   */
  layoutCompact: boolean;
  /**
   * 是否真正进入紧凑模式。
   */
  compact: boolean;
  /**
   * 当前 root 的显式列数。
   */
  columnCount: number;
};

/**
 * `CompactGrid` 的内部 store。
 */
export type CompactGridStore = {
  getSnapshot: () => CompactGridState;
  subscribe: (listener: CompactGridListener) => () => void;
  setExtra: (extra: React.ReactNode) => void;
  setRootElement: (root: HTMLElement | null) => void;
  registerItem: (item: HTMLElement, options: CompactGridItemOptions) => () => void;
  registerSlot: (slot: HTMLElement) => () => void;
  measure: () => void;
};

const hasExtra = (extra: React.ReactNode): boolean => {
  return isDef(extra) && extra !== false;
};

const getCompact = (
  extra: React.ReactNode,
  activeSlot: HTMLElement | null,
  layoutCompact: boolean,
): boolean => {
  return hasExtra(extra) && activeSlot !== null && layoutCompact;
};

const getItemSpan = (
  colSpan: CompactGridItemColSpan | undefined,
  columnCount: number,
): number => {
  if (colSpan === 'full') {
    return columnCount;
  }

  if (typeof colSpan === 'number' && Number.isInteger(colSpan) && colSpan > 0) {
    return Math.min(colSpan, columnCount);
  }

  return 1;
};

const getLayoutItems = (
  root: Element,
  items: Map<HTMLElement, CompactGridItemOptions>,
): CompactGridLayoutItem[] => {
  const layoutItems: CompactGridLayoutItem[] = [];

  for (let index = 0; index < root.children.length; index += 1) {
    const child = root.children.item(index);

    if (child === null || child.hasAttribute('data-rf-compact-grid-extra')) {
      continue;
    }

    const registeredItem = child instanceof HTMLElement ? items.get(child) : undefined;

    layoutItems.push({
      element: child,
      colSpan: registeredItem?.colSpan,
    });
  }

  return layoutItems;
};

const getLayoutItemsCompact = (
  layoutItems: CompactGridLayoutItem[],
  slot: HTMLElement,
  columnCount: number,
): boolean => {
  const lastItem = layoutItems.at(-1)?.element;

  // biome-ignore lint/complexity/useOptionalChain: 无需使用
  if (!lastItem || !lastItem.contains(slot)) {
    return false;
  }

  if (columnCount <= 0) {
    return false;
  }

  let rowUsed = 0;

  for (const item of layoutItems) {
    const span = getItemSpan(item.colSpan, columnCount);

    if (rowUsed + span > columnCount) {
      rowUsed = span;
    } else {
      rowUsed += span;
    }
  }

  return rowUsed === columnCount;
};

const getLayoutCompact = (
  root: Element | null,
  slot: HTMLElement | null,
  items: Map<HTMLElement, CompactGridItemOptions>,
  columnCount: number,
): boolean => {
  if (!root || !slot || !root.children.length) {
    return false;
  }

  const layoutItems = getLayoutItems(root, items);

  return getLayoutItemsCompact(layoutItems, slot, columnCount);
};

const getLastSlot = (
  root: HTMLElement | null,
  slots: Set<HTMLElement>,
): HTMLElement | null => {
  if (root === null || slots.size === 0) {
    return null;
  }

  let lastSlot: HTMLElement | null = null;

  for (const slot of slots) {
    if (!root.contains(slot)) {
      continue;
    }

    if (lastSlot === null) {
      lastSlot = slot;
      continue;
    }

    const slotFollowsLastSlot =
      lastSlot.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING;

    if (slotFollowsLastSlot !== 0) {
      lastSlot = slot;
    }
  }

  return lastSlot;
};

const createSnapshot = (
  extra: React.ReactNode,
  activeSlot: HTMLElement | null,
  layoutCompact: boolean,
  columnCount: number,
): CompactGridState => {
  return {
    extra,
    activeSlot,
    layoutCompact,
    compact: getCompact(extra, activeSlot, layoutCompact),
    columnCount,
  };
};

/**
 * 创建 `CompactGrid` 的内部 store。
 */
export const createCompactGridStore = (): CompactGridStore => {
  let rootElement: HTMLElement | null = null;
  let unobserveResize: (() => void) | null = null;
  let snapshot = createSnapshot(null, null, false, 0);
  const listeners = new Set<CompactGridListener>();
  const items = new Map<HTMLElement, CompactGridItemOptions>();
  const slots = new Set<HTMLElement>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commit = (nextSnapshot: CompactGridState) => {
    if (
      snapshot.extra === nextSnapshot.extra &&
      snapshot.activeSlot === nextSnapshot.activeSlot &&
      snapshot.layoutCompact === nextSnapshot.layoutCompact &&
      snapshot.compact === nextSnapshot.compact &&
      snapshot.columnCount === nextSnapshot.columnCount
    ) {
      return;
    }

    snapshot = nextSnapshot;
    notify();
  };

  const sync = (extra: React.ReactNode = snapshot.extra) => {
    const activeSlot = getLastSlot(rootElement, slots);
    const columnCount = rootElement
      ? getColumnCount(getComputedStyle(rootElement).gridTemplateColumns)
      : 0;
    const layoutCompact = getLayoutCompact(rootElement, activeSlot, items, columnCount);

    commit(createSnapshot(extra, activeSlot, layoutCompact, columnCount));
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setExtra: (extra) => {
      sync(extra);
    },
    setRootElement: (root) => {
      if (unobserveResize) {
        unobserveResize();
        unobserveResize = null;
      }

      rootElement = root;

      if (rootElement) {
        unobserveResize = observeElementResize(rootElement, () => {
          sync();
        });
      }

      sync();
    },
    registerItem: (item, options) => {
      items.set(item, options);
      sync();

      return () => {
        items.delete(item);
        sync();
      };
    },
    registerSlot: (slot) => {
      slots.add(slot);
      sync();

      return () => {
        slots.delete(slot);
        sync();
      };
    },
    measure: sync,
  };
};
