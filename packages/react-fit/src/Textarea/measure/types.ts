/**
 * @en The autosize height committed to the Textarea store.
 *
 * @zh 提交到 Textarea store 的自动高度。
 */
export type TextareaAutosizeHeight = number;

/**
 * @en Receives the completed autosize height and the measured source width.
 *
 * @zh 接收已完成的自动高度以及测量时的原始节点宽度。
 *
 * @param height - The height, or null when the source cannot be measured.
 * @param borderBoxInlineSize - The measured border-box inline size.
 */
export type TextareaAutosizeMeasureListener = (
  height: TextareaAutosizeHeight | null,
  borderBoxInlineSize: number,
) => void;

/**
 * @en A single autosize request scheduled for a source Textarea.
 *
 * @zh 针对一个原始 Textarea 调度的单次自动高度请求。
 */
export type TextareaAutosizeMeasureRequest = {
  /**
   * @en The source Textarea whose content and styles are measured.
   *
   * @zh 需要读取内容和样式的原始 Textarea。
   */
  textarea: HTMLTextAreaElement;

  /**
   * @en The optional minimum number of visible text rows.
   *
   * @zh 可选的最小可见文本行数。
   */
  minRows: number | undefined;

  /**
   * @en The optional maximum number of visible text rows.
   *
   * @zh 可选的最大可见文本行数。
   */
  maxRows: number | undefined;
};

/**
 * @en A computed CSS property copied from the source to a mirror Textarea.
 *
 * @zh 从原始节点复制到 mirror Textarea 的一项计算样式。
 */
export type TextareaSizingStyle = {
  /**
   * @en The CSS property name.
   *
   * @zh CSS 属性名称。
   */
  property: string;

  /**
   * @en The computed CSS property value.
   *
   * @zh CSS 属性的计算值。
   */
  value: string;
};

/**
 * @en The DOM nodes reused together for one Textarea measurement.
 *
 * @zh 针对同一个 Textarea 测量任务成组复用的 DOM 节点。
 */
export type TextareaMirrorPair = {
  /**
   * @en The mirror containing the source value for natural-height measurement.
   *
   * @zh 包含原始文本、用于测量自然高度的 mirror Textarea。
   */
  mirror: HTMLTextAreaElement;

  /**
   * @en The optional one-row mirror used by row constraints.
   *
   * @zh 行数约束使用的可选一行 mirror。
   */
  rowMirror: HTMLTextAreaElement | null;
};

/**
 * @en Retains completed mirrors briefly and reuses them by source Textarea.
 *
 * @zh 短暂保留已完成的 mirror，并按照原始 Textarea 复用它们。
 */
export type TextareaMirrorPool = {
  /**
   * @en Takes retained mirrors out of the cleanup queue for reuse.
   *
   * @zh 从清理队列中取出可复用的 mirror。
   */
  acquire: (
    textarea: HTMLTextAreaElement,
  ) => TextareaMirrorPair | null;

  /**
   * @en Returns mirrors to the pool and starts their retention period.
   *
   * @zh 将 mirror 归还到池中并开始计算保留时间。
   */
  release: (
    textarea: HTMLTextAreaElement,
    mirrors: TextareaMirrorPair,
  ) => void;
};

/**
 * @en Source measurements prepared before mirror DOM writes begin.
 *
 * @zh 在开始写入 mirror DOM 之前准备好的原始节点测量数据。
 */
export type PreparedTextareaAutosizeMeasure = {
  /**
   * @en The request associated with this prepared measurement.
   *
   * @zh 与当前预备测量数据关联的请求。
   */
  request: TextareaAutosizeMeasureRequest;

  /**
   * @en The document body that owns the shared measurement container.
   *
   * @zh 用于挂载共享测量容器的 document body。
   */
  body: HTMLElement;

  /**
   * @en The source computed styles required to reproduce text layout.
   *
   * @zh 在 mirror 中复现文本布局所需的原始计算样式。
   */
  sizingStyles: TextareaSizingStyle[];

  /**
   * @en The source Textarea's wrap attribute value.
   *
   * @zh 原始 Textarea 的 wrap 属性值。
   */
  wrap: string | null;

  /**
   * @en The value assigned to the content mirror for natural-height measurement.
   *
   * @zh 赋给内容 mirror、用于测量自然高度的文本值。
   */
  measurementValue: string;

  /**
   * @en Whether a separate one-row mirror is needed for row constraints.
   *
   * @zh 是否需要单独的一行 mirror 来计算行数约束。
   */
  needsRowHeight: boolean;

  /**
   * @en The source Textarea's border-box inline size at preparation time.
   *
   * @zh 准备阶段原始 Textarea 的 border-box inline size。
   */
  borderBoxInlineSize: number;

  /**
   * @en The sum of the source block-start and block-end padding.
   *
   * @zh 原始节点块轴起点与终点 padding 的总和。
   */
  paddingBlockSize: number;

  /**
   * @en The sum of the source block-start and block-end border widths.
   *
   * @zh 原始节点块轴起点与终点 border width 的总和。
   */
  borderBlockSize: number;

  /**
   * @en The computed box-sizing mode used to convert scrollHeight to CSS height.
   *
   * @zh 用于把 scrollHeight 转换为 CSS height 的计算后 box-sizing 模式。
   */
  boxSizing: string;
};

/**
 * @en An inserted mirror job waiting for its layout size to be read.
 *
 * @zh 已插入 DOM、等待布局尺寸被读取的 mirror 测量任务。
 */
export type TextareaAutosizeMeasureJob = {
  /**
   * @en The request currently represented by these mirror nodes.
   *
   * @zh 当前 mirror 节点所代表的测量请求。
   */
  request: TextareaAutosizeMeasureRequest;

  /**
   * @en The mirror containing the source value for natural-height measurement.
   *
   * @zh 包含原始文本、用于测量自然高度的 mirror Textarea。
   */
  mirror: HTMLTextAreaElement;

  /**
   * @en The optional one-row mirror used to resolve minRows and maxRows.
   *
   * @zh 用于计算 minRows 和 maxRows 的可选一行 mirror。
   */
  rowMirror: HTMLTextAreaElement | null;

  /**
   * @en The source border-box inline size captured for this measurement.
   *
   * @zh 当前测量捕获的原始节点 border-box inline size。
   */
  borderBoxInlineSize: number;

  /**
   * @en The source block-axis padding used to normalize scrollHeight.
   *
   * @zh 用于归一化 scrollHeight 的原始节点块轴 padding。
   */
  paddingBlockSize: number;

  /**
   * @en The source block-axis border size used for border-box height.
   *
   * @zh 计算 border-box 高度时使用的原始节点块轴 border size。
   */
  borderBlockSize: number;

  /**
   * @en The source box-sizing mode associated with this mirror measurement.
   *
   * @zh 与当前 mirror 测量关联的原始节点 box-sizing 模式。
   */
  boxSizing: string;
};

/**
 * @en Shared DOM resources used by Textarea measurement tasks.
 *
 * @zh Textarea 测量任务共用的 DOM 资源。
 */
export type TextareaAutosizeMeasureResources = {
  /**
   * @en The lazily created shared container holding mirror Textareas.
   *
   * @zh 延迟创建、用于容纳 mirror Textarea 的共享测量容器。
   */
  container: HTMLDivElement | null;

  /**
   * @en The pool that retains and reuses mirror nodes for the current page.
   *
   * @zh 为当前页面保留并复用 mirror 节点的资源池。
   */
  mirrorPool: TextareaMirrorPool;
};
