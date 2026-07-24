import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';
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

export type DemoBoxWidthSliderProps = Omit<
  DemoBoxSliderProps,
  | 'label'
  | 'max'
  | 'min'
  | 'onValueChange'
  | 'step'
  | 'value'
  | 'valueFormatter'
> & {
  label?: ReactNode;
};

type DemoBoxContextValue = {
  maxWidth: number;
  minWidth: number;
  setWidth: (width: number) => void;
  width: number;
  widthLabel: string;
  widthStep: number;
};

const DemoBoxContext = createContext<DemoBoxContextValue | null>(null);

const useDemoBoxContext = () => {
  const context = useContext(DemoBoxContext);

  if (context === null) {
    throw new Error('DemoBox compound components must be used inside DemoBox.');
  }

  return context;
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
    <div
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}
    >
      <div className="flex min-w-28 items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-sm font-medium text-muted-foreground"
        >
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

const DemoBoxWidthSlider = (props: DemoBoxWidthSliderProps) => {
  const { label, ...sliderProps } = props;
  const { maxWidth, minWidth, setWidth, width, widthLabel, widthStep } =
    useDemoBoxContext();

  return (
    <DemoBoxSlider
      {...sliderProps}
      label={label ?? widthLabel}
      min={minWidth}
      max={maxWidth}
      step={widthStep}
      value={width}
      onValueChange={setWidth}
      valueFormatter={(value) => `${value}px`}
    />
  );
};

const DemoBoxControls = (props: ComponentPropsWithoutRef<'div'>) => {
  const { className, ...controlsProps } = props;

  return (
    <div
      {...controlsProps}
      className={cn('space-y-4 border-b pb-5', className)}
    />
  );
};

const DemoBoxPreview = (props: ComponentPropsWithoutRef<'div'>) => {
  const { className, style, ...previewProps } = props;
  const { width } = useDemoBoxContext();

  return (
    <div
      {...previewProps}
      className={cn('max-w-full', className)}
      style={{ ...style, width }}
    />
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
  const contextValue = useMemo<DemoBoxContextValue>(() => {
    return {
      maxWidth: resolvedMaxWidth,
      minWidth: resolvedMinWidth,
      setWidth,
      width,
      widthLabel,
      widthStep,
    };
  }, [resolvedMaxWidth, resolvedMinWidth, width, widthLabel, widthStep]);

  if (!widthControl) {
    return (
      <DemoBoxContext.Provider value={contextValue}>
        <div {...rootProps} className={className}>
          {children}
        </div>
      </DemoBoxContext.Provider>
    );
  }

  return (
    <DemoBoxContext.Provider value={contextValue}>
      <div {...rootProps} className={className}>
        <div className="space-y-4 p-6">
          <DemoBoxWidthSlider />

          <div className={cn('max-w-full', contentClassName)} style={{ width }}>
            {children}
          </div>
        </div>
      </div>
    </DemoBoxContext.Provider>
  );
};

export const DemoBox = Object.assign(DemoBoxRoot, {
  Controls: DemoBoxControls,
  Preview: DemoBoxPreview,
  Slider: DemoBoxSlider,
  WidthSlider: DemoBoxWidthSlider,
});
