import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { forwardRef, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { isPositiveInteger } from '../_internal/isPositiveInteger';
import { createLineClampCloneStore } from './cloneStore';
import { createLineClampInPlaceStore } from './inPlaceStore';
import type { LineClampStore } from './store';

const LINE_CLAMP_STYLE: React.CSSProperties = {
  display: 'block',
  wordBreak: 'break-all',
};

const LINE_CLAMP_COLLAPSED_STYLE: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const LINE_CLAMP_SPACER_STYLE: React.CSSProperties = {
  float: 'right',
  width: 0,
};

const LINE_CLAMP_SUFFIX_STYLE: React.CSSProperties = {
  float: 'right',
  clear: 'both',
};

type LineClampSpacerProps = {
  store: LineClampStore;
};

const LineClampSpacer = (props: LineClampSpacerProps) => {
  const { store } = props;
  const contentHeight = useSyncExternalStore(
    store.subscribe,
    () => store.getState().contentHeight,
    () => store.getState().contentHeight,
  );

  return (
    <span
      ref={store.setSpacerElement}
      aria-hidden={true}
      style={{
        ...LINE_CLAMP_SPACER_STYLE,
        height: `max(0px, calc(${contentHeight}px - 1lh))`,
      }}
    />
  );
};

export type LineClampMeasureStrategy = 'in-place' | 'clone';

/**
 * @en Props for LineClamp.
 *
 * @zh LineClamp 的属性。
 */
export interface LineClampProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /**
   * @en Inline content clamped by the browser.
   *
   * @zh 由浏览器执行多行截断的 inline 内容。
   */
  children: React.ReactNode;

  /**
   * @en Maximum number of visible lines and the stable baseline used to
   * measure overflow. The same value remains in effect while `expanded` is
   * true. A value that is not a positive integer disables clamping, overflow
   * measurement, and Suffix rendering.
   *
   * @zh 最多展示的行数，也是测量 overflow 时使用的稳定基准。
   * `expanded` 为 true 时仍然使用同一个值进行测量。传入的值不是正整数
   * 时，禁用截断、overflow 测量和 Suffix 渲染。
   *
   * @default undefined
   */
  lines?: number;

  /**
   * @en Whether to display the full content. This is a controlled layout
   * state: LineClamp does not manage expansion or provide a toggle. Changing
   * it does not change the explicit `lines` measurement baseline or turn an
   * existing overflow result into false.
   *
   * @zh 是否完整展示内容。这是一个受控布局状态：LineClamp 不管理展开
   * 状态，也不提供 toggle。修改该属性不会改变显式的 `lines` 测量基准，
   * 也不会把已有的 overflow 结果变成 false。
   *
   * @default false
   */
  expanded?: boolean;

  /**
   * @en Content placed at the end of the last visible line while collapsed,
   * and after the text while expanded. The collapsed content should fit
   * within one line-height. It is rendered only when the measured content
   * overflows. Switching `expanded` moves its wrapper between two DOM
   * positions and therefore remounts that wrapper.
   *
   * @zh 收起时放置在最后一个可见行末尾，展开时跟随在文本之后的内容。
   * 仅在测量结果为 overflow 时渲染。收起状态下的渲染结果高度应当不超过
   * 一行。切换 `expanded` 会把包装节点移动到另一个 DOM 位置，因此包装
   * 节点会重新挂载。
   */
  suffix?: React.ReactNode;

  /**
   * @en Called after the first trusted measurement and whenever the measured
   * overflow state changes. Overflow means that the content exceeds the
   * explicit `lines` baseline, not that the currently expanded UI is visually
   * clipped. The first measurement always triggers this callback.
   *
   * @zh 首次可信测量完成后，以及测得的 overflow 状态变化时调用。
   * overflow 表示内容超过显式的 `lines` 基准，不表示当前展开 UI 正在发生
   * 视觉裁切。首次测量无论结果如何都会触发该回调。
   */
  onOverflowChange?: (overflow: boolean) => void;

  /**
   * @en Strategy used to determine whether the content overflows. `in-place`
   * reads line rects from the current DOM without creating a measurement
   * node. It only recognizes `<br>` as a hard line-break boundary; other hard
   * breaks are not currently supported. `clone` temporarily clones the
   * content into an isolated DOM node and causes an additional layout. Try it
   * when `in-place` does not fit the content, but provide a custom implementation
   * when neither strategy satisfies the layout requirements.
   *
   * @zh 用于判断内容是否溢出的测量策略。`in-place` 直接读取当前 DOM 的行
   * rect，不创建测量节点。它目前只识别 `<br>` 形成的 hard line break，
   * 暂不支持其他 hard break。`clone` 会把内容临时克隆到隔离的 DOM 节点
   * 中，并产生一次额外布局。当 `in-place` 不适合当前内容时可以尝试该策略；
   * 如果两种策略都不满足布局要求，需要由开发者自定义实现。
   *
   * @default 'in-place'
   */
  measureStrategy?: LineClampMeasureStrategy;
}

/**
 * @en Clamps inline content with the browser's native line-clamp behavior and
 * places a compact suffix according to the controlled expanded state.
 *
 * @zh 使用浏览器原生 line-clamp 能力截断 inline 内容，并在最后一个可见行
 * 的末尾放置紧凑的 suffix，并通过受控的 expanded 状态切换展示方式。
 *
 * @example
 * ```tsx
 * <LineClamp
 *   lines={2}
 *   expanded={expanded}
 *   suffix={<button>Expand</button>}
 * >
 *   Long inline content
 * </LineClamp>
 * ```
 */
export const LineClamp = forwardRef<HTMLSpanElement, LineClampProps>((props, forwardedRef) => {
  const {
    children,
    expanded = false,
    lines: propLines,
    measureStrategy = 'in-place',
    onOverflowChange,
    suffix,
    style,
    ...rootProps
  } = props;
  const lines = isPositiveInteger(propLines) ? propLines : undefined;
  const [inPlaceStore] = useState(() => {
    return createLineClampInPlaceStore(lines);
  });
  const [cloneStore] = useState(() => {
    return createLineClampCloneStore(lines);
  });
  const store = measureStrategy === 'clone' ? cloneStore : inPlaceStore;
  const overflow = useSyncExternalStore(
    store.subscribe,
    () => store.getState().overflow,
    () => store.getState().overflow,
  );
  const rootRef = useComposedRefs(forwardedRef, store.setRootElement);
  const clampEnabled = typeof lines !== 'undefined' && !expanded;
  const showSuffix = overflow && typeof suffix !== 'undefined' && suffix !== null;
  const showFloatedSuffix = showSuffix && !expanded;
  const showInlineSuffix = showSuffix && expanded;

  useLayoutEffect(() => {
    store.setOnOverflowChange(onOverflowChange);

    return () => {
      store.setOnOverflowChange(undefined);
    };
  });

  useLayoutEffect(() => {
    store.setLines(lines);
  }, [lines, store]);

  const rootStyle: React.CSSProperties = {
    ...LINE_CLAMP_STYLE,
    ...(clampEnabled ? LINE_CLAMP_COLLAPSED_STYLE : undefined),
    ...(clampEnabled ? { WebkitLineClamp: lines } : undefined),
    ...style,
  };
  return (
    <span {...rootProps} ref={rootRef} style={rootStyle}>
      {/* Float layout requires Spacer and Suffix before the content. */}
      {showFloatedSuffix ? <LineClampSpacer store={store} /> : null}
      {showFloatedSuffix ? (
        <span ref={store.setSuffixElement} style={LINE_CLAMP_SUFFIX_STYLE}>
          {suffix}
        </span>
      ) : null}
      {children}
      {/* Expanded layout keeps Suffix in normal inline order after text. */}
      {showInlineSuffix ? <span ref={store.setSuffixElement}>{suffix}</span> : null}
    </span>
  );
});

LineClamp.displayName = 'LineClamp';
