import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { isUndefined } from '../_internal/isUndefined.ts';
import { useStableSelector } from '../_internal/useStableSelector.ts';
import {
  createOverflowListStore,
  type OverflowListState,
  type OverflowListStore,
} from './store/index.ts';
import type { OverflowItemData } from './store/types.ts';

const OVERFLOW_LIST_NAME = 'OverflowList';
const OVERFLOW_LIST_ITEM_NAME = `${OVERFLOW_LIST_NAME}.Item`;
const OVERFLOW_LIST_ACCESSORY_NAME = `${OVERFLOW_LIST_NAME}.Accessory`;
const OVERFLOW_LIST_OVERFLOW_NAME = `${OVERFLOW_LIST_NAME}.Overflow`;

const overflowListContext = createContext<OverflowListStore | null>(null);

const useOverflowListStore = (componentName: string): OverflowListStore => {
  const store = useContext(overflowListContext);

  if (!store) {
    throw new Error(`${componentName} must be used inside OverflowList.`);
  }

  return store;
};

const useOverflowListSelector = <Selection,>(
  store: OverflowListStore,
  selector: (state: OverflowListState) => Selection,
  equal: (previous: Selection, next: Selection) => boolean = Object.is,
): Selection => {
  const stableSelector = useStableSelector(selector, equal);

  return useSyncExternalStore(
    store.subscribe,
    () => stableSelector(store.getSnapshot()),
    () => stableSelector(store.getSnapshot()),
  );
};

const isSameOverflowItems = <Data,>(
  previous: readonly Data[],
  next: readonly Data[],
) => {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((item, index) => Object.is(item, next[index]));
};

export type OverflowListProps = React.ComponentPropsWithoutRef<
  typeof Primitive.div
>;

export type OverflowListItemProps = React.ComponentPropsWithoutRef<
  typeof Primitive.span
> & {
  // biome-ignore lint/suspicious/noExplicitAny: 数据由开发者自定义
  data: any;
};

export type OverflowListAccessoryProps = React.ComponentPropsWithoutRef<
  typeof Primitive.span
>;

export type OverflowListOverflowRenderProps<Data = OverflowItemData> = {
  overflowItems: readonly Data[];
};

export type OverflowListOverflowProps<Data = OverflowItemData> = {
  children: (
    props: OverflowListOverflowRenderProps<Data>,
  ) => React.ReactNode;
};

const OverflowListRoot = forwardRef<HTMLElement, OverflowListProps>(
  (props, forwardedRef) => {
    const store = useMemo(() => createOverflowListStore(), []);
    const composedRef = useComposedRefs(forwardedRef, store.setRootElement);
    const overflow = useOverflowListSelector(
      store,
      (state) => state.overflow,
    );

    return (
      <overflowListContext.Provider value={store}>
        <Primitive.div
          {...props}
          ref={composedRef}
          data-overflow-list-root=""
          data-overflow={overflow ? '' : undefined}
        />
      </overflowListContext.Provider>
    );
  },
);

OverflowListRoot.displayName = OVERFLOW_LIST_NAME;

const OverflowListItem = forwardRef<HTMLElement, OverflowListItemProps>(
  (props, forwardedRef) => {
    const { data, ...itemProps } = props;
    const store = useOverflowListStore(OVERFLOW_LIST_ITEM_NAME);
    const itemId = useId();
    const dataRef = useRef(data);

    dataRef.current = data;

    const setItemElement = useCallback(
      (element: HTMLElement | null) => {
        store.setItemElement(itemId, element, dataRef.current);
      },
      [itemId, store],
    );
    const composedRef = useComposedRefs(forwardedRef, setItemElement);
    const visible = useOverflowListSelector(
      store,
      (state) => {
        const itemVisible = state.itemVisibility.get(itemId);

        return isUndefined(itemVisible) ? true : itemVisible;
      },
    );

    useLayoutEffect(() => {
      return store.registerItem(itemId, dataRef.current);
    }, [itemId, store]);

    useLayoutEffect(() => {
      store.setItemData(itemId, data);
    }, [data, itemId, store]);

    if (!visible) {
      return null;
    }

    return (
      <Primitive.span
        {...itemProps}
        ref={composedRef}
        data-overflow-list-item=""
      />
    );
  },
);

OverflowListItem.displayName = OVERFLOW_LIST_ITEM_NAME;

const OverflowListAccessory = forwardRef<
  HTMLElement,
  OverflowListAccessoryProps
>((props, forwardedRef) => {
  const {
    'aria-hidden': ariaHidden,
    style,
    ...accessoryProps
  } = props;
  const store = useOverflowListStore(OVERFLOW_LIST_ACCESSORY_NAME);
  const accessoryId = useId();
  const accessoryState = useOverflowListSelector(
    store,
    (state) => state.accessoryState,
  );
  const setAccessoryElement = useCallback(
    (element: HTMLElement | null) => {
      store.setAccessoryElement(accessoryId, element);
    },
    [accessoryId, store],
  );
  const composedRef = useComposedRefs(forwardedRef, setAccessoryElement);

  useLayoutEffect(() => {
    return store.registerAccessory(accessoryId);
  }, [accessoryId, store]);

  if (accessoryState === 'hidden') {
    return null;
  }

  const measuring = accessoryState === 'measuring';
  const accessoryStyle = measuring
    ? {
      ...style,
      pointerEvents: 'none' as const,
      visibility: 'hidden' as const,
    }
    : style;

  return (
    <Primitive.span
      {...accessoryProps}
      ref={composedRef}
      style={accessoryStyle}
      aria-hidden={measuring ? true : ariaHidden}
      data-overflow-list-accessory=""
      data-overflow-list-measuring={measuring ? '' : undefined}
    />
  );
});

OverflowListAccessory.displayName = OVERFLOW_LIST_ACCESSORY_NAME;

const OverflowListOverflow = <Data,>(
  props: OverflowListOverflowProps<Data>,
) => {
  const { children } = props;
  const store = useOverflowListStore(OVERFLOW_LIST_OVERFLOW_NAME);
  const overflowItems = useOverflowListSelector(
    store,
    (state) => state.overflowItemsData,
    isSameOverflowItems,
  );

  return children({
    overflowItems,
  });
};

export const OverflowList = Object.assign(OverflowListRoot, {
  Accessory: OverflowListAccessory,
  Item: OverflowListItem,
  Overflow: OverflowListOverflow,
});
