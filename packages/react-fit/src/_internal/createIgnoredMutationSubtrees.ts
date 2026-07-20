export type IgnoredMutationSubtrees = {
  /**
   * 将节点及其 subtree 标记为可忽略的 mutation 来源。
   *
   * 标记会保留到节点被垃圾回收，以便节点移除后延迟送达的 mutation
   * record 仍然可以被识别。
   */
  mark: (root: Node) => void;

  /**
   * 判断单条 mutation 是否完全来自已标记的 subtree。
   */
  isIgnored: (record: MutationRecord) => boolean;

  /**
   * 判断一批 mutation 中是否存在未被忽略的变化。
   */
  hasRelevantMutation: (records: readonly MutationRecord[]) => boolean;
};

/**
 * 创建一个使用 WeakSet 记录内部 DOM subtree 的 mutation 过滤器。
 */
export const createIgnoredMutationSubtrees = (): IgnoredMutationSubtrees => {
  const ignoredRoots = new WeakSet<Node>();

  const isWithinIgnoredSubtree = (node: Node): boolean => {
    let currentNode: Node | null = node;

    while (currentNode !== null) {
      if (ignoredRoots.has(currentNode)) {
        return true;
      }

      currentNode = currentNode.parentNode;
    }

    return false;
  };

  const isIgnored = (record: MutationRecord): boolean => {
    if (isWithinIgnoredSubtree(record.target)) {
      return true;
    }

    if (record.type !== 'childList') {
      return false;
    }

    const changedNodes = [
      ...Array.from(record.addedNodes),
      ...Array.from(record.removedNodes),
    ];

    return changedNodes.length > 0 && changedNodes.every(isWithinIgnoredSubtree);
  };

  return {
    mark: (root) => {
      ignoredRoots.add(root);
    },
    isIgnored,
    hasRelevantMutation: (records) => {
      return records.some((record) => !isIgnored(record));
    },
  };
};
