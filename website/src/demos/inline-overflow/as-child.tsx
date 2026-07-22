import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';

const label =
  'element-fit / packages / react-fit / src / InlineOverflow / as-child-layout-demo.tsx';

const InlineOverflowAsChildDemo = () => {
  const [overflow, setOverflow] = useState(false);

  return (
    <DemoBox>
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            asChild
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'overflow' : 'fit'}
          </div>
        </div>

        <InlineOverflow
          asChild
          onOverflowChange={(nextOverflow) => {
            setOverflow(nextOverflow);
          }}
        >
          <div className="flex w-[360px] max-w-full min-w-0 items-center rounded-md border bg-background p-3 data-overflow:text-primary">
            <InlineOverflow.Content asChild>
              <a
                href="#as-child"
                className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm underline-offset-4 hover:underline"
              >
                {label}
              </a>
            </InlineOverflow.Content>

            <InlineOverflow.Accessory asChild>
              <Button
                type="button"
                variant="link"
                size="xs"
                className="ml-2 flex-none px-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                More
              </Button>
            </InlineOverflow.Accessory>
          </div>
        </InlineOverflow>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowAsChildDemo;
