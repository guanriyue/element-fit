import type {
  LineClampOverflowChangeListener,
  LineClampStoreListener,
  LineClampStoreState,
} from './types';

export type LineClampStoreStateController = {
  getState: () => LineClampStoreState;
  subscribe: (listener: LineClampStoreListener) => () => void;
  commit: (state: Partial<LineClampStoreState>) => void;
  commitOverflow: (overflow: boolean) => void;
  setOnOverflowChange: (listener: LineClampOverflowChangeListener | undefined) => void;
};

export const createLineClampStoreState = (): LineClampStoreStateController => {
  let state: LineClampStoreState = {
    overflow: false,
    contentHeight: 0,
  };
  let onOverflowChange: LineClampOverflowChangeListener | undefined;
  let hasMeasuredOverflow = false;
  let measuredOverflow = false;
  const listeners = new Set<LineClampStoreListener>();

  const commit = (partialState: Partial<LineClampStoreState>) => {
    const nextState = {
      ...state,
      ...partialState,
    };

    if (state.overflow === nextState.overflow && state.contentHeight === nextState.contentHeight) {
      return;
    }

    state = nextState;

    for (const listener of listeners) {
      listener();
    }
  };

  const commitOverflow = (overflow: boolean) => {
    commit({ overflow });

    const changed = !hasMeasuredOverflow || measuredOverflow !== overflow;

    hasMeasuredOverflow = true;
    measuredOverflow = overflow;

    if (changed && onOverflowChange) {
      onOverflowChange(overflow);
    }
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    commit,
    commitOverflow,
    setOnOverflowChange: (listener) => {
      onOverflowChange = listener;
    },
  };
};
