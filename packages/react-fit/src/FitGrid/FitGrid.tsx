import { Primitive } from '@radix-ui/react-primitive';
import { clsx } from 'clsx';
import { isPositiveInteger } from '../_internal/isPositiveInteger.ts';
import { isUndefined } from '../_internal/isUndefined.ts';
import { toCSSLength } from '../_internal/toCSSLength.ts';

type FitGridStyle = React.CSSProperties & {
  '--rf-fit-grid-min-item-w': string;
  '--rf-fit-grid-col-gap': string;
  '--rf-fit-grid-row-gap': string;
  '--rf-fit-grid-min-cols'?: number;
  '--rf-fit-grid-max-cols'?: number;
};

/**
 * Props for the `FitGrid` component.
 */
export type FitGridProps = React.ComponentPropsWithoutRef<typeof Primitive.div> & {
  /**
   * The minimum inline size each item should keep before the grid reduces the column count.
   */
  minItemWidth: number | string;

  /**
   * The minimum number of columns the grid should try to keep.
   *
   * Invalid values are ignored and warn in development.
   */
  minColumns?: number;

  /**
   * The maximum number of columns the grid should create.
   *
   * Invalid values are ignored and warn in development.
   */
  maxColumns?: number;

  /**
   * The space between columns.
   */
  colGap?: number | string;

  /**
   * The space between rows.
   *
   * Defaults to `colGap` when omitted.
   */
  rowGap?: number | string;
};

/**
 * Arranges children in a CSS grid that adapts its column count to the available element space.
 *
 * The column count is driven by each item's minimum width instead of page or container
 * breakpoints. This keeps the component useful for filter forms, tool panels, cards, and other
 * repeated controls that need to fit the space around them.
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
export const FitGrid = (props: FitGridProps) => {
  const {
    minItemWidth,
    minColumns,
    maxColumns,
    colGap,
    rowGap,
    className,
    style,
    ...restProps
  } = props;

  const validMinColumns = isUndefined(minColumns) || isPositiveInteger(minColumns);
  const validMaxColumns = isUndefined(maxColumns) || isPositiveInteger(maxColumns);

  if (process.env.NODE_ENV !== 'production') {
    if (!validMinColumns) {
      console.warn('[react-fit] FitGrid expected minColumns to be a positive integer.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!validMaxColumns) {
      console.warn('[react-fit] FitGrid expected maxColumns to be a positive integer.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (
      validMinColumns &&
      validMaxColumns &&
      minColumns !== undefined &&
      maxColumns !== undefined
    ) {
      if (maxColumns < minColumns) {
        console.warn('[react-fit] FitGrid received maxColumns smaller than minColumns.');
      }
    }
  }

  const fitGridStyle: FitGridStyle = {
    ...style,
    '--rf-fit-grid-min-item-w': toCSSLength(minItemWidth),
    '--rf-fit-grid-col-gap': colGap === undefined ? '0px' : toCSSLength(colGap),
    '--rf-fit-grid-row-gap':
      rowGap === undefined
        ? colGap === undefined
          ? '0px'
          : toCSSLength(colGap)
        : toCSSLength(rowGap),
  };

  if (validMinColumns && minColumns !== undefined) {
    fitGridStyle['--rf-fit-grid-min-cols'] = minColumns;
  }

  if (validMaxColumns && maxColumns !== undefined) {
    fitGridStyle['--rf-fit-grid-max-cols'] = maxColumns;
  }

  return (
    <Primitive.div
      {...restProps}
      className={clsx('rf-fit-grid', className)}
      data-rf-fit-grid-max-cols={
        validMaxColumns && maxColumns !== undefined ? '' : undefined
      }
      data-rf-fit-grid-min-cols={
        validMinColumns && minColumns !== undefined ? '' : undefined
      }
      style={fitGridStyle}
    />
  );
};
