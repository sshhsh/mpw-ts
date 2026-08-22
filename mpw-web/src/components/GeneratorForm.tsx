import {
  ChevronDown,
  Globe2,
  KeyRound,
  LoaderCircle,
  Minus,
  Plus,
  Settings2,
  X,
} from 'lucide-react';
import type { SubmitEvent } from 'react';

import {
  MAX_COUNTER,
  MIN_COUNTER,
  TEMPLATES,
  type TemplateName,
} from '@mpw/core';

import { templateLabel, templateMetadata } from '../lib/templateMetadata';

interface GeneratorFormProps {
  advancedOpen: boolean;
  counter: number;
  error: string;
  hasResult: boolean;
  isGenerating: boolean;
  site: string;
  template: TemplateName;
  onAdvancedToggle: (open: boolean) => void;
  onCounterChange: (counter: number) => void;
  onReset: () => void;
  onSiteChange: (site: string) => void;
  onSubmit: (event: SubmitEvent) => void;
  onTemplateChange: (template: TemplateName) => void;
}

function clampCounter(value: number): number {
  return Math.min(MAX_COUNTER, Math.max(MIN_COUNTER, value));
}

function GeneratorForm({
  advancedOpen,
  counter,
  error,
  hasResult,
  isGenerating,
  site,
  template,
  onAdvancedToggle,
  onCounterChange,
  onReset,
  onSiteChange,
  onSubmit,
  onTemplateChange,
}: GeneratorFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <fieldset className="target-fields" aria-label="密码生成参数">
        <div className="field site-field">
          <div className="field-heading">
            <span className="section-label" id="site-label">
              <Globe2 size={16} /> 网站或服务
            </span>
            <button
              className="field-clear"
              type="button"
              onClick={onReset}
              disabled={
                !site &&
                counter === MIN_COUNTER &&
                template === 'long' &&
                !hasResult
              }
              aria-label="清空生成参数"
            >
              <X size={14} />
            </button>
          </div>
          <input
            id="site-input"
            aria-labelledby="site-label"
            value={site}
            onChange={(event) => onSiteChange(event.target.value)}
            autoComplete="off"
            placeholder="例如 example.com"
          />
        </div>
        <details
          className="advanced"
          open={advancedOpen}
          onToggle={(event) => onAdvancedToggle(event.currentTarget.open)}
        >
          <summary>
            <Settings2 size={16} />
            <span>高级选项</span>
            <small>
              {templateMetadata[template].name} · 计数器 {counter}
            </small>
            <ChevronDown size={16} />
          </summary>
          <div className="advanced-fields">
            <label className="field">
              <span>密码模板</span>
              <select
                value={template}
                onChange={(event) =>
                  onTemplateChange(event.target.value as TemplateName)
                }
              >
                {(Object.keys(TEMPLATES) as TemplateName[]).map((name) => (
                  <option key={name} value={name}>
                    {templateLabel(name)}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>计数器</span>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => onCounterChange(clampCounter(counter - 1))}
                  aria-label="减少计数器"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={MIN_COUNTER}
                  max={MAX_COUNTER}
                  value={counter}
                  onChange={(event) =>
                    onCounterChange(
                      clampCounter(
                        Number(event.target.value) || MIN_COUNTER,
                      ),
                    )
                  }
                  aria-label="计数器"
                />
                <button
                  type="button"
                  onClick={() => onCounterChange(clampCounter(counter + 1))}
                  aria-label="增加计数器"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </details>
      </fieldset>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="generate-row">
        <button
          className="primary-button"
          type="submit"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <LoaderCircle className="spin" size={19} />
          ) : (
            <KeyRound size={19} />
          )}
          {isGenerating ? '正在生成…' : '生成密码'}
        </button>
        <span>首次解锁后，生成只需瞬间</span>
      </div>
    </form>
  );
}

export default GeneratorForm;