import { EllipsisIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OverflowListDom } from '@/experiments/overflow-list-dom';
import {
  getStressWidthClassName,
  stressInstances,
  StressWidthSwitches,
  useStressWidth,
} from '@/stress-tests/shared';

const OVERFLOW_LIST_INSTANCE_COUNTS = [
  10,
  20,
  30,
  50,
  100,
  200,
  300,
  500,
] as const;

type OverflowListInstanceCount =
  (typeof OVERFLOW_LIST_INSTANCE_COUNTS)[number];

type Action = {
  id: string;
  longLabel: string;
  shortLabel: string;
};

const actions: readonly Action[] = [
  { id: 'view', shortLabel: '查看', longLabel: '查看订单详情' },
  { id: 'edit', shortLabel: '编辑', longLabel: '编辑订单资料' },
  { id: 'copy', shortLabel: '复制', longLabel: '复制订单链接' },
  { id: 'share', shortLabel: '分享', longLabel: '分享给团队成员' },
  { id: 'archive', shortLabel: '归档', longLabel: '归档当前订单' },
  { id: 'delete', shortLabel: '删除', longLabel: '永久删除订单' },
];

type OverflowListDomStressListProps = {
  actionCount: number;
  detailed: boolean;
  instanceCount: OverflowListInstanceCount;
};

type InstanceCountSelectProps = {
  onValueChange: (value: OverflowListInstanceCount) => void;
  value: OverflowListInstanceCount;
};

const InstanceCountSelect = (props: InstanceCountSelectProps) => {
  const { onValueChange, value } = props;

  const handleValueChange = (nextValue: string) => {
    const nextCount = Number(nextValue);

    if (
      OVERFLOW_LIST_INSTANCE_COUNTS.some((count) => count === nextCount)
    ) {
      onValueChange(nextCount as OverflowListInstanceCount);
    }
  };

  return (
    <div className="mr-2 flex items-center gap-2">
      <label
        htmlFor="overflow-list-dom-instance-count"
        className="text-sm text-muted-foreground"
      >
        实例数
      </label>
      <Select value={String(value)} onValueChange={handleValueChange}>
        <SelectTrigger
          id="overflow-list-dom-instance-count"
          size="sm"
          className="w-24"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {OVERFLOW_LIST_INSTANCE_COUNTS.map((count) => (
            <SelectItem key={count} value={String(count)}>
              {count}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const OverflowListDomStressList = memo(
  (props: OverflowListDomStressListProps) => {
    const { actionCount, detailed, instanceCount } = props;
    const renderedActions = actions.slice(0, actionCount);

    return (
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {stressInstances.slice(0, instanceCount).map((index) => (
          <div key={index} className="min-w-0 bg-background px-3 py-2">
            <div className="mb-1 text-xs text-muted-foreground">
              订单 #{String(index + 1).padStart(3, '0')}
            </div>

            <OverflowListDom className="flex min-w-0 items-center gap-1">
              {renderedActions.map((action) => (
                <OverflowListDom.Item key={action.id} data={action}>
                  <button
                    type="button"
                    className="inline-flex h-7 shrink-0 items-center rounded-sm border bg-background px-2 text-xs whitespace-nowrap"
                  >
                    {detailed ? action.longLabel : action.shortLabel}
                  </button>
                </OverflowListDom.Item>
              ))}

              <OverflowListDom.Overflow<Action>>
                {({ overflowItems }) => (
                  <OverflowListDom.Accessory>
                    <button
                      type="button"
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm border bg-background"
                      aria-label={`更多操作，共 ${overflowItems.length} 项`}
                      title={`更多操作，共 ${overflowItems.length} 项`}
                    >
                      <EllipsisIcon className="size-4" />
                    </button>
                  </OverflowListDom.Accessory>
                )}
              </OverflowListDom.Overflow>
            </OverflowListDom>
          </div>
        ))}
      </div>
    );
  },
);

OverflowListDomStressList.displayName = 'OverflowListDomStressList';

export const OverflowListDomStressTest = () => {
  const [instanceCount, setInstanceCount] =
    useState<OverflowListInstanceCount>(300);
  const [detailed, setDetailed] = useState(true);
  const [actionCount, setActionCount] = useState(actions.length);
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleLabelsToggle = () => {
    setDetailed((current) => !current);
  };

  const handleActionCountToggle = () => {
    setActionCount((current) =>
      current === actions.length ? 4 : actions.length,
    );
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <InstanceCountSelect
          value={instanceCount}
          onValueChange={setInstanceCount}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLabelsToggle}
        >
          {detailed ? '切换为短标签' : '切换为长标签'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleActionCountToggle}
        >
          {actionCount === actions.length ? '减少操作项' : '增加操作项'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={autoResize}
          onClick={toggleNarrow}
        >
          {narrow ? '切换为宽容器' : '切换为窄容器'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemount}
        >
          重新挂载
        </Button>

        <StressWidthSwitches
          idPrefix="overflow-list-dom"
          autoResize={autoResize}
          widthAnimation={widthAnimation}
          onAutoResizeChange={setAutoResize}
          onWidthAnimationChange={setWidthAnimation}
        />
      </div>

      <div
        className={getStressWidthClassName(widthAnimation)}
        style={{ width: narrow ? '62%' : '100%' }}
      >
        <OverflowListDomStressList
          key={mountRevision}
          actionCount={actionCount}
          detailed={detailed}
          instanceCount={instanceCount}
        />
      </div>
    </div>
  );
};
