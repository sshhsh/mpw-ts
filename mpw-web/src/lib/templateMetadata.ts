import type { TemplateName } from "@mpw/core";
import type { Translator } from "./useLanguage";

export function templateLabel(template: TemplateName, t: Translator): string {
  return t(`template.${template}`);
}

export function templateName(template: TemplateName, t: Translator): string {
  return t(`templateName.${template}`);
}
