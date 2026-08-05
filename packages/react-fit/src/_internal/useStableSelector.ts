import { useRef } from 'react';

export const useStableSelector = <State, Selection>(
  selector: (state: State) => Selection,
  eq: (previous: Selection, next: Selection) => boolean,
): ((state: State) => Selection) => {
  const previousRef = useRef<Selection | undefined>(undefined);

  return (state) => {
    const next = selector(state);
    const previous = previousRef.current;

    if (typeof previous !== 'undefined' && eq(previous, next)) {
      return previous;
    }

    previousRef.current = next;

    return next;
  };
};
