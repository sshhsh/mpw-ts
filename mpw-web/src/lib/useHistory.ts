import { useEffect, useState } from 'react';

import {
  loadHistory,
  mergeHistory,
  removeHistory,
  saveHistory,
  upsertHistory,
  type SiteHistoryEntry,
} from './history';

export function useHistory() {
  const [entries, setEntries] = useState<SiteHistoryEntry[]>(loadHistory);

  useEffect(() => {
    saveHistory(entries);
  }, [entries]);

  function upsert(
    next: Omit<SiteHistoryEntry, 'id' | 'lastUsedAt'>,
  ): void {
    setEntries((current) => upsertHistory(current, next));
  }

  function remove(id: string): void {
    setEntries((current) => removeHistory(current, id));
  }

  function merge(incoming: SiteHistoryEntry[]): void {
    setEntries((current) => mergeHistory(current, incoming));
  }

  function clear(): void {
    setEntries([]);
  }

  return { entries, upsert, remove, merge, clear };
}
