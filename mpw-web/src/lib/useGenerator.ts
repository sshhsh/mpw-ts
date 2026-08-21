import { useState } from 'react';

import { MIN_COUNTER } from '@mpw/core';
import type { TemplateName } from '@mpw/core';

export function useGenerator() {
  const [site, setSite] = useState('');
  const [counter, setCounter] = useState(MIN_COUNTER);
  const [template, setTemplate] = useState<TemplateName>('long');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);

  function reset(): void {
    setSite('');
    setCounter(MIN_COUNTER);
    setTemplate('long');
    setAdvancedOpen(false);
    setResult('');
    setShowResult(false);
  }

  function load(entry: {
    site: string;
    counter: number;
    template: TemplateName;
  }): void {
    setSite(entry.site);
    setCounter(entry.counter);
    setTemplate(entry.template);
    setAdvancedOpen(
      entry.counter !== MIN_COUNTER || entry.template !== 'long',
    );
    setResult('');
    setShowResult(false);
  }

  return {
    site,
    setSite,
    counter,
    setCounter,
    template,
    setTemplate,
    advancedOpen,
    setAdvancedOpen,
    result,
    setResult,
    showResult,
    setShowResult,
    reset,
    load,
  };
}