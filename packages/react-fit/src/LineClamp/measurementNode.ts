// MutationObserver callbacks run after the synchronous clone measurement has
// already removed its temporary node. A WeakSet marker survives until queued
// records are delivered, unlike a boolean paused only during measurement.
const measurementNodes = new WeakSet<Node>();

export const markLineClampMeasurementNode = (node: Node) => {
  measurementNodes.add(node);
};

const isWithinMeasurementNode = (node: Node): boolean => {
  let currentNode: Node | null = node;

  while (currentNode !== null) {
    if (measurementNodes.has(currentNode)) {
      return true;
    }

    currentNode = currentNode.parentNode;
  }

  return false;
};

export const isLineClampMeasurementMutation = (
  record: MutationRecord,
): boolean => {
  if (isWithinMeasurementNode(record.target)) {
    return true;
  }

  if (record.type !== 'childList') {
    return false;
  }

  const changedNodes = [
    ...Array.from(record.addedNodes),
    ...Array.from(record.removedNodes),
  ];

  if (changedNodes.length === 0) {
    return false;
  }

  return changedNodes.every(isWithinMeasurementNode);
};
