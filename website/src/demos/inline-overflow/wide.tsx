import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';

const defaultText =
  'element-fit/packages/react-fit/src/InlineOverflow/very-long-file-name-for-observation.tsx';

const InlineOverflowWideDemo = () => {
  const [text, setText] = useState(defaultText);
  const [overflow, setOverflow] = useState(false);
  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <DemoBox>
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            宽容器
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'overflow' : 'fit'}
          </div>
        </div>

        <div className="rounded-md border bg-background p-3">
          <InlineOverflow
            className="inline-flex max-w-full min-w-0 align-bottom data-overflow:text-primary"
            onOverflowChange={(nextOverflow) => {
              setOverflow(nextOverflow);
            }}
          >
            <InlineOverflow.Content className="min-w-0 flex-1">
              {text}
            </InlineOverflow.Content>
          </InlineOverflow>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inline-overflow-wide-text"
            className="text-sm font-medium"
          >
            示例文本
          </label>
          <textarea
            id="inline-overflow-wide-text"
            aria-describedby="inline-overflow-wide-text-description"
            value={text}
            onChange={handleTextChange}
            className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <div
            id="inline-overflow-wide-text-description"
            className="text-xs text-muted-foreground"
          >
            修改文本长度，观察宽容器中内容是否进入 overflow 状态。
          </div>
        </div>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowWideDemo;
