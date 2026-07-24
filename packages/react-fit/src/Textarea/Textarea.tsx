import { useComposedRefs } from '@radix-ui/react-compose-refs';
import {
  forwardRef,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { isPositiveInteger } from '../_internal/isPositiveInteger.ts';
import { createTextareaStore } from './store.ts';

export type TextareaAutoSizeOptions = {
  minRows?: number;
  maxRows?: number;
};

export interface TextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  autoSize?: boolean | TextareaAutoSizeOptions;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, forwardedRef) => {
    const {
      autoSize,
      className,
      cols,
      defaultValue,
      dir,
      lang,
      onChange,
      placeholder,
      rows,
      style,
      value,
      wrap,
      ...textareaProps
    } = props;
    const autoSizeIsObject = typeof autoSize === 'object'
      && autoSize !== null;
    const autoSizeEnabled = autoSize === true || autoSizeIsObject;
    const minRowsValue = autoSizeIsObject ? autoSize.minRows : undefined;
    const maxRowsValue = autoSizeIsObject ? autoSize.maxRows : undefined;
    const minRowsIsValid = isPositiveInteger(minRowsValue);
    const maxRowsIsValid = isPositiveInteger(maxRowsValue);
    const rowsIsValid = isPositiveInteger(rows);
    const effectiveMinRows = minRowsIsValid
      ? minRowsValue
      : rowsIsValid
        ? rows
        : undefined;
    let effectiveMaxRows = maxRowsIsValid ? maxRowsValue : undefined;

    if (process.env.NODE_ENV !== 'production' && autoSizeIsObject) {
      const minRowsIsDefined = typeof minRowsValue !== 'undefined';

      if (minRowsIsDefined && !minRowsIsValid) {
        console.warn(
          '[react-fit] Textarea expected autoSize.minRows to be a positive integer.',
        );
      }
    }

    if (process.env.NODE_ENV !== 'production' && autoSizeIsObject) {
      const maxRowsIsDefined = typeof maxRowsValue !== 'undefined';

      if (maxRowsIsDefined && !maxRowsIsValid) {
        console.warn(
          '[react-fit] Textarea expected autoSize.maxRows to be a positive integer.',
        );
      }
    }

    if (typeof effectiveMinRows !== 'undefined') {
      if (typeof effectiveMaxRows !== 'undefined') {
        if (effectiveMaxRows < effectiveMinRows) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[react-fit] Textarea received autoSize.maxRows smaller than the effective minimum rows.',
            );
          }

          effectiveMaxRows = effectiveMinRows;
        }
      }
    }
    const [store] = useState(() => {
      return createTextareaStore({
        enabled: autoSizeEnabled,
        minRows: effectiveMinRows,
        maxRows: effectiveMaxRows,
      });
    });
    const autosizeHeight = useSyncExternalStore(
      store.subscribe,
      store.getState,
      store.getState,
    );
    const composedRef = useComposedRefs(forwardedRef, store.setElement);
    const styleSignature = typeof style === 'undefined'
      ? ''
      : JSON.stringify(style);

    // biome-ignore lint/correctness/useExhaustiveDependencies: 可能影响布局的属性改变时重新测量
    useLayoutEffect(() => {
      store.setOptions({
        enabled: autoSizeEnabled,
        minRows: effectiveMinRows,
        maxRows: effectiveMaxRows,
      });
      store.requestMeasure();
    }, [
      autoSizeEnabled,
      defaultValue,
      effectiveMaxRows,
      effectiveMinRows,
      store,
      styleSignature,
      value,
    ]);

    const controlled = typeof value !== 'undefined';
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoSizeEnabled && !controlled) {
        store.requestMeasure();
      }

      if (typeof onChange !== 'undefined') {
        onChange(event);
      }
    };
    const textareaStyle = autoSizeEnabled && autosizeHeight !== null
      ? {
          ...style,
          height: autosizeHeight,
        }
      : style;

    return (
      <textarea
        {...textareaProps}
        ref={composedRef}
        className={className}
        cols={cols}
        defaultValue={defaultValue}
        dir={dir}
        lang={lang}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        style={textareaStyle}
        value={value}
        wrap={wrap}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
