import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ComponentProps, type ComponentType, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type InlineOverflowDebugProps = ComponentProps<typeof InlineOverflow> & {
  __debugDisableRangeFallback?: boolean;
};

const InlineOverflowDebug = InlineOverflow as ComponentType<InlineOverflowDebugProps> &
  typeof InlineOverflow;

const tooltipText =
  'project active element-fit InlineOverflow / long-inline-node-chain.tsx';

const InlineNodesContent = () => {
  return (
    <>
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
    </>
  );
};

const InlineOverflowInlineNodesDemo = () => {
  const [overflow, setOverflow] = useState(false);
  const [overflowWithoutFallback, setOverflowWithoutFallback] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipOpenWithoutFallback, setTooltipOpenWithoutFallback] = useState(false);
  const handleTooltipOpenChange = (nextOpen: boolean) => {
    setTooltipOpen(overflow && nextOpen);
  };
  const handleTooltipOpenWithoutFallbackChange = (nextOpen: boolean) => {
    setTooltipOpenWithoutFallback(overflowWithoutFallback && nextOpen);
  };

  return (
    <DemoBox>
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            多个 inline 节点
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-md border px-2 py-1">
              corrected: {overflow ? 'overflow' : 'fit'}
            </div>
            <div className="rounded-md border px-2 py-1">
              raw: {overflowWithoutFallback ? 'overflow' : 'fit'}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="w-full min-w-0 rounded-md border bg-background p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              启用边界校正
            </div>
            <TooltipProvider>
              <Tooltip
                open={overflow && tooltipOpen}
                onOpenChange={handleTooltipOpenChange}
              >
                <TooltipTrigger asChild>
                  <InlineOverflowDebug
                    className="flex w-full min-w-0 data-overflow:text-primary"
                    onOverflowChange={(nextOverflow) => {
                      setOverflow(nextOverflow);
                      if (!nextOverflow) {
                        setTooltipOpen(false);
                      }
                    }}
                  >
                    <InlineOverflow.Content className="min-w-0 flex-1">
                      <InlineNodesContent />
                    </InlineOverflow.Content>
                  </InlineOverflowDebug>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="w-full min-w-0 rounded-md border bg-background p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              关闭边界校正
            </div>
            <TooltipProvider>
              <Tooltip
                open={overflowWithoutFallback && tooltipOpenWithoutFallback}
                onOpenChange={handleTooltipOpenWithoutFallbackChange}
              >
                <TooltipTrigger asChild>
                  <InlineOverflowDebug
                    __debugDisableRangeFallback
                    className="flex w-full min-w-0 data-overflow:text-primary"
                    onOverflowChange={(nextOverflow) => {
                      setOverflowWithoutFallback(nextOverflow);
                      if (!nextOverflow) {
                        setTooltipOpenWithoutFallback(false);
                      }
                    }}
                  >
                    <InlineOverflow.Content className="min-w-0 flex-1">
                      <InlineNodesContent />
                    </InlineOverflow.Content>
                  </InlineOverflowDebug>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowInlineNodesDemo;
