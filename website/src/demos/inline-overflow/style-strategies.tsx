import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';

const text =
  'element-fit/packages/react-fit/src/InlineOverflow/content-style-is-owned-by-the-app.tsx';

type StrategyExampleProps = {
  contentClassName: string;
  description: string;
  label: string;
};

const StrategyExample = (props: StrategyExampleProps) => {
  const { contentClassName, description, label } = props;
  const [overflow, setOverflow] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <div className="rounded-md border px-2 py-1 text-xs">
          {overflow ? 'overflow' : 'fit'}
        </div>
      </div>

      <InlineOverflow
        className="flex w-72 max-w-full min-w-0 rounded-md border bg-background p-3 data-overflow:border-primary"
        onOverflowChange={setOverflow}
      >
        <InlineOverflow.Content
          className={`min-w-0 flex-1 ${contentClassName}`}
        >
          {text}
        </InlineOverflow.Content>
      </InlineOverflow>
    </div>
  );
};

const InlineOverflowStyleStrategiesDemo = () => {
  return (
    <DemoBox>
      <div className="grid gap-6 p-6 md:grid-cols-2">
        <StrategyExample
          label="Ellipsis"
          description="由调用方设置 hidden 与 text-ellipsis"
          contentClassName="overflow-hidden text-ellipsis whitespace-nowrap"
        />
        <StrategyExample
          label="Clip"
          description="由调用方直接裁剪，不绘制省略号"
          contentClassName="overflow-clip whitespace-nowrap"
        />
      </div>
    </DemoBox>
  );
};

export default InlineOverflowStyleStrategiesDemo;
