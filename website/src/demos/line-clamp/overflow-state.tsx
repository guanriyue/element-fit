import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import {
  LineClampPreview,
  longDescription,
  OverflowBadge,
  shortDescription,
} from '@/demos/line-clamp/shared';

const LineClampOverflowStateDemo = () => {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [text, setText] = useState(longDescription);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handlePresetToggle = () => {
    setText((value) => {
      return value === longDescription ? shortDescription : longDescription;
    });
    setExpanded(false);
  };

  return (
    <DemoBox widthControl defaultWidth={460} minWidth={260} maxWidth={720}>
      <div className="w-full min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OverflowBadge overflow={overflow} />

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handlePresetToggle}
          >
            {text === longDescription ? '切换短文本' : '切换长文本'}
          </Button>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="line-clamp-overflow-text" className="text-sm font-medium">
            示例文本
          </label>
          <textarea
            id="line-clamp-overflow-text"
            value={text}
            onChange={handleTextChange}
            className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <LineClampPreview
          expanded={expanded}
          lines={2}
          onOverflowChange={setOverflow}
          onToggle={() => {
            setExpanded((value) => !value);
          }}
        >
          {text}
        </LineClampPreview>
      </div>
    </DemoBox>
  );
};

export default LineClampOverflowStateDemo;
