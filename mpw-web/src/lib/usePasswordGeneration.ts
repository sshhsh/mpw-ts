import { useState, type SubmitEvent } from 'react';

import type { SiteHistoryEntry } from './history';
import type { MpwInstance } from './mpwTypes';
import { useGenerator } from './useGenerator';

type HistoryInput = Omit<SiteHistoryEntry, 'id' | 'lastUsedAt'>;

interface UsePasswordGenerationOptions {
  mpw: MpwInstance | null;
  onMissingSession: () => void;
  onHistoryUpsert: (entry: HistoryInput) => void;
}

export function usePasswordGeneration({
  mpw,
  onMissingSession,
  onHistoryUpsert,
}: UsePasswordGenerationOptions) {
  const generator = useGenerator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  function reset(): void {
    generator.reset();
    setCopied(false);
    setError('');
  }

  async function generate(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const target = generator.site.trim();
    if (!mpw) {
      onMissingSession();
      return;
    }
    if (!target) {
      setError('请输入网站或服务。');
      return;
    }
    setIsGenerating(true);
    setError('');
    setCopied(false);
    try {
      const generated = await mpw.generateAuthentication(target, {
        counter: generator.counter,
        template: generator.template,
      });
      generator.setGeneratedResult(generated);
      onHistoryUpsert({
        site: target,
        counter: generator.counter,
        template: generator.template,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? `生成失败：${cause.message}` : '生成失败。',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyResult(): Promise<void> {
    try {
      await navigator.clipboard.writeText(generator.result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('无法访问剪贴板，请手动复制。');
    }
  }

  function loadEntry(entry: SiteHistoryEntry): void {
    generator.load(entry);
    setError('');
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelector<HTMLInputElement>('#site-input')?.focus();
    }
  }

  return {
    ...generator,
    isGenerating,
    copied,
    error,
    generate,
    copyResult,
    loadEntry,
    reset,
  };
}