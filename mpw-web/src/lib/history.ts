import { TEMPLATES, type TemplateName } from '@mpw/core'

export interface SiteHistoryEntry {
  id: string
  site: string
  counter: number
  template: TemplateName
  lastUsedAt: number
}

const STORAGE_KEY = 'mpw.site-history.v2'
const LEGACY_STORAGE_KEY = 'mpw.site-history.v1'
const MAX_ENTRIES = 50

function parseEntry(value: unknown, legacy = false): SiteHistoryEntry | null {
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
    !Number.isFinite(entry.lastUsedAt) ||
    (legacy && entry.purpose !== 'authentication')
  ) {
    return null
  }

  const site = entry.site.trim()
  return {
    id: site.toLocaleLowerCase(),
    site,
    counter: entry.counter,
    template: entry.template as TemplateName,
    lastUsedAt: entry.lastUsedAt,
  }
}

export function loadHistory(storage: Storage = localStorage): SiteHistoryEntry[] {
  try {
    const current = storage.getItem(STORAGE_KEY)
    const raw = current ?? storage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const entries = parsed
      .map((entry) => parseEntry(entry, current === null))
      .filter((entry): entry is SiteHistoryEntry => entry !== null)
      .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
      .slice(0, MAX_ENTRIES)
    if (current === null) {
      saveHistory(entries, storage)
      storage.removeItem(LEGACY_STORAGE_KEY)
    } else if (storage.getItem(LEGACY_STORAGE_KEY) !== null) {
      storage.removeItem(LEGACY_STORAGE_KEY)
    }
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
  const id = normalizedSite.toLocaleLowerCase()
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
  storage.removeItem(LEGACY_STORAGE_KEY)
}

export { LEGACY_STORAGE_KEY, MAX_ENTRIES, STORAGE_KEY }