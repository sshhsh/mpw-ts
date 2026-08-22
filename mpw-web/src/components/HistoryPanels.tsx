import {
  History,
  KeyRound,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { normalizeSite, type SiteHistoryEntry } from '../lib/history';
import HistoryItem from './HistoryItem';

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
}: Pick<HistoryProps, 'entries' | 'selectedId' | 'onLoad' | 'onRemove'>) {
  return (
    <div className="history-list">
      {entries.length === 0 ? (
        <div className="empty">
          <KeyRound size={25} />
          <strong>尚无网站历史</strong>
          <span>成功生成后会出现在这里</span>
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
  const filtered = useFilteredHistory(props.entries, props.search);

  return (
    <aside className="history desktop-history" aria-labelledby="history-title">
      <div className="history-heading">
        <h2 id="history-title">
          <History size={16} /> 最近使用
        </h2>
        {props.entries.length > 0 && (
          <button
            className="icon-button quiet"
            type="button"
            onClick={props.onClear}
            aria-label="清除全部历史"
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
          placeholder="搜索网站"
          aria-label="搜索网站历史"
        />
      </label>
      {filtered.length === 0 && props.search ? (
        <div className="empty">
          <Search size={24} />
          <strong>没有匹配的网站</strong>
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
          <strong>历史中不含敏感信息</strong>
          <span>姓名、主密码和生成结果永不写入浏览器存储。</span>
        </p>
      </div>
    </aside>
  );
}

export function MobileHistory(props: HistoryProps) {
  const [managing, setManaging] = useState(false);
  const filtered = useFilteredHistory(props.entries, props.search);

  return (
    <section className="mobile-history" aria-labelledby="mobile-history-title">
      <div className="mobile-history-heading">
        <h2 id="mobile-history-title">
          <History size={16} /> 最近使用
        </h2>
        {props.entries.length > 0 && (
          <button
            className="text-button"
            type="button"
            onClick={() => setManaging((value) => !value)}
          >
            {managing ? '完成' : '管理'}
          </button>
        )}
      </div>
      <label className="search-box mobile-search-box">
        <Search size={17} />
        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="搜索网站"
          aria-label="搜索移动端网站历史"
        />
      </label>
      {props.entries.length === 0 ? (
        <p className="mobile-history-empty">
          生成第一个密码后，网站会保存在这里。
        </p>
      ) : filtered.length === 0 ? (
        <p className="mobile-history-empty">没有匹配的网站</p>
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
          <Trash2 size={15} /> 清除全部历史
        </button>
      )}
    </section>
  );
}