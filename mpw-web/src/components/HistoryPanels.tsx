import { History, KeyRound, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { normalizeSite, type SiteHistoryEntry } from "../lib/history";
import { useLanguage } from "../lib/useLanguage";
import HistoryItem from "./HistoryItem";

export interface HistoryProps {
  entries: SiteHistoryEntry[];
  search: string;
  selectedId: string;
  onClear: () => void;
  onLoad: (entry: SiteHistoryEntry) => void;
  onRemove: (id: string) => void;
  onSearchChange: (value: string) => void;
}

function useFilteredHistory(entries: SiteHistoryEntry[], search: string) {
  return useMemo(() => {
    const query = normalizeSite(search);
    return query
      ? entries.filter((entry) => normalizeSite(entry.site).includes(query))
      : entries;
  }, [entries, search]);
}

function HistoryList({
  entries,
  selectedId,
  onLoad,
  onRemove,
}: Pick<HistoryProps, "entries" | "selectedId" | "onLoad" | "onRemove">) {
  const { t } = useLanguage();
  return (
    <div className="history-list">
      {entries.length === 0 ? (
        <div className="empty">
          <KeyRound size={25} />
          <strong>{t("history.emptyTitle")}</strong>
          <span>{t("history.emptyCopy")}</span>
        </div>
      ) : (
        entries.map((entry) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            selected={selectedId === entry.id}
            variant="desktop"
            onLoad={onLoad}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  );
}

export function DesktopHistory(props: HistoryProps) {
  const { t } = useLanguage();
  const filtered = useFilteredHistory(props.entries, props.search);

  return (
    <aside className="history desktop-history" aria-labelledby="history-title">
      <div className="history-heading">
        <h2 id="history-title">
          <History size={16} /> {t("history.recent")}
        </h2>
        {props.entries.length > 0 && (
          <button
            className="icon-button quiet"
            type="button"
            onClick={props.onClear}
            aria-label={t("history.clear")}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
      <label className="search-box">
        <Search size={17} />
        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder={t("history.search")}
          aria-label={t("history.searchLabel")}
        />
      </label>
      {filtered.length === 0 && props.search ? (
        <div className="empty">
          <Search size={24} />
          <strong>{t("history.noMatch")}</strong>
        </div>
      ) : (
        <HistoryList
          entries={filtered}
          selectedId={props.selectedId}
          onLoad={props.onLoad}
          onRemove={props.onRemove}
        />
      )}
      <div className="storage-note">
        <ShieldCheck size={17} />
        <p>
          <strong>{t("history.sensitiveTitle")}</strong>
          <span>{t("history.sensitiveCopy")}</span>
        </p>
      </div>
    </aside>
  );
}

export function MobileHistory(props: HistoryProps) {
  const { t } = useLanguage();
  const [managing, setManaging] = useState(false);
  const filtered = useFilteredHistory(props.entries, props.search);

  return (
    <section className="mobile-history" aria-labelledby="mobile-history-title">
      <div className="mobile-history-heading">
        <h2 id="mobile-history-title">
          <History size={16} /> {t("history.recent")}
        </h2>
        {props.entries.length > 0 && (
          <button
            className="text-button"
            type="button"
            onClick={() => setManaging((value) => !value)}
          >
            {managing ? t("history.done") : t("history.manage")}
          </button>
        )}
      </div>
      <label className="search-box mobile-search-box">
        <Search size={17} />
        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder={t("history.search")}
          aria-label={t("history.mobileSearchLabel")}
        />
      </label>
      {props.entries.length === 0 ? (
        <p className="mobile-history-empty">{t("history.mobileEmpty")}</p>
      ) : filtered.length === 0 ? (
        <p className="mobile-history-empty">{t("history.noMatch")}</p>
      ) : (
        <div className="history-shortcuts">
          {filtered.map((entry) => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              selected={props.selectedId === entry.id}
              variant="mobile"
              managing={managing}
              onLoad={props.onLoad}
              onRemove={props.onRemove}
            />
          ))}
        </div>
      )}
      {managing && props.entries.length > 0 && (
        <button className="clear-mobile" type="button" onClick={props.onClear}>
          <Trash2 size={15} /> {t("history.clear")}
        </button>
      )}
    </section>
  );
}
