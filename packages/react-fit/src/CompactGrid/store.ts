import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { getColumnCount } from '../_internal/getColumnCount.ts';
import { isDef } from '../_internal/isDef.ts';

type CompactGridListener = () => void;

/**
 * `CompactGrid` 的状态。
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
};

/**
 * `CompactGrid` 的内部 store。
 */
export type CompactGridStore = {
  getSnapshot: () => CompactGridState;
  subscribe: (listener: CompactGridListener) => () => void;
  setExtra: (extra: React.ReactNode) => void;
  setRootElement: (root: HTMLElement | null) => void;
  registerSlot: (slot: HTMLElement) => () => void;
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

const getLayoutCompact = (
  root: Element | null,
  slot: HTMLElement | null,
): boolean => {
  if (!root || !slot || !root.children.length) {
    return false;
  }

  let regularCellCount = 0;
  let lastCell: Element | null = null;

  for (let index = 0; index < root.children.length; index += 1) {
    const child = root.children.item(index);

    if (child !== null && !child.hasAttribute('data-rf-compact-grid-extra')) {
      regularCellCount += 1;
      lastCell = child;
    }
  }

  if (regularCellCount === 0 || lastCell === null) {
    return false;
  }

  const columnCount = getColumnCount(getComputedStyle(root).gridTemplateColumns);

  if (columnCount <= 0 || regularCellCount % columnCount !== 0) {
    return false;
  }

  return lastCell.contains(slot);
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

const createState = (
  extra: React.ReactNode,
  activeSlot: HTMLElement | null,
  layoutCompact: boolean,
): CompactGridState => {
  return {
    extra,
    activeSlot,
    layoutCompact,
    compact: getCompact(extra, activeSlot, layoutCompact),
  };
};

const createNextState = (
  prevState: CompactGridState,
  patchState: Partial<CompactGridState>,
): CompactGridState => {
  const nextState = {
    ...prevState,
    ...patchState,
  };

  return {
    ...nextState,
    compact: getCompact(nextState.extra, nextState.activeSlot, nextState.layoutCompact),
  };
};

const isSameState = (prevState: CompactGridState, nextState: CompactGridState): boolean => {
  return (
    prevState.extra === nextState.extra &&
    prevState.activeSlot === nextState.activeSlot &&
    prevState.layoutCompact === nextState.layoutCompact &&
    prevState.compact === nextState.compact
  );
};

/**
 * 创建 `CompactGrid` 的内部 store。
 */
export const createCompactGridStore = (): CompactGridStore => {
  let rootElement: HTMLElement | null = null;
  let unobserveResize: (() => void) | null = null;
  let state = createState(null, null, false);
  const listeners = new Set<CompactGridListener>();
  const slots = new Set<HTMLElement>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const commit = (patchState: Partial<CompactGridState>) => {
    const nextState = createNextState(state, patchState);

    if (isSameState(state, nextState)) {
      return;
    }

    state = nextState;
    notify();
  };

  const sync = () => {
    const activeSlot = getLastSlot(rootElement, slots);
    const layoutCompact = getLayoutCompact(rootElement, activeSlot);

    commit({
      activeSlot,
      layoutCompact,
    });
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setExtra: (extra) => {
      commit({
        extra,
      });
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
    registerSlot: (slot) => {
      slots.add(slot);
      sync();

      return () => {
        slots.delete(slot);
        sync();
      };
    },
  };
};
