export type LineClampStoreListener = () => void;
export type LineClampOverflowChangeListener = (overflow: boolean) => void;

export type LineClampStoreState = {
  overflow: boolean;
  contentHeight: number;
};

export type LineClampStore = {
  getState: () => LineClampStoreState;
  subscribe: (listener: LineClampStoreListener) => () => void;
  setLines: (lines: number | undefined) => void;
  setOnOverflowChange: (listener: LineClampOverflowChangeListener | undefined) => void;
  setRootElement: (element: HTMLDivElement | null) => void;
  setSpacerElement: (element: HTMLSpanElement | null) => void;
  setSuffixElement: (element: HTMLSpanElement | null) => void;
};
