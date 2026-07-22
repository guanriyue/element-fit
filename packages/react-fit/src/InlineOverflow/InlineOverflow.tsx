import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  createInlineOverflowStore,
  type InlineOverflowChangeHandler,
  type InlineOverflowStore,
} from './store.ts';

const INLINE_OVERFLOW_NAME = 'InlineOverflow';
const INLINE_OVERFLOW_CONTENT_NAME = `${INLINE_OVERFLOW_NAME}.Content`;
const INLINE_OVERFLOW_ACCESSORY_NAME = `${INLINE_OVERFLOW_NAME}.Accessory`;

const inlineOverflowContext = createContext<InlineOverflowStore | null>(null);

const useInlineOverflowStore = (componentName: string): InlineOverflowStore => {
  const store = useContext(inlineOverflowContext);

  if (store === null) {
    throw new Error(`${componentName} must be used inside InlineOverflow.`);
  }

  return store;
};

const useInlineOverflow = (store: InlineOverflowStore): boolean => {
  return useSyncExternalStore(store.subscribe, store.getOverflow, store.getOverflow);
};

/**
 * `InlineOverflow` Root 接受的属性。
 *
 * 同时支持 `Primitive.span` 的原生属性与 `asChild`。
 */
export interface InlineOverflowProps extends React.ComponentPropsWithoutRef<typeof Primitive.span> {
  /**
   * 在首次可信测量完成后，以及后续 overflow 状态变化时调用。
   *
   * Root 或 Content 元素发生替换后，新的首次测量也会调用该回调。
   */
  onOverflowChange?: InlineOverflowChangeHandler;
}

/**
 * `InlineOverflow.Content` 接受的属性。
 *
 * 同时支持 `Primitive.span` 的原生属性与 `asChild`。
 * 组件不注入展示样式，单行排版与裁剪策略由调用方控制。
 */
export type InlineOverflowContentProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;

/**
 * `InlineOverflow.Accessory` 接受的属性。
 *
 * 同时支持 `Primitive.span` 的原生属性与 `asChild`。
 */
export type InlineOverflowAccessoryProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;

type InlineOverflowInternalProps = InlineOverflowProps & {
  __debugDisableRangeFallback?: boolean;
};

const InlineOverflowRoot = forwardRef<HTMLElement, InlineOverflowProps>((props, forwardedRef) => {
  const { __debugDisableRangeFallback, asChild, children, onOverflowChange, ...rootProps } =
    props as InlineOverflowInternalProps;
  // biome-ignore lint/correctness/useExhaustiveDependencies: 初始化选项
  const store = useMemo(() => {
    return createInlineOverflowStore(onOverflowChange, __debugDisableRangeFallback === true);
  }, []);

  useEffect(() => {
    store.setOnOverflowChange(onOverflowChange);
    store.setDisableRangeFallback(__debugDisableRangeFallback === true);

    return () => {
      store.setOnOverflowChange(undefined);
    };
  });

  const overflow = useInlineOverflow(store);
  const composedRef = useComposedRefs(forwardedRef, store.setRootElement);

  return (
    <inlineOverflowContext.Provider value={store}>
      <Primitive.span
        {...rootProps}
        asChild={asChild}
        ref={composedRef}
        data-overflow={overflow ? '' : undefined}
      >
        {children}
      </Primitive.span>
    </inlineOverflowContext.Provider>
  );
});

InlineOverflowRoot.displayName = INLINE_OVERFLOW_NAME;

/**
 * 渲染唯一的横向溢出测量节点，不提供默认样式。
 *
 * @example
 * ```tsx
 * <InlineOverflow className="inline-flex max-w-full min-w-0">
 *   <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
 *     {label}
 *   </InlineOverflow.Content>
 * </InlineOverflow>
 * ```
 */
export const InlineOverflowContent = forwardRef<HTMLElement, InlineOverflowContentProps>(
  (props, forwardedRef) => {
    const { asChild, children, ...contentProps } = props;
    const store = useInlineOverflowStore(INLINE_OVERFLOW_CONTENT_NAME);
    const composedRef = useComposedRefs(forwardedRef, store.setContentElement);

    return (
      <Primitive.span {...contentProps} asChild={asChild} ref={composedRef}>
        {children}
      </Primitive.span>
    );
  },
);

InlineOverflowContent.displayName = INLINE_OVERFLOW_CONTENT_NAME;

/**
 * 仅在 Root 发生 overflow 时渲染附属节点。
 *
 * Accessory 不参与溢出判定，其布局位置由调用方决定。未渲染时，其内部状态会被销毁。
 *
 * @example
 * ```tsx
 * <InlineOverflow className="grid w-64 min-w-0 gap-1">
 *   <InlineOverflow.Content className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
 *     {label}
 *   </InlineOverflow.Content>
 *   <InlineOverflow.Accessory asChild>
 *     <button type="button">Show details</button>
 *   </InlineOverflow.Accessory>
 * </InlineOverflow>
 * ```
 */
export const InlineOverflowAccessory = forwardRef<HTMLElement, InlineOverflowAccessoryProps>(
  (props, forwardedRef) => {
    const store = useInlineOverflowStore(INLINE_OVERFLOW_ACCESSORY_NAME);
    const visible = useInlineOverflow(store);

    if (!visible) {
      return null;
    }

    return <Primitive.span ref={forwardedRef} {...props} />;
  },
);

InlineOverflowAccessory.displayName = INLINE_OVERFLOW_ACCESSORY_NAME;

/**
 * 管理单行横向溢出测量，并向 Content 和 Accessory 提供派生状态。
 *
 * Root 和 Content 都不提供样式。调用方需要建立可测量、可收缩的布局，
 * 并决定单行排版与裁剪策略。
 *
 * @example
 * ```tsx
 * <InlineOverflow
 *   className="inline-flex max-w-full min-w-0"
 *   onOverflowChange={setOverflow}
 * >
 *   <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
 *     {label}
 *   </InlineOverflow.Content>
 *   <InlineOverflow.Accessory asChild>
 *     <button type="button">More</button>
 *   </InlineOverflow.Accessory>
 * </InlineOverflow>
 * ```
 */
export const InlineOverflow = Object.assign(InlineOverflowRoot, {
  Content: InlineOverflowContent,
  Accessory: InlineOverflowAccessory,
});
