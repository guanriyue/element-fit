import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const defaultText =
  'element-fit / packages / react-fit / src / InlineOverflow / as-child-layout-demo.tsx';

const InlineOverflowAsChildDemo = () => {
  const [text, setText] = useState(defaultText);
  const [overflow, setOverflow] = useState(false);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <DemoBox defaultWidth={360} minWidth={180} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="inline-overflow-as-child-text">示例文本</Label>
            <textarea
              id="inline-overflow-as-child-text"
              value={text}
              onChange={handleTextChange}
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </DemoBox.Controls>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            asChild
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'overflow' : 'fit'}
          </div>
        </div>

        <DemoBox.Preview>
          <InlineOverflow asChild onOverflowChange={setOverflow}>
            <div className="flex w-full min-w-0 items-center rounded-md border bg-background p-3 data-overflow:text-primary">
              <InlineOverflow.Content asChild>
                <a
                  href="#as-child"
                  className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm underline-offset-4 hover:underline"
                >
                  {text}
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
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowAsChildDemo;
