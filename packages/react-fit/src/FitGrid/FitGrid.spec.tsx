// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FitGrid, FitGridItem } from './FitGrid.tsx';

const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  process.env.NODE_ENV = originalNodeEnv;
});

describe('FitGrid', () => {
  it('sets the base grid class and required layout styles', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth="14rem">
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveClass('rf-fit-grid');
    expect(grid).toHaveStyle({
      display: 'grid',
      columnGap: '0px',
      rowGap: '0px',
    });
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(14rem, 1fr))');
  });

  it('converts numeric lengths to px values', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth={240} colGap={16} rowGap={8}>
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveStyle({
      columnGap: '16px',
      rowGap: '8px',
    });
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(240px, 1fr))');
  });

  it('uses colGap as rowGap when rowGap is omitted', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" colGap="1rem">
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveStyle({
      columnGap: '1rem',
      rowGap: '1rem',
    });
  });

  it('uses valid minColumns and maxColumns in the grid template', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" minColumns={2} maxColumns={4}>
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(calc((100% - 0px * (2 - 1)) / 2), max(12rem, calc((100% - 0px * (4 - 1)) / 4))), 1fr))',
    );
  });

  it('warns and ignores invalid column limits in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" minColumns={0} maxColumns={1.5}>
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(warn).toHaveBeenCalledWith(
      '[react-fit] FitGrid expected minColumns to be a positive integer.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[react-fit] FitGrid expected maxColumns to be a positive integer.',
    );
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(12rem, 1fr))');
  });

  it('warns but keeps valid column limits when maxColumns is smaller than minColumns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" minColumns={4} maxColumns={2}>
        <div />
      </FitGrid>,
    );

    expect(warn).toHaveBeenCalledWith(
      '[react-fit] FitGrid received maxColumns smaller than minColumns.',
    );
    const grid = screen.getByTestId('grid');

    expect(grid.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(calc((100% - 0px * (4 - 1)) / 4), max(12rem, calc((100% - 0px * (2 - 1)) / 2))), 1fr))',
    );
  });

  it('does not warn in production', () => {
    process.env.NODE_ENV = 'production';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" minColumns={0} maxColumns={0}>
        <div />
      </FitGrid>,
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it('exposes FitGrid.Item as FitGridItem', () => {
    expect(FitGrid.Item).toBe(FitGridItem);
  });
});

describe('FitGridItem', () => {
  it('sets a numeric column span', () => {
    render(
      <FitGridItem data-testid="item" colSpan={2}>
        item
      </FitGridItem>,
    );

    expect(screen.getByTestId('item')).toHaveStyle({
      gridColumn: 'span 2',
    });
  });

  it('sets a full row column span', () => {
    render(
      <FitGrid.Item data-testid="item" colSpan="full">
        item
      </FitGrid.Item>,
    );

    expect(screen.getByTestId('item')).toHaveStyle({
      gridColumn: '1 / -1',
    });
  });

  it('pins the item to the current row end', () => {
    render(
      <FitGrid.Item data-testid="item" pin="row-end">
        item
      </FitGrid.Item>,
    );

    expect(screen.getByTestId('item')).toHaveStyle({
      gridColumn: '-2 / -1',
    });
  });

  it('warns and ignores invalid column spans in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FitGrid.Item data-testid="item" colSpan={0}>
        item
      </FitGrid.Item>,
    );

    expect(warn).toHaveBeenCalledWith(
      '[react-fit] FitGridItem expected colSpan to be a positive integer or "full".',
    );
    expect(screen.getByTestId('item').style.gridColumn).toBe('');
  });

  it('warns and lets pin take precedence over colSpan', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FitGrid.Item data-testid="item" colSpan="full" pin="row-end">
        item
      </FitGrid.Item>,
    );

    expect(warn).toHaveBeenCalledWith(
      '[react-fit] FitGridItem received both pin and colSpan. pin takes precedence.',
    );
    expect(screen.getByTestId('item')).toHaveStyle({
      gridColumn: '-2 / -1',
    });
  });
});
