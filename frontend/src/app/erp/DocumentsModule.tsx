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

const TRASH_DOCS = [
  { id:"DOC-T01", name:"Old_Hajj_Permit_2023.pdf", deletedAt:"Jul 8", size:"1.4 MB" },
  { id:"DOC-T02", name:"Expired_Insurance_2022.pdf", deletedAt:"Jun 30", size:"2.1 MB" },
  { id:"DOC-T03", name:"Draft_Contract_v1.pdf", deletedAt:"Jun 25", size:"0.6 MB" },
];

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

// ─── VERSION CONTROL ──────────────────────────────────────────────────────────
const VERSIONS = [
  { v:"v3.0", date:"Jul 14, 2024  10:42 AM", user:"Admin (System)", size:"2.4 MB", note:"OCR auto-corrected Given Names field", current:true  },
  { v:"v2.1", date:"Jul 12, 2024  03:15 PM", user:"Rahim Khan",     size:"2.4 MB", note:"Metadata tags updated",                current:false },
  { v:"v2.0", date:"Jul 10, 2024  09:00 AM", user:"OCR Engine",     size:"2.4 MB", note:"Initial OCR extraction applied",       current:false },
  { v:"v1.0", date:"Jul 8, 2024   11:30 AM", user:"Abdullah Chowdhury", size:"2.2 MB", note:"Original upload",                  current:false },
];

function VersionsView() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Version Control</h2>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Version History</p>
            <p className="text-xs text-slate-400">Passport_Abdullah_Al-Mamun.pdf</p>
          </div>
          <div className="p-4 space-y-0 relative">
            {/* Vertical spine */}
            <div className="absolute left-[30px] top-8 bottom-8 w-px bg-slate-200" />
            {VERSIONS.map((v, i) => (
              <div key={i} onClick={() => setSelected(i)}
                className={cn("relative flex gap-3 pb-5 cursor-pointer", i === VERSIONS.length - 1 && "pb-0")}>
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 mt-0.5 transition-all",
                  v.current ? "border-[#1B75BC] bg-[#1B75BC]" : selected === i ? "border-[#1B75BC] bg-[var(--color-surface)]" : "border-slate-300 bg-[var(--color-surface)]")}>
                  {v.current && <div className="w-2 h-2 rounded-full bg-[var(--color-surface)]" />}
                </div>
                <div className={cn("flex-1 p-3 rounded-lg border transition-all",
                  selected === i ? "border-[#1B75BC]/30 bg-[#1B75BC]/5" : "border-transparent hover:bg-slate-50")}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#1B75BC] font-mono">{v.v}</span>
                    {v.current && <span className="text-xs bg-[#1B75BC] text-white px-1.5 rounded-full">current</span>}
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{v.note}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{v.user}</p>
                  <p className="text-xs text-slate-400">{v.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2 space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-slate-800">{VERSIONS[selected].v} — {VERSIONS[selected].note}</p>
                <p className="text-xs text-slate-400 mt-0.5">{VERSIONS[selected].date} · {VERSIONS[selected].user} · {VERSIONS[selected].size}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
                  <Eye size={13} /> Preview
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
                  <Download size={13} /> Download
                </button>
                {!VERSIONS[selected].current && (
                  <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
                    <RotateCcw size={13} /> Restore
                  </button>
                )}
              </div>
            </div>
            {/* Diff view placeholder */}
            <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs space-y-1.5">
              <p className="text-slate-400 mb-2">— Field diff vs previous version —</p>
              <div className="flex gap-3">
                <span className="w-32 text-slate-500 shrink-0">Given Names</span>
                <div className="flex gap-3">
                  <span className="line-through text-red-500 bg-red-50 px-1 rounded">ABDULIAH</span>
                  <ChevronRight size={12} className="text-slate-300 self-center" />
                  <span className="text-emerald-700 bg-emerald-50 px-1 rounded">ABDULLAH</span>
                </div>
              </div>
              <div className="flex gap-3 text-slate-400">
                <span className="w-32 shrink-0">All other fields</span>
                <span>unchanged</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Total Versions", value:"4" },
              { label:"Last Modified", value:"Jul 14" },
              { label:"Total Changes", value:"3" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DIGITAL SIGNATURE ────────────────────────────────────────────────────────
const SIGNERS = [
  { name:"Md. Abdullah Al-Mamun", role:"Customer",        email:"abdullah@gmail.com",   status:"signed",  date:"Jul 12" },
  { name:"Rahim Khan",            role:"Agent",           email:"rahim@rksonline.com",   status:"signed",  date:"Jul 12" },
  { name:"Abdullah Chowdhury",    role:"SM Travels Authorized",  email:"a.chowdhury@smtravelsinternational.com",  status:"pending", date:"—"      },
];

function SignatureView() {
  const [canvasActive, setCanvasActive] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Digital Signature</h2>
          <p className="text-sm text-slate-500 mt-0.5">Collect and manage legally binding e-signatures</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
          <UserPlus size={15} /> Add Signer
        </button>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {/* Document + signature pad */}
        <div className="col-span-2 space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Hajj_Service_Agreement_2024.pdf</p>
                <p className="text-xs text-slate-400">3 signatures required · 2 collected</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
                  <Eye size={13} /> Preview
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
                  <Send size={13} /> Send Reminder
                </button>
              </div>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">Waiting for 1 signature — <strong>Abdullah Chowdhury</strong> (SM Travels Authorized)</p>
            </div>
            {/* Signature canvas */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Your Signature</p>
              <div
                onClick={() => setCanvasActive(true)}
                className={cn("border-2 rounded-xl h-32 flex items-center justify-center cursor-pointer transition-all",
                  canvasActive ? "border-[#1B75BC] bg-[#1B75BC]/5" : "border-dashed border-slate-300 hover:border-[#1B75BC]/40")}>
                {canvasActive ? (
                  <p className="text-slate-400 text-sm italic">[ Signature canvas — draw here ]</p>
                ) : (
                  <p className="text-slate-400 text-sm">Click to sign</p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {["Draw","Type","Upload Image"].map(m => (
                  <button key={m} className="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">{m}</button>
                ))}
                <button onClick={() => setCanvasActive(false)} className="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-500 ml-auto">
                  Clear
                </button>
                <button className="px-4 py-1.5 text-xs bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Signer list */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <div className="px-4 py-3.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Signers</p>
          </div>
          <div className="divide-y divide-slate-50">
            {SIGNERS.map((s, i) => (
              <div key={i} className="px-4 py-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.role}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-0.5",
                    s.status === "signed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {s.status === "signed" ? `✓ Signed ${s.date}` : "Awaiting"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1B75BC] rounded-full" style={{ width: "66%" }} />
              </div>
              <span className="text-xs font-mono font-medium text-slate-600">2/3</span>
            </div>
            <button className="w-full py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              Send Reminder to Pending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EXPIRY REMINDERS ─────────────────────────────────────────────────────────
const EXPIRY_DOCS = [
  { name:"Hotel_Voucher_DarAlTawhid.pdf", type:"Hotel",   expiry:"Jul 25, 2024", daysLeft:11, customer:"SM Travels",  status:"expiring" },
  { name:"Group_Insurance_Policy.pdf",   type:"Insurance",expiry:"Jul 1, 2024",  daysLeft:-13, customer:"SM Travels", status:"expired"  },
  { name:"Visa_Application_BK0892.pdf",  type:"Visa",     expiry:"Dec 1, 2024",  daysLeft:140, customer:"Rabeya K.",  status:"pending"  },
  { name:"Company_Trade_License.pdf",    type:"License",  expiry:"Jan 31, 2025", daysLeft:201, customer:"SM Travels", status:"verified" },
  { name:"Medical_Certificate_H2024.pdf",type:"Medical",  expiry:"Oct 31, 2024", daysLeft:109, customer:"Hosne Ara",  status:"verified" },
];

function ExpiryView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Expiry Reminders</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
          <Bell size={15} /> Configure Alerts
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Expired",     count:1, color:"bg-red-500"    },
          { label:"Expiring ≤30d",count:1, color:"bg-orange-500"},
          { label:"Expiring ≤90d",count:1, color:"bg-amber-500" },
          { label:"Valid",       count:3, color:"bg-emerald-500"},
        ].map(s => (
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
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-border)]">
              {["Document","Type","Customer","Expiry Date","Days Left","Status","Action"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXPIRY_DOCS.sort((a, b) => a.daysLeft - b.daysLeft).map((d, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
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
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="text-xs text-[#1B75BC] hover:underline">Renew</button>
                    <span className="text-slate-300">·</span>
                    <button className="text-xs text-slate-500 hover:underline">Remind</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Alert Settings</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"First reminder at", value:"90 days before" },
            { label:"Second reminder at", value:"30 days before" },
            { label:"Final reminder at", value:"7 days before" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
              <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none" defaultValue={value}>
                {["90 days before","60 days before","30 days before","14 days before","7 days before"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          {["Email","SMS","System Notification"].map(ch => (
            <label key={ch} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#1B75BC]" /> {ch}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FILE SHARING ─────────────────────────────────────────────────────────────
function SharingView() {
  const [shareMode, setShareMode] = useState<"link" | "email">("link");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">File Sharing</h2>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <DocLibrary />
        </div>
        <div className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Share Document</h3>
            <p className="text-xs text-slate-500 mb-3">Passport_Abdullah_Al-Mamun.pdf</p>
            <div className="flex gap-2 mb-4">
              {(["link","email"] as const).map(m => (
                <button key={m} onClick={() => setShareMode(m)}
                  className={cn("flex-1 py-2 text-sm rounded-lg font-medium transition-all",
                    shareMode === m ? "bg-[#1B75BC] text-white" : "border border-[var(--color-border)] text-slate-600 hover:bg-slate-50")}>
                  {m === "link" ? "Link" : "Email"}
                </button>
              ))}
            </div>
            {shareMode === "link" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Access Level</label>
                  <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option>View only</option><option>Download</option><option>Full access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expires After</label>
                  <select className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option>7 days</option><option>30 days</option><option>Never</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-[var(--color-border)]">
                  <span className="text-xs text-slate-500 flex-1 truncate">https://bdh.app/share/abc123…</span>
                  <button className="p-1.5 hover:bg-slate-100 rounded"><Copy size={12} className="text-slate-400" /></button>
                </div>
                <button className="w-full py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] flex items-center justify-center gap-2">
                  <Link2 size={14} /> Generate Link
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Recipient Email</label>
                  <input placeholder="email@example.com" className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Message (optional)</label>
                  <textarea rows={2} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
                </div>
                <button className="w-full py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">Send</button>
              </div>
            )}
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
            <h4 className="font-semibold text-slate-800 mb-3">Active Share Links</h4>
            <div className="space-y-2">
              {[
                { name:"Airline_Ticket…", access:"View", exp:"Jul 21", views:3 },
                { name:"Group_Insurance…", access:"Download", exp:"Aug 1", views:1 },
              ].map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                  <div>
                    <p className="text-slate-700 font-medium">{l.name}</p>
                    <p className="text-slate-400">{l.access} · exp {l.exp} · {l.views} views</p>
                  </div>
                  <button className="text-red-400 hover:text-red-600 p-1"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WATERMARK ────────────────────────────────────────────────────────────────
function WatermarkView() {
  const [text, setText] = useState("CONFIDENTIAL – SM TRAVELS");
  const [opacity, setOpacity] = useState(20);
  const [angle, setAngle] = useState(45);
  const [position, setPosition] = useState("center");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Watermark Tool</h2>
      <div className="grid grid-cols-3 gap-5">
        {/* Preview */}
        <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3">Preview</p>
          <div className="relative bg-slate-50 rounded-xl border border-[var(--color-border)] overflow-hidden" style={{ minHeight: 340 }}>
            {/* Simulated doc content */}
            <div className="p-8 space-y-3">
              {[80, 60, 72, 55, 65, 40, 70].map((w, i) => (
                <div key={i} className="h-2.5 bg-slate-200 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
            {/* Watermark overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ transform: `rotate(-${angle}deg)` }}>
              <p className="text-4xl font-bold tracking-widest select-none"
                style={{ color: `rgba(20,53,107,${opacity / 100})`, whiteSpace: "nowrap" }}>
                {text}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
              Apply to Document
            </button>
            <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Apply to All Copies
            </button>
          </div>
        </div>
        {/* Controls */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Watermark Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Watermark Text</label>
              <input value={text} onChange={e => setText(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Opacity: {opacity}%</label>
              <input type="range" min={5} max={60} value={opacity} onChange={e => setOpacity(+e.target.value)}
                className="w-full accent-[#1B75BC]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Angle: {angle}°</label>
              <input type="range" min={0} max={90} value={angle} onChange={e => setAngle(+e.target.value)}
                className="w-full accent-[#1B75BC]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
              <select value={position} onChange={e => setPosition(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
                {["center","tile","top-left","bottom-right"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preset Templates</label>
              <div className="grid grid-cols-2 gap-1.5">
                {["CONFIDENTIAL","DRAFT","COPY","VOID"].map(t => (
                  <button key={t} onClick={() => setText(t)}
                    className="py-1.5 text-xs border border-[var(--color-border)] rounded-lg hover:border-[#1B75BC] hover:text-[#1B75BC] transition-colors text-slate-600">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TRASH & ARCHIVE ──────────────────────────────────────────────────────────
function TrashView() {
  const [tab, setTab] = useState<"trash" | "archive">("trash");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Trash & Archive</h2>
        {tab === "trash" && (
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 size={14} /> Empty Trash
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-2">
        {(["trash","archive"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 text-sm rounded-lg font-medium capitalize transition-all",
              tab === t ? "bg-[#1B75BC] text-white" : "border border-[var(--color-border)] text-slate-600 hover:bg-slate-50")}>
            {t === "trash" ? <><Trash2 size={13} className="inline mr-1" />Trash ({TRASH_DOCS.length})</> : <><Archive size={13} className="inline mr-1" />Archive</>}
          </button>
        ))}
      </div>
      {tab === "trash" ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-sm text-red-700">Items in trash are permanently deleted after 30 days</p>
          </div>
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Document Name","Size","Deleted",""].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRASH_DOCS.map(d => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-slate-300" />
                      <span className="text-sm text-slate-500">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{d.size}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{d.deletedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs text-[#1B75BC] hover:underline flex items-center gap-1">
                        <RotateCcw size={11} /> Restore
                      </button>
                      <span className="text-slate-300">·</span>
                      <button className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 text-center">
          <Archive size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No archived documents</p>
          <p className="text-sm text-slate-400 mt-1">Archived files are stored indefinitely and can be restored at any time</p>
          <button className="mt-4 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
            Archive Selected Documents
          </button>
        </div>
      )}
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

// re-export Send for use in OCR view where it wasn't imported
function Send({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
