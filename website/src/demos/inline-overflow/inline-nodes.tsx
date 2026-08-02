import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import {
  type ChangeEvent,
  type ComponentProps,
  type ComponentType,
  useState,
} from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BoundaryComparison,
  useBoundaryMetrics,
} from '@/demos/inline-overflow/boundary-observation';

type InlineOverflowDebugProps = ComponentProps<typeof InlineOverflow> & {
  __debugDisableRangeFallback?: boolean;
};

const InlineOverflowDebug =
  InlineOverflow as ComponentType<InlineOverflowDebugProps> &
    typeof InlineOverflow;

const defaultText = 'long-inline-node-chain.tsx';

const InlineNodesContent = (props: { text: string }) => {
  const { text } = props;

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
        <span>{text}</span>
      </span>
    </>
  );
};

const InlineOverflowInlineNodesDemo = () => {
  const [text, setText] = useState(defaultText);
  const [overflow, setOverflow] = useState(false);
  const [overflowWithoutFallback, setOverflowWithoutFallback] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipOpenWithoutFallback, setTooltipOpenWithoutFallback] =
    useState(false);
  const { contentRef, metrics } = useBoundaryMetrics();
  const tooltipText = `project active element-fit InlineOverflow / ${text}`;

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleTooltipOpenChange = (nextOpen: boolean) => {
    setTooltipOpen(overflow && nextOpen);
  };
  const handleTooltipOpenWithoutFallbackChange = (nextOpen: boolean) => {
    setTooltipOpenWithoutFallback(overflowWithoutFallback && nextOpen);
  };

  return (
    <DemoBox defaultWidth={560} minWidth={180} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="inline-overflow-inline-nodes-text">
              末尾文本
            </Label>
            <textarea
              id="inline-overflow-inline-nodes-text"
              aria-describedby="inline-overflow-inline-nodes-text-description"
              value={text}
              onChange={handleTextChange}
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <div
              id="inline-overflow-inline-nodes-text-description"
              className="text-xs text-muted-foreground"
            >
              输入内容会替换最后一个 inline-flex 节点中的文本，其余节点结构保持不变。
            </div>
          </div>
        </DemoBox.Controls>

        <BoundaryComparison
          correctedOverflow={overflow}
          regularOverflow={overflowWithoutFallback}
          metrics={metrics}
        />

        <DemoBox.Preview className="grid min-w-0 gap-3">
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
                    <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      <InlineNodesContent text={text} />
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
                    <InlineOverflow.Content
                      ref={contentRef}
                      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      <InlineNodesContent text={text} />
                    </InlineOverflow.Content>
                  </InlineOverflowDebug>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowInlineNodesDemo;
