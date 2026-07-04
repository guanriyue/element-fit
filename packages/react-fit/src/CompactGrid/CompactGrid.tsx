import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { getFitGridTemplateColumns } from '../_internal/getFitGridTemplateColumns.ts';
import { isPositiveInteger } from '../_internal/isPositiveInteger.ts';
import { isUndefined } from '../_internal/isUndefined.ts';
import { toCSSLength } from '../_internal/toCSSLength.ts';
import type { PrimitiveDivProps } from '../_internal/types.ts';
import type { CompactGridState, CompactGridStore } from './store.ts';
import { createCompactGridStore } from './store.ts';

type CompactGridStyle = React.CSSProperties & {
  display: 'grid';
  gridTemplateColumns: string;
  columnGap: string;
  rowGap: string;
};

const compactGridStoreContext = createContext<CompactGridStore | null>(null);

const useCompactGridStore = (componentName: string): CompactGridStore => {
  const store = useContext(compactGridStoreContext);

  if (store === null) {
    throw new Error(`${componentName} must be used inside CompactGrid.`);
  }

  return store;
};

const useCompactGridSelector = <Value,>(
  componentName: string,
  selector: (state: CompactGridState) => Value,
): Value => {
  const store = useCompactGridStore(componentName);

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(store.getSnapshot()),
  );
};

/**
 * `CompactGrid` 组件的属性。
 */
export interface CompactGridProps extends PrimitiveDivProps {
  /**
   * 每个 item 在减少列数前应尽量保持的最小 inline size。
   */
  minItemWidth: number | string;

  /**
   * Grid 应尝试保持的最小列数。
   *
   * 非法值会被忽略，并在开发环境给出警告。
   */
  minColumns?: number;

  /**
   * Grid 最多可创建的列数。
   *
   * 非法值会被忽略，并在开发环境给出警告。
   */
  maxColumns?: number;

  /**
   * 列之间的间距。
   */
  colGap?: number | string;

  /**
   * 行之间的间距。
   *
   * 未传入时默认等于 `colGap`。
   */
  rowGap?: number | string;
}

/**
 * `CompactGrid.Extra` 的属性。
 *
 * `Extra` 用来声明额外内容的默认位置。非紧凑模式下，它会作为普通 grid cell 渲染；
 * 紧凑模式下，它的 children 会渲染到当前 active `ExtraSlot` 中。
 */
export type CompactGridExtraProps = PrimitiveDivProps;

/**
 * `CompactGrid.ExtraSlot` 的属性。
 *
 * `ExtraSlot` 用来声明紧凑模式下承载 `Extra` children 的候选位置。
 * 多个 `ExtraSlot` 同时存在时，组件会使用 DOM 顺序中的最后一个有效插槽。
 */
export type CompactGridExtraSlotProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;

const CompactGridRoot = forwardRef<HTMLDivElement, CompactGridProps>((props, ref) => {
  const { minItemWidth, minColumns, maxColumns, colGap, rowGap, style, ...restProps } = props;
  const store = useMemo(() => {
    return createCompactGridStore();
  }, []);

  const minColumnsPositive = isPositiveInteger(minColumns);
  const maxColumnsPositive = isPositiveInteger(maxColumns);

  if (process.env.NODE_ENV !== 'production') {
    const minColumnsUndef = isUndefined(minColumns);
    const validMinColumns = minColumnsUndef || minColumnsPositive;

    if (!validMinColumns) {
      console.warn('[react-fit] CompactGrid expected minColumns to be a positive integer.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const maxColumnsUndef = isUndefined(maxColumns);
    const validMaxColumns = maxColumnsUndef || maxColumnsPositive;

    if (!validMaxColumns) {
      console.warn('[react-fit] CompactGrid expected maxColumns to be a positive integer.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (minColumnsPositive && maxColumnsPositive) {
      if (maxColumns < minColumns) {
        console.warn('[react-fit] CompactGrid received maxColumns smaller than minColumns.');
      }
    }
  }

  const rootRef = useComposedRefs(ref, store.setRootElement);

  const cssMinItemWidth = toCSSLength(minItemWidth);
  const colGapUndef = isUndefined(colGap);
  const rowGapUndef = isUndefined(rowGap);
  const cssColGap = colGapUndef ? '0px' : toCSSLength(colGap);
  const cssRowGap = rowGapUndef ? (colGapUndef ? '0px' : toCSSLength(colGap)) : toCSSLength(rowGap);

  const compactGridStyle: CompactGridStyle = {
    ...style,
    display: 'grid',
    gridTemplateColumns: getFitGridTemplateColumns(
      cssMinItemWidth,
      minColumnsPositive ? minColumns : undefined,
      maxColumnsPositive ? maxColumns : undefined,
      cssColGap,
    ),
    columnGap: cssColGap,
    rowGap: cssRowGap,
  };

  return (
    <compactGridStoreContext.Provider value={store}>
      <Primitive.div {...restProps} ref={rootRef} style={compactGridStyle} />
    </compactGridStoreContext.Provider>
  );
});

CompactGridRoot.displayName = 'CompactGrid' as const;

/**
 * 声明 `CompactGrid` 的额外内容。
 *
 * 一个 `CompactGrid` 中只应存在一个 `Extra`。当 children 为 `null`、`undefined` 或 `false`
 * 时，会被视为没有 extra，组件不会进入紧凑模式。
 *
 * @example
 * ```tsx
 * <CompactGrid.Extra>
 *   <button type="reset">Reset</button>
 * </CompactGrid.Extra>
 * ```
 */
export const CompactGridExtra = forwardRef<HTMLDivElement, CompactGridExtraProps>((props, ref) => {
  const { children, ...restProps } = props;
  const store = useCompactGridStore('CompactGrid.Extra');
  const compact = useCompactGridSelector('CompactGrid.Extra', (state) => {
    return state.compact;
  });

  useLayoutEffect(() => {
    store.setExtra(children);

    return () => {
      store.setExtra(null);
    };
  }, [children, store]);

  if (compact) {
    return null;
  }

  return (
    <Primitive.div {...restProps} ref={ref} data-rf-compact-grid-extra="">
      {children}
    </Primitive.div>
  );
});

CompactGridExtra.displayName = 'CompactGridExtra' as const;

/**
 * 声明 `CompactGrid.Extra` 在紧凑模式下的候选渲染位置。
 *
 * 非紧凑模式下，或当前 slot 不是 active slot 时，`ExtraSlot` 会通过 `hidden` 隐藏，
 * 避免空的 `span` 影响布局。
 *
 * @example
 * ```tsx
 * <div className="field-with-actions">
 *   <Field name="status" />
 *   <CompactGrid.ExtraSlot />
 * </div>
 * ```
 */
export const CompactGridExtraSlot = forwardRef<HTMLSpanElement, CompactGridExtraSlotProps>(
  (props, ref) => {
    const { hidden, ...restProps } = props;
    const store = useCompactGridStore('CompactGrid.ExtraSlot');
    const slotElementRef = useRef<HTMLSpanElement | null>(null);
    const unregisterSlotRef = useRef<(() => void) | null>(null);
    const registerSlotRef = useCallback(
      (slot: HTMLSpanElement | null) => {
        if (unregisterSlotRef.current) {
          unregisterSlotRef.current();
          unregisterSlotRef.current = null;
        }

        if (slot !== null) {
          unregisterSlotRef.current = store.registerSlot(slot);
        }
      },
      [store],
    );
    const slotRef = useComposedRefs(ref, slotElementRef, registerSlotRef);
    const active = useCompactGridSelector('CompactGrid.ExtraSlot', (state) => {
      return state.activeSlot === slotElementRef.current;
    });
    const compact = useCompactGridSelector('CompactGrid.ExtraSlot', (state) => {
      return state.compact;
    });
    const extra = useCompactGridSelector('CompactGrid.ExtraSlot', (state) => {
      return state.extra;
    });

    return (
      <Primitive.span
        {...restProps}
        ref={slotRef}
        data-rf-compact-grid-extra-slot=""
        hidden={hidden || !compact || !active}
      >
        {compact && active ? extra : null}
      </Primitive.span>
    );
  },
);

CompactGridExtraSlot.displayName = 'CompactGridExtraSlot' as const;

/**
 * 使用 CSS Grid 排列子项，并在特定列数下将 `Extra` 渲染到 `ExtraSlot` 中。
 *
 * 当普通 grid cell 数量刚好填满当前行时，`Extra` 会进入紧凑模式并渲染在 `ExtraSlot` 的位置。
 *
 * @example
 * ```tsx
 * <CompactGrid minItemWidth="14rem" maxColumns={3} colGap="0.75rem">
 *   <div>
 *     <Field name="keyword" />
 *   </div>
 *   <div>
 *     <Field name="status" />
 *     <CompactGrid.ExtraSlot />
 *   </div>
 *   <CompactGrid.Extra>
 *     <button type="reset">Reset</button>
 *   </CompactGrid.Extra>
 * </CompactGrid>
 * ```
 */
export const CompactGrid = Object.assign(CompactGridRoot, {
  /**
   * 提供默认位置和 children。非紧凑模式下它会作为一个 grid cell 渲染。
   */
  Extra: CompactGridExtra,

  /**
   * 声明紧凑模式下渲染 `Extra` children 的位置。
   */
  ExtraSlot: CompactGridExtraSlot,
});
