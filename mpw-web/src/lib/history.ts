import { TEMPLATES, type TemplateName } from '@mpw/core'

export interface SiteHistoryEntry {
  id: string
  site: string
  counter: number
  template: TemplateName
  lastUsedAt: number
}

const STORAGE_KEY = 'mpw.site-history'
const MAX_ENTRIES = 50

export function historyEntryId(
  site: string,
  template: TemplateName,
  counter: number,
): string {
  return `${encodeURIComponent(site.trim().toLocaleLowerCase())}:${template}:${counter}`
}

function parseEntry(value: unknown): SiteHistoryEntry | null {
  if (typeof value !== 'object' || value === null) return null
  const entry = value as Record<string, unknown>
  if (
    typeof entry.site !== 'string' ||
    entry.site.trim().length === 0 ||
    typeof entry.counter !== 'number' ||
    !Number.isInteger(entry.counter) ||
    entry.counter < 1 ||
    entry.counter > 0xffffffff ||
    typeof entry.template !== 'string' ||
    !Object.hasOwn(TEMPLATES, entry.template) ||
    typeof entry.lastUsedAt !== 'number' ||
    !Number.isFinite(entry.lastUsedAt)
  ) {
    return null
  }

  const site = entry.site.trim()
  const template = entry.template as TemplateName
  return {
    id: historyEntryId(site, template, entry.counter),
    site,
    counter: entry.counter,
    template,
    lastUsedAt: entry.lastUsedAt,
  }
}

export function loadHistory(storage: Storage = localStorage): SiteHistoryEntry[] {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const entries = parsed
      .map(parseEntry)
      .filter((entry): entry is SiteHistoryEntry => entry !== null)
      .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
      .slice(0, MAX_ENTRIES)
    return entries
  } catch {
    return []
  }
}

export function saveHistory(
  entries: SiteHistoryEntry[],
  storage: Storage = localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
}

export function upsertHistory(
  entries: SiteHistoryEntry[],
  next: Omit<SiteHistoryEntry, 'id' | 'lastUsedAt'>,
  now = Date.now(),
): SiteHistoryEntry[] {
  const normalizedSite = next.site.trim()
  const id = historyEntryId(normalizedSite, next.template, next.counter)
  return [
    { ...next, id, site: normalizedSite, lastUsedAt: now },
    ...entries.filter((entry) => entry.id !== id),
  ].slice(0, MAX_ENTRIES)
}

export function removeHistory(
  entries: SiteHistoryEntry[],
  id: string,
): SiteHistoryEntry[] {
  return entries.filter((entry) => entry.id !== id)
}

export function clearHistory(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_KEY)
}

export { MAX_ENTRIES, STORAGE_KEY }