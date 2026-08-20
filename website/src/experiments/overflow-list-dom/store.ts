import { getElementContentBoxWidth } from '../../../../packages/react-fit/src/_internal/getElementContentBoxWidth.ts';
import {
  getElementViewportProximity,
  type ViewportProximity,
} from '../../../../packages/react-fit/src/_internal/getElementViewportProximity.ts';
import { getEntryBorderBoxWidth } from '../../../../packages/react-fit/src/_internal/getEntryBorderBoxWidth.ts';
import { getEntryContentBoxWidth } from '../../../../packages/react-fit/src/_internal/getEntryContentBoxWidth.ts';
import {
  type LayoutTask,
  layoutTaskScheduler,
} from '../../../../packages/react-fit/src/_internal/layoutTaskScheduler.ts';
import { createViewportPriorityTaskScheduler } from '../../../../packages/react-fit/src/_internal/viewportPriorityTaskScheduler.ts';

// biome-ignore lint/suspicious/noExplicitAny: 实验组件透传调用方数据
export type OverflowListDomItemData = any;

type ElementId = unknown;
type Listener = () => void;

type Snapshot = {
  overflow: boolean;
  overflowItemsData: readonly OverflowListDomItemData[];
};

type ItemRecord = {
  componentRegistered: boolean;
  data: OverflowListDomItemData;
  element: HTMLElement | null;
  id: ElementId;
  observedWidth: number | undefined;
  observing: boolean;
};

type AccessoryMeasurementStyle = {
  ariaHidden: string | null;
  pointerEvents: string;
  pointerEventsPriority: string;
  visibility: string;
  visibilityPriority: string;
};

type AccessoryRecord = {
  componentRegistered: boolean;
  element: HTMLElement | null;
  id: ElementId;
  measurementStyle: AccessoryMeasurementStyle | undefined;
  observedWidth: number | undefined;
  observing: boolean;
};

type ElementRecord = ItemRecord | AccessoryRecord;

type Geometry = {
  accessoryWidth: number | undefined;
  fullItemsWidth: number;
  orderedItems: readonly ItemRecord[];
  prefixWidths: readonly number[];
};

type MeasureResult = {
  overflow: boolean;
  visibleCount: number;
};

export type OverflowListDomStore = {
  getSnapshot: () => Snapshot;
  registerAccessory: (id: ElementId) => () => void;
  registerItem: (
    id: ElementId,
    data: OverflowListDomItemData,
  ) => () => void;
  setAccessoryElement: (id: ElementId, element: HTMLElement | null) => void;
  setItemData: (id: ElementId, data: OverflowListDomItemData) => void;
  setItemElement: (
    id: ElementId,
    element: HTMLElement | null,
    data: OverflowListDomItemData,
  ) => void;
  setRootElement: (element: HTMLDivElement | null) => void;
  subscribe: (listener: Listener) => () => void;
};

const ELEMENT_RESIZE_EPSILON = 0.5;
const LAYOUT_EPSILON = 0.5;
const ROOT_RESIZE_EPSILON = 0.5;
const SCROLL_WIDTH_PRECISION_BOUNDARY = 1;
const VIEWPORT_MARGIN_RATIO = 0.5;

const viewportTaskScheduler = createViewportPriorityTaskScheduler({
  farTaskBatchSize: 30,
});

const getRootViewportProximity = (root: HTMLElement): ViewportProximity => {
  return getElementViewportProximity(root, {
    horizontalMargin: window.innerWidth * VIEWPORT_MARGIN_RATIO,
    verticalMargin: window.innerHeight * VIEWPORT_MARGIN_RATIO,
  });
};

const widthFits = (width: number, availableWidth: number) => {
  return width <= availableWidth + LAYOUT_EPSILON;
};

const getVisibleCount = (
  prefixWidths: readonly number[],
  availableWidth: number,
  maximumCount = prefixWidths.length - 1,
) => {
  for (let count = maximumCount; count >= 0; count -= 1) {
    if (widthFits(prefixWidths[count], availableWidth)) {
      return count;
    }
  }

  return 0;
};

const isSameDataList = (
  previous: readonly OverflowListDomItemData[],
  next: readonly OverflowListDomItemData[],
) => {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => value === next[index]);
};

const measureItemGeometry = (
  orderedItems: readonly ItemRecord[],
): Geometry => {
  const prefixWidths = [0];
  let inlineStart = 0;
  let inlineEnd = 0;

  for (const [index, item] of orderedItems.entries()) {
    const element = item.element as HTMLElement;
    const rect = element.getBoundingClientRect();

    item.observedWidth = rect.width;

    if (index === 0) {
      inlineStart = rect.left;
      inlineEnd = rect.right;
    } else {
      inlineStart = Math.min(inlineStart, rect.left);
      inlineEnd = Math.max(inlineEnd, rect.right);
    }

    prefixWidths.push(inlineEnd - inlineStart);
  }

  return {
    accessoryWidth: undefined,
    fullItemsWidth: prefixWidths[prefixWidths.length - 1],
    orderedItems,
    prefixWidths,
  };
};

const measureFittingItemGeometry = (
  orderedItems: readonly ItemRecord[],
): Geometry => {
  const firstItem = orderedItems[0];

  if (!firstItem) {
    return {
      accessoryWidth: undefined,
      fullItemsWidth: 0,
      orderedItems,
      prefixWidths: [0],
    };
  }

  const firstRect = (firstItem.element as HTMLElement).getBoundingClientRect();
  const lastItem = orderedItems[orderedItems.length - 1];
  const lastRect = lastItem === firstItem
    ? firstRect
    : (lastItem.element as HTMLElement).getBoundingClientRect();

  firstItem.observedWidth = firstRect.width;
  lastItem.observedWidth = lastRect.width;

  return {
    accessoryWidth: undefined,
    fullItemsWidth: Math.max(firstRect.right, lastRect.right)
      - Math.min(firstRect.left, lastRect.left),
    orderedItems,
    prefixWidths: [0],
  };
};

const resolveMeasureResult = (
  geometry: Geometry,
  rootWidth: number,
): MeasureResult | undefined => {
  const itemCount = geometry.orderedItems.length;

  if (!itemCount || widthFits(geometry.fullItemsWidth, rootWidth)) {
    return {
      overflow: false,
      visibleCount: itemCount,
    };
  }

  if (typeof geometry.accessoryWidth === 'undefined') {
    return undefined;
  }

  return {
    overflow: true,
    visibleCount: getVisibleCount(
      geometry.prefixWidths,
      rootWidth - geometry.accessoryWidth,
      itemCount - 1,
    ),
  };
};

export const createOverflowListDomStore = (): OverflowListDomStore => {
  const itemRecords = new Map<ElementId, ItemRecord>();
  const accessoryRecords = new Map<ElementId, AccessoryRecord>();
  const elementRecords = new Map<HTMLElement, ElementRecord>();
  const listeners = new Set<Listener>();

  let rootElement: HTMLDivElement | null = null;
  let observedRootWidth: number | undefined;
  let viewportProximity: ViewportProximity = 'near';
  let geometry: Geometry | undefined;
  let committedResult: MeasureResult | undefined;
  let measuring = false;
  let snapshot: Snapshot = {
    overflow: false,
    overflowItemsData: [],
  };

  const setSnapshot = (nextSnapshot: Snapshot) => {
    if (snapshot === nextSnapshot) {
      return;
    }

    snapshot = nextSnapshot;

    for (const listener of listeners) {
      listener();
    }
  };

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? undefined
    : new ResizeObserver((entries) => {
      let elementGeometryChanged = false;

      for (const entry of entries) {
        if (entry.target === rootElement) {
          const width = getEntryContentBoxWidth(entry);

          if (
            typeof observedRootWidth !== 'undefined'
            && Math.abs(observedRootWidth - width) <= ROOT_RESIZE_EPSILON
          ) {
            continue;
          }

          observedRootWidth = width;

          if (rootElement) {
            viewportProximity = getRootViewportProximity(rootElement);
          }

          if (!measuring) {
            scheduleRootResize();
          }

          continue;
        }

        const record = elementRecords.get(entry.target as HTMLElement);

        if (!record) {
          continue;
        }

        const width = getEntryBorderBoxWidth(entry);
        const previousWidth = record.observedWidth;

        if (typeof previousWidth === 'undefined' || measuring) {
          record.observedWidth = width;
          continue;
        }

        if (Math.abs(previousWidth - width) <= ELEMENT_RESIZE_EPSILON) {
          continue;
        }

        record.observedWidth = width;
        elementGeometryChanged = true;
      }

      if (elementGeometryChanged) {
        invalidate();
      }
    });

  const observeRecord = (record: ElementRecord) => {
    if (!resizeObserver || !record.element || record.observing) {
      return;
    }

    resizeObserver.observe(record.element, { box: 'border-box' });
    record.observing = true;
  };

  const unobserveRecord = (record: ElementRecord) => {
    if (!resizeObserver || !record.element || !record.observing) {
      return;
    }

    resizeObserver.unobserve(record.element);
    record.observing = false;
  };

  const restoreAccessoryMeasurementStyle = (record: AccessoryRecord) => {
    const { element, measurementStyle } = record;

    if (!element || !measurementStyle) {
      return;
    }

    if (measurementStyle.visibility) {
      element.style.setProperty(
        'visibility',
        measurementStyle.visibility,
        measurementStyle.visibilityPriority,
      );
    } else {
      element.style.removeProperty('visibility');
    }

    if (measurementStyle.pointerEvents) {
      element.style.setProperty(
        'pointer-events',
        measurementStyle.pointerEvents,
        measurementStyle.pointerEventsPriority,
      );
    } else {
      element.style.removeProperty('pointer-events');
    }

    if (measurementStyle.ariaHidden) {
      element.setAttribute('aria-hidden', measurementStyle.ariaHidden);
    } else {
      element.removeAttribute('aria-hidden');
    }

    element.removeAttribute('data-overflow-list-measuring');
    record.measurementStyle = undefined;
  };

  const showItemForMeasurement = (record: ItemRecord) => {
    unobserveRecord(record);

    if (record.element) {
      record.element.hidden = false;
    }
  };

  const setItemVisible = (record: ItemRecord, visible: boolean) => {
    if (!record.element) {
      return;
    }

    if (visible) {
      record.element.hidden = false;
      observeRecord(record);
    } else {
      unobserveRecord(record);
      record.element.hidden = true;
    }
  };

  const hideAccessory = (record: AccessoryRecord) => {
    unobserveRecord(record);
    restoreAccessoryMeasurementStyle(record);

    if (record.element) {
      record.element.hidden = true;
    }
  };

  const showAccessoryForMeasurement = (record: AccessoryRecord) => {
    const { element } = record;

    if (!element) {
      return;
    }

    unobserveRecord(record);
    restoreAccessoryMeasurementStyle(record);
    record.measurementStyle = {
      ariaHidden: element.getAttribute('aria-hidden'),
      pointerEvents: element.style.getPropertyValue('pointer-events'),
      pointerEventsPriority:
        element.style.getPropertyPriority('pointer-events'),
      visibility: element.style.getPropertyValue('visibility'),
      visibilityPriority: element.style.getPropertyPriority('visibility'),
    };

    element.hidden = false;
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('pointer-events', 'none', 'important');
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('data-overflow-list-measuring', '');
  };

  const showAccessory = (record: AccessoryRecord) => {
    restoreAccessoryMeasurementStyle(record);

    if (!record.element) {
      return;
    }

    record.element.hidden = false;
    observeRecord(record);
  };

  const getRegisteredItems = () => {
    return Array.from(itemRecords.values()).filter(
      (record) => record.componentRegistered,
    );
  };

  const getRegisteredAccessories = () => {
    return Array.from(accessoryRecords.values()).filter(
      (record) => record.componentRegistered,
    );
  };

  const getOrderedItems = (root: HTMLElement) => {
    const records = getRegisteredItems();

    for (const record of records) {
      if (!record.element) {
        throw new Error(
          'OverflowListDom.Item must render a measurable element.',
        );
      }

      if (record.element.parentElement !== root) {
        throw new Error(
          'OverflowListDom.Item must be a direct child of OverflowListDom.',
        );
      }
    }

    return records.sort((left, right) => {
      const position = (left.element as HTMLElement).compareDocumentPosition(
        right.element as HTMLElement,
      );

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
    const records = getRegisteredAccessories();

    for (const record of records) {
      if (!record.element) {
        throw new Error(
          'OverflowListDom.Accessory must render a measurable element.',
        );
      }

      if (record.element.parentElement !== root) {
        throw new Error(
          'OverflowListDom.Accessory must be a direct child of OverflowListDom.',
        );
      }
    }

    return records;
  };

  const measureOccupiedWidth = (
    items: readonly ItemRecord[],
    accessories: readonly AccessoryRecord[],
  ) => {
    const records: ElementRecord[] = [...items, ...accessories];
    const firstRecord = records[0];

    if (!firstRecord) {
      return 0;
    }

    const firstRect = (firstRecord.element as HTMLElement)
      .getBoundingClientRect();

    firstRecord.observedWidth = firstRect.width;

    let inlineStart = firstRect.left;
    let inlineEnd = firstRect.right;

    for (let index = 1; index < records.length; index += 1) {
      const record = records[index];
      const rect = (record.element as HTMLElement).getBoundingClientRect();

      record.observedWidth = rect.width;
      inlineStart = Math.min(inlineStart, rect.left);
      inlineEnd = Math.max(inlineEnd, rect.right);
    }

    return inlineEnd - inlineStart;
  };

  const applyResultToDom = (
    orderedItems: readonly ItemRecord[],
    result: MeasureResult,
    accessoryMode: 'hidden' | 'measuring' | 'visible',
  ) => {
    for (const [index, record] of orderedItems.entries()) {
      setItemVisible(record, index < result.visibleCount);
    }

    for (const record of getRegisteredAccessories()) {
      if (accessoryMode === 'hidden') {
        hideAccessory(record);
      } else if (accessoryMode === 'measuring') {
        showAccessoryForMeasurement(record);
      } else {
        showAccessory(record);
      }
    }
  };

  const publishResult = (
    orderedItems: readonly ItemRecord[],
    result: MeasureResult,
  ) => {
    const nextOverflowItemsData = orderedItems
      .slice(result.visibleCount)
      .map((record) => record.data);
    const overflowItemsData = isSameDataList(
      snapshot.overflowItemsData,
      nextOverflowItemsData,
    )
      ? snapshot.overflowItemsData
      : nextOverflowItemsData;

    if (rootElement) {
      rootElement.toggleAttribute('data-overflow', result.overflow);
    }

    if (
      snapshot.overflow === result.overflow
      && snapshot.overflowItemsData === overflowItemsData
    ) {
      return;
    }

    setSnapshot({
      overflow: result.overflow,
      overflowItemsData,
    });
  };

  const getMeasuredRootWidth = (root: HTMLElement) => {
    if (typeof observedRootWidth !== 'undefined') {
      return observedRootWidth;
    }

    return getElementContentBoxWidth(root);
  };

  const enqueueMeasure = () => {
    layoutTaskScheduler.schedule(measureTask);
  };

  const enqueueResize = () => {
    layoutTaskScheduler.schedule(resizeTask);
  };

  const scheduleMeasure = () => {
    if (!rootElement) {
      return;
    }

    viewportTaskScheduler.schedule(enqueueMeasure, viewportProximity);
  };

  const invalidate = () => {
    viewportTaskScheduler.cancel(enqueueResize);
    layoutTaskScheduler.cancel(resizeTask);
    geometry = undefined;
    committedResult = undefined;
    scheduleMeasure();
  };

  const measureTask: LayoutTask = () => {
    if (!rootElement) {
      return undefined;
    }

    const measuredRoot = rootElement;
    const previousGeometry = geometry;
    const previousResult = committedResult;
    const previousSnapshot = snapshot;

    measuring = true;
    geometry = undefined;
    committedResult = undefined;

    let measuredGeometry: Geometry;
    let measuredResult: MeasureResult;
    let measuredRootWidth = 0;
    let candidateVisibleCount = 0;
    let committed = false;

    const commit = () => {
      geometry = measuredGeometry;
      committedResult = measuredResult;
      committed = true;
    };

    return {
      stages: [
        {
          write: () => {
            for (const record of getRegisteredItems()) {
              showItemForMeasurement(record);
            }

            for (const record of getRegisteredAccessories()) {
              hideAccessory(record);
            }
          },
        },
        {
          read: () => {
            const orderedItems = getOrderedItems(measuredRoot);

            measuredRootWidth = getMeasuredRootWidth(measuredRoot);
            const rootHasDefiniteScrollableOverflow =
              measuredRoot.scrollWidth - measuredRoot.clientWidth
              >= SCROLL_WIDTH_PRECISION_BOUNDARY;

            if (!rootHasDefiniteScrollableOverflow) {
              const fittingGeometry = measureFittingItemGeometry(orderedItems);

              if (widthFits(fittingGeometry.fullItemsWidth, measuredRootWidth)) {
                measuredGeometry = fittingGeometry;
                candidateVisibleCount = orderedItems.length;
                measuredResult = {
                  overflow: false,
                  visibleCount: candidateVisibleCount,
                };
                return;
              }
            }

            measuredGeometry = measureItemGeometry(orderedItems);
            candidateVisibleCount = getVisibleCount(
              measuredGeometry.prefixWidths,
              measuredRootWidth,
            );
            measuredResult = {
              overflow: candidateVisibleCount < orderedItems.length,
              visibleCount: candidateVisibleCount,
            };
          },
          write: () => {
            if (!measuredResult.overflow) {
              applyResultToDom(
                measuredGeometry.orderedItems,
                measuredResult,
                'hidden',
              );
              publishResult(measuredGeometry.orderedItems, measuredResult);
              commit();
              return;
            }

            applyResultToDom(
              measuredGeometry.orderedItems,
              measuredResult,
              'measuring',
            );
          },
        },
        {
          read: () => {
            if (committed) {
              return;
            }

            const accessories = getMountedAccessories(measuredRoot);
            const visibleItems = measuredGeometry.orderedItems.slice(
              0,
              candidateVisibleCount,
            );
            const occupiedWidth = measureOccupiedWidth(
              visibleItems,
              accessories,
            );
            const candidateItemsWidth =
              measuredGeometry.prefixWidths[candidateVisibleCount];

            measuredGeometry.accessoryWidth = Math.max(
              0,
              occupiedWidth - candidateItemsWidth,
            );
            measuredResult = resolveMeasureResult(
              measuredGeometry,
              measuredRootWidth,
            ) as MeasureResult;
          },
          write: () => {
            if (committed) {
              return;
            }

            applyResultToDom(
              measuredGeometry.orderedItems,
              measuredResult,
              'visible',
            );
            publishResult(measuredGeometry.orderedItems, measuredResult);
            commit();
          },
        },
      ],
      cleanup: () => {
        if (!committed) {
          if (previousGeometry && previousResult) {
            applyResultToDom(
              previousGeometry.orderedItems,
              previousResult,
              previousResult.overflow ? 'visible' : 'hidden',
            );
          } else {
            for (const record of getRegisteredItems()) {
              setItemVisible(record, true);
            }

            for (const record of getRegisteredAccessories()) {
              hideAccessory(record);
            }
          }

          if (rootElement) {
            rootElement.toggleAttribute(
              'data-overflow',
              previousSnapshot.overflow,
            );
          }

          setSnapshot(previousSnapshot);
          geometry = previousGeometry;
          committedResult = previousResult;
        }

        measuring = false;
      },
    };
  };

  const resizeTask: LayoutTask = () => {
    if (!rootElement || !geometry) {
      return undefined;
    }

    const currentGeometry = geometry;
    const nextResult = resolveMeasureResult(
      currentGeometry,
      getMeasuredRootWidth(rootElement),
    );

    if (
      !nextResult
      || (
        committedResult
        && committedResult.overflow === nextResult.overflow
        && committedResult.visibleCount === nextResult.visibleCount
      )
    ) {
      return undefined;
    }

    measuring = true;

    return {
      stages: [
        {
          write: () => {
            applyResultToDom(
              currentGeometry.orderedItems,
              nextResult,
              nextResult.overflow ? 'visible' : 'hidden',
            );
            publishResult(currentGeometry.orderedItems, nextResult);
            committedResult = nextResult;
          },
        },
      ],
      cleanup: () => {
        measuring = false;
      },
    };
  };

  const scheduleRootResize = () => {
    if (!geometry || !rootElement) {
      scheduleMeasure();
      return;
    }

    const nextResult = resolveMeasureResult(
      geometry,
      getMeasuredRootWidth(rootElement),
    );

    if (!nextResult) {
      scheduleMeasure();
      return;
    }

    viewportTaskScheduler.schedule(enqueueResize, viewportProximity);
  };

  const cancelTasks = () => {
    viewportTaskScheduler.cancel(enqueueMeasure);
    viewportTaskScheduler.cancel(enqueueResize);
    layoutTaskScheduler.cancel(measureTask);
    layoutTaskScheduler.cancel(resizeTask);
  };

  return {
    getSnapshot: () => snapshot,
    registerAccessory: (id) => {
      let record = accessoryRecords.get(id);

      if (record) {
        record.componentRegistered = true;
      } else {
        record = {
          componentRegistered: true,
          element: null,
          id,
          measurementStyle: undefined,
          observedWidth: undefined,
          observing: false,
        };
        accessoryRecords.set(id, record);
      }

      if (!measuring) {
        invalidate();
      }

      return () => {
        const currentRecord = accessoryRecords.get(id);

        if (!currentRecord) {
          return;
        }

        currentRecord.componentRegistered = false;

        if (!currentRecord.element) {
          accessoryRecords.delete(id);
        }

        if (!measuring) {
          invalidate();
        }
      };
    },
    registerItem: (id, data) => {
      let record = itemRecords.get(id);

      if (record) {
        record.componentRegistered = true;
        record.data = data;
      } else {
        record = {
          componentRegistered: true,
          data,
          element: null,
          id,
          observedWidth: undefined,
          observing: false,
        };
        itemRecords.set(id, record);
      }

      if (!measuring) {
        invalidate();
      }

      return () => {
        const currentRecord = itemRecords.get(id);

        if (!currentRecord) {
          return;
        }

        currentRecord.componentRegistered = false;

        if (!currentRecord.element) {
          itemRecords.delete(id);
        }

        if (!measuring) {
          invalidate();
        }
      };
    },
    setAccessoryElement: (id, element) => {
      let record = accessoryRecords.get(id);

      if (!record) {
        if (!element) {
          return;
        }

        record = {
          componentRegistered: false,
          element: null,
          id,
          measurementStyle: undefined,
          observedWidth: undefined,
          observing: false,
        };
        accessoryRecords.set(id, record);
      }

      if (record.element === element) {
        return;
      }

      if (record.element) {
        unobserveRecord(record);
        restoreAccessoryMeasurementStyle(record);
        elementRecords.delete(record.element);
      }

      record.element = element;
      record.observedWidth = undefined;
      record.observing = false;

      if (element) {
        elementRecords.set(element, record);
        hideAccessory(record);
      } else if (!record.componentRegistered) {
        accessoryRecords.delete(id);
      }

      if (record.componentRegistered && !measuring) {
        invalidate();
      }
    },
    setItemData: (id, data) => {
      const record = itemRecords.get(id);

      if (!record || record.data === data) {
        return;
      }

      record.data = data;

      if (!measuring) {
        invalidate();
      }
    },
    setItemElement: (id, element, data) => {
      let record = itemRecords.get(id);

      if (!record) {
        if (!element) {
          return;
        }

        record = {
          componentRegistered: false,
          data,
          element: null,
          id,
          observedWidth: undefined,
          observing: false,
        };
        itemRecords.set(id, record);
      }

      record.data = data;

      if (record.element === element) {
        return;
      }

      if (record.element) {
        unobserveRecord(record);
        elementRecords.delete(record.element);
      }

      record.element = element;
      record.observedWidth = undefined;
      record.observing = false;

      if (element) {
        element.hidden = false;
        elementRecords.set(element, record);
      } else if (!record.componentRegistered) {
        itemRecords.delete(id);
      }

      if (record.componentRegistered && !measuring) {
        invalidate();
      }
    },
    setRootElement: (element) => {
      if (rootElement === element) {
        return;
      }

      cancelTasks();

      if (resizeObserver && rootElement) {
        resizeObserver.unobserve(rootElement);
      }

      rootElement = element;
      observedRootWidth = undefined;
      viewportProximity = 'near';
      geometry = undefined;
      committedResult = undefined;

      if (!rootElement) {
        return;
      }

      viewportProximity = getRootViewportProximity(rootElement);

      if (resizeObserver) {
        resizeObserver.observe(rootElement, { box: 'content-box' });
      }

      invalidate();
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
