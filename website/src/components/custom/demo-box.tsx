import { type ComponentPropsWithoutRef, type ReactNode, useId, useState } from 'react';
import { Slider as UiSlider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export type DemoBoxProps = ComponentPropsWithoutRef<'div'> & {
  contentClassName?: string;
  defaultWidth?: number;
  maxWidth?: number;
  minWidth?: number;
  widthControl?: boolean;
  widthLabel?: string;
  widthStep?: number;
};

export type DemoBoxSliderProps = Omit<
  ComponentPropsWithoutRef<typeof UiSlider>,
  'onValueChange' | 'value'
> & {
  label: ReactNode;
  onValueChange: (value: number) => void;
  sliderClassName?: string;
  value: number;
  valueFormatter?: (value: number) => ReactNode;
};

const clampWidth = (width: number, minWidth: number, maxWidth: number) => {
  return Math.min(Math.max(width, minWidth), maxWidth);
};

const DemoBoxSlider = (props: DemoBoxSliderProps) => {
  const {
    className,
    id: propId,
    label,
    onValueChange,
    sliderClassName,
    value,
    valueFormatter,
    ...sliderProps
  } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;

  const handleValueChange = (nextValue: number[]) => {
    onValueChange(nextValue[0] ?? value);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-28 items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <span className="rounded-md border px-2 py-1 text-xs tabular-nums text-muted-foreground">
          {valueFormatter ? valueFormatter(value) : value}
        </span>
      </div>

      <UiSlider
        id={id}
        value={[value]}
        onValueChange={handleValueChange}
        className={cn('w-64 max-w-full', sliderClassName)}
        {...sliderProps}
      />
    </div>
  );
};

const DemoBoxRoot = (props: DemoBoxProps) => {
  const {
    children,
    className,
    contentClassName,
    defaultWidth = 560,
    maxWidth = 760,
    minWidth = 260,
    widthControl = false,
    widthLabel = '宽度',
    widthStep = 10,
    ...rootProps
  } = props;
  const resolvedMinWidth = Math.min(minWidth, maxWidth);
  const resolvedMaxWidth = Math.max(minWidth, maxWidth);
  const [width, setWidth] = useState(() => {
    return clampWidth(defaultWidth, resolvedMinWidth, resolvedMaxWidth);
  });

  if (!widthControl) {
    return (
      <div {...rootProps} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div {...rootProps} className={className}>
      <div className="space-y-4 p-6">
        <DemoBoxSlider
          label={widthLabel}
          min={resolvedMinWidth}
          max={resolvedMaxWidth}
          step={widthStep}
          value={width}
          onValueChange={setWidth}
          valueFormatter={(value) => `${value}px`}
        />

        <div className={cn('max-w-full', contentClassName)} style={{ width }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const DemoBox = Object.assign(DemoBoxRoot, {
  Slider: DemoBoxSlider,
});
