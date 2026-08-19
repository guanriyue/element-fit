import { observeElementResize } from '@guanriyue/resize-observer-hub';
import { getEntryBorderBoxWidth } from '../../_internal/getEntryBorderBoxWidth.ts';
import { isUndefined } from '../../_internal/isUndefined.ts';
import type {
  OverflowItemData,
  OverflowListAccessoryRecord,
  OverflowListElementId,
  OverflowListItemRecord,
} from './types.ts';

/** 可见元素的 border-box 变化超过该值后才使几何缓存失效。 */
const OVERFLOW_LIST_ELEMENT_RESIZE_EPSILON = 0.5;

type OverflowListElementRegistryOptions = {
  isMeasuring: () => boolean;
  onGeometryInvalidated: () => void;
  onItemRemoved: (id: OverflowListElementId) => void;
};

export type OverflowListElementRegistry = {
  getAccessoryElementRevision: () => number;
  getMountedAccessories: (root: HTMLElement) => readonly OverflowListAccessoryRecord[];
  getOrderedItems: (root: HTMLElement) => readonly OverflowListItemRecord[];
  getRegisteredItems: () => readonly OverflowListItemRecord[];
  registerAccessory: (id: OverflowListElementId) => () => void;
  registerItem: (id: OverflowListElementId, data: OverflowItemData) => () => void;
  setAccessoryElement: (id: OverflowListElementId, element: HTMLElement | null) => void;
  setItemData: (id: OverflowListElementId, data: OverflowItemData) => void;
  setItemElement: (
    id: OverflowListElementId,
    element: HTMLElement | null,
    data: OverflowItemData,
  ) => void;
};

type OverflowListElementRecord = OverflowListItemRecord | OverflowListAccessoryRecord;

/** 管理 Item 与 Accessory 的组件生命周期、DOM 引用和尺寸观察。 */
export const createOverflowListElementRegistry = (
  options: OverflowListElementRegistryOptions,
): OverflowListElementRegistry => {
  const itemRecords = new Map<OverflowListElementId, OverflowListItemRecord>();
  const accessoryRecords = new Map<OverflowListElementId, OverflowListAccessoryRecord>();
  let accessoryElementRevision = 0;

  const stopRecordResize = (record: OverflowListElementRecord) => {
    if (record.unobserveResize) {
      record.unobserveResize();
      record.unobserveResize = undefined;
    }

    record.observedWidth = undefined;
  };

  const observeRecordResize = (record: OverflowListElementRecord, element: HTMLElement) => {
    stopRecordResize(record);
    record.unobserveResize = observeElementResize(
      element,
      (entry) => {
        const width = getEntryBorderBoxWidth(entry);
        const previousWidth = record.observedWidth;

        if (isUndefined(previousWidth) || options.isMeasuring()) {
          record.observedWidth = width;
          return;
        }

        if (
          Math.abs(previousWidth - width)
          <= OVERFLOW_LIST_ELEMENT_RESIZE_EPSILON
        ) {
          return;
        }

        record.observedWidth = width;
        options.onGeometryInvalidated();
      },
      { box: 'border-box' },
    );
  };

  const getRegisteredItems = () => {
    return Array.from(itemRecords.values()).filter((record) => record.componentRegistered);
  };

  const getOrderedItems = (root: HTMLElement) => {
    const registeredItems = getRegisteredItems();

    for (const record of registeredItems) {
      if (!record.element) {
        throw new Error('OverflowList.Item must render a measurable element.');
      }

      if (record.element.parentElement !== root) {
        throw new Error('OverflowList.Item must be a direct child of OverflowList.');
      }
    }

    return registeredItems.sort((left, right) => {
      const leftElement = left.element as HTMLElement;
      const rightElement = right.element as HTMLElement;
      const position = leftElement.compareDocumentPosition(rightElement);

      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }

      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }

      return 0;
    });
  };

  const getMountedAccessories = (root: HTMLElement) => {
    const registeredAccessories = Array.from(accessoryRecords.values()).filter(
      (record) => record.componentRegistered,
    );

    for (const record of registeredAccessories) {
      if (!record.element) {
        throw new Error('OverflowList.Accessory must render a measurable element.');
      }

      if (record.element.parentElement !== root) {
        throw new Error('OverflowList.Accessory must be a direct child of OverflowList.');
      }
    }

    return registeredAccessories;
  };

  const setItemElement = (
    id: OverflowListElementId,
    element: HTMLElement | null,
    data: OverflowItemData,
  ) => {
    let record = itemRecords.get(id);

    if (!record) {
      if (!element) {
        return;
      }

      record = {
        data,
        element: null,
        id,
        observedWidth: undefined,
        componentRegistered: false,
        unobserveResize: undefined,
      };
      itemRecords.set(id, record);
    }

    record.data = data;

    if (record.element === element) {
      return;
    }

    stopRecordResize(record);
    record.element = element;

    if (element) {
      observeRecordResize(record, element);
    } else if (!record.componentRegistered) {
      itemRecords.delete(id);
      options.onItemRemoved(id);
    }

    if (record.componentRegistered && !options.isMeasuring()) {
      options.onGeometryInvalidated();
    }
  };

  const setAccessoryElement = (id: OverflowListElementId, element: HTMLElement | null) => {
    let record = accessoryRecords.get(id);

    if (!record) {
      if (!element) {
        return;
      }

      record = {
        element: null,
        id,
        observedWidth: undefined,
        componentRegistered: false,
        unobserveResize: undefined,
      };
      accessoryRecords.set(id, record);
    }

    if (record.element === element) {
      return;
    }

    stopRecordResize(record);
    record.element = element;
    accessoryElementRevision += 1;

    if (element) {
      observeRecordResize(record, element);
    } else if (!record.componentRegistered) {
      accessoryRecords.delete(id);
    }

    if (record.componentRegistered && !options.isMeasuring()) {
      options.onGeometryInvalidated();
    }
  };

  const registerAccessory = (id: OverflowListElementId) => {
    let record = accessoryRecords.get(id);

    if (record) {
      record.componentRegistered = true;
    } else {
      record = {
        element: null,
        id,
        observedWidth: undefined,
        componentRegistered: true,
        unobserveResize: undefined,
      };
      accessoryRecords.set(id, record);
    }

    if (!options.isMeasuring()) {
      options.onGeometryInvalidated();
    }

    return () => {
      const currentRecord = accessoryRecords.get(id);

      if (!currentRecord) {
        return;
      }

      currentRecord.componentRegistered = false;

      if (!currentRecord.element) {
        stopRecordResize(currentRecord);
        accessoryRecords.delete(id);
      }

      if (!options.isMeasuring()) {
        options.onGeometryInvalidated();
      }
    };
  };

  const registerItem = (id: OverflowListElementId, data: OverflowItemData) => {
    let record = itemRecords.get(id);

    if (record) {
      record.data = data;
      record.componentRegistered = true;
    } else {
      record = {
        data,
        element: null,
        id,
        observedWidth: undefined,
        componentRegistered: true,
        unobserveResize: undefined,
      };
      itemRecords.set(id, record);
    }

    options.onGeometryInvalidated();

    return () => {
      const currentRecord = itemRecords.get(id);

      if (!currentRecord) {
        return;
      }

      currentRecord.componentRegistered = false;

      if (!currentRecord.element) {
        stopRecordResize(currentRecord);
        itemRecords.delete(id);
        options.onItemRemoved(id);
      }

      options.onGeometryInvalidated();
    };
  };

  const setItemData = (id: OverflowListElementId, data: OverflowItemData) => {
    const record = itemRecords.get(id);

    if (!record || record.data === data) {
      return;
    }

    record.data = data;
    options.onGeometryInvalidated();
  };

  return {
    getAccessoryElementRevision: () => accessoryElementRevision,
    getMountedAccessories,
    getOrderedItems,
    getRegisteredItems,
    registerAccessory,
    registerItem,
    setAccessoryElement,
    setItemData,
    setItemElement,
  };
};
