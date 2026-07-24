import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  LineClampPreview,
  longDescription,
  OverflowBadge,
} from '@/demos/line-clamp/shared';
import { cn } from '@/lib/utils';

type StylePreviewProps = {
  breakAll: boolean;
  expanded: boolean;
  label: string;
  lines: number;
  onToggle: () => void;
};

const longToken = 'ORDER_FULFILLMENT_RISK_REVIEW_2026_07_23';

const StylePreview = (props: StylePreviewProps) => {
  const { breakAll, expanded, label, lines, onToggle } = props;
  const [overflow, setOverflow] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <OverflowBadge overflow={overflow} />
      </div>

      <LineClampPreview
        expanded={expanded}
        lines={lines}
        onOverflowChange={setOverflow}
        onToggle={onToggle}
        rootClassName={cn(
          'transition-colors data-[state=collapsed]:text-foreground data-[state=expanded]:text-blue-600 dark:data-[state=expanded]:text-blue-400',
          breakAll ? 'break-all' : 'break-normal',
        )}
      >
        {longDescription} {longToken}
      </LineClampPreview>
    </div>
  );
};

const LineClampStyleControlDemo = () => {
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState(3);

  const handleToggle = () => {
    setExpanded((value) => !value);
  };

  return (
    <DemoBox defaultWidth={520} minWidth={200} maxWidth={760} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider sliderClassName="w-56" />
            <DemoBox.Slider
              label="行数"
              min={1}
              max={6}
              step={1}
              value={lines}
              onValueChange={setLines}
              sliderClassName="w-56"
            />
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Switch
              id="line-clamp-style-expanded"
              checked={expanded}
              onCheckedChange={setExpanded}
            />
            <Label htmlFor="line-clamp-style-expanded">expanded</Label>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview className="space-y-4">
          <StylePreview
            label="word-break: normal"
            breakAll={false}
            expanded={expanded}
            lines={lines}
            onToggle={handleToggle}
          />
          <StylePreview
            label="word-break: break-all"
            breakAll
            expanded={expanded}
            lines={lines}
            onToggle={handleToggle}
          />
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default LineClampStyleControlDemo;
