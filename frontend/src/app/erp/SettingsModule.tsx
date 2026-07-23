import React, { useState } from "react";
import {
  Settings, Mail, MessageSquare, Phone, CreditCard, ScanText,
  Database, Shield, Lock, Cpu, Building2, Users, Star, Activity,
  Check, X, Plus, Trash2, Edit2, Eye, EyeOff, RefreshCw,
  Download, Upload, AlertTriangle, CheckCircle, ChevronRight,
  Globe, Zap, Key, Server, HardDrive, Bell, Save, Copy,
  Info, GitBranch, FileText,
} from "lucide-react";
import { cn } from "../lib/utils";

type SView =
  | "general" | "email" | "sms" | "whatsapp" | "payment"
  | "ocr" | "backup" | "roles" | "permissions" | "system"
  | "branches" | "users" | "plans" | "health";

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
  { label:"Infrastructure", items:[
    { id:"backup"      as SView, label:"Backup Settings",    icon:Database   },
    { id:"plans"       as SView, label:"Subscription Plans", icon:Star       },
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
    <div className={cn("bg-white rounded-xl border border-slate-200", className)}>
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
    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"/>
);
const Sel = ({ opts, dv }: { opts:string[]; dv?:string }) => (
  <select defaultValue={dv} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
    {opts.map(o=><option key={o}>{o}</option>)}
  </select>
);
const Txt = ({ dv="", rows=2 }: { dv?:string; rows?:number }) => (
  <textarea rows={rows} defaultValue={dv}
    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none"/>
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
        className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg focus:outline-none font-mono"/>
      <button onClick={()=>setShow(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        {show?<EyeOff size={14}/>:<Eye size={14}/>}
      </button>
    </div>
  );
}

function SaveBtn() {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex justify-end mt-5">
      <button onClick={()=>{ setOk(true); setTimeout(()=>setOk(false),2200); }}
        className="flex items-center gap-2 px-5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
        {ok?<><Check size={14}/> Saved!</>:<><Save size={14}/> Save Changes</>}
      </button>
    </div>
  );
}

// ─── GENERAL ─────────────────────────────────────────────────────────────────
function GeneralSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="General Settings" subtitle="Core business information and localization"/>
      <Panel title="Business Information" icon={Building2}>
        <Field label="Company Name"><Inp dv="BDH Travels & Tourism"/></Field>
        <Field label="Registration No." hint="Trade license / business reg."><Inp dv="CHG-2018-00842"/></Field>
        <Field label="Address" hint="Registered address"><Txt dv="144/A CDA Commercial Area, Agrabad, Chattogram, Bangladesh"/></Field>
        <Field label="Phone"><Inp dv="+880 31 123 4567"/></Field>
        <Field label="Email"><Inp type="email" dv="info@bdhtravels.com"/></Field>
        <Field label="Website"><Inp dv="https://bdhtravels.com"/></Field>
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
          <div className="flex gap-2"><input type="color" defaultValue="#1B75BC" className="w-10 h-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer"/><Inp dv="#1B75BC"/></div>
        </Field>
        <Field label="Company Logo">
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 rounded-lg bg-[#1B75BC] flex items-center justify-center text-white text-xs font-bold">BDH</div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Upload size={13}/> Upload</button>
          </div>
        </Field>
      </Panel>
      <SaveBtn/>
    </div>
  );
}

// ─── EMAIL ────────────────────────────────────────────────────────────────────
function EmailSettings() {
  const [testOk, setTestOk] = useState(false);
  return (
    <div className="space-y-5">
      <PageHeader title="Email Settings" subtitle="SMTP configuration for outgoing email"/>
      <Panel title="SMTP Configuration" icon={Mail}>
        <Field label="Mail Driver"><Sel opts={["SMTP","SendGrid","Mailgun","Amazon SES"]}/></Field>
        <Field label="SMTP Host"><Inp dv="smtp.gmail.com"/></Field>
        <Field label="SMTP Port"><Inp dv="587"/></Field>
        <Field label="Encryption"><Sel opts={["TLS","SSL","None"]} dv="TLS"/></Field>
        <Field label="Username"><Inp type="email" dv="noreply@bdhtravels.com"/></Field>
        <Field label="Password"><SecretInp dv="••••••••••"/></Field>
        <Field label="From Name"><Inp dv="BDH Travels & Tourism"/></Field>
      </Panel>
      <Panel title="Email Templates" icon={Mail}>
        {["Booking Confirmation","Payment Receipt","Visa Update","Password Reset","Welcome Email"].map(t=>(
          <div key={t} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-700">{t}</span>
            <button className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Edit2 size={11}/> Edit</button>
          </div>
        ))}
      </Panel>
      <div className="flex items-center justify-between">
        <button onClick={()=>{setTestOk(true);setTimeout(()=>setTestOk(false),3000);}}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          {testOk?<><CheckCircle size={14} className="text-emerald-500"/> Sent!</>:<><Zap size={14}/> Send Test Email</>}
        </button>
        <SaveBtn/>
      </div>
    </div>
  );
}

// ─── SMS ─────────────────────────────────────────────────────────────────────
function SmsSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="SMS Settings" subtitle="BulkSMSBD API for outgoing SMS notifications"/>
      <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <Info size={15} className="text-blue-500 flex-shrink-0"/>
        <p className="text-sm text-blue-700">Using <strong>BulkSMSBD</strong> — Bangladesh's leading bulk SMS gateway. Docs at <a href="#" className="underline">bulksmsbd.net</a></p>
      </div>
      <Panel title="BulkSMSBD API" icon={MessageSquare} iconColor="#059669">
        <Field label="API Key" hint="From your BulkSMSBD dashboard"><SecretInp dv="bdh_api_xxxxxxxxxxxx"/></Field>
        <Field label="Sender ID" hint="Approved alphanumeric sender"><Inp dv="BDHTRVL"/></Field>
        <Field label="API Endpoint"><Inp dv="https://bulksmsbd.net/api/smsapi"/></Field>
        <Field label="SMS Balance" hint="Current credit balance">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800 font-mono">4,280 credits</span>
            <button className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg"><Plus size={11}/> Top Up</button>
          </div>
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
      <SaveBtn/>
    </div>
  );
}

// ─── WHATSAPP ────────────────────────────────────────────────────────────────
function WhatsappSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="WhatsApp Settings" subtitle="Wasender API for WhatsApp Business messaging"/>
      <div className="flex items-center gap-3 p-3.5 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl">
        <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0"><Phone size={12} className="text-white"/></div>
        <p className="text-sm text-[#1a9e4e] font-medium">Connected — BDH Official WhatsApp Business account active</p>
      </div>
      <Panel title="Wasender API" icon={Phone} iconColor="#25D366">
        <Field label="API Token"><SecretInp dv="wsndr_live_xxxxxxxxxxx"/></Field>
        <Field label="Phone Number ID"><Inp dv="+880 1XXXXXXXXX"/></Field>
        <Field label="Business Account ID"><Inp dv="105xxxxxxxxxx"/></Field>
        <Field label="Webhook URL" hint="For incoming message events">
          <div className="flex gap-2"><Inp dv="https://bdhtravels.com/api/whatsapp/webhook"/>
            <button className="px-3 py-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 flex-shrink-0"><Copy size={14}/></button>
          </div>
        </Field>
      </Panel>
      <Panel title="Message Templates" icon={MessageSquare} iconColor="#25D366">
        <div className="mb-3 flex justify-end">
          <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"><Plus size={13}/> Add Template</button>
        </div>
        {[["booking_confirmation","approved","UTILITY"],["payment_receipt","approved","UTILITY"],["visa_approved","approved","UTILITY"],["departure_reminder","pending","MARKETING"],["otp_verification","approved","AUTHENTICATION"]].map(([name,status,cat])=>(
          <div key={name} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700 flex-1">{name}</code>
            <span className="text-xs text-slate-400">{cat}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
              status==="approved"?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{status}</span>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Eye size={12}/></button>
          </div>
        ))}
      </Panel>
      <SaveBtn/>
    </div>
  );
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
function PaymentSettings() {
  const gws = [
    { name:"bKash",      logo:"bK",  color:"#E2136E", mode:"live",    fee:"1.5%" },
    { name:"Nagad",      logo:"Na",  color:"#F7941D", mode:"live",    fee:"1.5%" },
    { name:"SSLCommerz", logo:"SSL", color:"#E12219", mode:"sandbox", fee:"2.5%" },
    { name:"Visa/MC",    logo:"V/M", color:"#1A1F71", mode:"live",    fee:"2.0%" },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="Payment Settings" subtitle="Configure payment gateways and transaction settings"/>
      {gws.map(gw=>(
        <Panel key={gw.name} title={gw.name} icon={CreditCard} iconColor={gw.color}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: gw.color }}>{gw.logo}</div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",gw.mode==="live"?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{gw.mode.toUpperCase()}</span>
            </div>
            <Toggle on={gw.mode==="live"}/>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">API Key / Merchant ID</label><SecretInp dv="live_xxxxxxxxxxxx"/></div>
            <div><label className="text-xs font-medium text-slate-500 mb-1 block">Secret Key</label><SecretInp dv="secret_xxxxxxxxx"/></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">Transaction fee: <strong className="text-slate-700">{gw.fee}</strong></span>
            <Sel opts={["Live Mode","Sandbox Mode"]} dv={gw.mode==="live"?"Live Mode":"Sandbox Mode"}/>
          </div>
        </Panel>
      ))}
      <SaveBtn/>
    </div>
  );
}

// ─── OCR ────────────────────────────────────────────────────────────────────
function OcrSettings() {
  return (
    <div className="space-y-5">
      <PageHeader title="OCR Settings" subtitle="Optical Character Recognition for passport & document scanning"/>
      <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle size={15} className="text-amber-500 flex-shrink-0"/>
        <p className="text-sm text-amber-700">OCR is a <strong>paid add-on</strong>. Current plan: <strong>500 scans/month</strong> · Used: <strong>312 / 500</strong> this cycle.</p>
      </div>
      <Panel title="OCR Provider" icon={ScanText} iconColor="#7C3AED">
        <Field label="Provider"><Sel opts={["OpenAI GPT-4 Vision","Google Vision API","AWS Textract","Azure Computer Vision"]}/></Field>
        <Field label="API Key"><SecretInp dv="sk-proj-xxxxxxxxxxxx"/></Field>
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
        {[["Passport (MRZ zone)","Active","1,840 scans"],["National ID (NID)","Active","342 scans"],["Visa Sticker","Active","510 scans"],["Birth Certificate","Disabled","0 scans"],["Driving License","Disabled","0 scans"]].map(([doc,status,usage])=>(
          <div key={doc} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-700">{doc}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{usage}</span>
              <Toggle on={status==="Active"}/>
            </div>
          </div>
        ))}
      </Panel>
      <Panel title="Monthly Usage" icon={Star}>
        <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Scans used</span><span className="font-medium">312 / 500</span></div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-[#1B75BC] rounded-full" style={{ width:"62.4%" }}/>
        </div>
        <p className="text-xs text-slate-400">Resets Aug 1, 2024 · <button className="text-[#1B75BC] hover:underline">Upgrade Plan</button></p>
      </Panel>
      <SaveBtn/>
    </div>
  );
}

// ─── BACKUP ──────────────────────────────────────────────────────────────────
function BackupSettings() {
  const history = [
    { date:"Jul 14 02:00 AM", size:"284 MB", type:"Auto",   status:"success" },
    { date:"Jul 13 02:00 AM", size:"281 MB", type:"Auto",   status:"success" },
    { date:"Jul 12 02:00 AM", size:"279 MB", type:"Auto",   status:"success" },
    { date:"Jul 11 02:00 AM", size:"278 MB", type:"Auto",   status:"failed"  },
    { date:"Jul 10 11:30 AM", size:"276 MB", type:"Manual", status:"success" },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title="Backup Settings" subtitle="Automated database and file backup"
        action={<button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg"><Download size={14}/> Backup Now</button>}/>
      <Panel title="Schedule" icon={Database}>
        <Field label="Auto Backup"><Toggle on={true}/></Field>
        <Field label="Frequency"><Sel opts={["Daily","Twice Daily","Weekly","Monthly"]} dv="Daily"/></Field>
        <Field label="Backup Time"><Inp dv="02:00 AM"/></Field>
        <Field label="Retention"><Sel opts={["7 days","14 days","30 days","90 days"]} dv="30 days"/></Field>
      </Panel>
      <Panel title="Storage" icon={HardDrive}>
        <Field label="Primary"><Sel opts={["Local Server","AWS S3","Google Drive","Dropbox","FTP"]} dv="Local Server"/></Field>
        <Field label="Secondary"><Sel opts={["None","AWS S3","Google Drive"]} dv="None"/></Field>
        <Field label="Backup Path"><Inp dv="/var/backups/bdh-erp/"/></Field>
        <Field label="Include Files"><Toggle on={true} label="Upload media & documents"/></Field>
      </Panel>
      <Panel title="Backup History" icon={Database}>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100">{["Date","Size","Type","Status",""].map(h=>(
            <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">{h}</th>
          ))}</tr></thead>
          <tbody>{history.map((b,i)=>(
            <tr key={i} className="border-b border-slate-50">
              <td className="py-2.5 pr-4 text-sm text-slate-600 font-mono">{b.date}</td>
              <td className="py-2.5 pr-4 text-sm font-mono text-slate-600">{b.size}</td>
              <td className="py-2.5 pr-4"><span className={cn("text-xs px-2 py-0.5 rounded-full",b.type==="Auto"?"bg-blue-50 text-blue-600":"bg-purple-50 text-purple-600")}>{b.type}</span></td>
              <td className="py-2.5 pr-4"><span className={cn("text-xs px-2 py-0.5 rounded-full",b.status==="success"?"bg-emerald-50 text-emerald-600":"bg-red-50 text-red-500")}>{b.status}</span></td>
              <td className="py-2.5"><div className="flex gap-1">
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Download size={12}/></button>
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><RefreshCw size={12}/></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </Panel>
    </div>
  );
}

// ─── ROLES ───────────────────────────────────────────────────────────────────
const ROLES_DATA = [
  { id:1, name:"Super Admin",    users:1, color:"#EF4444", desc:"Full system access. No restrictions."              },
  { id:2, name:"Branch Manager", users:3, color:"#1B75BC", desc:"Full branch access, read-only other branches."     },
  { id:3, name:"Sales Executive",users:8, color:"#0E7C66", desc:"Manage bookings, clients, invoices."               },
  { id:4, name:"Visa Officer",   users:4, color:"#F15A24", desc:"Visa applications, OCR, status updates."           },
  { id:5, name:"Accountant",     users:2, color:"#2563EB", desc:"Finance, invoices, reports. No booking edits."     },
  { id:6, name:"HR Manager",     users:1, color:"#7C3AED", desc:"Staff, KPI, payroll, manpower management."         },
  { id:7, name:"Support Staff",  users:5, color:"#64748B", desc:"View-only CRM, respond to inquiries."              },
];
const MODS = ["Dashboard","Bookings","CRM","Packages","Accounts","Invoices","Reports","Documents","CMS","Operations","Settings"];

function RolesView() {
  const [sel, setSel] = useState(1);
  const role = ROLES_DATA.find(r=>r.id===sel)!;
  return (
    <div>
      <PageHeader title="Role Management" subtitle="Define roles and their access scope"
        action={<button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg"><Plus size={14}/> New Role</button>}/>
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-2">
          {ROLES_DATA.map(r=>(
            <button key={r.id} onClick={()=>setSel(r.id)}
              className={cn("w-full text-left p-4 rounded-xl border transition-all",
                sel===r.id?"border-[#1B75BC] bg-[#1B75BC]/5":"bg-white border-slate-200 hover:bg-slate-50")}>
              <div className="flex items-center gap-2.5 mb-0.5">
                <div className="w-3 h-3 rounded-full" style={{ background: r.color }}/>
                <span className="text-sm font-semibold text-slate-800 flex-1">{r.name}</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{r.users}</span>
              </div>
              <p className="text-xs text-slate-400 ml-5">{r.desc}</p>
            </button>
          ))}
        </div>
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: role.color }}>{role.name.slice(0,1)}</div>
              <div><p className="font-bold text-slate-800">{role.name}</p><p className="text-xs text-slate-400">{role.users} users assigned</p></div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"><Edit2 size={13}/> Edit</button>
              {role.id!==1 && <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-red-200 text-red-500 rounded-lg"><Trash2 size={13}/> Delete</button>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
            <Txt dv={role.desc} rows={2}/>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Module Access</p>
            <div className="grid grid-cols-2 gap-2">
              {MODS.map(mod=>(
                <div key={mod} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">{mod}</span>
                  <select className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none">
                    <option>Full</option><option>View</option><option>None</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <SaveBtn/>
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 w-32 sticky left-0 bg-slate-50 z-10">Module</th>
                {P_ROLES.map(r=>{
                  const rc = ROLES_DATA.find(x=>x.name.startsWith(r.split(" ")[0]))?.color;
                  return <th key={r} className="text-center text-xs font-semibold px-3 py-3 min-w-24" style={{ color: rc||"#64748B" }}>{r}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {P_MODS.map((mod,mi)=>(
                <tr key={mod} className={cn("border-b border-slate-50",mi%2===0?"bg-white":"bg-slate-50/30")}>
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
          <button className="flex items-center gap-1.5 text-sm px-3 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"><RefreshCw size={13}/> Clear All Caches</button>
        </div>
      </Panel>
      <SaveBtn/>
    </div>
  );
}

// ─── BRANCHES ────────────────────────────────────────────────────────────────
const BRANCH_DATA = [
  { name:"Chattogram Head Office", city:"Chattogram", mgr:"Abdullah Chowdhury", phone:"+880 31 123 4567", staff:24, status:"active", hq:true  },
  { name:"Dhaka Branch",           city:"Dhaka",      mgr:"Rahim Khan",         phone:"+880 2 123 4567",  staff:12, status:"active", hq:false },
  { name:"Sylhet Branch",          city:"Sylhet",     mgr:"Nasir Ahmed",        phone:"+880 821 12345",   staff:6,  status:"active", hq:false },
  { name:"Cox's Bazar Branch",     city:"Cox's Bazar",mgr:"Kamal Hossain",      phone:"+880 341 12345",   staff:4,  status:"active", hq:false },
  { name:"Khulna Branch",          city:"Khulna",     mgr:"TBD",                phone:"—",                staff:0,  status:"setup",  hq:false },
];

function BranchesView() {
  return (
    <div>
      <PageHeader title="Branch Management" subtitle="Head office and regional branches"
        action={<button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg"><Plus size={14}/> Add Branch</button>}/>
      <div className="space-y-3">
        {BRANCH_DATA.map((b,i)=>(
          <div key={i} className={cn("bg-white rounded-xl border p-5",b.hq?"border-[#1B75BC]/30 bg-[#1B75BC]/3":"border-slate-200")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold",b.hq?"bg-[#1B75BC]":"bg-slate-400")}>{b.city.slice(0,2)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{b.name}</p>
                    {b.hq && <span className="text-xs px-2 py-0.5 bg-[#1B75BC] text-white rounded-full font-medium">HQ</span>}
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      b.status==="active"?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600")}>{b.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-400">
                    <span>{b.city}</span><span>{b.phone}</span><span>{b.staff} staff</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-1"><p className="text-xs text-slate-400">Manager</p><p className="text-sm font-medium text-slate-700">{b.mgr}</p></div>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Edit2 size={14}/></button>
                {!b.hq && <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── USERS ───────────────────────────────────────────────────────────────────
const USERS_DATA = [
  { name:"Abdullah Chowdhury", email:"abdullah@bdhtravels.com", role:"Super Admin",    branch:"Chattogram HQ", status:"active",   last:"Today 09:12" },
  { name:"Fatema Begum",       email:"fatema@bdhtravels.com",   role:"Visa Officer",   branch:"Chattogram HQ", status:"active",   last:"Today 08:55" },
  { name:"Rahim Khan",         email:"rahim@bdhtravels.com",    role:"Sales Executive",branch:"Dhaka Branch",  status:"active",   last:"Today 09:01" },
  { name:"Nasir Ahmed",        email:"nasir@bdhtravels.com",    role:"Branch Manager", branch:"Sylhet Branch", status:"active",   last:"Yesterday"   },
  { name:"Salma Khatun",       email:"salma@bdhtravels.com",    role:"Support Staff",  branch:"Chattogram HQ", status:"active",   last:"Today 08:30" },
  { name:"Kamal Hossain",      email:"kamal@bdhtravels.com",    role:"Accountant",     branch:"Chattogram HQ", status:"inactive", last:"Jul 10"      },
];
const U_ROLE_COLOR: Record<string,string> = {
  "Super Admin":"#EF4444","Branch Manager":"#1B75BC","Sales Executive":"#0E7C66",
  "Visa Officer":"#F15A24","Accountant":"#2563EB","Support Staff":"#64748B",
};

function UsersView() {
  return (
    <div>
      <PageHeader title="Users Management" subtitle="Staff accounts, roles, and access control"
        action={<button className="flex items-center gap-2 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg"><Plus size={14}/> Invite User</button>}/>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {["User","Email","Role","Branch","Status","Last Active",""].map(h=>(
              <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
            ))}
          </tr></thead>
          <tbody>{USERS_DATA.map((u,i)=>(
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: U_ROLE_COLOR[u.role]||"#64748B" }}>
                    {u.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{u.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{u.email}</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: U_ROLE_COLOR[u.role]||"#64748B" }}>{u.role}</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-500">{u.branch}</td>
              <td className="px-4 py-3">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                  u.status==="active"?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-400")}>{u.status}</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">{u.last}</td>
              <td className="px-4 py-3 opacity-0 group-hover:opacity-100"><div className="flex gap-1">
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400" title="Edit"><Edit2 size={12}/></button>
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400" title="Reset password"><Key size={12}/></button>
                <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500" title="Deactivate"><X size={12}/></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────
const PLANS = [
  { id:"starter",  name:"Starter",    price:0,    users:3,  branches:1, color:"#64748B", current:false,
    features:["Core bookings","Basic reports","5 GB storage"] },
  { id:"pro",      name:"Pro",        price:4900, users:15, branches:3, color:"#1B75BC", current:true,
    features:["Everything in Starter","WhatsApp integration","OCR 200/mo","Advanced reports","Priority support"] },
  { id:"business", name:"Business",   price:9900, users:50, branches:10,color:"#F15A24", current:false,
    features:["Everything in Pro","OCR 2000/mo","Custom domain","API access","Dedicated support"] },
  { id:"enterprise",name:"Enterprise",price:-1,   users:-1, branches:-1,color:"#0E7C66", current:false,
    features:["Unlimited everything","White-label ERP","On-premise deploy","SLA","Custom integrations"] },
];

function PlansView() {
  return (
    <div>
      <PageHeader title="Subscription Plans" subtitle="Current plan: Pro · Renews August 1, 2024"/>
      <div className="grid grid-cols-4 gap-4 mb-5">
        {PLANS.map(p=>(
          <div key={p.id} className={cn("rounded-xl border p-5 relative",
            p.current?"border-[#1B75BC] bg-[#1B75BC]/3":"bg-white border-slate-200")}>
            {p.current && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#1B75BC] text-white text-xs font-bold rounded-full whitespace-nowrap">Current Plan</div>}
            <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center text-white text-xs font-bold" style={{ background: p.color }}>{p.name.slice(0,1)}</div>
            <p className="font-bold text-slate-800 mb-0.5">{p.name}</p>
            <p className="text-2xl font-black text-slate-800 mb-1" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
              {p.price===0?"Free":p.price===-1?"Custom":`৳${p.price.toLocaleString()}`}
              {p.price>0&&<span className="text-sm font-normal text-slate-400">/mo</span>}
            </p>
            <p className="text-xs text-slate-400 mb-3">
              {p.users===-1?"Unlimited users":`Up to ${p.users} users`} · {p.branches===-1?"Unlimited branches":`${p.branches} branch${p.branches>1?"es":""}`}
            </p>
            <ul className="space-y-1.5 mb-4">
              {p.features.map(f=><li key={f} className="flex items-start gap-1.5 text-xs text-slate-600"><Check size={11} className="text-emerald-500 mt-0.5 flex-shrink-0"/>{f}</li>)}
            </ul>
            <button className={cn("w-full py-2 text-sm font-medium rounded-lg transition-colors",
              p.current?"bg-[#1B75BC] text-white cursor-default":"border border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {p.current?"Current":p.price===-1?"Contact Sales":"Upgrade"}
            </button>
          </div>
        ))}
      </div>
      <Panel title="Current Usage" icon={Star}>
        <div className="grid grid-cols-3 gap-4">
          {[{label:"Users",used:18,max:15,over:true},{label:"Branches",used:3,max:3,over:false},{label:"Storage",used:12,max:50,sfx:" GB",over:false}].map(r=>(
            <div key={r.label} className="bg-slate-50 rounded-xl p-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>{r.label}</span>
                <span className={r.over?"text-red-500 font-semibold":""}>{r.used}/{r.max}{r.sfx||""}</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full",r.over?"bg-red-500":"bg-[#1B75BC]")}
                  style={{ width:`${Math.min((r.used/r.max)*100,100)}%`}}/>
              </div>
              {r.over && <p className="text-xs text-red-500 mt-1">Over limit — upgrade plan</p>}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── SYSTEM HEALTH ────────────────────────────────────────────────────────────
const HEALTH_ITEMS = [
  { name:"Web Server",      status:"healthy", value:"142ms avg",    icon:Server,   detail:"Nginx 1.24 · 99.97% uptime"    },
  { name:"Database",        status:"healthy", value:"38ms avg",     icon:Database, detail:"MySQL 8.0 · 0 slow queries"     },
  { name:"Redis Cache",     status:"healthy", value:"2ms avg",      icon:Zap,      detail:"Hit rate: 94.2%"                },
  { name:"Queue Worker",    status:"healthy", value:"12 jobs/min",  icon:GitBranch,detail:"4 workers · 0 failed"           },
  { name:"Disk Storage",    status:"warning", value:"68% used",     icon:HardDrive,detail:"34.2 GB / 50 GB"               },
  { name:"SSL Certificate", status:"healthy", value:"Valid",        icon:Shield,   detail:"Expires Jan 14, 2025"           },
  { name:"Email Service",   status:"healthy", value:"98.4% delivery",icon:Mail,   detail:"3 bounces this week"            },
  { name:"Backup Service",  status:"error",   value:"Last failed",  icon:Database, detail:"Jul 11 backup failed — retry"   },
];
const H_STYLE: Record<string,{ card:string; icon:string; dot:string }> = {
  healthy: { card:"bg-emerald-50 border-emerald-200", icon:"text-emerald-600", dot:"bg-emerald-500" },
  warning: { card:"bg-amber-50 border-amber-200",     icon:"text-amber-600",   dot:"bg-amber-400"   },
  error:   { card:"bg-red-50 border-red-200",         icon:"text-red-600",     dot:"bg-red-500"     },
};

function HealthView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="text-xl font-bold text-slate-800">System Health</h2>
          <p className="text-sm text-slate-500">Last checked: <span className="font-medium text-slate-600">Today 09:14 AM</span></p></div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"><RefreshCw size={13}/> Refresh</button>
      </div>
      <div className="flex items-center gap-3 mb-5">
        {[["healthy","6 Healthy","bg-emerald-500"],["warning","1 Warning","bg-amber-400"],["error","1 Error","bg-red-500"]].map(([k,l,c])=>(
          <span key={k} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
            k==="healthy"?"bg-emerald-50 text-emerald-700 border-emerald-200":k==="warning"?"bg-amber-50 text-amber-700 border-amber-200":"bg-red-50 text-red-600 border-red-200")}>
            <span className={cn("w-2 h-2 rounded-full",c)}/>{l}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {HEALTH_ITEMS.map(h=>{
          const s = H_STYLE[h.status];
          return (
            <div key={h.name} className={cn("flex items-center gap-4 p-4 rounded-xl border",s.card)}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border",s.card)}>
                <h.icon size={18} className={s.icon}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                  <span className={cn("w-2 h-2 rounded-full animate-pulse",s.dot)}/>
                </div>
                <p className="text-xs font-mono font-medium text-slate-700">{h.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{h.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:"CPU Usage",v:"24%",b:24,c:"bg-[#1B75BC]"},{l:"Memory",v:"58%",b:58,c:"bg-[#0E7C66]"},{l:"Disk I/O",v:"12%",b:12,c:"bg-[#F15A24]"},{l:"Network",v:"8 MB/s",b:35,c:"bg-[#2563EB]"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.l}</p>
            <p className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily:"'JetBrains Mono',monospace" }}>{s.v}</p>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full",s.c)} style={{ width:`${s.b}%`}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODULE ROOT ─────────────────────────────────────────────────────────────
export function SettingsModule() {
  const [view, setView] = useState<SView>("general");
  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
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
          {view==="system"      && <SystemConfig/>}
          {view==="branches"    && <BranchesView/>}
          {view==="plans"       && <PlansView/>}
          {view==="health"      && <HealthView/>}
        </div>
      </div>
    </div>
  );
}
