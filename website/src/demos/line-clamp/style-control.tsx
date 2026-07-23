import { LineClamp } from '@guanriyue/react-fit/line-clamp';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { longDescription } from '@/demos/line-clamp/shared';
import { cn } from '@/lib/utils';

const longToken = 'ORDER_FULFILLMENT_RISK_REVIEW_2026_07_23';

const LineClampStyleControlDemo = () => {
  const [breakAll, setBreakAll] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <DemoBox widthControl defaultWidth={520} minWidth={280} maxWidth={760}>
      <div className="w-full min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch
              id="line-clamp-break-all"
              checked={breakAll}
              onCheckedChange={setBreakAll}
            />
            <label htmlFor="line-clamp-break-all">word-break: break-all</label>
          </div>

          <code className="text-xs text-muted-foreground">
            data-state: {expanded ? 'expanded' : 'collapsed'}
          </code>
        </div>

        <div className="w-full min-w-0 rounded-md border bg-background p-4">
          <LineClamp
            lines={3}
            expanded={expanded}
            className={cn(
              'text-sm leading-7 transition-colors',
              'data-[state=collapsed]:text-foreground data-[state=expanded]:text-blue-600 dark:data-[state=expanded]:text-blue-400',
              breakAll && 'break-all',
            )}
            suffix={
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto px-1 py-0 align-baseline"
                onClick={() => {
                  setExpanded((value) => !value);
                }}
              >
                {expanded ? '收起' : '展开'}
              </Button>
            }
          >
            {longDescription} {longToken}
          </LineClamp>
        </div>
      </div>
    </DemoBox>
  );
};

export default LineClampStyleControlDemo;
