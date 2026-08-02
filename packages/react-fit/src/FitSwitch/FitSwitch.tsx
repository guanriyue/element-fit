import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { FitSwitchState, FitSwitchStore, FitSwitchView } from './store.ts';
import { createFitSwitchStore } from './store.ts';

export type FitSwitchProps = {
  /**
   * 声明 `FitSwitch.Collapsed` 和 `FitSwitch.Expanded` 两个 view。
   *
   * `FitSwitch` 自身不渲染 DOM，因此两个 view 应该最终成为同一个 parent element
   * 下的 sibling。当前版本会使用这个共同 parent element 作为可用宽度容器。
   */
  children?: React.ReactNode;
};

/**
 * `FitSwitch.Collapsed` 和 `FitSwitch.Expanded` 的属性。
 *
 * 默认渲染 `div`。传入 `asChild` 时，会把 ref、data attributes 和测量状态注入到唯一 child 上。
 */
export type FitSwitchViewProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

const fitSwitchStoreContext = createContext<FitSwitchStore | null>(null);

const useFitSwitchStore = (componentName: string): FitSwitchStore => {
  const store = useContext(fitSwitchStoreContext);

  if (store === null) {
    throw new Error(`${componentName} must be used inside FitSwitch.`);
  }

  return store;
};

const useFitSwitchSelector = <Value,>(
  componentName: string,
  selector: (state: FitSwitchState) => Value,
): Value => {
  const store = useFitSwitchStore(componentName);

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(store.getSnapshot()),
  );
};

const FitSwitchRoot = (props: FitSwitchProps) => {
  const { children } = props;
  const store = useMemo(() => {
    return createFitSwitchStore();
  }, []);

  return <fitSwitchStoreContext.Provider value={store}>{children}</fitSwitchStoreContext.Provider>;
};

FitSwitchRoot.displayName = 'FitSwitch' as const;

const createFitSwitchView = (view: FitSwitchView) => {
  const componentName = view === 'collapsed' ? 'FitSwitch.Collapsed' : 'FitSwitch.Expanded';

  const FitSwitchViewComponent = forwardRef<HTMLElement, FitSwitchViewProps>((props, ref) => {
    const { className, inert, ...restProps } = props;
    const store = useFitSwitchStore(componentName);
    const mode = useFitSwitchSelector(componentName, (state) => {
      return state.mode;
    });
    const visible = mode === view;
    const registerViewRef = useCallback(
      (element: HTMLElement | null) => {
        store.setViewElement(view, element);
      },
      [store],
    );
    const composedRef = useComposedRefs(ref, registerViewRef);

    return (
      <Primitive.div
        {...restProps}
        ref={composedRef}
        className={className}
        inert={visible ? inert : true}
        data-fit-measuring={visible ? undefined : ''}
      />
    );
  });

  FitSwitchViewComponent.displayName = componentName;

  return FitSwitchViewComponent;
};

export const FitSwitchCollapsed = createFitSwitchView('collapsed');

export const FitSwitchExpanded = createFitSwitchView('expanded');

/**
 * 在同一个横向可用空间内，根据 expanded view 是否能放下切换完整 view。
 *
 * `FitSwitch` 自身不渲染 DOM。`Collapsed` 和 `Expanded` 会同时保持挂载，
 * 当前 view 处于 visible 状态，另一个 view 处于 hidden but measurable 状态。
 *
 * @example
 * ```tsx
 * <div>
 *   <FitSwitch>
 *     <FitSwitch.Collapsed>
 *       <Tabs />
 *     </FitSwitch.Collapsed>
 *
 *     <FitSwitch.Expanded>
 *       <Tabs />
 *     </FitSwitch.Expanded>
 *   </FitSwitch>
 * </div>
 * ```
 */
export const FitSwitch = Object.assign(FitSwitchRoot, {
  /**
   * 声明 expanded 放不下时展示的完整 view。
   *
   * @example
   * ```tsx
   * <FitSwitch.Collapsed asChild>
   *   <Tabs />
   * </FitSwitch.Collapsed>
   * ```
   */
  Collapsed: FitSwitchCollapsed,

  /**
   * 声明优先展示的完整 view。只要它的宽度能放入容器，`FitSwitch` 就会展示它。
   *
   * @example
   * ```tsx
   * <FitSwitch.Expanded asChild>
   *   <Tabs />
   * </FitSwitch.Expanded>
   * ```
   */
  Expanded: FitSwitchExpanded,
});
