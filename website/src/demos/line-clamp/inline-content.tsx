import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LineClampPreview } from '@/demos/line-clamp/shared';

const LineClampInlineContentDemo = () => {
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState(3);
  const [showBreak, setShowBreak] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [showInlineBlock, setShowInlineBlock] = useState(true);

  return (
    <DemoBox defaultWidth={500} minWidth={200} maxWidth={760} widthStep={1}>
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

          <div className="flex flex-wrap gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="line-clamp-inline-break"
                checked={showBreak}
                onCheckedChange={setShowBreak}
              />
              <Label htmlFor="line-clamp-inline-break">BR 换行</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="line-clamp-inline-code"
                checked={showCode}
                onCheckedChange={setShowCode}
              />
              <Label htmlFor="line-clamp-inline-code">inline code</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="line-clamp-inline-block"
                checked={showInlineBlock}
                onCheckedChange={setShowInlineBlock}
              />
              <Label htmlFor="line-clamp-inline-block">inline-block</Label>
            </div>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview>
          <LineClampPreview
            expanded={expanded}
            lines={lines}
            onToggle={() => {
              setExpanded((value) => !value);
            }}
          >
            普通文本可以和
            <strong className="mx-1 font-semibold text-foreground">
              强调内容
            </strong>
            、
            <a
              href="#line-clamp-inline-content"
              className="mx-1 text-blue-600 underline-offset-4 hover:underline"
            >
              链接
            </a>
            {showCode ? (
              <>
                、
                <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
                  inline code
                </code>
              </>
            ) : null}
            {showInlineBlock ? (
              <>
                以及
                <span className="mx-1 inline-block whitespace-nowrap rounded-md border px-2 text-xs font-medium">
                  inline-block 标签
                </span>
              </>
            ) : null}
            一起参与排版。
            {showBreak ? <br /> : ' '}
            第二段用于观察 hard line break 与后续内容继续增长时的截断位置。
          </LineClampPreview>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default LineClampInlineContentDemo;
