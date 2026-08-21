import { useState } from 'react';

import type { TemplateName } from '@mpw/core';

export function useGenerator() {
  const [site, setSite] = useState('');
  const [counter, setCounter] = useState(1);
  const [template, setTemplate] = useState<TemplateName>('long');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);

  function reset(): void {
    setSite('');
    setCounter(1);
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
    setAdvancedOpen(entry.counter !== 1 || entry.template !== 'long');
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