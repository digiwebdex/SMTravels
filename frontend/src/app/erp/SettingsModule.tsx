import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings, Mail, MessageSquare, Phone, CreditCard, ScanText,
  Database, Shield, Lock, Cpu, Building2, Users, Star, Activity,
  Check, X, Plus, Trash2, Edit2, Eye, EyeOff, RefreshCw,
  Download, Upload, AlertTriangle, CheckCircle, ChevronRight,
  Globe, Zap, Key, Server, HardDrive, Bell, Save, Copy,
  Info, GitBranch, FileText, Handshake, Truck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";
import { useIntegrationsStatus, useTestIntegration } from "../hooks/integrations";
import { useBankAccounts } from "../hooks/finance";
import {
  useAdminUsers, useUpdateUser, useRoles, useAdminBranches,
  useAgents, useCreateAgent, useUpdateAgent,
  useSuppliers, useCreateSupplier, useUpdateSupplier,
} from "../hooks/settings";
import type { AgentListItem, SupplierListItem } from "@contracts/settings.contract";
import { ModulePage } from "../design-system/patterns/ModulePage";
import { EmptyState } from "../lib/ds";

type SView =
  | "general" | "email" | "sms" | "whatsapp" | "payment"
  | "ocr" | "backup" | "roles" | "permissions" | "system"
  | "branches" | "users" | "agents" | "suppliers" | "health";

const NAV_GROUPS = [
  { label:"Core", items:[
    { id:"general"     as SView, label:"General Settings",   icon:Settings   },
    { id:"system"      as SView, label:"System Config",      icon:Cpu        },
    { id:"branches"    as SView, label:"Branch Management",  icon:Building2  },
  ]},
  { label:"Notifications", items:[
    { id:"email"       as SView, label:"Email Settings",     icon:Mail       },
    { id:"sms"         as SView, label:"SMS Settings",       icon:MessageSquare },
    { id:"whatsapp"    as SView, label:"WhatsApp Settings",  icon:Phone      },
  ]},
  { label:"Finance & Integrations", items:[
    { id:"payment"     as SView, label:"Payment Settings",   icon:CreditCard },
    { id:"ocr"         as SView, label:"OCR Settings",       icon:ScanText   },
  ]},
  { label:"Access Control", items:[
    { id:"roles"       as SView, label:"Role Management",    icon:Shield     },
    { id:"permissions" as SView, label:"Permissions Matrix", icon:Lock       },
    { id:"users"       as SView, label:"Users Management",   icon:Users      },
  ]},
  { label:"Partners", items:[
    { id:"agents"      as SView, label:"Agents",             icon:Handshake  },
    { id:"suppliers"   as SView, label:"Suppliers",          icon:Truck      },
  ]},
  { label:"Infrastructure", items:[
    { id:"backup"      as SView, label:"Backup Settings",    icon:Database   },
    { id:"health"      as SView, label:"System Health",      icon:Activity   },
  ]},
];

// ─── shared ───────────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?:React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Panel({ title, icon: Icon, iconColor="#1B75BC", children, className }: {
  title:string; icon?:React.ElementType; iconColor?:string; children:React.ReactNode; className?:string;
}) {
  return (
    <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]", className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        {Icon && <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconColor+"20" }}>
          <Icon size={14} style={{ color: iconColor }}/>
        </div>}
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, full, children }: { label:string; hint?:string; full?:boolean; children:React.ReactNode }) {
  if (full) return (
    <div className="py-3.5 border-b border-slate-50 last:border-0 space-y-1">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
  return (
    <div className="grid grid-cols-5 gap-4 items-center py-3.5 border-b border-slate-50 last:border-0">
      <div className="col-span-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

const Inp = ({ dv="", type="text", placeholder="" }: { dv?:string; type?:string; placeholder?:string }) => (
  <input type={type} defaultValue={dv} placeholder={placeholder}
    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
);
const Sel = ({ opts, dv }: { opts:string[]; dv?:string }) => (
  <select defaultValue={dv} className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none">
    {opts.map(o=><option key={o}>{o}</option>)}
  </select>
);
const Txt = ({ dv="", rows=2 }: { dv?:string; rows?:number }) => (
  <textarea rows={rows} defaultValue={dv}
    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none"/>
);

function Toggle({ on: initOn=false, label }: { on?:boolean; label?:string }) {
  const [on, setOn] = useState(initOn);
  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>setOn(v=>!v)}
        className={cn("relative w-10 h-5 rounded-full transition-colors", on?"bg-[#1B75BC]":"bg-slate-300")}>
        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", on?"left-5":"left-0.5")}/>
      </button>
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </div>
  );
}

function SecretInp({ dv="" }: { dv?:string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show?"text":"password"} defaultValue={dv}
        className="w-full px-3 py-2 pr-9 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none font-mono"/>
      <button onClick={()=>setShow(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        {show?<EyeOff size={14}/>:<Eye size={14}/>}
      </button>
    </div>
  );
}

// Honest state: there is no settings-persistence API (integration credentials
// are managed via the server environment; company settings have no endpoint).
// Rather than a misleading "Saved!" toast, the control is disabled with an explanation.
function SaveBtn() {
  return (
    <div className="flex justify-end items-center gap-3 mt-5">
      <span className="text-xs text-slate-400">Managed via server configuration</span>
      <button disabled
        title="These settings are configured on the server (environment). Saving from the UI is not enabled in this build."
        className="flex items-center gap-2 px-5 py-2 text-sm bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed">
        <Save size={14}/> Save Changes
      </button>
    </div>
  );
}

function ConnectionStatus({ configured, loading }: { configured: boolean; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-[var(--color-border)] rounded-xl text-slate-400">
        <Loader2 size={15} className="animate-spin"/><span className="text-sm">Checking connection…</span>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center gap-3 p-3.5 rounded-xl border",
      configured ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200")}>
      {configured ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0"/> : <AlertTriangle size={15} className="text-amber-500 flex-shrink-0"/>}
      <p className={cn("text-sm font-medium", configured ? "text-emerald-700" : "text-amber-700")}>
        {configured ? "Configured" : "Not configured"}
      </p>
    </div>
  );
}

function EnvKeysNote() {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-[var(--color-border)] rounded-xl">
      <Key size={15} className="text-slate-400 flex-shrink-0"/>
      <p className="text-sm text-slate-600">
        API keys live in server <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">.env.production</code> — never pasted in this UI
      </p>
    </div>
  );
}

function IntegrationTestForm({ channel, placeholder }: { channel: "email" | "sms" | "whatsapp"; placeholder: string }) {
  const [to, setTo] = useState("");
  const [sent, setSent] = useState(false);
  const test = useTestIntegration();
  const send = () => {
    if (!to.trim()) return;
    test.mutate({ channel, to: to.trim() }, {
      onSuccess: () => { setSent(true); setTimeout(() => setSent(false), 3000); },
    });
  };
  return (
    <Panel title="Send test" icon={Zap}>
      <div className="flex gap-2">
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
        <button onClick={send} disabled={test.isPending || !to.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50 whitespace-nowrap">
          {test.isPending ? <Loader2 size={14} className="animate-spin"/> : sent ? <><CheckCircle size={14}/> Sent!</> : <><Zap size={14}/> Send test</>}
        </button>
      </div>
    </Panel>
  );
}

// ─── GENERAL ─────────────────────────────────────────────────────────────────
function GeneralSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="General Settings" subtitle="Core business information and localization"/>
      <Panel title="Business Information" icon={Building2}>
        <Field label="Company Name"><Inp dv="SM Travels International & Tourism"/></Field>
        <Field label="Registration No." hint="Trade license / business reg."><Inp dv="CHG-2018-00842"/></Field>
        <Field label="Address" hint="Registered address"><Txt dv="144/A CDA Commercial Area, Agrabad, Chattogram, Bangladesh"/></Field>
        <Field label="Phone"><Inp dv="+880 31 123 4567"/></Field>
        <Field label="Email"><Inp type="email" dv="info@smtravelsinternational.com"/></Field>
        <Field label="Website"><Inp dv="https://smtravelsinternational.com"/></Field>
      </Panel>
      <Panel title="Localization" icon={Globe}>
        <Field label="Default Language"><Sel opts={["Bangla (বাংলা)","English (US)"]}/></Field>
        <Field label="Timezone"><Sel opts={["Asia/Dhaka (UTC+6)","UTC","Asia/Riyadh","Asia/Kuala_Lumpur"]}/></Field>
        <Field label="Date Format"><Sel opts={["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"]}/></Field>
        <Field label="Default Currency"><Sel opts={["BDT — Bangladeshi Taka","USD — US Dollar","SAR — Saudi Riyal"]}/></Field>
        <Field label="Fiscal Year Start"><Sel opts={["July 1","January 1","April 1"]}/></Field>
      </Panel>
      <Panel title="Branding" icon={Star}>
        <Field label="Primary Color">
          <div className="flex gap-2"><input type="color" defaultValue="#1B75BC" className="w-10 h-9 rounded-lg border border-[var(--color-border)] p-0.5 cursor-pointer"/><Inp dv="#1B75BC"/></div>
        </Field>
        <Field label="Company Logo">
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold">SM</div>
            <button disabled title="Logo upload is not available in this build"
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-[#9CA3AF] opacity-60 cursor-not-allowed"><Upload size={13}/> Upload</button>
          </div>
        </Field>
      </Panel>
      <p className="text-xs text-slate-400 px-1">Changes are not saved yet.</p>
      <SaveBtn/>
    </div>
  );
}

// ─── EMAIL ────────────────────────────────────────────────────────────────────
function EmailSettings() {
  const { data: status, isLoading } = useIntegrationsStatus();
  return (
    <div className="space-y-5">
      <PageHeader title="Email Settings" subtitle="SMTP configuration for outgoing email"/>
      <ConnectionStatus configured={!!status?.email} loading={isLoading}/>
      <EnvKeysNote/>
      <Panel title="SMTP Configuration" icon={Mail}>
        <Field label="Mail Driver" hint="Configured via server environment"><Sel opts={["SMTP","SendGrid","Mailgun","Amazon SES"]}/></Field>
        <Field label="From Name"><Inp dv="SM Travels International"/></Field>
        <Field label="Status" hint="Live credential check">
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
            status?.email ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
            {isLoading ? "Checking…" : status?.email ? "Configured" : "Not configured"}
          </span>
        </Field>
      </Panel>
      <Panel title="Email Templates" icon={Mail}>
        {["Booking Confirmation","Payment Receipt","Visa Update","Password Reset","Welcome Email"].map(t=>(
          <div key={t} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-700">{t}</span>
            <button disabled title="Editing email templates is not available in this build"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-[var(--color-border)] rounded-lg text-[#9CA3AF] opacity-60 cursor-not-allowed"><Edit2 size={11}/> Edit</button>
          </div>
        ))}
      </Panel>
      <IntegrationTestForm channel="email" placeholder="recipient@example.com"/>
    </div>
  );
}

// ─── SMS ─────────────────────────────────────────────────────────────────────
function SmsSettings() {
  const { data: status, isLoading } = useIntegrationsStatus();
  return (
    <div className="space-y-5">
      <PageHeader title="SMS Settings" subtitle="BulkSMSBD API for outgoing SMS notifications"/>
      <ConnectionStatus configured={!!status?.sms} loading={isLoading}/>
      <EnvKeysNote/>
      <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={15} className="text-blue-500 flex-shrink-0"/>
        <p className="text-sm text-blue-700">Using <strong>BulkSMSBD</strong> — credentials are managed on the server, not in this UI.</p>
      </div>
      <Panel title="BulkSMSBD API" icon={MessageSquare} iconColor="#059669">
        <Field label="Sender ID" hint="Configured via BULKSMSBD_SENDER_ID in .env.production"><Inp dv="— server managed —" placeholder="Set in .env.production"/></Field>
        <Field label="Connection">
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
            status?.sms ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
            {isLoading ? "Checking…" : status?.sms ? "Configured" : "Not configured"}
          </span>
        </Field>
      </Panel>
      <Panel title="SMS Triggers" icon={Bell}>
        {[["Booking Confirmation SMS",true],["Payment Received SMS",true],["Visa Status Update SMS",true],["Departure Reminder (48h)",true],["Document Expiry Alert",false],["OTP for Login",true]].map(([lbl,on])=>(
          <div key={lbl as string} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-700">{lbl as string}</span>
            <Toggle on={on as boolean}/>
          </div>
        ))}
      </Panel>
      <IntegrationTestForm channel="sms" placeholder="+880 1XXXXXXXXX"/>
    </div>
  );
}

// ─── WHATSAPP ────────────────────────────────────────────────────────────────
function WhatsappSettings() {
  const { data: status, isLoading } = useIntegrationsStatus();
  return (
    <div className="space-y-5">
      <PageHeader title="WhatsApp Settings" subtitle="Wasender API for WhatsApp Business messaging"/>
      <ConnectionStatus configured={!!status?.whatsapp} loading={isLoading}/>
      <EnvKeysNote/>
      <div className={cn("flex items-center gap-3 p-3.5 rounded-xl border",
        status?.whatsapp ? "bg-[#25D366]/10 border-[#25D366]/30" : "bg-amber-50 border-amber-200")}>
        <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0"><Phone size={12} className="text-white"/></div>
        <p className={cn("text-sm font-medium", status?.whatsapp ? "text-[#1a9e4e]" : "text-amber-700")}>
          {isLoading ? "Checking connection…" : status?.whatsapp ? "Wasender API configured" : "Wasender API not configured"}
        </p>
      </div>
      <Panel title="Wasender API" icon={Phone} iconColor="#25D366">
        <Field label="Webhook URL" hint="For incoming message events">
          <div className="flex gap-2"><Inp dv="https://your-domain.com/api/whatsapp/webhook"/>
            <button onClick={() => navigator.clipboard.writeText("https://your-domain.com/api/whatsapp/webhook")}
              title="Copy webhook URL"
              className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-slate-400 hover:bg-slate-50 flex-shrink-0"><Copy size={14}/></button>
          </div>
        </Field>
        <Field label="Connection">
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
            status?.whatsapp ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
            {isLoading ? "Checking…" : status?.whatsapp ? "Configured" : "Not configured"}
          </span>
        </Field>
      </Panel>
      <Panel title="Message Templates" icon={MessageSquare} iconColor="#25D366">
        <div className="mb-3 flex justify-end">
          <button disabled title="Adding message templates is not available in this build"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[#9CA3AF] opacity-60 cursor-not-allowed"><Plus size={13}/> Add Template</button>
        </div>
        {[["booking_confirmation","approved","UTILITY"],["payment_receipt","approved","UTILITY"],["visa_approved","approved","UTILITY"],["departure_reminder","pending","MARKETING"],["otp_verification","approved","AUTHENTICATION"]].map(([name,status,cat])=>(
          <div key={name} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700 flex-1">{name}</code>
            <span className="text-xs text-slate-400">{cat}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
              status==="approved"?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{status}</span>
            <button disabled title="Viewing this template is not available in this build"
              className="p-1.5 rounded text-[#9CA3AF] opacity-60 cursor-not-allowed"><Eye size={12}/></button>
          </div>
        ))}
      </Panel>
      <IntegrationTestForm channel="whatsapp" placeholder="+880 1XXXXXXXXX"/>
    </div>
  );
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
function PaymentSettings() {
  const { data: banks, isLoading } = useBankAccounts();
  const disabledGws = [
    { name:"bKash",      logo:"bK",  color:"#E2136E" },
    { name:"Nagad",      logo:"Na",  color:"#F7941D" },
    { name:"SSLCommerz", logo:"SSL", color:"#E12219" },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="Payment Settings" subtitle="NPSB bank transfer instructions for customer portal payments"/>
      <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={15} className="text-blue-500 flex-shrink-0"/>
        <p className="text-sm text-blue-700">
          Customers pay via <strong>NPSB bank transfer</strong>, upload proof in the portal, and staff verify in Invoices → Payment Collection.
          Bank accounts are managed in <strong>Accounts → Bank Accounts</strong>.
        </p>
      </div>
      <Panel title="NPSB — Company Bank Accounts" icon={CreditCard} iconColor="#1B75BC">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4"><Loader2 size={16} className="animate-spin"/> Loading accounts…</div>
        ) : (banks ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 py-2">No active bank accounts. Add them in the Accounts module to show NPSB instructions to customers.</p>
        ) : (
          <div className="space-y-3">
            {(banks ?? []).filter((b) => b.active).map((b) => (
              <div key={b.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="font-semibold text-slate-800 text-sm">{b.name}</p>
                {b.bankName && <p className="text-xs text-slate-500 mt-0.5">{b.bankName}{b.branchName ? ` · ${b.branchName}` : ""}</p>}
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  {b.accountNumber && <span className="font-mono text-slate-700">A/C: {b.accountNumber}</span>}
                  {b.iban && <span className="font-mono text-slate-600">IBAN: {b.iban}</span>}
                  <span className="text-xs px-2 py-0.5 bg-[#1B75BC]/10 text-[#1B75BC] rounded-full font-medium">{b.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="How NPSB works" icon={FileText} iconColor="#F15A24">
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
          <li>Customer transfers to a company account above via NPSB / mobile banking.</li>
          <li>Customer submits amount, NPSB reference, and proof screenshot in the portal.</li>
          <li>Accountant approves or rejects the pending payment in Invoices → Payment Collection.</li>
        </ol>
      </Panel>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Online payment gateways — configured manually for now.</p>
      {disabledGws.map(gw=>(
        <Panel key={gw.name} title={gw.name} icon={CreditCard} iconColor={gw.color} className="opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold opacity-50" style={{ background: gw.color }}>{gw.logo}</div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-400">Not available</span>
            </div>
            <Toggle on={false} label="Disabled"/>
          </div>
          <p className="text-xs text-slate-400 mt-3">Online gateway integration is planned for a future release.</p>
        </Panel>
      ))}
    </div>
  );
}

// ─── OCR ────────────────────────────────────────────────────────────────────
function OcrSettings() {
  const { data: status, isLoading } = useIntegrationsStatus();
  return (
    <div className="space-y-5">
      <PageHeader title="OCR Settings" subtitle="Optical Character Recognition for passport & document scanning"/>
      <ConnectionStatus configured={!!status?.vision} loading={isLoading}/>
      <EnvKeysNote/>
      <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle size={15} className="text-amber-500 flex-shrink-0"/>
        <p className="text-sm text-amber-700">
          Google Vision: <strong>{isLoading ? "…" : status?.vision ? "Configured" : "Not configured"}</strong>
          {status?.gemini != null && <> · Gemini: <strong>{status.gemini ? "Configured" : "Not configured"}</strong></>}
        </p>
      </div>
      <Panel title="OCR Provider" icon={ScanText} iconColor="#7C3AED">
        <Field label="Provider"><Sel opts={["Google Vision API","OpenAI GPT-4 Vision","AWS Textract","Azure Computer Vision"]} dv="Google Vision API"/></Field>
        <Field label="Vision API" hint="GOOGLE_VISION_* in .env.production">
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
            status?.vision ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
            {isLoading ? "Checking…" : status?.vision ? "Configured" : "Not configured"}
          </span>
        </Field>
        <Field label="Model"><Sel opts={["gpt-4o","gpt-4-vision-preview","claude-sonnet-4-6"]}/></Field>
        <Field label="Confidence Threshold" hint="Min % to auto-accept field">
          <div className="flex items-center gap-3">
            <input type="range" min={50} max={99} defaultValue={85} className="flex-1 accent-[#1B75BC]"/>
            <span className="text-sm font-bold text-slate-700 w-10 text-right">85%</span>
          </div>
        </Field>
        <Field label="Auto-approve above threshold"><Toggle on={true}/></Field>
        <Field label="Flag low-confidence fields"><Toggle on={true}/></Field>
      </Panel>
      <Panel title="Supported Document Types" icon={ScanText} iconColor="#7C3AED">
        {[["Passport (MRZ zone)","Active"],["National ID (NID)","Active"],["Visa Sticker","Active"],["Birth Certificate","Disabled"],["Driving License","Disabled"]].map(([doc,status])=>(
          <div key={doc} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-700">{doc}</span>
            <Toggle on={status==="Active"}/>
          </div>
        ))}
      </Panel>
      <SaveBtn/>
    </div>
  );
}

// ─── BACKUP ──────────────────────────────────────────────────────────────────
function BackupSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="Backup Settings" subtitle="Automated database and file backup"/>
      <Panel title="Schedule" icon={Database}>
        <Field label="Auto Backup"><Toggle on={true}/></Field>
        <Field label="Frequency"><Sel opts={["Daily","Twice Daily","Weekly","Monthly"]} dv="Daily"/></Field>
        <Field label="Backup Time"><Inp dv="02:00 AM"/></Field>
        <Field label="Retention"><Sel opts={["7 days","14 days","30 days","90 days"]} dv="30 days"/></Field>
      </Panel>
      <Panel title="Storage" icon={HardDrive}>
        <Field label="Primary"><Sel opts={["Local Server","AWS S3","Google Drive","Dropbox","FTP"]} dv="Local Server"/></Field>
        <Field label="Secondary"><Sel opts={["None","AWS S3","Google Drive"]} dv="None"/></Field>
        <Field label="Backup Path"><Inp dv="/var/www/SMTravels/backups/"/></Field>
        <Field label="Include Files"><Toggle on={true} label="Upload media & documents"/></Field>
      </Panel>
      <EmptyState variant="no-data" title="Backup history"
        desc="Backups run automatically nightly on the server. Backup history is not surfaced in the UI yet." />
    </div>
  );
}

// ─── ROLES ───────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "#EF4444", COMPANY_ADMIN: "#DC2626", BRANCH_MANAGER: "#1B75BC",
  STAFF: "#64748B", ACCOUNTANT: "#2563EB", SALES_EXECUTIVE: "#0E7C66",
  VISA_EXECUTIVE: "#F15A24", HAJJ_EXECUTIVE: "#7C3AED", UMRAH_EXECUTIVE: "#9333EA",
  AGENT: "#059669", SUPPLIER: "#78716C", CUSTOMER: "#94A3B8",
};
const MODS = ["dashboard","bookings","crm","packages","accounts","invoices","reports","documents","cms","ops","settings"];

function RolesView() {
  const { data: roles, isLoading, isError } = useRoles();
  const [sel, setSel] = useState<string | null>(null);
  const selected = roles?.find((r) => r.id === (sel ?? roles[0]?.id));
  if (isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  if (isError || !roles?.length) return <p className="text-sm text-slate-500">Unable to load roles.</p>;
  const role = selected ?? roles[0];
  const permByMod = Object.fromEntries((role.permissions ?? []).map((p) => [p.module, p.access]));
  return (
    <div>
      <PageHeader title="Role Management" subtitle="System roles and module access (read-only matrix from RBAC seed)"/>
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2 max-h-[32rem] overflow-y-auto">
          {roles.map((r) => (
            <button key={r.id} onClick={() => setSel(r.id)}
              className={cn("w-full text-left p-4 rounded-xl border transition-all",
                role.id === r.id ? "border-[#1B75BC] bg-[#1B75BC]/5" : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-slate-50")}>
              <div className="flex items-center gap-2.5 mb-0.5">
                <div className="w-3 h-3 rounded-full" style={{ background: ROLE_COLORS[r.key] ?? "#64748B" }}/>
                <span className="text-sm font-semibold text-slate-800 flex-1">{r.name}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{r.userCount}</span>
              </div>
              <p className="text-xs text-slate-400 ml-5">{r.description ?? r.key}</p>
            </button>
          ))}
        </div>
        <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: ROLE_COLORS[role.key] ?? "#64748B" }}>{role.name.slice(0, 1)}</div>
            <div><p className="font-bold text-slate-800">{role.name}</p><p className="text-xs text-slate-400">{role.userCount} users · {role.isSystem ? "System role" : "Custom"}</p></div>
          </div>
          {role.description && <p className="text-sm text-slate-600">{role.description}</p>}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Module Access</p>
            <div className="grid grid-cols-2 gap-2">
              {MODS.map((mod) => {
                const access = permByMod[mod] ?? "none";
                return (
                  <div key={mod} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                    <span className="text-xs text-slate-600 capitalize">{mod}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      access === "full" ? "bg-[#1B75BC] text-white" : access === "view" ? "bg-[#1B75BC]/15 text-[#1B75BC]" : "bg-slate-100 text-slate-400")}>{access}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PERMISSIONS MATRIX ──────────────────────────────────────────────────────
type Perm = "full"|"view"|"none";
const P_ROLES = ["Super Admin","Branch Mgr","Sales Exec","Visa Officer","Accountant","Support"];
const P_MODS  = ["Dashboard","Bookings","CRM","Packages","Accounts","Invoices","Reports","Documents","CMS","Ops","Settings"];
const INIT_MATRIX: Record<string,Record<string,Perm>> = {
  "Dashboard": { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"view","Visa Officer":"view","Accountant":"view","Support":"view" },
  "Bookings":  { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"full","Visa Officer":"view","Accountant":"view","Support":"view" },
  "CRM":       { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"full","Visa Officer":"none","Accountant":"none","Support":"view" },
  "Packages":  { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"view","Visa Officer":"none","Accountant":"none","Support":"view" },
  "Accounts":  { "Super Admin":"full","Branch Mgr":"view","Sales Exec":"none","Visa Officer":"none","Accountant":"full","Support":"none" },
  "Invoices":  { "Super Admin":"full","Branch Mgr":"view","Sales Exec":"view","Visa Officer":"none","Accountant":"full","Support":"none" },
  "Reports":   { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"view","Visa Officer":"view","Accountant":"full","Support":"none" },
  "Documents": { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"view","Visa Officer":"full","Accountant":"none","Support":"view" },
  "CMS":       { "Super Admin":"full","Branch Mgr":"none","Sales Exec":"none","Visa Officer":"none","Accountant":"none","Support":"none" },
  "Ops":       { "Super Admin":"full","Branch Mgr":"full","Sales Exec":"view","Visa Officer":"view","Accountant":"view","Support":"view" },
  "Settings":  { "Super Admin":"full","Branch Mgr":"none","Sales Exec":"none","Visa Officer":"none","Accountant":"none","Support":"none" },
};
const P_CELL: Record<Perm,string> = {
  full: "bg-[#1B75BC] text-white",
  view: "bg-[#1B75BC]/15 text-[#1B75BC]",
  none: "bg-slate-100 text-slate-400",
};
const P_ICON: Record<Perm,React.ElementType> = { full:Check, view:Eye, none:X };
const CYCLE: Perm[] = ["full","view","none"];

function PermissionsMatrix() {
  const [mx, setMx] = useState(INIT_MATRIX);
  const cycle = (mod:string,role:string) => {
    const cur = mx[mod]?.[role] ?? "none";
    const next = CYCLE[(CYCLE.indexOf(cur)+1)%3];
    setMx(m=>({ ...m, [mod]:{ ...m[mod],[role]:next } }));
  };
  return (
    <div>
      <PageHeader title="Permissions Matrix" subtitle="Click any cell to cycle: Full → View → None"/>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 w-32 sticky left-0 bg-slate-50 z-10">Module</th>
                {P_ROLES.map(r=>{
                  const rc = "#64748B";
                  return <th key={r} className="text-center text-xs font-semibold px-3 py-3 min-w-24" style={{ color: rc||"#64748B" }}>{r}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {P_MODS.map((mod,mi)=>(
                <tr key={mod} className={cn("border-b border-slate-50",mi%2===0?"bg-[var(--color-surface)]":"bg-slate-50/30")}>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700 sticky left-0 bg-inherit">{mod}</td>
                  {P_ROLES.map(role=>{
                    const level = mx[mod]?.[role]??"none";
                    const Icon = P_ICON[level];
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <button onClick={()=>cycle(mod,role)}
                          className={cn("w-16 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-all hover:opacity-80 cursor-pointer",P_CELL[level])}>
                          <Icon size={10}/>{level}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-5 px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-500 font-medium">Legend:</span>
          {(["full","view","none"] as Perm[]).map(p=>{
            const Icon = P_ICON[p];
            const labels: Record<Perm,string> = { full:"Full Access",view:"View Only",none:"No Access" };
            return (
              <div key={p} className="flex items-center gap-1.5">
                <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",P_CELL[p])}><Icon size={10}/>{labels[p]}</span>
              </div>
            );
          })}
          <div className="ml-auto"><SaveBtn/></div>
        </div>
      </div>
    </div>
  );
}

// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────
function SystemConfig() {
  const qc = useQueryClient();
  const clearCaches = () => { qc.clear(); toast.success("All cached data cleared — screens will refetch."); };
  return (
    <div className="space-y-5">
      <PageHeader title="System Configuration" subtitle="Advanced ERP behaviour and performance settings"/>
      <Panel title="Application" icon={Cpu}>
        <Field label="Environment"><Sel opts={["Production","Staging","Development"]} dv="Production"/></Field>
        <Field label="Debug Mode"><Toggle on={false}/></Field>
        <Field label="Maintenance Mode"><Toggle on={false}/></Field>
        <Field label="Session Timeout" hint="Minutes of inactivity before logout"><Inp dv="60"/></Field>
        <Field label="Max Upload Size"><Sel opts={["10 MB","25 MB","50 MB","100 MB"]} dv="25 MB"/></Field>
      </Panel>
      <Panel title="Security" icon={Shield}>
        <Field label="Two-Factor Auth" hint="Require for all admin accounts"><Toggle on={true}/></Field>
        <Field label="Password Policy"><Sel opts={["Strong (8+ chars, symbols)","Medium (6+ chars)","Basic"]} dv="Strong (8+ chars, symbols)"/></Field>
        <Field label="Login Attempt Limit" hint="Lock account after N failed tries"><Inp dv="5"/></Field>
        <Field label="IP Whitelist" hint="Leave blank to allow all IPs"><Inp placeholder="103.12.x.x, 45.64.x.x"/></Field>
        <Field label="Force HTTPS"><Toggle on={true}/></Field>
      </Panel>
      <Panel title="Cache & Performance" icon={Zap}>
        <Field label="Cache Driver"><Sel opts={["File","Redis","Memcached"]} dv="Redis"/></Field>
        <Field label="Cache TTL (seconds)"><Inp dv="3600"/></Field>
        <Field label="Queue Driver"><Sel opts={["Sync","Database","Redis"]} dv="Redis"/></Field>
        <div className="pt-2">
          <button onClick={clearCaches}
            className="flex items-center gap-1.5 text-sm px-3 py-2 border border-[var(--color-border)] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"><RefreshCw size={13}/> Clear All Caches</button>
        </div>
      </Panel>
      <SaveBtn/>
    </div>
  );
}

function BranchesView() {
  const { data: branches, isLoading, isError } = useAdminBranches();
  if (isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  if (isError) return <p className="text-sm text-red-500">Failed to load branches.</p>;
  return (
    <div>
      <PageHeader title="Branch Management" subtitle="Head office and regional branches"/>
      <div className="space-y-3">
        {(branches ?? []).map((b) => (
          <div key={b.id} className={cn("bg-[var(--color-surface)] rounded-xl border p-5", b.isHq ? "border-[#1B75BC]/30 bg-[#1B75BC]/3" : "border-[var(--color-border)]")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold", b.isHq ? "bg-[#1B75BC]" : "bg-slate-400")}>{b.city.slice(0, 2)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{b.name}</p>
                    {b.isHq && <span className="text-xs px-2 py-0.5 bg-[#1B75BC] text-white rounded-full font-medium">HQ</span>}
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      b.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>{b.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-400">
                    <span>{b.city}</span><span>{b.phone ?? "—"}</span><span>{b.staffCount} staff</span>
                  </div>
                </div>
              </div>
              <div className="text-right mr-1">
                <p className="text-xs text-slate-400">Manager</p>
                <p className="text-sm font-medium text-slate-700">{b.managerName ?? "—"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AGENT_TIERS = ["SILVER", "GOLD", "PLATINUM"] as const;
const SUPPLIER_STATUSES = ["PENDING", "VERIFIED", "SUSPENDED"] as const;

type AgentForm = { name: string; agentCode: string; phone: string; email: string; tier: typeof AGENT_TIERS[number]; branchId: string };
const emptyAgentForm = (): AgentForm => ({ name: "", agentCode: "", phone: "", email: "", tier: "SILVER", branchId: "" });

function AgentsView() {
  const { data, isLoading, isError } = useAgents({ pageSize: 100 });
  const { data: branches } = useAdminBranches();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const agents = data?.data ?? [];
  const [panel, setPanel] = useState<"closed" | "create" | "edit">("closed");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentForm>(emptyAgentForm);

  const openCreate = () => { setForm(emptyAgentForm()); setEditId(null); setPanel("create"); };
  const openEdit = (a: AgentListItem) => {
    setForm({ name: a.name, agentCode: a.agentCode, phone: a.phone ?? "", email: a.email ?? "", tier: (a.tier as AgentForm["tier"]) || "SILVER", branchId: a.branchId ?? "" });
    setEditId(a.id);
    setPanel("edit");
  };
  const closePanel = () => { setPanel("closed"); setEditId(null); };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      tier: form.tier,
      ...(form.branchId ? { branchId: form.branchId } : {}),
    };
    if (panel === "create") {
      createAgent.mutate({ ...payload, ...(form.agentCode.trim() ? { agentCode: form.agentCode.trim() } : {}) }, { onSuccess: closePanel });
    } else if (editId) {
      updateAgent.mutate({ id: editId, ...payload }, { onSuccess: closePanel });
    }
  };

  const busy = createAgent.isPending || updateAgent.isPending;

  if (isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  if (isError) return <p className="text-sm text-red-500">Failed to load agents.</p>;

  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle="Travel agent partners, tiers, and commission rates"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
            <Plus size={14}/> Add Agent
          </button>
        }
      />
      <div className="flex gap-5">
        <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden", panel !== "closed" ? "flex-1" : "w-full")}>
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {["Agent", "Code", "Contact", "Branch", "Tier", "Status", "Bookings", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>{agents.map((a) => (
              <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#0E7C66]">
                      {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{a.agentCode}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-600">{a.phone ?? "—"}</p>
                  <p className="text-xs text-slate-400">{a.email ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{a.branchName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 capitalize">{a.tier.toLowerCase()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    a.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{a.bookingsCount}</td>
                <td className="px-4 py-3 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#1B75BC]" title="Edit">
                    <Edit2 size={12}/>
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {agents.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No agents found.</p>}
        </div>

        {panel !== "closed" && (
          <Panel title={panel === "create" ? "New Agent" : "Edit Agent"} icon={Handshake} className="w-80 flex-shrink-0">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              {panel === "create" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Agent Code</label>
                  <input value={form.agentCode} onChange={(e) => setForm({ ...form, agentCode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Tier</label>
                <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as AgentForm["tier"] })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none">
                  {AGENT_TIERS.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Branch</label>
                <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none">
                  <option value="">— None —</option>
                  {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} disabled={busy || !form.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                  {panel === "create" ? "Create" : "Save"}
                </button>
                <button onClick={closePanel} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

type SupplierForm = { name: string; supplierCode: string; phone: string; email: string; category: string; status: typeof SUPPLIER_STATUSES[number] };
const emptySupplierForm = (): SupplierForm => ({ name: "", supplierCode: "", phone: "", email: "", category: "", status: "PENDING" });

function SuppliersView() {
  const { data, isLoading, isError } = useSuppliers({ pageSize: 100 });
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const suppliers = data?.data ?? [];
  const [panel, setPanel] = useState<"closed" | "create" | "edit">("closed");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptySupplierForm);

  const openCreate = () => { setForm(emptySupplierForm()); setEditId(null); setPanel("create"); };
  const openEdit = (s: SupplierListItem) => {
    setForm({
      name: s.name, supplierCode: s.supplierCode, phone: s.phone ?? "", email: s.email ?? "",
      category: s.category ?? "", status: (s.status as SupplierForm["status"]) || "PENDING",
    });
    setEditId(s.id);
    setPanel("edit");
  };
  const closePanel = () => { setPanel("closed"); setEditId(null); };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.category.trim() ? { category: form.category.trim() } : {}),
    };
    if (panel === "create") {
      createSupplier.mutate({ ...payload, ...(form.supplierCode.trim() ? { supplierCode: form.supplierCode.trim() } : {}) }, { onSuccess: closePanel });
    } else if (editId) {
      updateSupplier.mutate({ id: editId, ...payload, status: form.status }, { onSuccess: closePanel });
    }
  };

  const busy = createSupplier.isPending || updateSupplier.isPending;

  if (isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  if (isError) return <p className="text-sm text-red-500">Failed to load suppliers.</p>;

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Hotel, airline, and service vendor partners"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
            <Plus size={14}/> Add Supplier
          </button>
        }
      />
      <div className="flex gap-5">
        <div className={cn("bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden", panel !== "closed" ? "flex-1" : "w-full")}>
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              {["Supplier", "Code", "Contact", "Category", "Status", "Services", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>{suppliers.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#F15A24]">
                      {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{s.supplierCode}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-600">{s.phone ?? "—"}</p>
                  <p className="text-xs text-slate-400">{s.email ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.category ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                    s.status === "VERIFIED" ? "bg-emerald-50 text-emerald-600"
                      : s.status === "SUSPENDED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>{s.status.toLowerCase()}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.servicesCount}</td>
                <td className="px-4 py-3 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-[#1B75BC]" title="Edit">
                    <Edit2 size={12}/>
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {suppliers.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No suppliers found.</p>}
        </div>

        {panel !== "closed" && (
          <Panel title={panel === "create" ? "New Supplier" : "Edit Supplier"} icon={Truck} className="w-80 flex-shrink-0">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              {panel === "create" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Supplier Code</label>
                  <input value={form.supplierCode} onChange={(e) => setForm({ ...form, supplierCode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Hotel, Airline, Visa…"
                  className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
              </div>
              {panel === "edit" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SupplierForm["status"] })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none">
                    {SUPPLIER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={save} disabled={busy || !form.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                  {panel === "create" ? "Create" : "Save"}
                </button>
                <button onClick={closePanel} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">Cancel</button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

const U_ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "#EF4444", COMPANY_ADMIN: "#DC2626", BRANCH_MANAGER: "#1B75BC",
  STAFF: "#64748B", ACCOUNTANT: "#2563EB", SALES_EXECUTIVE: "#0E7C66",
  VISA_EXECUTIVE: "#F15A24", HAJJ_EXECUTIVE: "#7C3AED", UMRAH_EXECUTIVE: "#9333EA",
};

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function UsersView() {
  const { data, isLoading, isError } = useAdminUsers({ pageSize: 100 });
  const updateUser = useUpdateUser();
  const users = data?.data ?? [];

  const toggleStatus = (id: string, current: string) => {
    updateUser.mutate({ id, status: current === "active" ? "inactive" : "active" });
  };

  if (isLoading) return <div className="flex justify-center py-16 text-slate-400"><Loader2 size={22} className="animate-spin"/></div>;
  if (isError) return <p className="text-sm text-red-500">Failed to load users.</p>;

  return (
    <div>
      <PageHeader title="Users Management" subtitle="Staff accounts, roles, and access control"/>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {["User", "Email", "Role", "Branch", "Status", "Last Active", ""].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
            ))}
          </tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: U_ROLE_COLOR[u.role] || "#64748B" }}>
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{u.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{u.email}</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: U_ROLE_COLOR[u.role] || "#64748B" }}>{formatRoleLabel(u.role)}</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{u.branchName ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                  u.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>{u.status}</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">
                {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
              </td>
              <td className="px-4 py-3 opacity-0 group-hover:opacity-100">
                <button onClick={() => toggleStatus(u.id, u.status)} disabled={updateUser.isPending}
                  className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500" title={u.status === "active" ? "Deactivate" : "Activate"}>
                  {u.status === "active" ? <X size={12}/> : <Check size={12}/>}
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {users.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No users found.</p>}
      </div>
    </div>
  );
}

// ─── SYSTEM HEALTH ────────────────────────────────────────────────────────────
function HealthView() {
  return (
    <div className="space-y-5">
      <PageHeader title="System Health" subtitle="Infrastructure status and metrics"/>
      <EmptyState variant="coming-soon" title="System health"
        desc="Live infrastructure metrics are planned for a later release." />
    </div>
  );
}

// ─── MODULE ROOT ─────────────────────────────────────────────────────────────
export function SettingsModule() {
  const [view, setView] = useState<SView>("general");
  return (
    <div className="p-5 md:p-7">
      <ModulePage title="Settings" subtitle="Platform configuration, integrations, roles & access">
        <div className="flex min-h-[70vh] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden bg-[#F0F2F5]">
          <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
            <div className="px-4 py-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</h2>
            </div>
            <nav className="flex-1 py-2 overflow-y-auto no-scrollbar">
              {NAV_GROUPS.map(group=>(
                <div key={group.label} className="mb-2">
                  <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group.label}</p>
                  {group.items.map(item=>(
                    <button key={item.id} onClick={()=>setView(item.id)}
                      className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                        view===item.id?"bg-[#1B75BC]/8 text-[#1B75BC] font-medium border-r-2 border-[#1B75BC]":"text-slate-600 hover:bg-slate-50")}>
                      <item.icon size={15} className={view===item.id?"text-[#1B75BC]":"text-slate-400"}/>
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400"><Server size={11}/> v2.4.1 · Production</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-4xl">
              {view==="general"     && <GeneralSettings/>}
              {view==="email"       && <EmailSettings/>}
              {view==="sms"         && <SmsSettings/>}
              {view==="whatsapp"    && <WhatsappSettings/>}
              {view==="payment"     && <PaymentSettings/>}
              {view==="ocr"         && <OcrSettings/>}
              {view==="backup"      && <BackupSettings/>}
              {view==="roles"       && <RolesView/>}
              {view==="permissions" && <PermissionsMatrix/>}
              {view==="users"       && <UsersView/>}
              {view==="agents"      && <AgentsView/>}
              {view==="suppliers"   && <SuppliersView/>}
              {view==="system"      && <SystemConfig/>}
              {view==="branches"    && <BranchesView/>}
              {view==="health"      && <HealthView/>}
            </div>
          </div>
        </div>
      </ModulePage>
    </div>
  );
}
