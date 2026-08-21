import { useReducer } from 'react';

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

type GeneratorAction =
  | { type: 'siteChanged'; site: string }
  | { type: 'counterChanged'; counter: number }
  | { type: 'templateChanged'; template: TemplateName }
  | { type: 'advancedToggled'; open: boolean }
  | { type: 'generated'; result: string }
  | { type: 'resultVisibilityToggled' }
  | { type: 'loaded'; entry: GeneratorEntry }
  | { type: 'reset' };

const initialState: GeneratorState = {
  site: '',
  counter: MIN_COUNTER,
  template: 'long',
  advancedOpen: false,
  result: '',
  showResult: false,
};

function reducer(
  state: GeneratorState,
  action: GeneratorAction,
): GeneratorState {
  switch (action.type) {
    case 'siteChanged':
      return { ...state, site: action.site, result: '', showResult: false };
    case 'counterChanged':
      return { ...state, counter: action.counter };
    case 'templateChanged':
      return { ...state, template: action.template };
    case 'advancedToggled':
      return { ...state, advancedOpen: action.open };
    case 'generated':
      return { ...state, result: action.result, showResult: false };
    case 'resultVisibilityToggled':
      return { ...state, showResult: !state.showResult };
    case 'loaded':
      return {
        ...initialState,
        ...action.entry,
        advancedOpen:
          action.entry.counter !== MIN_COUNTER ||
          action.entry.template !== 'long',
      };
    case 'reset':
      return initialState;
  }
}

export function useGenerator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    ...state,
    changeSite: (site: string) => dispatch({ type: 'siteChanged', site }),
    changeCounter: (counter: number) =>
      dispatch({ type: 'counterChanged', counter }),
    changeTemplate: (template: TemplateName) =>
      dispatch({ type: 'templateChanged', template }),
    toggleAdvanced: (open: boolean) =>
      dispatch({ type: 'advancedToggled', open }),
    setGeneratedResult: (result: string) =>
      dispatch({ type: 'generated', result }),
    toggleResultVisibility: () =>
      dispatch({ type: 'resultVisibilityToggled' }),
    reset: () => dispatch({ type: 'reset' }),
    load: (entry: GeneratorEntry) => dispatch({ type: 'loaded', entry }),
  };
}