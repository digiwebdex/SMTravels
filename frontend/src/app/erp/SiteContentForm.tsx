import React, { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, Image as ImageIcon, Upload, X } from "lucide-react";
import { cn } from "../lib/utils";
import { inputCls } from "./crm/ui";

/**
 * SiteContentForm — a structure-aware, form-based editor for the SiteContent
 * store. Instead of asking the user to hand-edit raw JSON, it reads the shape
 * of the existing content and renders friendly inputs:
 *  - text / long-text / number / on-off toggle
 *  - English ↔ বাংলা pairs (both `xxx`/`xxxBn` siblings and `{en, bn}` objects)
 *  - lists (packages, team, FAQs…) as add / remove / reorder cards
 *  - image fields with a live preview + upload (stored as a data URI)
 * The exact field names and nesting are preserved, so the public site keeps
 * reading the same structure. An "Advanced (JSON)" mode stays available for
 * power users via the parent view.
 */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

// ── helpers ──────────────────────────────────────────────────────────────────
const isObj = (v: unknown): v is Record<string, Json> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isPrimitive = (v: unknown) => v === null || ["string", "number", "boolean"].includes(typeof v);

/** Immutable set of a nested value by path (only clones along the path). */
function setByPath(root: Json, path: (string | number)[], val: Json): Json {
  if (path.length === 0) return val;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[head as number] = setByPath(root[head as number], rest, val);
    return copy;
  }
  const src = isObj(root) ? root : {};
  return { ...src, [head]: setByPath(src[head as string], rest, val) };
}

/** camelCase / snake_case → "Title Case", with a Bangla tag for *Bn keys. */
function humanize(key: string): string {
  const bn = key.endsWith("Bn");
  const base = bn ? key.slice(0, -2) : key;
  const words = base
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  const title = words.charAt(0).toUpperCase() + words.slice(1);
  return bn ? `${title} (বাংলা)` : title;
}

/** A blank template shaped like an existing sample, so "Add" keeps field names. */
function blankLike(sample: Json): Json {
  if (Array.isArray(sample)) return sample.length ? [blankLike(sample[0])] : [];
  if (isObj(sample)) {
    const o: Record<string, Json> = {};
    for (const k of Object.keys(sample)) o[k] = blankLike(sample[k]);
    return o;
  }
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  return "";
}

const IMG_KEY = /(image|img|logo|photo|icon|flyer|cover|avatar|thumb|banner|picture)/i;
const looksLikeImageVal = (v: unknown) =>
  typeof v === "string" && (/^(https?:)?\/\//.test(v) || v.startsWith("/") || v.startsWith("data:image"));

/** Best-effort human title for a list card. */
function cardTitle(item: Json, i: number): string {
  if (isObj(item)) {
    for (const k of ["title", "name", "label", "question", "heading", "city", "country", "step", "year", "code", "to", "eyebrow", "slug"]) {
      const v = item[k];
      if (typeof v === "string" && v.trim()) return v;
      if (isObj(v) && typeof v.en === "string" && v.en.trim()) return v.en;
    }
  }
  if (typeof item === "string" && item.trim()) return item;
  return `Item ${i + 1}`;
}

interface NodeProps {
  value: Json;
  path: (string | number)[];
  patch: (path: (string | number)[], val: Json) => void;
}

// ── leaf inputs ───────────────────────────────────────────────────────────────
function TextInput({ value, path, patch, image }: NodeProps & { image?: boolean }) {
  const str = value == null ? "" : String(value);
  const long = !image && (str.length > 60 || str.includes("\n"));

  const onFile = (file: File) => {
    if (file.size > 1_500_000) {
      alert("Image is larger than 1.5 MB — please use a smaller file or paste a URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patch(path, String(reader.result));
    reader.readAsDataURL(file);
  };

  if (image) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-slate-50">
          {looksLikeImageVal(str) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={str} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")} />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input className={inputCls} value={str} placeholder="Image URL or /path.png" onChange={(e) => patch(path, e.target.value)} />
          <div className="mt-1.5 flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">
              <Upload className="h-3 w-3" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
            {str && (
              <button type="button" onClick={() => patch(path, "")} className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (long) {
    return (
      <textarea
        className={cn(inputCls, "min-h-[76px] resize-y leading-relaxed")}
        value={str}
        onChange={(e) => patch(path, e.target.value)}
      />
    );
  }
  return <input className={inputCls} value={str} onChange={(e) => patch(path, e.target.value)} />;
}

function NumberInput({ value, path, patch }: NodeProps) {
  return (
    <input
      type="number"
      className={inputCls}
      value={value == null ? "" : Number(value)}
      onChange={(e) => patch(path, e.target.value === "" ? 0 : Number(e.target.value))}
    />
  );
}

function ToggleInput({ value, path, patch }: NodeProps) {
  const on = Boolean(value);
  return (
    <button
      type="button"
      onClick={() => patch(path, !on)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        on ? "bg-[#1B75BC]" : "bg-slate-300",
      )}
      aria-pressed={on}
    >
      <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform", on ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

// ── bilingual {en, bn} object ──────────────────────────────────────────────────
function EnBnField({ value, path, patch }: NodeProps) {
  const v = isObj(value) ? value : {};
  const long = String(v.en ?? "").length > 60 || String(v.bn ?? "").length > 40;
  const cls = cn(inputCls, long && "min-h-[70px] resize-y");
  const cell = (which: "en" | "bn", heading: string) => (
    <div>
      <div className="mb-1 text-[11px] font-medium text-slate-400">{heading}</div>
      {long ? (
        <textarea className={cls} value={String(v[which] ?? "")} onChange={(e) => patch([...path, which], e.target.value)} />
      ) : (
        <input className={cls} value={String(v[which] ?? "")} onChange={(e) => patch([...path, which], e.target.value)} />
      )}
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {cell("en", "English")}
      {cell("bn", "বাংলা")}
    </div>
  );
}

// ── list of primitives (string[] / number[]) ───────────────────────────────────
function PrimitiveList({ value, path, patch }: NodeProps) {
  const arr = Array.isArray(value) ? value : [];
  const isNum = arr.length > 0 && typeof arr[0] === "number";
  return (
    <div className="space-y-1.5">
      {arr.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-right text-[11px] text-slate-300">{i + 1}</span>
          {isNum ? (
            <input type="number" className={inputCls} value={Number(item)} onChange={(e) => patch([...path, i], e.target.value === "" ? 0 : Number(e.target.value))} />
          ) : (
            <input className={inputCls} value={String(item ?? "")} onChange={(e) => patch([...path, i], e.target.value)} />
          )}
          <button type="button" onClick={() => patch(path, arr.filter((_, j) => j !== i))} className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => patch(path, [...arr, isNum ? 0 : ""])} className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-slate-500 hover:bg-slate-50">
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}

// ── list of objects (packages, team, FAQs…) as cards ────────────────────────────
function ObjectList({ value, path, patch }: NodeProps) {
  const arr = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<number | null>(arr.length === 1 ? 0 : null);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const next = arr.slice();
    [next[i], next[j]] = [next[j], next[i]];
    patch(path, next);
    setOpen(j);
  };

  return (
    <div className="space-y-2">
      {arr.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-lg border border-[var(--color-border)] bg-white">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
                <span className="truncate text-[13px] font-medium text-slate-700">{cardTitle(item, i)}</span>
              </button>
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === arr.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30" title="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => { patch(path, arr.filter((_, j) => j !== i)); setOpen(null); }} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-[var(--color-border)] px-3 py-3">
                <Node value={item} path={[...path, i]} patch={patch} />
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => { const next = [...arr, blankLike(arr[0] ?? {})]; patch(path, next); setOpen(next.length - 1); }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-slate-500 hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}

// ── object → labelled field groups (with EN/বাংলা pairing) ──────────────────────
function ObjectGroup({ value, path, patch }: NodeProps) {
  const obj = isObj(value) ? value : {};
  const keys = Object.keys(obj);
  const done = new Set<string>();
  const rows: React.ReactNode[] = [];

  for (const k of keys) {
    if (done.has(k)) continue;
    // fold a plain *Bn sibling into a paired row when the base key exists
    if (k.endsWith("Bn") && keys.includes(k.slice(0, -2))) continue;
    const bnKey = `${k}Bn`;
    const hasPair = keys.includes(bnKey);

    if (hasPair) {
      done.add(k); done.add(bnKey);
      rows.push(
        <div key={k} className="space-y-1.5">
          <div className="text-[12px] font-semibold text-slate-600">{humanize(k)}</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50/60 p-2">
              <div className="mb-1 text-[11px] font-medium text-slate-400">English</div>
              <Node value={obj[k]} path={[...path, k]} patch={patch} bare />
            </div>
            <div className="rounded-lg bg-slate-50/60 p-2">
              <div className="mb-1 text-[11px] font-medium text-slate-400">বাংলা</div>
              <Node value={obj[bnKey]} path={[...path, bnKey]} patch={patch} bare />
            </div>
          </div>
        </div>,
      );
      continue;
    }

    done.add(k);
    rows.push(
      <div key={k} className="space-y-1.5">
        <div className="text-[12px] font-semibold text-slate-600">{humanize(k)}</div>
        <Node value={obj[k]} path={[...path, k]} patch={patch} imageKey={IMG_KEY.test(k)} bare />
      </div>,
    );
  }

  return <div className="space-y-3.5">{rows}</div>;
}

// ── dispatcher ──────────────────────────────────────────────────────────────────
function Node({ value, path, patch, imageKey, bare }: NodeProps & { imageKey?: boolean; bare?: boolean }) {
  // {en, bn} bilingual object
  if (isObj(value)) {
    const ks = Object.keys(value);
    if (ks.length > 0 && ks.every((k) => k === "en" || k === "bn")) {
      return <EnBnField value={value} path={path} patch={patch} />;
    }
    return <ObjectGroup value={value} path={path} patch={patch} />;
  }
  if (Array.isArray(value)) {
    return value.every(isPrimitive) ? <PrimitiveList value={value} path={path} patch={patch} /> : <ObjectList value={value} path={path} patch={patch} />;
  }
  if (typeof value === "number") return <NumberInput value={value} path={path} patch={patch} />;
  if (typeof value === "boolean") return <ToggleInput value={value} path={path} patch={patch} />;
  const image = imageKey || looksLikeImageVal(value);
  void bare;
  return <TextInput value={value} path={path} patch={patch} image={image} />;
}

export function SiteContentForm({ value, onChange }: { value: Json; onChange: (next: Json) => void }) {
  const patch = (p: (string | number)[], val: Json) => onChange(setByPath(value, p, val));
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-slate-50/40 p-4">
      <Node value={value} path={[]} patch={patch} />
    </div>
  );
}
