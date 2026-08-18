import { describe, expect, it } from 'vitest'

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
  purpose: 'authentication' as const,
  context: '',
}

describe('site history storage', () => {
  it('round-trips valid entries without sensitive fields', () => {
    const entries = upsertHistory([], base, 100)
    saveHistory(entries)

    expect(loadHistory()).toEqual(entries)
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('password')
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('fullName')
  })

  it('ignores malformed JSON and invalid entries', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')
    expect(loadHistory()).toEqual([])

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ site: '' }]))
    expect(loadHistory()).toEqual([])
  })

  it('updates duplicates, sorts newest first, and caps capacity', () => {
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
    expect(upsertHistory(entries, { ...base, counter: 2 }, 1001)[0].counter).toBe(
      2,
    )
  })

  it('removes a single entry', () => {
    const entries = upsertHistory([], base)
    expect(removeHistory(entries, entries[0].id)).toEqual([])
  })
})