import { beforeEach, describe, expect, it } from 'vitest';

import {
  STORAGE_KEY,
  loadHistory,
  mergeHistory,
  removeHistory,
  saveHistory,
  upsertHistory,
} from './history';

const base = {
  site: 'example.com',
  counter: 1,
  template: 'long' as const,
};

describe('site history storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips valid entries without sensitive fields', () => {
    const entries = upsertHistory([], base, 100);
    saveHistory(entries);

    expect(loadHistory()).toEqual(entries);
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('password');
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('fullName');
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('purpose');
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('context');
  });

  it('removes storage when saving an empty history', () => {
    localStorage.setItem(STORAGE_KEY, 'stale');

    saveHistory([]);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ignores malformed JSON and invalid entries', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    expect(loadHistory()).toEqual([]);

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ site: '' }]));
    expect(loadHistory()).toEqual([]);
  });

  it('keeps configurations for the same site and updates exact duplicates', () => {
    let entries = upsertHistory([], base, 100);
    entries = upsertHistory(entries, { ...base, counter: 2 }, 200);
    entries = upsertHistory(entries, { ...base, template: 'maximum' }, 300);

    expect(entries).toHaveLength(3);
    expect(
      entries.map(({ template, counter }) => ({ template, counter })),
    ).toEqual([
      { template: 'maximum', counter: 1 },
      { template: 'long', counter: 2 },
      { template: 'long', counter: 1 },
    ]);

    entries = upsertHistory(entries, base, 400);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      id: 'example.com:long:1',
      lastUsedAt: 400,
    });
  });

  it('normalizes site identity independently of case and surrounding spaces', () => {
    let entries = upsertHistory([], base, 100);
    entries = upsertHistory(entries, { ...base, site: '  EXAMPLE.COM  ' }, 200);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'example.com:long:1',
      site: 'EXAMPLE.COM',
      lastUsedAt: 200,
    });
  });

  it('sorts newest first without discarding older entries', () => {
    let entries = Array.from(
      { length: 55 },
      (_, index) =>
        upsertHistory([], { ...base, site: `site-${index}.example` }, index)[0],
    );
    entries = upsertHistory(entries, base, 1000);
    saveHistory(entries);

    const loaded = loadHistory();
    expect(loaded).toHaveLength(56);
    expect(loaded[0].site).toBe('example.com');
    expect(loaded.at(-1)?.site).toBe('site-0.example');
  });

  it('removes a single configuration', () => {
    const first = upsertHistory([], base);
    const entries = upsertHistory(first, { ...base, counter: 2 });
    expect(removeHistory(entries, first[0].id)).toEqual([entries[0]]);
  });

  it('merges all entries and keeps the newest duplicate', () => {
    const current = [
      upsertHistory([], base, 100)[0],
      upsertHistory([], { ...base, site: 'local.example' }, 300)[0],
    ];
    const incoming = [
      upsertHistory([], base, 200)[0],
      upsertHistory([], { ...base, site: 'remote.example' }, 400)[0],
    ];

    const merged = mergeHistory(current, incoming);

    expect(merged).toHaveLength(3);
    expect(merged.map((entry) => entry.site)).toEqual([
      'remote.example',
      'local.example',
      'example.com',
    ]);
    expect(merged[2].lastUsedAt).toBe(200);
  });
});
