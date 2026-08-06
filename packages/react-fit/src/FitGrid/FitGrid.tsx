import { Primitive } from '@radix-ui/react-primitive';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import { getFitGridTemplateColumns } from '../_internal/getFitGridTemplateColumns.ts';
import { isPositiveInteger } from '../_internal/isPositiveInteger.ts';
import { isUndefined } from '../_internal/isUndefined.ts';
import { toCSSLength } from '../_internal/toCSSLength.ts';
import type { PrimitiveDivProps } from '../_internal/types.ts';

type FitGridStyle = React.CSSProperties & {
  display: 'grid';
  gridTemplateColumns: string;
  columnGap: string;
  rowGap: string;
};

/**
 * `FitGrid` 组件的属性。
 */
export interface FitGridProps extends PrimitiveDivProps {
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
 * `FitGridItem` 组件的属性。
 */
export interface FitGridItemProps extends PrimitiveDivProps {
  /**
   * 当前 item 应跨越的列数。
   *
   * 使用 `'full'` 可以占据整行。
   */
  colSpan?: number | 'full';

  /**
   * 将当前 item 固定到当前行的最后一列。
   *
   * 该属性预期用于 Grid 的最后一个子节点。如果在中间节点上使用，最终布局结果由调用方负责。
   */
  pin?: 'row-end';
}

const FitGridRoot = forwardRef<HTMLDivElement, FitGridProps>((props, ref) => {
  const { minItemWidth, minColumns, maxColumns, colGap, rowGap, className, style, ...restProps } =
    props;

  const minColumnsPositive = isPositiveInteger(minColumns);
  const maxColumnsPositive = isPositiveInteger(maxColumns);

  if (process.env.NODE_ENV !== 'production') {
    const minColumnsUndef = isUndefined(minColumns);
    const validMinColumns = minColumnsUndef || minColumnsPositive;

    if (!validMinColumns) {
      console.warn('[react-fit] FitGrid expected minColumns to be a positive integer.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const maxColumnsUndef = isUndefined(maxColumns);
    const validMaxColumns = maxColumnsUndef || maxColumnsPositive;

    if (!validMaxColumns) {
      console.warn('[react-fit] FitGrid expected maxColumns to be a positive integer.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (minColumnsPositive && maxColumnsPositive) {
      if (maxColumns < minColumns) {
        console.warn('[react-fit] FitGrid received maxColumns smaller than minColumns.');
      }
    }
  }

  const cssMinItemWidth = toCSSLength(minItemWidth);
  const colGapUndef = isUndefined(colGap);
  const rowGapUndef = isUndefined(rowGap);
  const cssColGap = colGapUndef ? '0px' : toCSSLength(colGap);
  const cssRowGap = rowGapUndef ? (colGapUndef ? '0px' : toCSSLength(colGap)) : toCSSLength(rowGap);

  const fitGridStyle: FitGridStyle = {
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
    <Primitive.div
      {...restProps}
      ref={ref}
      className={clsx('rf-fit-grid', className)}
      style={fitGridStyle}
    />
  );
});

FitGridRoot.displayName = 'FitGrid' as const;

export const FitGridItem = forwardRef<HTMLDivElement, FitGridItemProps>((props, ref) => {
  const { colSpan, pin, className, style, ...restProps } = props;
  const colSpanFull = colSpan === 'full';
  const colSpanPositive = isPositiveInteger(colSpan);

  if (process.env.NODE_ENV !== 'production') {
    const colSpanUndef = isUndefined(colSpan);
    const validColSpan = colSpanUndef || colSpanFull || colSpanPositive;

    if (!validColSpan) {
      console.warn('[react-fit] FitGridItem expected colSpan to be a positive integer or "full".');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!isUndefined(pin) && (colSpanFull || colSpanPositive)) {
      console.warn('[react-fit] FitGridItem received both pin and colSpan. pin takes precedence.');
    }
  }

  const itemStyle: React.CSSProperties = {
    ...style,
  };

  if (colSpanFull || colSpanPositive) {
    itemStyle.gridColumn = colSpan === 'full' ? '1 / -1' : `span ${colSpan}`;
  }

  if (pin === 'row-end') {
    itemStyle.gridColumn = '-2 / -1';
  }

  return (
    <Primitive.div
      {...restProps}
      ref={ref}
      className={clsx('rf-fit-grid-item', className)}
      style={itemStyle}
    />
  );
});

FitGridItem.displayName = 'FitGridItem' as const;

/**
 * 对 CSS Grid 自适应列能力的简易封装，根据当前元素可用空间调整列数。
 *
 * 列数由每个 item 的最小宽度驱动，而不是由页面或容器断点直接决定。
 * 组件不进行 JavaScript 尺寸测量，列数调整由浏览器的 CSS Grid 布局完成。
 * 这使得它适用于过滤表单、工具面板、卡片列表，以及其他需要适配周围空间的重复控件。
 *
 * @example
 * ```tsx
 * <FitGrid minItemWidth="14rem" maxColumns={4} colGap="0.75rem">
 *   <input />
 *   <input />
 *   <button>Apply</button>
 * </FitGrid>
 * ```
 */
export const FitGrid = Object.assign(FitGridRoot, {
  /**
   * 配置 `FitGrid` 内部的一个子项。
   *
   * `FitGridItem` 是一个轻量的 CSS Grid item 包装组件。它不进行测量，预期在 `FitGrid` 内部使用。
   */
  Item: FitGridItem,
});
