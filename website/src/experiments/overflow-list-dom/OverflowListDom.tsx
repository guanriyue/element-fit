import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  createOverflowListDomStore,
  type OverflowListDomItemData,
  type OverflowListDomStore,
} from './store.ts';

const overflowListDomContext = createContext<OverflowListDomStore | null>(
  null,
);

const useOverflowListDomStore = () => {
  const store = useContext(overflowListDomContext);

  if (!store) {
    throw new Error(
      'OverflowListDom parts must be used inside OverflowListDom.',
    );
  }

  return store;
};

type OverflowListDomProps = React.HTMLAttributes<HTMLDivElement>;

type OverflowListDomItemProps = {
  children: React.ReactElement;
  data: OverflowListDomItemData;
};

type OverflowListDomAccessoryProps = {
  children: React.ReactElement;
};

type OverflowListDomOverflowProps<Data = OverflowListDomItemData> = {
  children: (props: {
    overflowItems: readonly Data[];
  }) => React.ReactNode;
};

const OverflowListDomRoot = (props: OverflowListDomProps) => {
  const store = useMemo(() => createOverflowListDomStore(), []);
  const { children, ...rootProps } = props;

  return (
    <overflowListDomContext.Provider value={store}>
      <div
        {...rootProps}
        ref={store.setRootElement}
        data-overflow-list-root=""
        data-overflow-list-dom-experiment=""
      >
        {children}
      </div>
    </overflowListDomContext.Provider>
  );
};

const OverflowListDomItem = (props: OverflowListDomItemProps) => {
  const { children, data } = props;
  const store = useOverflowListDomStore();
  const itemId = useId();
  const dataRef = useRef(data);

  dataRef.current = data;

  const setItemElement = useCallback(
    (element: HTMLElement | null) => {
      store.setItemElement(itemId, element, dataRef.current);
    },
    [itemId, store],
  );

  useLayoutEffect(() => {
    return store.registerItem(itemId, dataRef.current);
  }, [itemId, store]);

  useLayoutEffect(() => {
    store.setItemData(itemId, data);
  }, [data, itemId, store]);

  // biome-ignore lint/suspicious/noExplicitAny: 压测实验只克隆可转发 HTMLElement ref 的 child
  return cloneElement(children as React.ReactElement<any>, {
    ref: setItemElement,
    'data-overflow-list-item': '',
  });
};

const OverflowListDomAccessory = (
  props: OverflowListDomAccessoryProps,
) => {
  const { children } = props;
  const store = useOverflowListDomStore();
  const accessoryId = useId();
  const setAccessoryElement = useCallback(
    (element: HTMLElement | null) => {
      store.setAccessoryElement(accessoryId, element);
    },
    [accessoryId, store],
  );

  useLayoutEffect(() => {
    return store.registerAccessory(accessoryId);
  }, [accessoryId, store]);

  // biome-ignore lint/suspicious/noExplicitAny: 压测实验只克隆可转发 HTMLElement ref 的 child
  return cloneElement(children as React.ReactElement<any>, {
    ref: setAccessoryElement,
    'data-overflow-list-accessory': '',
  });
};

const OverflowListDomOverflow = <Data,>(
  props: OverflowListDomOverflowProps<Data>,
) => {
  const { children } = props;
  const store = useOverflowListDomStore();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  return children({
    overflowItems: snapshot.overflowItemsData as readonly Data[],
  });
};

export const OverflowListDom = Object.assign(OverflowListDomRoot, {
  Accessory: OverflowListDomAccessory,
  Item: OverflowListDomItem,
  Overflow: OverflowListDomOverflow,
});
