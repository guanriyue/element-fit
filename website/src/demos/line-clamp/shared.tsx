import {
  LineClamp,
  type LineClampMeasureStrategy,
} from '@guanriyue/react-fit/line-clamp';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const longDescription =
  '订单履约系统在高峰期需要同时处理库存锁定、支付确认、仓库波次和承运商回传。当前摘要会保留关键风险、下一步动作和负责人信息，方便运营人员在列表中快速判断是否需要展开查看完整记录。';

export const shortDescription = '这是一条较短的备注，通常不会触发多行截断。';

export type LineClampPreviewProps = {
  children: ReactNode;
  className?: string;
  expanded: boolean;
  lines: number;
  measureStrategy?: LineClampMeasureStrategy;
  onOverflowChange?: (overflow: boolean) => void;
  onToggle: () => void;
  rootClassName?: string;
  suffix?: ReactNode;
};

export const ToggleSuffix = (props: {
  children?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const { children, expanded, onToggle } = props;

  return (
    <Button
      type="button"
      variant="link"
      size="xs"
      onClick={onToggle}
      className="h-auto px-1 py-0 align-baseline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {children ?? (expanded ? '收起' : '展开')}
    </Button>
  );
};

export const OverflowBadge = (props: { overflow: boolean }) => {
  const { overflow } = props;

  return (
    <span className="rounded-md border px-2 py-1 text-xs tabular-nums text-muted-foreground">
      overflow: {overflow ? 'true' : 'false'}
    </span>
  );
};

export const LineClampPreview = (props: LineClampPreviewProps) => {
  const {
    children,
    className,
    expanded,
    lines,
    measureStrategy,
    onOverflowChange,
    onToggle,
    rootClassName,
    suffix,
  } = props;

  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-md border bg-background p-4 text-sm leading-7',
        className,
      )}
    >
      <LineClamp
        className={rootClassName}
        expanded={expanded}
        lines={lines}
        measureStrategy={measureStrategy}
        onOverflowChange={onOverflowChange}
        suffix={
          suffix ?? <ToggleSuffix expanded={expanded} onToggle={onToggle} />
        }
      >
        {children}
      </LineClamp>
    </div>
  );
};
