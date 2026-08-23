import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { PrimitiveDivProps, PrimitiveSpanProps } from '../_internal/types.ts';
import {
  createFitListStore,
  FIT_LIST_INACTIVE_ATTRIBUTE,
  type FitListStore,
} from './store.ts';

const FIT_LIST_NAME = 'FitList';
const FIT_LIST_ITEM_NAME = `${FIT_LIST_NAME}.Item`;
const FIT_LIST_EXPANDED_NAME = `${FIT_LIST_NAME}.Expanded`;
const FIT_LIST_COMPACT_NAME = `${FIT_LIST_NAME}.Compact`;

const fitListContext = createContext<FitListStore | null>(null);

const useFitListStore = (componentName: string) => {
  const store = useContext(fitListContext);

  if (!store) {
    throw new Error(`${componentName} must be used inside FitList.`);
  }

  return store;
};

const useFitListMode = (store: FitListStore) => {
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().mode,
    () => store.getSnapshot().mode,
  );
};

export type FitListProps = PrimitiveDivProps;

export type FitListItemProps = PrimitiveSpanProps;

export type FitListExpandedProps = PrimitiveSpanProps;

export type FitListCompactProps = PrimitiveSpanProps;

const FitListRoot = forwardRef<HTMLElement, FitListProps>(
  (props, forwardedRef) => {
    const store = useMemo(() => createFitListStore(), []);
    const rootRef = useComposedRefs(forwardedRef, store.setRootElement);

    return (
      <fitListContext.Provider value={store}>
        <Primitive.div {...props} ref={rootRef} />
      </fitListContext.Provider>
    );
  },
);

FitListRoot.displayName = FIT_LIST_NAME;

export const FitListItem = forwardRef<HTMLElement, FitListItemProps>(
  (props, forwardedRef) => {
    const store = useFitListStore(FIT_LIST_ITEM_NAME);
    const itemId = useId();
    const setItemElement = useCallback(
      (element: HTMLElement | null) => {
        store.setItemElement(itemId, element);
      },
      [itemId, store],
    );
    const itemRef = useComposedRefs(forwardedRef, setItemElement);

    return <Primitive.span {...props} ref={itemRef} />;
  },
);

FitListItem.displayName = FIT_LIST_ITEM_NAME;

export const FitListExpanded = forwardRef<
  HTMLElement,
  FitListExpandedProps
>((props, forwardedRef) => {
  const store = useFitListStore(FIT_LIST_EXPANDED_NAME);
  const mode = useFitListMode(store);
  const elementId = useId();
  const setElement = useCallback(
    (element: HTMLElement | null) => {
      store.setModeElement('expanded', elementId, element);
    },
    [elementId, store],
  );
  const elementRef = useComposedRefs(forwardedRef, setElement);
  const modeProps = {
    [FIT_LIST_INACTIVE_ATTRIBUTE]: mode === 'compact' ? '' : undefined,
  };

  return <Primitive.span {...props} {...modeProps} ref={elementRef} />;
});

FitListExpanded.displayName = FIT_LIST_EXPANDED_NAME;

export const FitListCompact = forwardRef<HTMLElement, FitListCompactProps>(
  (props, forwardedRef) => {
    const store = useFitListStore(FIT_LIST_COMPACT_NAME);
    const mode = useFitListMode(store);
    const elementId = useId();
    const setElement = useCallback(
      (element: HTMLElement | null) => {
        store.setModeElement('compact', elementId, element);
      },
      [elementId, store],
    );
    const elementRef = useComposedRefs(forwardedRef, setElement);
    const modeProps = {
      [FIT_LIST_INACTIVE_ATTRIBUTE]: mode === 'expanded' ? '' : undefined,
    };

    return <Primitive.span {...props} {...modeProps} ref={elementRef} />;
  },
);

FitListCompact.displayName = FIT_LIST_COMPACT_NAME;

export const FitList = Object.assign(FitListRoot, {
  Item: FitListItem,
  Expanded: FitListExpanded,
  Compact: FitListCompact,
});
