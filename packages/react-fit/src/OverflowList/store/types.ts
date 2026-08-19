/** Item 携带的业务数据，Store 只负责按溢出顺序透传。 */
// biome-ignore lint/suspicious/noExplicitAny: 数据结构由调用方决定
export type OverflowItemData = any;

/** Item 和 Accessory 使用的注册标识不限制具体类型。 */
export type OverflowListElementId = unknown;

/** useSyncExternalStore 使用的无参数监听器。 */
export type OverflowListListener = () => void;

/** Accessory 在 React 树中的挂载状态。 */
export type OverflowListAccessoryState = 'hidden' | 'measuring' | 'visible';

/** 所有 OverflowList React 组件共同消费的状态。 */
export type OverflowListState = {
  /** 所有 Accessory 是否不渲染、隐藏测量或正常展示。 */
  accessoryState: OverflowListAccessoryState;

  /** Item 的可见状态；没有记录的 Item 默认可见。 */
  itemVisibility: ReadonlyMap<OverflowListElementId, boolean>;

  /** 当前是否至少有一个 Item 溢出。 */
  overflow: boolean;

  /** 按 DOM 顺序排列的溢出 Item 业务数据。 */
  overflowItemsData: readonly OverflowItemData[];
};

/** Item 的生命周期记录；隐藏时 element 为 null，但记录仍然存在。 */
export type OverflowListItemRecord = {
  /** Item 最新的业务数据。 */
  data: OverflowItemData;

  /** Item 当前渲染的直接 DOM 子节点，隐藏时为空。 */
  element: HTMLElement | null;

  /** Item 的稳定注册标识。 */
  id: OverflowListElementId;

  /** ResizeObserver 最近读取的 border-box inline size。 */
  observedWidth: number | undefined;

  /** Item 组件的注册生命周期是否仍然有效。 */
  componentRegistered: boolean;

  /** 当前元素的 ResizeObserver 清理函数。 */
  unobserveResize: (() => void) | undefined;
};

/** Accessory 的生命周期记录；无溢出时只保留注册信息。 */
export type OverflowListAccessoryRecord = {
  /** Accessory 当前渲染的直接 DOM 子节点。 */
  element: HTMLElement | null;

  /** Accessory 的稳定注册标识。 */
  id: OverflowListElementId;

  /** ResizeObserver 最近读取的 border-box inline size。 */
  observedWidth: number | undefined;

  /** Accessory 组件的注册生命周期是否仍然有效。 */
  componentRegistered: boolean;

  /** 当前元素的 ResizeObserver 清理函数。 */
  unobserveResize: (() => void) | undefined;
};

/** 全量 Item 布局建立的几何缓存。 */
export type OverflowListGeometry = {
  /** Accessory 及其与 Item 之间间距的最近一次真实占用宽度。 */
  accessoryWidth: number | undefined;

  /** 全部 Item 的实际水平跨度。 */
  fullItemsWidth: number;

  /** 按 DOM 顺序排列的 Item 记录。 */
  orderedItems: readonly OverflowListItemRecord[];

  /** `prefixWidths[n]` 表示前 n 个 Item 的实际水平跨度。 */
  prefixWidths: readonly number[];
};

/** 一次测量最终提交的可见边界。 */
export type OverflowListMeasureResult = {
  /** 是否至少有一个 Item 溢出。 */
  overflow: boolean;

  /** DOM 顺序前缀中保持可见的 Item 数量。 */
  visibleCount: number;
};

/** Store 提供给 React 组件的接口。 */
export type OverflowListStore = {
  /** 返回所有 React 组件共同使用的稳定状态快照。 */
  getSnapshot: () => OverflowListState;

  /** 注册 Accessory 组件；即使其 DOM 为 null，记录也会保留。 */
  registerAccessory: (id: OverflowListElementId) => () => void;

  /** 注册 Item 组件；即使其 DOM 为 null，记录也会保留。 */
  registerItem: (
    id: OverflowListElementId,
    data: OverflowItemData,
  ) => () => void;

  /** 更新 Accessory 当前渲染的真实 DOM 元素。 */
  setAccessoryElement: (
    id: OverflowListElementId,
    element: HTMLElement | null,
  ) => void;

  /** 更新 Item 的业务数据。 */
  setItemData: (id: OverflowListElementId, data: OverflowItemData) => void;

  /** 更新 Item 当前渲染的真实 DOM 元素。 */
  setItemElement: (
    id: OverflowListElementId,
    element: HTMLElement | null,
    data: OverflowItemData,
  ) => void;

  /** 注册或注销 Root DOM 元素。 */
  setRootElement: (element: HTMLElement | null) => void;

  /** 订阅完整状态；组件通过稳定 selector 读取自己需要的部分。 */
  subscribe: (listener: OverflowListListener) => () => void;
};
