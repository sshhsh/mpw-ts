import { X } from 'lucide-react';

import type { SiteHistoryEntry } from '../lib/history';
import { templateMetadata } from '../lib/templateMetadata';

interface HistoryItemProps {
  entry: SiteHistoryEntry;
  selected: boolean;
  variant: 'desktop' | 'mobile';
  managing?: boolean;
  relativeTime?: string;
  onLoad: (entry: SiteHistoryEntry) => void;
  onRemove: (id: string) => void;
}

function HistoryItem({
  entry,
  selected,
  variant,
  managing = false,
  relativeTime,
  onLoad,
  onRemove,
}: HistoryItemProps) {
  const templateName = templateMetadata[entry.template].name;
  const content = (
    <>
      <span className="monogram">{entry.site.charAt(0).toUpperCase()}</span>
      <span>
        <strong>{entry.site}</strong>
        <small>
          {templateName} · 计数器 {entry.counter}
          {relativeTime ? ` · ${relativeTime}` : ''}
        </small>
      </span>
    </>
  );
  const loadLabel = `载入 ${entry.site}，${templateName}，计数器 ${entry.counter}`;
  const removeButton = (
    <button
      className={variant === 'desktop' ? 'delete-button' : 'shortcut-delete'}
      type="button"
      onClick={() => onRemove(entry.id)}
      aria-label={`删除 ${entry.site}`}
    >
      <X size={variant === 'desktop' ? 15 : 14} />
    </button>
  );

  if (variant === 'desktop') {
    return (
      <article className={`history-item ${selected ? 'selected' : ''}`}>
        <button
          className="history-load"
          type="button"
          onClick={() => onLoad(entry)}
          aria-label={loadLabel}
        >
          {content}
        </button>
        {removeButton}
      </article>
    );
  }

  return (
    <div className={`shortcut-wrap ${selected ? 'selected' : ''}`}>
      <button
        className="history-shortcut"
        type="button"
        onClick={() => onLoad(entry)}
        aria-label={loadLabel}
      >
        {content}
      </button>
      {managing && removeButton}
    </div>
  );
}

export default HistoryItem;