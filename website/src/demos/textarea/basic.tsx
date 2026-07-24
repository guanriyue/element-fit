import { Textarea } from '@guanriyue/react-fit/textarea';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';

const initialText = '输入更多内容，观察 textarea 随换行自动调整高度。\n缩窄容器也会触发重新测量。';

type AutoSizeMode = 'off' | 'unbounded' | 'bounded';
type OverflowYMode = 'auto' | 'hidden' | 'clip' | 'scroll';

const autoSizeModes: Array<{
  label: string;
  value: AutoSizeMode;
}> = [
  {
    label: '关闭',
    value: 'off',
  },
  {
    label: '不限行数',
    value: 'unbounded',
  },
  {
    label: '限制行数',
    value: 'bounded',
  },
];

const overflowYModes: Array<{
  label: string;
  value: OverflowYMode;
}> = [
  { label: 'auto', value: 'auto' },
  { label: 'hidden', value: 'hidden' },
  { label: 'clip', value: 'clip' },
  { label: 'scroll', value: 'scroll' },
];

const textareaClassName =
  'w-full resize-none rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

const TextareaBasicDemo = () => {
  const [text, setText] = useState(initialText);
  const [autoSizeMode, setAutoSizeMode] = useState<AutoSizeMode>('bounded');
  const [overflowY, setOverflowY] = useState<OverflowYMode>('auto');
  const [rows, setRows] = useState(3);
  const [minRows, setMinRows] = useState(2);
  const [maxRows, setMaxRows] = useState(5);

  const autoSize = autoSizeMode === 'off'
    ? false
    : autoSizeMode === 'unbounded'
      ? true
      : {
          minRows,
          maxRows,
        };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleMinRowsChange = (nextMinRows: number) => {
    setMinRows(nextMinRows);

    if (maxRows < nextMinRows) {
      setMaxRows(nextMinRows);
    }
  };

  return (
    <DemoBox widthControl defaultWidth={520} minWidth={260} maxWidth={720}>
      <div className="w-full min-w-0 space-y-4">
        <div className="space-y-4 border-b pb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="min-w-28 text-sm font-medium text-muted-foreground">
              autoSize
            </span>
            {/** biome-ignore lint/a11y/useSemanticElements: 不使用 fieldset */}
            <div
              role="group"
              aria-label="autoSize 模式"
              className="inline-flex flex-wrap rounded-md border bg-background p-1"
            >
              {autoSizeModes.map((mode) => {
                const active = autoSizeMode === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    aria-pressed={active}
                    className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => {
                      setAutoSizeMode(mode.value);
                    }}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="min-w-28 text-sm font-medium text-muted-foreground">
              overflow-y
            </span>
            {/** biome-ignore lint/a11y/useSemanticElements: 不使用 fieldset */}
            <div
              role="group"
              aria-label="overflow-y 模式"
              className="inline-flex flex-wrap rounded-md border bg-background p-1"
            >
              {overflowYModes.map((mode) => {
                const active = overflowY === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    aria-pressed={active}
                    className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => {
                      setOverflowY(mode.value);
                    }}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <DemoBox.Slider
            label="rows"
            min={1}
            max={8}
            step={1}
            value={rows}
            onValueChange={setRows}
            sliderClassName="w-56"
          />

          <div className={autoSizeMode === 'bounded' ? undefined : 'opacity-45'}>
            <DemoBox.Slider
              label="minRows"
              min={1}
              max={8}
              step={1}
              value={minRows}
              onValueChange={handleMinRowsChange}
              sliderClassName="w-56"
              disabled={autoSizeMode !== 'bounded'}
            />
          </div>

          <div className={autoSizeMode === 'bounded' ? undefined : 'opacity-45'}>
            <DemoBox.Slider
              label="maxRows"
              min={minRows}
              max={10}
              step={1}
              value={maxRows}
              onValueChange={setMaxRows}
              sliderClassName="w-56"
              disabled={autoSizeMode !== 'bounded'}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="textarea-autosize-preview" className="text-sm font-medium">
            内容
          </label>
          <Textarea
            id="textarea-autosize-preview"
            autoSize={autoSize}
            rows={rows}
            value={text}
            onChange={handleChange}
            className={textareaClassName}
            style={{ overflowY }}
          />
        </div>
      </div>
    </DemoBox>
  );
};

export default TextareaBasicDemo;
