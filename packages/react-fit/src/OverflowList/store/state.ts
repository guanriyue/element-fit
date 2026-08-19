import { isUndefined } from '../../_internal/isUndefined.ts';
import type {
  OverflowItemData,
  OverflowListAccessoryState,
  OverflowListElementId,
  OverflowListItemRecord,
  OverflowListListener,
  OverflowListMeasureResult,
  OverflowListState,
} from './types.ts';

export type OverflowListStateStore = {
  applyResult: (
    orderedItems: readonly OverflowListItemRecord[],
    result: OverflowListMeasureResult,
    accessoryState: OverflowListAccessoryState,
  ) => void;
  getSnapshot: () => OverflowListState;
  removeItemVisibility: (id: OverflowListElementId) => void;
  setState: (nextState: OverflowListState) => void;
  subscribe: (listener: OverflowListListener) => () => void;
};

const isSameDataList = (
  previous: readonly OverflowItemData[],
  next: readonly OverflowItemData[],
) => {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => value === next[index]);
};

/** 管理 React 组件共同消费的单一状态快照。 */
export const createOverflowListStateStore = (): OverflowListStateStore => {
  let state: OverflowListState = {
    accessoryState: 'hidden',
    itemVisibility: new Map(),
    overflow: false,
    overflowItemsData: [],
  };
  const listeners = new Set<OverflowListListener>();

  const setState = (nextState: OverflowListState) => {
    if (state === nextState) {
      return;
    }

    state = nextState;

    for (const listener of listeners) {
      listener();
    }
  };

  const getItemVisible = (id: OverflowListElementId) => {
    const visible = state.itemVisibility.get(id);

    return isUndefined(visible) ? true : visible;
  };

  const removeItemVisibility = (id: OverflowListElementId) => {
    if (!state.itemVisibility.has(id)) {
      return;
    }

    const itemVisibility = new Map(state.itemVisibility);

    itemVisibility.delete(id);
    setState({
      ...state,
      itemVisibility,
    });
  };

  const applyResult = (
    orderedItems: readonly OverflowListItemRecord[],
    result: OverflowListMeasureResult,
    accessoryState: OverflowListAccessoryState,
  ) => {
    let mutableItemVisibility: Map<OverflowListElementId, boolean> | undefined;

    for (const [index, item] of orderedItems.entries()) {
      const visible = index < result.visibleCount;

      if (getItemVisible(item.id) === visible) {
        continue;
      }

      if (!mutableItemVisibility) {
        mutableItemVisibility = new Map(state.itemVisibility);
      }

      if (visible) {
        mutableItemVisibility.delete(item.id);
      } else {
        mutableItemVisibility.set(item.id, false);
      }
    }

    const itemVisibility = mutableItemVisibility || state.itemVisibility;
    const nextOverflowItemsData = orderedItems.slice(result.visibleCount).map((item) => item.data);
    const overflowItemsData = isSameDataList(state.overflowItemsData, nextOverflowItemsData)
      ? state.overflowItemsData
      : nextOverflowItemsData;

    if (
      state.accessoryState === accessoryState &&
      state.itemVisibility === itemVisibility &&
      state.overflow === result.overflow &&
      state.overflowItemsData === overflowItemsData
    ) {
      return;
    }

    setState({
      accessoryState,
      itemVisibility,
      overflow: result.overflow,
      overflowItemsData,
    });
  };

  return {
    applyResult,
    getSnapshot: () => state,
    removeItemVisibility,
    setState,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
