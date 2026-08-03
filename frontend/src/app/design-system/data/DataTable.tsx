import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Columns3, Download, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Btn, EmptyState, SkeletonTable } from "../../lib/ds";

export type DataColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  defaultHidden?: boolean;
  className?: string;
  mobileLabel?: string;
  /** Initial width in px (resizable) */
  width?: number;
  minWidth?: number;
};

type SavedView = { id: string; name: string; hidden: string[]; widths: Record<string, number> };

type DataTableProps<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Persist column prefs / saved views under this key */
  viewKey?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  onExport?: () => void;
  bulkActions?: React.ReactNode;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  emptyTitle?: string;
  emptyDesc?: string;
  footer?: React.ReactNode;
  className?: string;
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  viewKey,
  loading,
  searchPlaceholder = "Quick search…",
  search,
  onSearchChange,
  onExport,
  bulkActions,
  selectedKeys,
  onSelectionChange,
  emptyTitle,
  emptyDesc,
  footer,
  className,
}: DataTableProps<T>) {
  const storageRoot = viewKey ? `smtravels-dt:${viewKey}` : null;

  const [hidden, setHidden] = useState<Set<string>>(() => {
    if (storageRoot) {
      const saved = loadJson<{ hidden?: string[] }>(`${storageRoot}:cols`, {});
      if (saved.hidden) return new Set(saved.hidden);
    }
    return new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id));
  });

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    columns.forEach((c) => { if (c.width) base[c.id] = c.width; });
    if (storageRoot) {
      const saved = loadJson<{ widths?: Record<string, number> }>(`${storageRoot}:cols`, {});
      return { ...base, ...(saved.widths ?? {}) };
    }
    return base;
  });

  const [views, setViews] = useState<SavedView[]>(() =>
    storageRoot ? loadJson<SavedView[]>(`${storageRoot}:views`, []) : [],
  );
  const [showCols, setShowCols] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [viewName, setViewName] = useState("");
  const resizing = useRef<{ id: string; startX: number; startW: number } | null>(null);

  useEffect(() => {
    if (!storageRoot) return;
    localStorage.setItem(`${storageRoot}:cols`, JSON.stringify({ hidden: [...hidden], widths }));
  }, [hidden, widths, storageRoot]);

  useEffect(() => {
    if (!storageRoot) return;
    localStorage.setItem(`${storageRoot}:views`, JSON.stringify(views));
  }, [views, storageRoot]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const { id, startX, startW } = resizing.current;
      const col = columns.find((c) => c.id === id);
      const min = col?.minWidth ?? 80;
      const next = Math.max(min, startW + (e.clientX - startX));
      setWidths((w) => ({ ...w, [id]: next }));
    };
    const onUp = () => { resizing.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [columns]);

  const visible = useMemo(
    () => columns.filter((c) => !hidden.has(c.id)),
    [columns, hidden],
  );

  const allSelected = selectedKeys && rows.length > 0 && selectedKeys.length === rows.length;
  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : rows.map(rowKey));
  };
  const toggleOne = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return;
    onSelectionChange(
      selectedKeys.includes(key) ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key],
    );
  };

  const applyView = (v: SavedView) => {
    setHidden(new Set(v.hidden));
    setWidths(v.widths);
    setShowViews(false);
  };

  const saveCurrentView = () => {
    const name = viewName.trim() || `View ${views.length + 1}`;
    const next: SavedView = {
      id: `v-${Date.now()}`,
      name,
      hidden: [...hidden],
      widths: { ...widths },
    };
    setViews((prev) => [...prev, next]);
    setViewName("");
    setShowViews(false);
  };

  return (
    <div className={cn("bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--elevation-1)] overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        {onSearchChange && (
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {selectedKeys && selectedKeys.length > 0 && bulkActions}
          {storageRoot && (
            <div className="relative">
              <Btn variant="secondary" size="sm" icon={Bookmark} onClick={() => { setShowViews((v) => !v); setShowCols(false); }}>
                Views
              </Btn>
              {showViews && (
                <div className="absolute right-0 top-full mt-1 z-20 w-56 p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--elevation-3)] space-y-2">
                  {views.length === 0 && <p className="text-[11px] text-[var(--color-text-faint)] px-1">No saved views yet</p>}
                  {views.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => applyView(v)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[var(--color-bg)]"
                    >
                      {v.name}
                    </button>
                  ))}
                  <div className="border-t border-[var(--color-border-subtle)] pt-2 flex gap-1">
                    <input
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      placeholder="View name"
                      className="flex-1 min-w-0 px-2 py-1 text-xs border border-[var(--color-border)] rounded"
                    />
                    <Btn size="xs" variant="primary" onClick={saveCurrentView}>Save</Btn>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <Btn variant="secondary" size="sm" icon={Columns3} onClick={() => { setShowCols((v) => !v); setShowViews(false); }}>
              Columns
            </Btn>
            {showCols && (
              <div className="absolute right-0 top-full mt-1 z-20 w-48 p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--elevation-3)]">
                {columns.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-[var(--color-bg)] rounded">
                    <input
                      type="checkbox"
                      checked={!hidden.has(c.id)}
                      onChange={() => {
                        setHidden((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return next;
                        });
                      }}
                    />
                    {c.header}
                  </label>
                ))}
              </div>
            )}
          </div>
          {onExport && (
            <Btn variant="secondary" size="sm" icon={Download} onClick={onExport}>
              Export
            </Btn>
          )}
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={visible.length || 5} />
      ) : rows.length === 0 ? (
        <EmptyState variant="no-results" title={emptyTitle} desc={emptyDesc} compact />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto max-h-[70vh]">
            <table className="w-full text-sm table-fixed">
              <thead className="sticky top-0 z-10 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                <tr>
                  {onSelectionChange && (
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={!!allSelected} onChange={toggleAll} aria-label="Select all" />
                    </th>
                  )}
                  {visible.map((c) => (
                    <th
                      key={c.id}
                      style={{ width: widths[c.id], minWidth: c.minWidth ?? 80 }}
                      className={cn("relative px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] select-none", c.className)}
                    >
                      {c.header}
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${c.header}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          resizing.current = {
                            id: c.id,
                            startX: e.clientX,
                            startW: widths[c.id] ?? (e.currentTarget.parentElement?.clientWidth ?? 120),
                          };
                          document.body.style.cursor = "col-resize";
                          document.body.style.userSelect = "none";
                        }}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[var(--color-primary)]/40"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const key = rowKey(row);
                  return (
                    <tr
                      key={key}
                      tabIndex={0}
                      className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-primary-tint)]/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                    >
                      {onSelectionChange && selectedKeys && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedKeys.includes(key)}
                            onChange={() => toggleOne(key)}
                            aria-label={`Select ${key}`}
                          />
                        </td>
                      )}
                      {visible.map((c) => (
                        <td key={c.id} style={{ width: widths[c.id] }} className={cn("px-4 py-3 text-[var(--color-text)] truncate", c.className)}>
                          {c.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[var(--color-border-subtle)]">
            {rows.map((row) => {
              const key = rowKey(row);
              return (
                <div key={key} className="p-4 space-y-2">
                  {visible.map((c) => (
                    <div key={c.id} className="flex justify-between gap-3 text-sm">
                      <span className="text-[var(--color-text-faint)] text-xs">{c.mobileLabel ?? c.header}</span>
                      <span className="text-right font-medium text-[var(--color-text)]">{c.cell(row)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {footer && (
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg)]/50">
          {footer}
        </div>
      )}
    </div>
  );
}
