import React, { useState, useRef } from "react";
import {
  Upload, FileText, FileCheck, History, Shield, Bell, Share2,
  Stamp, Trash2, Archive, Eye, Download, Edit2, MoreHorizontal,
  CheckCircle, AlertTriangle, XCircle, Clock, Plus, X, Search,
  Filter, Tag, Star, Lock, Link2, Copy, RotateCcw, ZoomIn,
  ChevronRight, ChevronDown, ChevronLeft, Layers, RefreshCw,
  Users, UserPlus, Grid, List, FilePlus, FolderOpen, Loader2, Scan,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useErpDocuments, useUploadDocument, downloadDocumentFile } from "../hooks/documents";
import { useCustomers } from "../hooks/crm";
import {
  useOcrPending, useDocumentOcr, useRunDocumentOcr, useCorrectDocumentOcr, useApplyOcr, useOcrHistory,
} from "../hooks/ocr";
import { DOCUMENT_TYPES } from "../lib/documentTypes"; // runtime value — NEVER from @contracts (no vite alias; bundling backend code is deliberate off-limits)
import type { DocumentTypeDto, DocumentDto } from "@contracts/document.contract";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const runOcr = useRunDocumentOcr();
  const rows: DocumentDto[] = q.data?.data ?? [];
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
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
                      <button type="button" onClick={() => void downloadDocumentFile(doc)} title="Download"
                        className="p-1 hover:bg-slate-100 rounded cursor-pointer">
                        <Download size={13} className="text-slate-400" />
                      </button>
                    )}
                    {doc.hasFile && (doc.type === "PASSPORT" || doc.type === "NID" || doc.type === "VISA") && (
                      <button
                        type="button"
                        title="Run OCR"
                        disabled={runOcr.isPending}
                        onClick={() => runOcr.mutate(doc.id)}
                        className="p-1 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-50"
                      >
                        {runOcr.isPending ? <Loader2 size={13} className="animate-spin text-[#1B75BC]" /> : <Scan size={13} className="text-[#1B75BC]" />}
                      </button>
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
              className="border border-slate-200 rounded-xl p-4 hover:border-[#1B75BC]/30 hover:bg-slate-50 cursor-pointer transition-all">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <FileText size={18} className="text-red-500" />
              </div>
              <p className="text-xs font-medium text-slate-700 leading-tight mb-1 line-clamp-2">{doc.name}</p>
              <p className="text-xs text-slate-400 mb-2">{fmtBytes(doc.sizeBytes)}</p>
              <StatusChip status={doc.status.toLowerCase()} />
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
          dragging ? "border-[#1B75BC] bg-[#1B75BC]/5" : "border-slate-300 bg-white hover:border-[#1B75BC]/40 hover:bg-slate-50"
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
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
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
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Document Metadata</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value as DocumentTypeDto)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{prettyType(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer / Owner</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Select customer…</option>
                {(customers.data?.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expiry Date (optional)</label>
              <input type="date" value={expiryAt} onChange={e => setExpiryAt(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
            </div>
            <p className="text-xs text-slate-400">Upload a passport (PDF/JPG/PNG), run OCR, correct fields, then Apply to customer/booking.</p>
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

// ─── OCR VALIDATION (live) ────────────────────────────────────────────────────
type OcrFieldRow = { key: string; label: string; value: string; confidence: number; uncertain: boolean };

function buildOcrRows(doc: {
  ocrName: string | null;
  ocrPassportNo: string | null;
  ocrDob: string | null;
  ocrExpiry: string | null;
  ocrNationality: string | null;
  ocrGender?: string | null;
  ocrIssueCountry?: string | null;
  ocrMrz?: string | null;
  ocrConfidence: number | null;
  ocrCorrectedFields?: Record<string, { original: string | null; corrected: string }> | null;
}): OcrFieldRow[] {
  const conf = doc.ocrConfidence ?? 0;
  const fieldConf = (key: string, base: number) => {
    if (doc.ocrCorrectedFields?.[key]) return 100;
    return base;
  };
  const rows: OcrFieldRow[] = [
    { key: "fullName", label: "Full Name", value: doc.ocrName ?? "", confidence: fieldConf("fullName", conf), uncertain: conf < 80 && !doc.ocrCorrectedFields?.fullName },
    { key: "passportNumber", label: "Passport No.", value: doc.ocrPassportNo ?? "", confidence: fieldConf("passportNumber", conf), uncertain: conf < 80 && !doc.ocrCorrectedFields?.passportNumber },
    { key: "dateOfBirth", label: "Date of Birth", value: doc.ocrDob ?? "", confidence: fieldConf("dateOfBirth", Math.max(0, conf - 5)), uncertain: conf < 85 },
    { key: "dateOfExpiry", label: "Expiry Date", value: doc.ocrExpiry ?? "", confidence: fieldConf("dateOfExpiry", conf), uncertain: conf < 80 },
    { key: "nationality", label: "Nationality", value: doc.ocrNationality ?? "", confidence: fieldConf("nationality", conf), uncertain: conf < 80 },
    { key: "gender", label: "Gender", value: doc.ocrGender ?? "", confidence: fieldConf("gender", Math.max(0, conf - 10)), uncertain: conf < 75 },
    { key: "issueCountry", label: "Issue Country", value: doc.ocrIssueCountry ?? "", confidence: fieldConf("issueCountry", Math.max(0, conf - 10)), uncertain: conf < 75 },
    { key: "mrz", label: "MRZ", value: doc.ocrMrz ?? "", confidence: fieldConf("mrz", Math.max(0, conf - 15)), uncertain: conf < 70 },
  ];
  return rows;
}

function OcrView() {
  const { data: pending, isLoading, isError, error, refetch } = useOcrPending({ page: 1, pageSize: 50 });
  const docs = pending?.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, refetch: refetchDetail } = useDocumentOcr(selectedId);
  const runOcr = useRunDocumentOcr();
  const correct = useCorrectDocumentOcr();
  const apply = useApplyOcr();
  const qc = useQueryClient();
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "VERIFIED" | "FAILED" }) =>
      apiFetch(`/documents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { toast.success("Document status updated"); void qc.invalidateQueries({ queryKey: ["ocr"] }); void qc.invalidateQueries({ queryKey: ["documents"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  React.useEffect(() => {
    if (!selectedId && docs.length) setSelectedId(docs[0]!.id);
  }, [docs, selectedId]);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [phone, setPhone] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!detail) return;
    setDraft({
      fullName: detail.ocrName ?? "",
      passportNumber: detail.ocrPassportNo ?? "",
      dateOfBirth: detail.ocrDob ?? "",
      dateOfExpiry: detail.ocrExpiry ?? "",
      nationality: detail.ocrNationality ?? "",
      gender: detail.ocrGender ?? "",
      issueCountry: detail.ocrIssueCountry ?? "",
      mrz: detail.ocrMrz ?? "",
    });
  }, [detail?.id, detail?.ocrReviewedAt, detail?.ocrName, detail?.ocrPassportNo]);

  const rows = detail ? buildOcrRows({ ...detail, ...Object.fromEntries(Object.entries(draft).map(([k, v]) => {
    const map: Record<string, string> = {
      fullName: "ocrName", passportNumber: "ocrPassportNo", dateOfBirth: "ocrDob",
      dateOfExpiry: "ocrExpiry", nationality: "ocrNationality", gender: "ocrGender",
      issueCountry: "ocrIssueCountry", mrz: "ocrMrz",
    };
    return [map[k] ?? k, v];
  })) } as never) : [];
  // Rebuild rows from draft for display
  const displayRows: OcrFieldRow[] = detail ? [
    { key: "fullName", label: "Full Name", value: draft.fullName ?? "", confidence: detail.ocrConfidence ?? 0, uncertain: (detail.ocrConfidence ?? 0) < 80 && !detail.ocrCorrectedFields?.fullName },
    { key: "passportNumber", label: "Passport No.", value: draft.passportNumber ?? "", confidence: detail.ocrConfidence ?? 0, uncertain: (detail.ocrConfidence ?? 0) < 80 && !detail.ocrCorrectedFields?.passportNumber },
    { key: "dateOfBirth", label: "Date of Birth", value: draft.dateOfBirth ?? "", confidence: Math.max(0, (detail.ocrConfidence ?? 0) - 5), uncertain: (detail.ocrConfidence ?? 0) < 85 },
    { key: "dateOfExpiry", label: "Expiry Date", value: draft.dateOfExpiry ?? "", confidence: detail.ocrConfidence ?? 0, uncertain: (detail.ocrConfidence ?? 0) < 80 },
    { key: "nationality", label: "Nationality", value: draft.nationality ?? "", confidence: detail.ocrConfidence ?? 0, uncertain: (detail.ocrConfidence ?? 0) < 80 },
    { key: "gender", label: "Gender", value: draft.gender ?? "", confidence: Math.max(0, (detail.ocrConfidence ?? 0) - 10), uncertain: (detail.ocrConfidence ?? 0) < 75 },
    { key: "issueCountry", label: "Issue Country", value: draft.issueCountry ?? "", confidence: Math.max(0, (detail.ocrConfidence ?? 0) - 10), uncertain: (detail.ocrConfidence ?? 0) < 75 },
    { key: "mrz", label: "MRZ", value: draft.mrz ?? "", confidence: Math.max(0, (detail.ocrConfidence ?? 0) - 15), uncertain: (detail.ocrConfidence ?? 0) < 70 },
  ].map((r) => ({
    ...r,
    uncertain: r.uncertain || !r.value,
    confidence: detail.ocrCorrectedFields?.[r.key] ? 100 : r.confidence,
  })) : [];

  const failed = displayRows.filter((f) => f.uncertain).length;
  const conf = detail?.ocrConfidence ?? 0;

  const saveCorrections = async () => {
    if (!selectedId) return;
    await correct.mutateAsync({ id: selectedId, fields: draft });
    void refetchDetail();
  };

  const onApply = async () => {
    if (!selectedId || !detail) return;
    if (!phone.trim() && !detail.customerId) {
      toast.error("Enter customer phone to create/link customer on Apply");
      return;
    }
    const corrected: Record<string, string> = {};
    for (const [k, v] of Object.entries(draft)) {
      const orig = (detail.ocrOriginalFields?.[k] as string | undefined)
        ?? (detail as never)[`ocr${k[0]!.toUpperCase()}${k.slice(1)}` as never];
      if (v && String(orig ?? "") !== v) corrected[k] = v;
    }
    await apply.mutateAsync({
      target: "customer",
      documentId: selectedId,
      customerId: detail.customerId ?? undefined,
      phone: phone.trim() || undefined,
      createCustomer: true,
      fields: {
        fullName: draft.fullName,
        passportNumber: draft.passportNumber,
        dateOfBirth: draft.dateOfBirth,
        dateOfExpiry: draft.dateOfExpiry,
        nationality: draft.nationality,
        gender: draft.gender,
        issueCountry: draft.issueCountry,
        mrz: draft.mrz,
        confidence: conf,
      },
      correctedFields: Object.keys(corrected).length ? corrected : undefined,
    });
    void refetch();
    void refetchDetail();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">OCR Validation</h2>
          <p className="text-sm text-slate-500 mt-0.5">Review extracted fields · correct · Apply to customer / booking</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!selectedId || runOcr.isPending}
            onClick={() => selectedId && runOcr.mutate(selectedId)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
          >
            {runOcr.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Re-run OCR
          </button>
          <button
            type="button"
            disabled={!selectedId || apply.isPending}
            onClick={() => void onApply()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {apply.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Apply to Customer
          </button>
        </div>
      </div>

      {isError && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl">{(error as Error)?.message || "Failed to load OCR queue"} <button type="button" className="underline ml-2" onClick={() => refetch()}>Retry</button></div>}

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-2 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">OCR Queue · {pending?.total ?? 0}</p>
            </div>
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : docs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No OCR results yet. Upload a passport and run OCR from the library.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {docs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={cn("w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors", selectedId === d.id && "bg-[#1B75BC]/5")}
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {d.ocrStatus} · {d.ocrConfidence ?? 0}% · {d.customerName || d.travelerName || d.bookingNo || "unlinked"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {detail && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Document</p>
                {detail.hasFile && (
                  <button type="button" onClick={() => downloadDocumentFile(detail)} className="flex items-center gap-1 text-xs text-[#1B75BC] hover:underline">
                    <Download size={12} /> Download / Preview
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{detail.id}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Overall confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", conf >= 90 ? "bg-emerald-500" : conf >= 70 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${conf}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{conf}%</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Customer: {detail.customerName || "—"}</p>
                <p>Booking: {detail.bookingNo || "—"}</p>
                <p>Reviewer: {detail.ocrReviewedById || "—"}</p>
                <p>Applied: {detail.ocrAppliedAt ? detail.ocrAppliedAt.slice(0, 19).replace("T", " ") : "—"}</p>
              </div>
              {!detail.customerId && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer phone (for Apply)</label>
                  <input className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801…" />
                </div>
              )}
              <div className="flex items-center gap-3">
                {failed > 0 ? <AlertTriangle size={18} className="text-red-500" /> : <CheckCircle size={18} className="text-emerald-500" />}
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {failed > 0 ? `${failed} field${failed > 1 ? "s" : ""} need review` : "Fields look complete"}
                  </p>
                  <p className="text-xs text-slate-400">{displayRows.length - failed}/{displayRows.length} confident</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Extracted Fields</p>
            <p className="text-xs text-slate-400 mt-0.5">Uncertain values highlighted · click to correct</p>
          </div>
          {!detail ? (
            <div className="py-16 text-center text-sm text-slate-400">Select a document from the OCR queue</div>
          ) : (
            <>
              <table className="w-full min-w-[680px] md:min-w-0">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Field", "Extracted Value", "Confidence", "Status", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((f) => (
                    <tr key={f.key} className={cn("border-b border-slate-50 hover:bg-slate-50", f.uncertain && "bg-red-50/30")}>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium whitespace-nowrap">{f.label}</td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {editKey === f.key ? (
                          <div className="flex items-center gap-2">
                            <input value={editVal} onChange={(e) => setEditVal(e.target.value)}
                              className="border border-[#1B75BC] rounded px-2 py-1 text-sm font-mono w-full focus:outline-none" />
                            <button type="button" onClick={() => { setDraft((d) => ({ ...d, [f.key]: editVal })); setEditKey(null); }} className="text-emerald-600">
                              <CheckCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className={f.uncertain ? "text-red-600 font-semibold" : "text-slate-800"}>{f.value || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", f.confidence >= 90 ? "bg-emerald-500" : f.confidence >= 70 ? "bg-amber-400" : "bg-red-400")}
                              style={{ width: `${Math.min(100, f.confidence)}%` }} />
                          </div>
                          <span className="text-xs font-mono font-medium">{f.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {f.uncertain ? <XCircle size={15} className="text-red-500" /> : <CheckCircle size={15} className="text-emerald-500" />}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => { setEditKey(f.key); setEditVal(f.value); }} className="p-1 hover:bg-slate-100 rounded">
                          <Edit2 size={13} className="text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
                <button type="button" disabled={correct.isPending} onClick={() => void saveCorrections()} className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50">
                  Save Corrections
                </button>
                <button type="button" disabled={statusMut.isPending || !selectedId} onClick={() => selectedId && statusMut.mutate({ id: selectedId, status: "VERIFIED" })} className="px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50">
                  Approve & Verify
                </button>
                <button type="button" disabled={statusMut.isPending || !selectedId} onClick={() => selectedId && statusMut.mutate({ id: selectedId, status: "FAILED" })} className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 ml-auto">
                  Reject Document
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OCR / DOCUMENT HISTORY (live audit) ──────────────────────────────────────
function VersionsView() {
  const { data, isLoading, isError, error, refetch } = useOcrHistory({ page: 1, pageSize: 50 });
  const rows = data?.data ?? [];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">OCR History</h2>
        <p className="text-sm text-slate-500 mt-0.5">Uploader / reviewer audit trail from activity log</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {isError ? (
          <div className="p-6 text-sm text-red-600">{(error as Error)?.message} <button type="button" className="underline" onClick={() => refetch()}>Retry</button></div>
        ) : isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : (
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["When", "Action", "Document / Target", "User"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{r.createdAt.slice(0, 19).replace("T", " ")}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.action}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.target || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{r.userId || "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">No OCR audit events yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── DIGITAL SIGNATURE ────────────────────────────────────────────────────────
const SIGNERS = [
  { name:"Md. Abdullah Al-Mamun", role:"Customer",        email:"abdullah@gmail.com",   status:"signed",  date:"Jul 12" },
  { name:"Rahim Khan",            role:"Agent",           email:"rahim@rksonline.com",   status:"signed",  date:"Jul 12" },
  { name:"Abdullah Chowdhury",    role:"BDH Authorized",  email:"a.chowdhury@bdh.com",  status:"pending", date:"—"      },
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
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Hajj_Service_Agreement_2024.pdf</p>
                <p className="text-xs text-slate-400">3 signatures required · 2 collected</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <Eye size={13} /> Preview
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                  <Send size={13} /> Send Reminder
                </button>
              </div>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">Waiting for 1 signature — <strong>Abdullah Chowdhury</strong> (BDH Authorized)</p>
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
                  <button key={m} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">{m}</button>
                ))}
                <button onClick={() => setCanvasActive(false)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 ml-auto">
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
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
  { name:"Hotel_Voucher_DarAlTawhid.pdf", type:"Hotel",   expiry:"Jul 25, 2024", daysLeft:11, customer:"BDH Travels",  status:"expiring" },
  { name:"Group_Insurance_Policy.pdf",   type:"Insurance",expiry:"Jul 1, 2024",  daysLeft:-13, customer:"BDH Travels", status:"expired"  },
  { name:"Visa_Application_BK0892.pdf",  type:"Visa",     expiry:"Dec 1, 2024",  daysLeft:140, customer:"Rabeya K.",  status:"pending"  },
  { name:"Company_Trade_License.pdf",    type:"License",  expiry:"Jan 31, 2025", daysLeft:201, customer:"BDH Travels", status:"verified" },
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
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <div className={cn("w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center", s.color)}>
              <Bell size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
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
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Alert Settings</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"First reminder at", value:"90 days before" },
            { label:"Second reminder at", value:"30 days before" },
            { label:"Final reminder at", value:"7 days before" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" defaultValue={value}>
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
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Share Document</h3>
            <p className="text-xs text-slate-500 mb-3">Passport_Abdullah_Al-Mamun.pdf</p>
            <div className="flex gap-2 mb-4">
              {(["link","email"] as const).map(m => (
                <button key={m} onClick={() => setShareMode(m)}
                  className={cn("flex-1 py-2 text-sm rounded-lg font-medium transition-all",
                    shareMode === m ? "bg-[#1B75BC] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50")}>
                  {m === "link" ? "Link" : "Email"}
                </button>
              ))}
            </div>
            {shareMode === "link" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Access Level</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option>View only</option><option>Download</option><option>Full access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expires After</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option>7 days</option><option>30 days</option><option>Never</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
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
                  <input placeholder="email@example.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Message (optional)</label>
                  <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
                </div>
                <button className="w-full py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">Send</button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
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
  const [text, setText] = useState("CONFIDENTIAL – BDH TRAVELS");
  const [opacity, setOpacity] = useState(20);
  const [angle, setAngle] = useState(45);
  const [position, setPosition] = useState("center");
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Watermark Tool</h2>
      <div className="grid grid-cols-3 gap-5">
        {/* Preview */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-800 mb-3">Preview</p>
          <div className="relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden" style={{ minHeight: 340 }}>
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
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Watermark Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Watermark Text</label>
              <input value={text} onChange={e => setText(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
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
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {["center","tile","top-left","bottom-right"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Preset Templates</label>
              <div className="grid grid-cols-2 gap-1.5">
                {["CONFIDENTIAL","DRAFT","COPY","VOID"].map(t => (
                  <button key={t} onClick={() => setText(t)}
                    className="py-1.5 text-xs border border-slate-200 rounded-lg hover:border-[#1B75BC] hover:text-[#1B75BC] transition-colors text-slate-600">
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
              tab === t ? "bg-[#1B75BC] text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {t === "trash" ? <><Trash2 size={13} className="inline mr-1" />Trash ({TRASH_DOCS.length})</> : <><Archive size={13} className="inline mr-1" />Archive</>}
          </button>
        ))}
      </div>
      {tab === "trash" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
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
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Archive size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No archived documents</p>
          <p className="text-sm text-slate-400 mt-1">Archived files are stored indefinitely and can be restored at any time</p>
          <button className="mt-4 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
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
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
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
