import {
  createOverflowListElementRegistry,
} from './elementRegistry.ts';
import {
  createOverflowListMeasurementController,
  type OverflowListMeasurementController,
} from './measurement.ts';
import { createOverflowListStateStore } from './state.ts';
import type { OverflowListStore } from './types.ts';

export type {
  OverflowListAccessoryState,
  OverflowListState,
  OverflowListStore,
} from './types.ts';

/** 组装状态、元素注册与测量调度，形成一个 OverflowList 实例。 */
export const createOverflowListStore = (): OverflowListStore => {
  const stateStore = createOverflowListStateStore();
  let measurementController: OverflowListMeasurementController;
  const elementRegistry = createOverflowListElementRegistry({
    isMeasuring: () => measurementController.isMeasuring(),
    onGeometryInvalidated: () => measurementController.invalidate(),
    onItemRemoved: stateStore.removeItemVisibility,
  });

  measurementController = createOverflowListMeasurementController({
    getAccessoryElementRevision:
      elementRegistry.getAccessoryElementRevision,
    getMountedAccessories: elementRegistry.getMountedAccessories,
    getOrderedItems: elementRegistry.getOrderedItems,
    getRegisteredItems: elementRegistry.getRegisteredItems,
    stateStore,
  });

  return {
    getSnapshot: stateStore.getSnapshot,
    registerAccessory: elementRegistry.registerAccessory,
    registerItem: elementRegistry.registerItem,
    setAccessoryElement: elementRegistry.setAccessoryElement,
    setItemData: elementRegistry.setItemData,
    setItemElement: elementRegistry.setItemElement,
    setRootElement: measurementController.setRootElement,
    subscribe: stateStore.subscribe,
  };
};
