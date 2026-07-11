import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const tooltipText =
  'project active element-fit InlineOverflow / long-inline-node-chain.tsx';

const InlineOverflowInlineNodesDemo = () => {
  const [overflow, setOverflow] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const handleTooltipOpenChange = (nextOpen: boolean) => {
    setTooltipOpen(overflow && nextOpen);
  };

  return (
    <DemoBox>
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            多个 inline 节点
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'overflow' : 'fit'}
          </div>
        </div>

        <div className="w-[320px] max-w-full rounded-md border bg-background p-3">
          <TooltipProvider>
            <Tooltip
              open={overflow && tooltipOpen}
              onOpenChange={handleTooltipOpenChange}
            >
              <TooltipTrigger asChild>
                <InlineOverflow
                  className="inline-flex max-w-full min-w-0 align-bottom data-overflow:text-primary"
                  onOverflowChange={(nextOverflow) => {
                    setOverflow(nextOverflow);
                    if (!nextOverflow) {
                      setTooltipOpen(false);
                    }
                  }}
                >
                  <InlineOverflow.Content className="min-w-0 flex-1">
                    <span className="mr-2 inline-block rounded bg-muted px-1.5 py-0.5">
                      project
                    </span>
                    <span className="mr-2 inline-flex items-center gap-1 rounded border px-1.5 py-0.5">
                      <span className="size-1.5 rounded-full bg-primary" />
                      active
                    </span>
                    <span className="mr-2 inline-block">element-fit</span>
                    <span className="mr-2 inline-block">InlineOverflow</span>
                    <span className="inline-flex items-center gap-1">
                      <span>/</span>
                      <span>long-inline-node-chain.tsx</span>
                    </span>
                  </InlineOverflow.Content>
                </InlineOverflow>
              </TooltipTrigger>
              <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowInlineNodesDemo;
