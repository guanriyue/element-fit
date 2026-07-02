// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FitGrid } from './FitGrid.tsx';

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
  it('sets the base grid class and required sizing variable', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth="14rem">
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveClass('rf-fit-grid');
    expect(grid).toHaveStyle({
      '--rf-fit-grid-min-item-w': '14rem',
      '--rf-fit-grid-col-gap': '0px',
      '--rf-fit-grid-row-gap': '0px',
    });
  });

  it('converts numeric lengths to px values', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth={240} colGap={16} rowGap={8}>
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveStyle({
      '--rf-fit-grid-min-item-w': '240px',
      '--rf-fit-grid-col-gap': '16px',
      '--rf-fit-grid-row-gap': '8px',
    });
  });

  it('uses colGap as rowGap when rowGap is omitted', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" colGap="1rem">
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveStyle({
      '--rf-fit-grid-col-gap': '1rem',
      '--rf-fit-grid-row-gap': '1rem',
    });
  });

  it('keeps valid minColumns and maxColumns as layout variables', () => {
    render(
      <FitGrid data-testid="grid" minItemWidth="12rem" minColumns={2} maxColumns={4}>
        <div />
      </FitGrid>,
    );

    const grid = screen.getByTestId('grid');

    expect(grid).toHaveAttribute('data-rf-fit-grid-min-cols');
    expect(grid).toHaveAttribute('data-rf-fit-grid-max-cols');
    expect(grid).toHaveStyle({
      '--rf-fit-grid-min-cols': '2',
      '--rf-fit-grid-max-cols': '4',
    });
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
    expect(grid).not.toHaveAttribute('data-rf-fit-grid-min-cols');
    expect(grid).not.toHaveAttribute('data-rf-fit-grid-max-cols');
    expect(grid.style.getPropertyValue('--rf-fit-grid-min-cols')).toBe('');
    expect(grid.style.getPropertyValue('--rf-fit-grid-max-cols')).toBe('');
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

    expect(grid).toHaveStyle({
      '--rf-fit-grid-min-cols': '4',
      '--rf-fit-grid-max-cols': '2',
    });
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
});
