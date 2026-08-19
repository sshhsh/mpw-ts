import { beforeEach, describe, expect, it } from 'vitest'

import {
  MAX_ENTRIES,
  STORAGE_KEY,
  loadHistory,
  removeHistory,
  saveHistory,
  upsertHistory,
} from './history'

const base = {
  site: 'example.com',
  counter: 1,
  template: 'long' as const,
}

describe('site history storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips valid entries without sensitive fields', () => {
    const entries = upsertHistory([], base, 100)
    saveHistory(entries)

    expect(loadHistory()).toEqual(entries)
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('password')
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('fullName')
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('purpose')
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('context')
  })

  it('ignores malformed JSON and invalid entries', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')
    expect(loadHistory()).toEqual([])

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ site: '' }]))
    expect(loadHistory()).toEqual([])
  })

  it('keeps configurations for the same site and updates exact duplicates', () => {
    let entries = upsertHistory([], base, 100)
    entries = upsertHistory(entries, { ...base, counter: 2 }, 200)
    entries = upsertHistory(entries, { ...base, template: 'maximum' }, 300)

    expect(entries).toHaveLength(3)
    expect(entries.map(({ template, counter }) => ({ template, counter }))).toEqual([
      { template: 'maximum', counter: 1 },
      { template: 'long', counter: 2 },
      { template: 'long', counter: 1 },
    ])

    entries = upsertHistory(entries, base, 400)
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({ id: 'example.com:long:1', lastUsedAt: 400 })
  })

  it('sorts newest first and caps capacity', () => {
    let entries = Array.from({ length: MAX_ENTRIES + 5 }, (_, index) =>
      upsertHistory(
        [],
        { ...base, site: `site-${index}.example` },
        index,
      )[0],
    )
    entries = upsertHistory(entries, base, 1000)

    expect(entries).toHaveLength(MAX_ENTRIES)
    expect(entries[0].site).toBe('example.com')
  })

  it('removes a single configuration', () => {
    const first = upsertHistory([], base)
    const entries = upsertHistory(first, { ...base, counter: 2 })
    expect(removeHistory(entries, first[0].id)).toEqual([entries[0]])
  })
})