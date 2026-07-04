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
import type { CompactGridItemColSpan, CompactGridState, CompactGridStore } from './store.ts';
import { createCompactGridStore } from './store.ts';

type CompactGridStyle = React.CSSProperties & {
  display: 'grid';
  gridAutoColumns: string;
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
 * `CompactGrid.Item` 的属性。
 */
export interface CompactGridItemProps extends PrimitiveDivProps {
  /**
   * 当前 item 应跨越的列数。
   *
   * 使用 `'full'` 可以占据整行。数字跨列只会在当前显式列数内生效；
   * 当声明的列数超过当前显式列数时，会按整行处理，避免创建可见的隐式列。
   */
  colSpan?: CompactGridItemColSpan;
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
    // 数字 colSpan 在当前显式列数不足时会创建隐式列。如果隐式列拥有宽度，
    // `getComputedStyle(root).gridTemplateColumns` 会把它也序列化出来，导致 store
    // 误以为 root 拥有更多列。把隐式列压成 0px 后，`getColumnCount` 可以在统计时
    // 忽略这些 track，从而保持“列数只来自组件自身模板”的语义。
    gridAutoColumns: '0px',
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
 * 声明一个参与 `CompactGrid` 紧凑计算的 grid item。
 *
 * `Item` 可以通过 `colSpan` 告诉组件自己占据几列。未设置时按 1 列计算。
 * 如果数字 `colSpan` 超过当前显式列数，组件会把它视为整行。
 *
 * @example
 * ```tsx
 * <CompactGrid.Item colSpan={2}>
 *   <Field name="range" />
 * </CompactGrid.Item>
 * ```
 */
export const CompactGridItem = forwardRef<HTMLDivElement, CompactGridItemProps>((props, ref) => {
  const { colSpan, style, ...restProps } = props;
  const store = useCompactGridStore('CompactGrid.Item');
  const itemElementRef = useRef<HTMLDivElement | null>(null);
  const unregisterItemRef = useRef<(() => void) | null>(null);
  const colSpanFull = colSpan === 'full';
  const colSpanPositive = isPositiveInteger(colSpan);
  const gridColumn = useCompactGridSelector('CompactGrid.Item', (state) => {
    if (colSpanFull) {
      return '1 / -1';
    }

    if (typeof colSpan === 'number' && colSpanPositive) {
      return state.columnCount <= 0 || colSpan > state.columnCount ? '1 / -1' : `span ${colSpan}`;
    }

    return undefined;
  });

  if (process.env.NODE_ENV !== 'production') {
    const colSpanUndef = isUndefined(colSpan);
    const validColSpan = colSpanUndef || colSpanFull || colSpanPositive;

    if (!validColSpan) {
      console.warn('[react-fit] CompactGridItem expected colSpan to be a positive integer or "full".');
    }
  }

  const registerItemRef = useCallback(
    (item: HTMLDivElement | null) => {
      if (unregisterItemRef.current) {
        unregisterItemRef.current();
        unregisterItemRef.current = null;
      }

      if (item !== null) {
        unregisterItemRef.current = store.registerItem(item, {
          colSpan: colSpanFull || colSpanPositive ? colSpan : undefined,
        });
      }
    },
    [colSpan, colSpanFull, colSpanPositive, store],
  );
  const itemRef = useComposedRefs(ref, itemElementRef, registerItemRef);
  const itemStyle: React.CSSProperties = {
    ...style,
  };

  if (!isUndefined(gridColumn)) {
    itemStyle.gridColumn = gridColumn;
  }

  return <Primitive.div {...restProps} ref={itemRef} style={itemStyle} />;
});

CompactGridItem.displayName = 'CompactGridItem' as const;

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
 * `CompactGrid.Item` 的数字 `colSpan` 不会扩展根节点的列矩阵；越界时会退化为整行。
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
   * 声明参与紧凑计算的 grid item。
   */
  Item: CompactGridItem,

  /**
   * 提供默认位置和 children。非紧凑模式下它会作为一个 grid cell 渲染。
   */
  Extra: CompactGridExtra,

  /**
   * 声明紧凑模式下渲染 `Extra` children 的位置。
   */
  ExtraSlot: CompactGridExtraSlot,
});
