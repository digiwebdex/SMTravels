import { useState } from "react";
import { Upload, FileText, Download, Trash2, User } from "lucide-react";
import { ErrorBanner, SkeletonTable } from "../../lib/ds";
import {
  useEmployees, useEmployeeDocuments, useUploadEmployeeDocument, useDeleteEmployeeDocument,
  downloadEmployeeDocument, type EmployeeDocumentDto,
} from "../../hooks/hr";
import { Card, Field, PrimaryBtn, fmtDate, inputCls, selectCls } from "./ui";

const DOC_TYPES = ["OFFER_LETTER", "APPOINTMENT_LETTER", "CONTRACT", "PASSPORT", "NATIONAL_ID", "CERTIFICATE", "RESUME", "MEDICAL", "DRIVING_LICENSE", "OTHER"];

function DocRow({ doc, employeeId, onDelete }: { doc: EmployeeDocumentDto; employeeId: string; onDelete: () => void }) {
  const expiringSoon = doc.expiryDate && new Date(doc.expiryDate).getTime() - Date.now() < 30 * 86400_000;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary-tint)] flex items-center justify-center flex-shrink-0">
          <FileText size={14} className="text-[var(--color-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] truncate">{doc.title}</p>
          <p className="text-[10px] text-[var(--color-text-faint)]">
            {doc.type.replace(/_/g, " ")} · v{doc.version}
            {doc.expiryDate && <span className={expiringSoon ? "text-[var(--color-danger)] font-semibold" : ""}> · expires {fmtDate(doc.expiryDate)}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button type="button" onClick={() => downloadEmployeeDocument(employeeId, doc)} aria-label={`Download ${doc.title}`}
          className="text-[var(--color-text-faint)] hover:text-[var(--color-primary)] cursor-pointer p-1.5"><Download size={14} /></button>
        <button type="button" onClick={onDelete} aria-label={`Remove ${doc.title}`}
          className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] cursor-pointer p-1.5"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function UploadForm({ employeeId }: { employeeId: string }) {
  const uploadMut = useUploadEmployeeDocument();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("OTHER");
  const [title, setTitle] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const canUpload = file && title.trim();
  const submit = () => {
    if (!file || !title.trim()) return;
    uploadMut.mutate({ employeeId, file, type, title: title.trim(), expiryDate: expiryDate || undefined },
      { onSuccess: () => { setFile(null); setTitle(""); setExpiryDate(""); } });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
      <Field label="Title" required><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Passport copy" /></Field>
      <Field label="Type">
        <select className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </Field>
      <Field label="Expiry (optional)"><input type="date" className={inputCls} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></Field>
      <Field label="File" required>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-[11px] file:mr-2 file:px-3 file:py-1.5 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-primary)] file:text-[var(--color-primary-fg)] file:text-[11px] file:font-bold file:cursor-pointer" />
      </Field>
      <div className="col-span-2 md:col-span-4">
        <PrimaryBtn onClick={submit} disabled={!canUpload || uploadMut.isPending}><Upload size={13} /> {uploadMut.isPending ? "Uploading…" : "Upload Document"}</PrimaryBtn>
      </div>
    </div>
  );
}

export function DocumentsView() {
  const [employeeId, setEmployeeId] = useState("");
  const [q, setQ] = useState("");
  const { data: empResult } = useEmployees({ q: q || undefined, pageSize: 20 });
  const employees = empResult?.data ?? [];
  const { data: docs, isLoading, isError, error } = useEmployeeDocuments(employeeId || null);
  const deleteMut = useDeleteEmployeeDocument();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Field label="Search Employee">
              <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or code…" />
            </Field>
          </div>
          <div className="flex-1 min-w-[220px]">
            <Field label="Select Employee">
              <select className={selectCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Choose an employee…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} · {e.employeeCode}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Card>

      {!employeeId ? (
        <Card className="p-10 flex flex-col items-center justify-center text-center gap-2">
          <User size={28} className="text-[var(--color-text-faint)]" />
          <p className="text-[13px] font-semibold text-[var(--color-text)]">Select an employee to view documents</p>
          <p className="text-[11px] text-[var(--color-text-faint)]">Use the search box above to find them by name or employee code.</p>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <UploadForm employeeId={employeeId} />
          </Card>
          <Card>
            {isLoading ? <SkeletonTable rows={4} cols={1} /> : isError ? (
              <div className="p-4"><ErrorBanner message={(error as Error)?.message || "Failed to load documents."} /></div>
            ) : !docs || docs.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-faint)] py-8 text-center">No documents uploaded yet.</p>
            ) : docs.map((d) => (
              <DocRow key={d.id} doc={d} employeeId={employeeId} onDelete={() => deleteMut.mutate({ employeeId, docId: d.id })} />
            ))}
          </Card>
        </>
      )}
    </div>
  );
}