import type { TemplateName } from '@mpw/core';

interface TemplateMetadata {
  name: string;
  detail: string;
}

export const templateMetadata: Record<TemplateName, TemplateMetadata> = {
  maximum: { name: '最高强度', detail: '20 位' },
  long: { name: '长密码', detail: '14 位' },
  medium: { name: '中等', detail: '8 位' },
  basic: { name: '基础', detail: '8 位' },
  short: { name: '短密码', detail: '4 位' },
  pin: { name: 'PIN', detail: '4 位数字' },
  name: { name: '用户名', detail: '9 位' },
  phrase: { name: '短语', detail: '4 组单词' },
};

export function templateLabel(template: TemplateName): string {
  const { name, detail } = templateMetadata[template];
  return `${name} · ${detail}`;
}
