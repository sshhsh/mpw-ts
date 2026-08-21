import { useState } from 'react';

import { MIN_COUNTER } from '@mpw/core';
import type { TemplateName } from '@mpw/core';

interface GeneratorState {
  site: string;
  counter: number;
  template: TemplateName;
  advancedOpen: boolean;
  result: string;
  showResult: boolean;
}

type GeneratorEntry = Pick<GeneratorState, 'site' | 'counter' | 'template'>;

const initialState: GeneratorState = {
  site: '',
  counter: MIN_COUNTER,
  template: 'long',
  advancedOpen: false,
  result: '',
  showResult: false,
};

export function useGenerator() {
  const [state, setState] = useState(initialState);

  return {
    ...state,
    changeSite: (site: string) =>
      setState((current) => ({
        ...current,
        site,
        result: '',
        showResult: false,
      })),
    changeCounter: (counter: number) =>
      setState((current) => ({ ...current, counter })),
    changeTemplate: (template: TemplateName) =>
      setState((current) => ({ ...current, template })),
    toggleAdvanced: (open: boolean) =>
      setState((current) => ({ ...current, advancedOpen: open })),
    setGeneratedResult: (result: string) =>
      setState((current) => ({ ...current, result, showResult: false })),
    toggleResultVisibility: () =>
      setState((current) => ({
        ...current,
        showResult: !current.showResult,
      })),
    reset: () => setState(initialState),
    load: (entry: GeneratorEntry) =>
      setState({
        ...initialState,
        ...entry,
        advancedOpen:
          entry.counter !== MIN_COUNTER || entry.template !== 'long',
      }),
  };
}