// @vitest-environment jsdom

import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompactGrid } from './CompactGrid.tsx';

type MockEntry = Pick<ResizeObserverEntry, 'target'>;

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  readonly callback: ResizeObserverCallback;
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  emit(entries: MockEntry[]): void {
    this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

const originalNodeEnv = process.env.NODE_ENV;
const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  MockResizeObserver.instances = [];
  process.env.NODE_ENV = 'test';
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((element) => {
    return {
      gridTemplateColumns: (element as HTMLElement).dataset.columns || '100px 100px',
    } as CSSStyleDeclaration;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  process.env.NODE_ENV = originalNodeEnv;
  globalThis.ResizeObserver = originalResizeObserver;
});

describe('CompactGrid', () => {
  it('renders Extra in the default cell when the layout is not compact', () => {
    render(
      <CompactGrid data-columns="100px 100px 100px" data-testid="grid" minItemWidth="14rem">
        <div>Keyword</div>
        <div>
          Status
          <CompactGrid.ExtraSlot data-testid="slot" />
        </div>
        <CompactGrid.Extra data-testid="extra">
          <button type="reset">Reset</button>
        </CompactGrid.Extra>
      </CompactGrid>,
    );

    const grid = screen.getByTestId('grid');

    act(() => {
      MockResizeObserver.instances[0]?.emit([{ target: grid }]);
    });

    expect(screen.getByTestId('extra')).toHaveTextContent('Reset');
    expect(screen.getByTestId('slot')).toBeEmptyDOMElement();
  });

  it('renders Extra children in ExtraSlot when the layout is compact', () => {
    render(
      <CompactGrid data-columns="100px 100px" data-testid="grid" minItemWidth="14rem">
        <div>Keyword</div>
        <div>
          Status
          <CompactGrid.ExtraSlot data-testid="slot" />
        </div>
        <CompactGrid.Extra data-testid="extra">
          <button type="reset">Reset</button>
        </CompactGrid.Extra>
      </CompactGrid>,
    );

    const grid = screen.getByTestId('grid');

    act(() => {
      MockResizeObserver.instances[0]?.emit([{ target: grid }]);
    });

    expect(screen.queryByTestId('extra')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('slot')).getByText('Reset')).toBeInTheDocument();
  });

  it('forwards refs to root, Extra, and ExtraSlot elements', () => {
    let rootElement: HTMLDivElement | null = null;
    let extraElement: HTMLDivElement | null = null;
    let slotElement: HTMLSpanElement | null = null;

    render(
      <CompactGrid
        ref={(node) => {
          rootElement = node;
        }}
        minItemWidth="14rem"
      >
        <div>
          Status
          <CompactGrid.ExtraSlot
            ref={(node) => {
              slotElement = node;
            }}
          />
        </div>
        <CompactGrid.Extra
          ref={(node) => {
            extraElement = node;
          }}
        >
          Reset
        </CompactGrid.Extra>
      </CompactGrid>,
    );

    expect(rootElement).toBeInstanceOf(HTMLDivElement);
    expect(extraElement).toBeInstanceOf(HTMLDivElement);
    expect(slotElement).toBeInstanceOf(HTMLSpanElement);
  });
});
