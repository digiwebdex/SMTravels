import React, { useState, useRef } from "react";
import {
  Upload, FileText, FileCheck, History, Shield, Bell, Share2,
  Stamp, Trash2, Archive, Eye, Download, Edit2, MoreHorizontal,
  CheckCircle, AlertTriangle, XCircle, Clock, Plus, X, Search,
  Filter, Tag, Star, Lock, Link2, Copy, RotateCcw, ZoomIn,
  ChevronRight, ChevronDown, ChevronLeft, Layers, RefreshCw,
  Users, UserPlus, Grid, List, FilePlus, FolderOpen, Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { EmptyState } from "../lib/ds";
import { ModulePage } from "../design-system/patterns/ModulePage";
import { useErpDocuments, useUploadDocument, downloadDocumentFile, useUpdateDocumentStatus } from "../hooks/documents";
import { useRunOcr } from "../hooks/ocr";
import { useCustomers } from "../hooks/crm";
import { DOCUMENT_TYPES } from "../lib/documentTypes"; // runtime value — NEVER from @contracts (no vite alias; bundling backend code is deliberate off-limits)
import type { DocumentTypeDto, DocumentDto } from "@contracts/document.contract";

// ─── Types ────────────────────────────────────────────────────────────────────
type DocView =
  | "upload" | "ocr" | "versions" | "signature"
  | "expiry" | "sharing" | "watermark" | "trash";

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  verified:  { label: "Verified",  cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  uploaded:  { label: "Uploaded",  cls: "bg-blue-50 text-blue-700",       icon: CheckCircle },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700",     icon: Clock       },
  missing:   { label: "Missing",   cls: "bg-slate-100 text-slate-500",    icon: Clock       },
  expiring:  { label: "Expiring",  cls: "bg-orange-50 text-orange-700",   icon: AlertTriangle },
  expired:   { label: "Expired",   cls: "bg-red-50 text-red-600",         icon: XCircle     },
  failed:    { label: "Failed",    cls: "bg-red-50 text-red-600",         icon: XCircle     },
  not_required: { label: "Not required", cls: "bg-slate-100 text-slate-500", icon: CheckCircle },
};

// ─── Sub-nav ──────────────────────────────────────────────────────────────────
const NAV = [
  { id:"upload"    as DocView, label:"Upload Documents",   icon:Upload    },
  { id:"ocr"       as DocView, label:"OCR Validation",     icon:FileCheck },
  { id:"versions"  as DocView, label:"Version Control",    icon:History   },
  { id:"signature" as DocView, label:"Digital Signature",  icon:Stamp     },
  { id:"expiry"    as DocView, label:"Expiry Reminders",   icon:Bell      },
  { id:"sharing"   as DocView, label:"File Sharing",       icon:Share2    },
  { id:"watermark" as DocView, label:"Watermark Tool",     icon:Shield    },
  { id:"trash"     as DocView, label:"Trash & Archive",    icon:Trash2    },
];

// ─── Shared chip ──────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cfg.cls)}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

// ─── Document Library (wired to GET /api/documents; branch-scoped server-side) ─
const fmtBytes = (n: number | null): string =>
  n == null ? "—" : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
const prettyType = (t: string): string => t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function DocLibrary() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const q = useErpDocuments({ q: search || undefined, pageSize: 50 });
  const updateStatus = useUpdateDocumentStatus();
  const rows: DocumentDto[] = q.data?.data ?? [];
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
        </div>
        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded", viewMode === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600")}>
            <List size={15} />
          </button>
          <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded", viewMode === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600")}>
            <Grid size={15} />
          </button>
        </div>
      </div>
      {q.isLoading ? (
        <div className="flex items-center justify-center py-14 text-slate-400 text-sm gap-2"><Loader2 size={15} className="animate-spin" /> Loading documents…</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400">
          <FolderOpen size={26} className="mb-2" />
          <p className="text-sm">{search ? "No documents match your search." : "No documents uploaded yet."}</p>
        </div>
      ) : viewMode === "list" ? (
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Document Name", "Type", "Size", "Status", "Expiry", "Owner", ""].map((h, i) => (
                <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(doc => (
              <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={14} className="text-red-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{prettyType(doc.type)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{fmtBytes(doc.sizeBytes)}</td>
                <td className="px-4 py-3"><StatusChip status={doc.status.toLowerCase()} /></td>
                <td className={cn("px-4 py-3 text-sm", doc.status === "EXPIRED" ? "text-red-600 font-medium" : doc.status === "EXPIRING" ? "text-orange-600 font-medium" : "text-slate-500")}>
                  {doc.expiryAt ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{doc.ownerLabel ?? prettyType(doc.ownerType)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {doc.hasFile && (
                      <button onClick={() => void downloadDocumentFile(doc)} title="Download"
                        className="p-1 hover:bg-slate-100 rounded cursor-pointer">
                        <Download size={13} className="text-slate-400" />
                      </button>
                    )}
                    {doc.status === "UPLOADED" && (
                      <>
                        <button
                          onClick={() => updateStatus.mutate({ id: doc.id, status: "VERIFIED" })}
                          disabled={updateStatus.isPending}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: doc.id, status: "FAILED" })}
                          disabled={updateStatus.isPending}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="grid grid-cols-4 gap-3 p-4">
          {rows.map(doc => (
            <div key={doc.id} onClick={() => doc.hasFile && void downloadDocumentFile(doc)}
              className="border border-[var(--color-border)] rounded-xl p-4 hover:border-[#1B75BC]/30 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <FileText size={18} className="text-red-500" />
              </div>
              <p className="text-xs font-medium text-slate-700 leading-tight mb-1 line-clamp-2">{doc.name}</p>
              <p className="text-xs text-slate-400 mb-2">{fmtBytes(doc.sizeBytes)}</p>
              <StatusChip status={doc.status.toLowerCase()} />
              {doc.status === "UPLOADED" && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: doc.id, status: "VERIFIED" }); }}
                    disabled={updateStatus.isPending}
                    className="flex-1 px-1 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: doc.id, status: "FAILED" }); }}
                    disabled={updateStatus.isPending}
                    className="flex-1 px-1 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── UPLOAD (wired to POST /api/documents) ────────────────────────────────────
interface QueueItem { file: File; status: "queued" | "uploading" | "done" | "error" }

function UploadView() {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [docType, setDocType] = useState<DocumentTypeDto>("PASSPORT");
  const [customerId, setCustomerId] = useState("");
  const [expiryAt, setExpiryAt] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();
  const customers = useCustomers({ page: 1, pageSize: 100 });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const fresh = Array.from(files).map<QueueItem>(file => ({ file, status: "queued" }));
    setQueue(q => [...q, ...fresh]);
  };

  const startUpload = async () => {
    if (!customerId || upload.isPending) return;
    for (const [i, item] of queue.entries()) {
      if (item.status !== "queued") continue;
      setQueue(q => q.map((x, j) => (j === i ? { ...x, status: "uploading" } : x)));
      try {
        await upload.mutateAsync({
          file: item.file, type: docType, name: item.file.name,
          customerId, expiryAt: expiryAt || undefined,
        });
        setQueue(q => q.map((x, j) => (j === i ? { ...x, status: "done" } : x)));
      } catch {
        setQueue(q => q.map((x, j) => (j === i ? { ...x, status: "error" } : x)));
      }
    }
  };

  const pending = queue.filter(u => u.status === "queued").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Upload Documents</h2>
          <p className="text-sm text-slate-500 mt-0.5">Supports PDF, JPG, PNG — max 10 MB</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInput.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-16 transition-all cursor-pointer",
          dragging ? "border-[#1B75BC] bg-[#1B75BC]/5" : "border-slate-300 bg-[var(--color-surface)] hover:border-[#1B75BC]/40 hover:bg-slate-50"
        )}>
        <input ref={fileInput} type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all",
          dragging ? "bg-[#1B75BC] text-white" : "bg-slate-100 text-slate-400")}>
          <Upload size={28} />
        </div>
        <p className="text-base font-semibold text-slate-700">
          {dragging ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-slate-400 mt-1 mb-4">or click to browse from your computer</p>
        <span className="px-5 py-2 bg-[#1B75BC] text-white text-sm rounded-lg hover:bg-[#14588F]">
          Browse Files
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Upload queue */}
        <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Upload Queue</h3>
          {queue.length === 0 ? (
            <p className="text-sm text-slate-400">No files selected yet.</p>
          ) : (
            <div className="space-y-3">
              {queue.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{u.file.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-slate-400">{fmtBytes(u.file.size)}</span>
                        {u.status === "done" && <CheckCircle size={14} className="text-emerald-500" />}
                        {u.status === "error" && <XCircle size={14} className="text-red-500" />}
                        {u.status === "uploading" && <Loader2 size={14} className="text-[#1B75BC] animate-spin" />}
                        {u.status === "queued" && <Clock size={14} className="text-slate-400" />}
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all",
                        u.status === "done" ? "bg-emerald-500 w-full" : u.status === "error" ? "bg-red-400 w-full" : u.status === "uploading" ? "bg-[#1B75BC] w-2/3" : "bg-slate-200 w-0")} />
                    </div>
                  </div>
                  {u.status === "queued" && (
                    <button onClick={() => setQueue(q => q.filter((_, j) => j !== i))}
                      className="p-1 hover:bg-slate-100 rounded flex-shrink-0 cursor-pointer">
                      <X size={14} className="text-slate-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata form — applies to every queued file */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Document Metadata</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value as DocumentTypeDto)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{prettyType(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer / Owner</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Select customer…</option>
                {(customers.data?.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date (optional)</label>
              <input type="date" value={expiryAt} onChange={e => setExpiryAt(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
            </div>
            <p className="text-xs text-slate-400">OCR fields are manual entry — review documents after upload.</p>
            <button onClick={() => void startUpload()} disabled={!customerId || pending === 0}
              className={cn("w-full py-2 text-sm rounded-lg mt-1",
                customerId && pending > 0 ? "bg-[#1B75BC] text-white hover:bg-[#14588F] cursor-pointer" : "bg-slate-100 text-slate-400 cursor-not-allowed")}>
              Upload {pending > 0 ? `${pending} file${pending > 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </div>
      </div>

      <DocLibrary />
    </div>
  );
}

// ─── OCR VALIDATION ───────────────────────────────────────────────────────────
function OcrView() {
  const docs = useErpDocuments({ type: "PASSPORT", pageSize: 50 });
  const runOcr = useRunOcr();
  const ocrDocs = (docs.data?.data ?? []).filter((d) => d.hasFile);
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? ocrDocs[0]?.id ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">OCR Validation</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Review and correct extracted field data</p>
          {ocrDocs.length > 0 && (
            <select value={activeId ?? ""} onChange={(e) => setSelected(e.target.value || null)}
              className="mt-2 text-xs border border-[var(--color-border)] rounded-lg px-2 py-1">
              {ocrDocs.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.ownerLabel ?? d.id}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => activeId && runOcr.mutate(activeId)}
            disabled={!activeId || runOcr.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50">
            {runOcr.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Re-run OCR
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState variant="no-data" title="OCR field review"
          desc="Run OCR on a document to extract passport fields for review. Extracted fields will appear here." />
      </div>
    </div>
  );
}

// ─── VERSION CONTROL (deferred — no versions endpoint) ────────────────────────
function VersionsView() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Version Control</h2>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState variant="coming-soon" title="Version Control"
          desc="Document version history is planned for a later release." />
      </div>
    </div>
  );
}

// ─── DIGITAL SIGNATURE (deferred — no signatures endpoint) ────────────────────
function SignatureView() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Digital Signature</h2>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState variant="coming-soon" title="Digital Signature"
          desc="E-signature collection is planned for a later release." />
      </div>
    </div>
  );
}

// ─── EXPIRY REMINDERS (derived from GET /api/documents) ───────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

const fmtExpiryDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface ExpiryRow {
  id: string;
  name: string;
  type: string;
  customer: string;
  expiry: string;
  daysLeft: number;
  status: string;
}

function ExpiryView() {
  const q = useErpDocuments({ pageSize: 100 });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: ExpiryRow[] = (q.data?.data ?? [])
    .filter((d): d is DocumentDto & { expiryAt: string } => d.expiryAt != null)
    .map((d) => {
      const daysLeft = Math.round((new Date(d.expiryAt).getTime() - today.getTime()) / DAY_MS);
      const status = daysLeft < 0 ? "expired" : daysLeft <= 30 ? "expiring" : d.status.toLowerCase();
      return {
        id: d.id,
        name: d.name,
        type: prettyType(d.type),
        customer: d.ownerLabel ?? prettyType(d.ownerType),
        expiry: fmtExpiryDate(d.expiryAt),
        daysLeft,
        status,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const summary = [
    { label: "Expired",       count: rows.filter((r) => r.daysLeft < 0).length,                      color: "bg-red-500" },
    { label: "Expiring ≤30d", count: rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30).length, color: "bg-orange-500" },
    { label: "Expiring ≤90d", count: rows.filter((r) => r.daysLeft > 30 && r.daysLeft <= 90).length, color: "bg-amber-500" },
    { label: "Valid",         count: rows.filter((r) => r.daysLeft > 90).length,                     color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Expiry Reminders</h2>
      <div className="grid grid-cols-4 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 text-center">
            <div className={cn("w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center", s.color)}>
              <Bell size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        {q.isLoading ? (
          <div className="flex items-center justify-center py-14 text-slate-400 text-sm gap-2">
            <Loader2 size={15} className="animate-spin" /> Loading documents…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState variant="no-data" title="No documents with expiry dates"
            desc="Documents that have an expiry date will appear here so you can track upcoming renewals." />
        ) : (
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-[var(--color-border)]">
                {["Document", "Type", "Customer", "Expiry Date", "Days Left", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{d.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{d.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{d.customer}</td>
                  <td className={cn("px-4 py-3 text-sm font-medium", d.daysLeft < 0 ? "text-red-600" : d.daysLeft < 30 ? "text-orange-600" : "text-slate-600")}>
                    {d.expiry}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-bold", d.daysLeft < 0 ? "text-red-600" : d.daysLeft < 30 ? "text-orange-600" : d.daysLeft < 90 ? "text-amber-600" : "text-emerald-600")}>
                      {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusChip status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── FILE SHARING (deferred — no share-link endpoint) ─────────────────────────
function SharingView() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">File Sharing</h2>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState variant="coming-soon" title="File Sharing"
          desc="Secure share links are planned for a later release." />
      </div>
    </div>
  );
}

// ─── WATERMARK (deferred — no watermark endpoint) ─────────────────────────────
function WatermarkView() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Watermark Tool</h2>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState variant="coming-soon" title="Watermark Tool"
          desc="Document watermarking is planned for a later release." />
      </div>
    </div>
  );
}

// ─── TRASH & ARCHIVE (deferred — no trash/archive endpoint) ───────────────────
function TrashView() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Trash & Archive</h2>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <EmptyState variant="coming-soon" title="Trash & Archive"
          desc="Trash and archive management is planned for a later release." />
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export function DocumentsModule() {
  const [view, setView] = useState<DocView>("upload");

  const renderView = () => {
    switch (view) {
      case "upload":    return <UploadView />;
      case "ocr":       return <OcrView />;
      case "versions":  return <VersionsView />;
      case "signature": return <SignatureView />;
      case "expiry":    return <ExpiryView />;
      case "sharing":   return <SharingView />;
      case "watermark": return <WatermarkView />;
      case "trash":     return <TrashView />;
      default:          return <UploadView />;
    }
  };

  return (
    <div className="p-5 md:p-7">
      <ModulePage title="Documents" subtitle="Upload, verify, sign & manage document lifecycle">
        <div className="flex min-h-[70vh] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[#F0F2F5]">
          <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
            <div className="px-4 py-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents</h2>
            </div>
            <nav className="flex-1 py-2 no-scrollbar overflow-y-auto">
              {NAV.map(item => (
                <button key={item.id} onClick={() => setView(item.id)}
                  className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                    view === item.id ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium" : "text-slate-600 hover:bg-slate-50")}>
                  <item.icon size={15} className={view === item.id ? "text-[#1B75BC]" : "text-slate-400"} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-100">
              <div className="text-xs text-slate-400 mb-1">Storage used</div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-[#1B75BC] rounded-full" style={{ width: "34%" }} />
              </div>
              <p className="text-xs text-slate-500">3.4 GB / 10 GB</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">{renderView()}</div>
          </div>
        </div>
      </ModulePage>
    </div>
  );
}
