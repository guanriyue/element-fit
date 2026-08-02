import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { Input } from '@/components/ui/input';
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
  numberInput?: boolean;
  numberInputSuffix?: ReactNode;
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
  | 'numberInput'
  | 'numberInputSuffix'
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
    numberInput = false,
    numberInputSuffix,
    onValueChange,
    sliderClassName,
    value,
    valueFormatter,
    ...sliderProps
  } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;
  const numberInputId = `${id}-number`;
  const min = sliderProps.min ?? 0;
  const max = sliderProps.max ?? 100;
  const step = sliderProps.step ?? 1;
  const [inputValue, setInputValue] = useState(() => String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleValueChange = (nextValue: number[]) => {
    onValueChange(nextValue[0] ?? value);
  };

  const handleNumberInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextInputValue = event.target.value;
    const nextValue = event.target.valueAsNumber;

    setInputValue(nextInputValue);

    if (Number.isFinite(nextValue) && nextValue >= min && nextValue <= max) {
      onValueChange(nextValue);
    }
  };

  const commitNumberInput = () => {
    const nextValue = Number(inputValue);

    if (!Number.isFinite(nextValue) || inputValue.trim() === '') {
      setInputValue(String(value));
      return;
    }

    const nextValueInRange = Math.min(Math.max(nextValue, min), max);
    setInputValue(String(nextValueInRange));
    onValueChange(nextValueInRange);
  };

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }

    if (event.key === 'Escape') {
      setInputValue(String(value));
    }
  };

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}
    >
      <div
        className={cn(
          'flex min-w-28 items-center justify-between gap-3',
          numberInput && 'min-w-44',
        )}
      >
        <label
          htmlFor={numberInput ? numberInputId : id}
          className="text-sm font-medium text-muted-foreground"
        >
          {label}
        </label>
        {numberInput ? (
          <div className="flex items-center gap-1.5">
            <Input
              id={numberInputId}
              type="number"
              min={min}
              max={max}
              step={step}
              value={inputValue}
              onBlur={commitNumberInput}
              onChange={handleNumberInputChange}
              onKeyDown={handleNumberInputKeyDown}
              className="h-8 w-20 px-2 text-right text-xs tabular-nums"
            />
            {numberInputSuffix ? (
              <span className="text-xs text-muted-foreground">
                {numberInputSuffix}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="rounded-md border px-2 py-1 text-xs tabular-nums text-muted-foreground">
            {valueFormatter ? valueFormatter(value) : value}
          </span>
        )}
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
      numberInput
      numberInputSuffix="px"
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
