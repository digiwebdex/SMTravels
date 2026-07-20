/**
 * BDH Travels — Design System Showcase
 * Route: /ds
 *
 * Developer handoff reference. Shows every token, component, state, and pattern
 * used across the ERP + portal ecosystem. Grouped into 7 sections:
 *  1. Tokens (colors, typography, spacing)
 *  2. Components (buttons, badges, forms, cards)
 *  3. Data (tables, KPI tiles, charts)
 *  4. States (empty, loading, error)
 *  5. Navigation patterns
 *  6. Responsive breakpoints
 *  7. Content (multi-currency, Bangla, date)
 */

import React, { useState } from "react";
import { Link } from "react-router";
import {
  Palette, Type, Square, Database, Layout, Monitor, Globe,
  CalendarDays, Users, Receipt, BarChart3, Package, Settings,
  Star, Plane, MapPin, Hotel, Briefcase, Shield, Calculator,
  UserCircle, Building2, ArrowRight, Check, X, ChevronDown,
  Bell, Search, Filter, Download, Plus, Eye, Edit2, Trash2,
  AlertTriangle, CheckCircle, Info, ExternalLink, Wallet,
  TrendingUp, FileText, Home,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  StatusBadge, Btn, KpiTile, EmptyState, ErrorBanner,
  SkeletonTable, SkeletonCard, SkeletonPage, FormField,
  TextInput, SelectInput, SectionCard, PageHeader,
  Avatar, Spinner, Divider, ProgressBar, Tag, Tooltip,
  formatAmount, formatAmountShort, formatDate, toBanglaDigits,
  useLoadingState, BRAND, STATUS_MAP,
} from "../lib/ds";
import type { StatusKey } from "../lib/ds";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, title, subtitle, children }: {
  id: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function Demo({ label, children, code }: { label: string; children: React.ReactNode; code?: string }) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {code && (
          <button onClick={() => setShowCode(v => !v)}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-200 transition-colors">
            {showCode ? "Hide" : "Code"}
          </button>
        )}
      </div>
      <div className="p-5 bg-white">{children}</div>
      {showCode && code && (
        <div className="border-t border-slate-200 bg-slate-900 px-5 py-4">
          <pre className="text-xs text-slate-300 font-mono overflow-x-auto">{code}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Color swatch ────────────────────────────────────────────────────────────
function ColorSwatch({ name, hex, token, textDark = false }: {
  name: string; hex: string; token: string; textDark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button onClick={copy} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 hover:shadow-md transition-all text-left">
      <div className="h-16 w-full" style={{ backgroundColor: hex }} />
      <div className="px-3 py-2.5 bg-white">
        <p className="text-[11px] font-black text-slate-800">{name}</p>
        <p className="text-[10px] text-slate-400 font-mono">{hex}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{token}</p>
        <p className="text-[9px] text-emerald-500 font-semibold mt-0.5 h-3">{copied ? "Copied!" : ""}</p>
      </div>
    </button>
  );
}

// ─── Type scale sample ───────────────────────────────────────────────────────
const TYPE_SCALE = [
  { name: "Display",    cls: "text-4xl font-black",  sample: "বিশ্বের পথে, আপনার সেবায়" },
  { name: "Heading 1",  cls: "text-2xl font-black",  sample: "Bookings Overview" },
  { name: "Heading 2",  cls: "text-xl font-bold",    sample: "Payment Summary" },
  { name: "Heading 3",  cls: "text-base font-bold",  sample: "Invoice Details" },
  { name: "Body",       cls: "text-sm",               sample: "Your booking is confirmed. Departure 15 Jan 2026." },
  { name: "Small",      cls: "text-xs text-slate-500",sample: "Updated 2 hours ago · BDH Travels HQ" },
  { name: "Micro",      cls: "text-[10px] text-slate-400 uppercase tracking-wider font-bold", sample: "Status · Created · Amount" },
  { name: "Mono/Finance", cls: "text-lg font-black", sample: "৳ 1,20,000", mono: true },
];

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "tokens",     icon: Palette,  label: "Tokens" },
  { id: "components", icon: Square,   label: "Components" },
  { id: "data",       icon: Database, label: "Data" },
  { id: "states",     icon: AlertTriangle, label: "States" },
  { id: "navigation", icon: Layout,   label: "Navigation" },
  { id: "responsive", icon: Monitor,  label: "Responsive" },
  { id: "i18n",       icon: Globe,    label: "i18n & Locale" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DesignSystemPage() {
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [loadDemo, setLoadDemo] = useState(false);
  const skeletonLoading = useLoadingState(2000);

  return (
    <div className="min-h-screen bg-[#F0F2F5]">

      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1300px] mx-auto px-6 py-3.5 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0E6BB8] flex items-center justify-center">
              <Palette size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Design System</p>
              <p className="text-[10px] text-slate-400">BDH Travels ERP · v1.0</p>
            </div>
          </div>

          {/* Section nav */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar">
            {NAV_SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#0E6BB8] hover:bg-[#0E6BB8]/5 transition-all whitespace-nowrap">
                <s.icon size={12} />
                {s.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              {(["en", "bn"] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={cn("px-3 py-1.5 text-xs font-bold rounded-[10px] transition-all",
                    lang === l ? "bg-white text-[#0E6BB8] shadow-sm" : "text-slate-500")}>
                  {l === "en" ? "English" : "বাংলা"}
                </button>
              ))}
            </div>
            <Link to="/sitemap" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0E6BB8] px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50">
              Sitemap <ExternalLink size={11} />
            </Link>
            <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0E6BB8] px-3 py-2 rounded-xl hover:bg-[#0B5794]">
              <Home size={12} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1300px] mx-auto px-6 py-10 space-y-16">

        {/* Hero */}
        <div className="bg-[#0E6BB8] rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #E8471F 0%, transparent 60%)" }} />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold border border-white/20">Version 1.0</span>
              <span className="px-3 py-1 bg-[#E8471F]/20 rounded-full text-xs font-semibold border border-[#E8471F]/30 text-[#C43A15]">Handoff Ready</span>
            </div>
            <h1 className="text-3xl font-black mb-3">BDH Travels Design System</h1>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Canonical component library for the ERP, 5 role portals, and public website.
              All tokens, components, states, and interaction patterns documented in one place.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {["React 18", "TypeScript", "Tailwind v4", "react-router v7", "Recharts", "Lucide Icons"].map(t => (
                <span key={t} className="px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg font-semibold">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 1. TOKENS ───────────────────────────────────────────────────── */}
        <Section id="tokens" title="Design Tokens"
          subtitle="Color palette, typography scale, and spacing — the raw ingredients used everywhere.">

          <div className="space-y-10">
            <SubSection title="Brand Colors">
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
                <ColorSwatch name="Navy"       hex="#0E6BB8" token="--brand-navy" />
                <ColorSwatch name="Navy Dark"  hex="#0B5794" token="hover state" />
                <ColorSwatch name="Gold"       hex="#E8471F" token="--brand-gold" />
                <ColorSwatch name="Emerald"    hex="#0E7C66" token="--brand-emerald" />
                <ColorSwatch name="ERP BG"     hex="#F0F2F5" token="--erp-bg" />
                <ColorSwatch name="Slate 800"  hex="#1e293b" token="text-slate-800" textDark />
                <ColorSwatch name="Slate 500"  hex="#64748b" token="text-slate-500" textDark />
                <ColorSwatch name="Slate 200"  hex="#e2e8f0" token="border-slate-200" textDark />
              </div>
            </SubSection>

            <SubSection title="Semantic Colors">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "Success",  hex: "#0E7C66", bg: "#ECFDF5", label: "Paid, Active, Verified" },
                  { name: "Warning",  hex: "#E8471F", bg: "#FFF9E6", label: "Pending, Follow-up" },
                  { name: "Danger",   hex: "#DC2626", bg: "#FEF2F2", label: "Overdue, Error, Lost" },
                  { name: "Info",     hex: "#2563EB", bg: "#EFF6FF", label: "New, Processing, Sent" },
                ].map(s => (
                  <div key={s.name} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="h-10" style={{ backgroundColor: s.hex }} />
                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: s.bg, border: `1px solid ${s.hex}40` }} />
                        <p className="text-xs font-bold text-slate-800">{s.name}</p>
                      </div>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Typography Scale">
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {TYPE_SCALE.map(t => (
                  <div key={t.name} className="px-5 py-4 flex items-baseline gap-6">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.name}</p>
                      <p className="text-[9px] text-slate-300 font-mono mt-0.5">{t.cls.split(" ").find(c => c.startsWith("text-")) ?? ""}</p>
                    </div>
                    <p className={cn(t.cls, "text-slate-800 flex-1 min-w-0")}
                      style={t.mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
                      {t.sample}
                    </p>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Spacing & Radius">
              <div className="flex flex-wrap gap-4 items-end">
                {[2, 4, 6, 8, 10, 12, 16, 20, 24].map(n => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div className="bg-[#0E6BB8]" style={{ width: n * 4, height: n * 4, borderRadius: 2 }} />
                    <p className="text-[9px] text-slate-400 font-mono">{n * 4}px</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 items-center">
                {[4, 8, 12, 16, 20, 9999].map(r => (
                  <div key={r} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-8 bg-[#0E6BB8]/20 border-2 border-[#0E6BB8]"
                      style={{ borderRadius: r === 9999 ? 9999 : r }} />
                    <p className="text-[9px] text-slate-400 font-mono">{r === 9999 ? "full" : `${r}px`}</p>
                  </div>
                ))}
              </div>
            </SubSection>
          </div>
        </Section>

        {/* ── 2. COMPONENTS ───────────────────────────────────────────────── */}
        <Section id="components" title="Components"
          subtitle="Reusable primitives exported from src/app/lib/ds.tsx. Import and use directly.">

          <div className="space-y-10">
            <SubSection title="Buttons">
              <Demo label="All variants" code={`import { Btn } from "../lib/ds";\n<Btn variant="primary">Save</Btn>\n<Btn variant="secondary">Cancel</Btn>\n<Btn variant="danger">Delete</Btn>\n<Btn variant="ghost">More</Btn>\n<Btn variant="gold">Premium</Btn>`}>
                <div className="flex flex-wrap gap-3">
                  <Btn variant="primary" icon={Plus}>New Booking</Btn>
                  <Btn variant="secondary" icon={Download}>Export</Btn>
                  <Btn variant="ghost">Filter</Btn>
                  <Btn variant="danger" icon={Trash2}>Delete</Btn>
                  <Btn variant="gold">Upgrade</Btn>
                </div>
              </Demo>
              <Demo label="Sizes">
                <div className="flex flex-wrap items-center gap-3">
                  <Btn size="xs">Extra Small</Btn>
                  <Btn size="sm">Small</Btn>
                  <Btn size="md">Medium (default)</Btn>
                  <Btn size="lg">Large</Btn>
                </div>
              </Demo>
              <Demo label="States">
                <div className="flex flex-wrap gap-3">
                  <Btn loading>Saving…</Btn>
                  <Btn disabled>Disabled</Btn>
                  <Btn variant="secondary" loading>Loading</Btn>
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Status Badges">
              <Demo label="All status variants" code={`import { StatusBadge } from "../lib/ds";\n<StatusBadge status="confirmed" />\n<StatusBadge status="pending" showDot />`}>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_MAP) as StatusKey[]).map(s => (
                    <StatusBadge key={s} status={s} showDot />
                  ))}
                </div>
              </Demo>
              <Demo label="Sizes">
                <div className="flex items-center gap-3">
                  <StatusBadge status="confirmed" size="xs" />
                  <StatusBadge status="confirmed" size="sm" />
                  <StatusBadge status="confirmed" size="md" />
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Forms">
              <Demo label="Form fields">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                  <FormField label="Full Name" required>
                    <TextInput placeholder="Md. Abdur Rahman" />
                  </FormField>
                  <FormField label="Phone" hint="+880 format">
                    <TextInput placeholder="+880 17XX XXX XXX" type="tel" />
                  </FormField>
                  <FormField label="Service Type" required>
                    <SelectInput
                      options={[
                        { value: "hajj", label: "Hajj Package" },
                        { value: "umrah", label: "Umrah Package" },
                        { value: "visa", label: "Visa Processing" },
                      ]}
                      placeholder="Select service…"
                    />
                  </FormField>
                  <FormField label="Email" error="Invalid email address">
                    <TextInput placeholder="user@example.com" type="email" error />
                  </FormField>
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Avatars & Utility">
              <Demo label="Avatars">
                <div className="flex items-end gap-4">
                  {(["xs","sm","md","lg","xl"] as const).map(sz => (
                    <div key={sz} className="flex flex-col items-center gap-1">
                      <Avatar name="Fatima Khanam" size={sz} />
                      <p className="text-[9px] text-slate-400">{sz}</p>
                    </div>
                  ))}
                  <Avatar name="Shah Jalal" color="#E8471F" size="lg" />
                  <Avatar name="Rahim Uddin" color="#0E7C66" size="lg" />
                </div>
              </Demo>
              <Demo label="Progress bars">
                <div className="space-y-3 max-w-sm">
                  <ProgressBar value={72} showLabel color={BRAND.navy} />
                  <ProgressBar value={45} showLabel color={BRAND.emerald} />
                  <ProgressBar value={89} showLabel color={BRAND.gold} />
                  <ProgressBar value={20} showLabel color="#DC2626" />
                </div>
              </Demo>
              <Demo label="Tags & Tooltip">
                <div className="flex flex-wrap gap-2">
                  <Tag label="Hajj 2026" />
                  <Tag label="VIP" color="#E8471F" />
                  <Tag label="Dhaka HQ" color="#0E6BB8" onRemove={() => {}} />
                  <Tooltip content="Opens in agent portal">
                    <Tag label="B2B Agent" color="#374151" />
                  </Tooltip>
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Dividers & Spinner">
              <Demo label="Divider variants">
                <div className="space-y-4 max-w-sm">
                  <Divider />
                  <Divider label="OR" />
                  <Divider label="Payment Summary" />
                </div>
              </Demo>
              <Demo label="Spinners">
                <div className="flex items-center gap-6">
                  <Spinner size={16} />
                  <Spinner size={24} />
                  <Spinner size={32} color={BRAND.emerald} />
                  <Spinner size={24} color={BRAND.gold} />
                </div>
              </Demo>
            </SubSection>

            <SubSection title="KPI Tiles">
              <Demo label="Metric cards">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiTile label="Total Bookings" value="2,847" trend={18} icon={CalendarDays} accent={BRAND.navy} />
                  <KpiTile label="Revenue (Jul)" value={formatAmountShort(2138000)} trend={12} icon={Receipt} accent={BRAND.emerald} />
                  <KpiTile label="Active Agents" value="147" trend={-3} icon={Users} accent={BRAND.gold} />
                  <KpiTile label="Pending Visas" value="34" icon={FileText} accent="#DC2626" />
                </div>
              </Demo>
              <Demo label="Loading state">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <KpiTile key={i} label="" value="" icon={CalendarDays} loading />)}
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Section Cards">
              <Demo label="Card container">
                <SectionCard title="Recent Bookings" subtitle="Last 30 days"
                  actions={<><Btn size="xs" variant="secondary" icon={Filter}>Filter</Btn><Btn size="xs" icon={Plus}>New</Btn></>}>
                  <p className="text-sm text-slate-500">Content goes here — tables, lists, charts.</p>
                </SectionCard>
              </Demo>
            </SubSection>
          </div>
        </Section>

        {/* ── 3. DATA DISPLAY ─────────────────────────────────────────────── */}
        <Section id="data" title="Data Display"
          subtitle="Tables, lists, and charts — standardized patterns for all data-heavy screens.">

          <div className="space-y-10">
            <SubSection title="Table (canonical)">
              <Demo label="Full table with status badges">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Booking #", "Customer", "Service", "Date", "Amount", "Status", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: "BK-2847", name: "Fatima Khanam",  svc: "Hajj 2026",      date: "12 Jan 2026", amt: 210000, status: "confirmed" as StatusKey },
                        { id: "BK-2846", name: "Md. Rafikul",    svc: "Umrah Package",   date: "11 Jan 2026", amt: 85000,  status: "pending" as StatusKey },
                        { id: "BK-2845", name: "Nusrat Jahan",   svc: "Visa (Malaysia)", date: "10 Jan 2026", amt: 18500,  status: "processing" as StatusKey },
                        { id: "BK-2844", name: "Sheikh Imran",   svc: "Air Ticket",       date: "09 Jan 2026", amt: 42000,  status: "completed" as StatusKey },
                        { id: "BK-2843", name: "Rokeya Begum",   svc: "Hajj 2026",       date: "08 Jan 2026", amt: 195000, status: "cancelled" as StatusKey },
                      ].map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-xs font-mono text-slate-500">{row.id}</td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{row.name}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-600">{row.svc}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{row.date}</td>
                          <td className="px-4 py-3.5 text-sm font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {formatAmount(row.amt, "BDT", lang)}
                          </td>
                          <td className="px-4 py-3.5"><StatusBadge status={row.status} /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Eye size={13} /></button>
                              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Edit2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Mobile Card List (≤ 768px)">
              <Demo label="Card alternative to table — shown on md:hidden">
                <div className="space-y-3 max-w-sm">
                  {[
                    { id: "BK-2847", name: "Fatima Khanam",  svc: "Hajj 2026",    amt: 210000, status: "confirmed" as StatusKey },
                    { id: "BK-2846", name: "Md. Rafikul",    svc: "Umrah Package", amt: 85000,  status: "pending" as StatusKey },
                  ].map(row => (
                    <div key={row.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] font-mono text-slate-400">{row.id}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.svc}</p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <p className="text-sm font-black text-slate-800" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatAmount(row.amt, "BDT", lang)}
                        </p>
                        <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><Eye size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </Demo>
            </SubSection>
          </div>
        </Section>

        {/* ── 4. STATES ───────────────────────────────────────────────────── */}
        <Section id="states" title="UI States"
          subtitle="Loading, empty, and error states — required for every list and data screen.">

          <div className="space-y-10">
            <SubSection title="Loading Skeletons">
              <Demo label="Skeleton table">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <SkeletonTable rows={4} cols={6} />
                </div>
              </Demo>
              <Demo label="Skeleton cards">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SkeletonCard lines={3} />
                  <SkeletonCard lines={4} />
                  <SkeletonCard lines={2} />
                </div>
              </Demo>
              <Demo label="Full page skeleton">
                <div className="pointer-events-none">
                  <SkeletonPage />
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Empty States">
              <Demo label="All empty state variants">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(["no-data", "no-results", "no-connection", "error", "coming-soon"] as const).map(v => (
                    <div key={v} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{v}</p>
                      </div>
                      <EmptyState variant={v} compact action={v === "no-data" ? () => {} : undefined} actionLabel="Add Booking" />
                    </div>
                  ))}
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Error & Alert Banners">
              <Demo label="All banner variants">
                <div className="space-y-3 max-w-lg">
                  <ErrorBanner variant="error"   message="Failed to load bookings. Server returned 500." onRetry={() => {}} />
                  <ErrorBanner variant="warning" message="3 visa applications expire in 48 hours." />
                  <ErrorBanner variant="info"    message="System maintenance scheduled 2:00–4:00 AM BST." />
                </div>
              </Demo>
            </SubSection>
          </div>
        </Section>

        {/* ── 5. NAVIGATION ───────────────────────────────────────────────── */}
        <Section id="navigation" title="Navigation Patterns"
          subtitle="Sidebar, topbar, bottom nav, breadcrumbs — consistent across all portals.">

          <div className="space-y-10">
            <SubSection title="Portal Overview — Quick Links">
              <Demo label="All portal entry points">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "ERP Admin",    path: "/erp",        color: BRAND.navy,    icon: BarChart3 },
                    { label: "Accountant",   path: "/accountant", color: BRAND.emerald, icon: Calculator },
                    { label: "Staff",        path: "/staff",      color: "#6D28D9",     icon: Users },
                    { label: "Agent",        path: "/agent",      color: "#374151",     icon: Briefcase },
                    { label: "Supplier",     path: "/supplier",   color: "#7C3AED",     icon: Building2 },
                    { label: "Customer",     path: "/portal",     color: "#2563EB",     icon: UserCircle },
                  ].map(p => {
                    const Icon = p.icon;
                    return (
                      <Link key={p.path} to={p.path}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}18` }}>
                          <Icon size={18} style={{ color: p.color }} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 text-center leading-tight">{p.label}</p>
                        <ArrowRight size={11} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Sidebar Nav Item">
              <Demo label="Active / Hover / Default states">
                <div className="bg-[#0E6BB8] rounded-xl w-52 p-2 space-y-0.5">
                  {[
                    { icon: BarChart3,   label: "Dashboard",        active: true },
                    { icon: Users,       label: "CRM & Leads",      active: false },
                    { icon: CalendarDays,label: "Bookings",         active: false },
                    { icon: Receipt,     label: "Invoices",         active: false },
                    { icon: Settings,    label: "Settings",         active: false },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all",
                          item.active
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        )}>
                        <Icon size={15} />
                        <span className="text-[13px] font-semibold">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Bottom Nav (Mobile)">
              <Demo label="5-item thumb-zone nav — 44px touch target">
                <div className="bg-white border border-slate-200 rounded-2xl max-w-sm mx-auto overflow-hidden">
                  <div className="flex items-center justify-around px-1 py-1.5">
                    {[
                      { icon: BarChart3,    label: "Home",    active: true },
                      { icon: CalendarDays, label: "Bookings", active: false },
                      { icon: Receipt,      label: "Invoices", active: false },
                      { icon: Bell,         label: "Alerts", badge: 3 },
                      { icon: UserCircle,   label: "Profile",  active: false },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[52px] relative cursor-pointer"
                          style={{ minHeight: 44 }}>
                          <Icon size={22} className={item.active ? "text-[#0E6BB8]" : "text-slate-400"} />
                          <span className={cn("text-[10px] font-semibold leading-none",
                            item.active ? "text-[#0E6BB8]" : "text-slate-400")}>{item.label}</span>
                          {item.badge && (
                            <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-black">
                              {item.badge}
                            </span>
                          )}
                          {item.active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#0E6BB8] rounded-full" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Demo>
            </SubSection>
          </div>
        </Section>

        {/* ── 6. RESPONSIVE ───────────────────────────────────────────────── */}
        <Section id="responsive" title="Responsive Breakpoints"
          subtitle="Mobile-first. 390px (mobile), 768px (tablet), 1280px (desktop). All primary flows work on all sizes.">

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: "Mobile", size: "390px", icon: "📱", rules: ["Bottom nav (5 items)", "Hamburger → drawer", "Tables → cards", "Filter → slide-up sheet", "44px min touch target", "Single column layout"] },
                { label: "Tablet", size: "768px", icon: "💻", rules: ["Sidebar collapses to icons", "2-column grids", "Horizontal scroll tables", "Both nav patterns available", "Drawers stay for sidebar", "KPI grid: 2×2"] },
                { label: "Desktop", size: "1280px+", icon: "🖥️", rules: ["Full sidebar (240px)", "3–4 column grids", "Full table layout", "Inline filters", "Collapsible sidebar", "KPI grid: 4×1"] },
              ].map(bp => (
                <div key={bp.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{bp.icon}</span>
                    <div>
                      <p className="text-sm font-black text-slate-800">{bp.label}</p>
                      <p className="text-xs text-slate-400 font-mono">{bp.size}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {bp.rules.map(r => (
                      <li key={r} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">CSS utility pattern</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { rule: "hidden md:flex",   desc: "Show desktop sidebar" },
                  { rule: "md:hidden",         desc: "Show mobile layout / bottom nav" },
                  { rule: "overflow-x-auto",   desc: "Horizontal scroll for tables on mobile" },
                  { rule: "min-w-[680px]",     desc: "Force table min-width inside scroll" },
                  { rule: "pb-24",             desc: "Bottom nav clearance on mobile" },
                  { rule: "lg:left-60",        desc: "Sidebar-offset topbar on desktop only" },
                ].map(u => (
                  <div key={u.rule} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                    <code className="text-xs font-mono text-[#0E6BB8] bg-[#0E6BB8]/5 px-2 py-1 rounded font-bold">{u.rule}</code>
                    <p className="text-xs text-slate-500">{u.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── 7. i18n & LOCALE ────────────────────────────────────────────── */}
        <Section id="i18n" title="i18n & Locale"
          subtitle="Bangla (বাংলা) + English UI. Multi-currency display. All via formatAmount() in src/app/lib/ds.tsx.">

          <div className="space-y-10">
            <SubSection title="Currency Display">
              <Demo label="formatAmount() — canonical function">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {["Amount (raw)", "BDT (en)", "BDT (bn)", "SAR", "USD", "Short"].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[210000, 1200000, 85000, 18500, 5500000].map(n => (
                        <tr key={n} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{n.toLocaleString()}</td>
                          <td className="px-4 py-2.5 font-mono font-black text-slate-800">{formatAmount(n, "BDT", "en")}</td>
                          <td className="px-4 py-2.5 font-mono font-black text-slate-800">{formatAmount(n, "BDT", "bn")}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{formatAmount(n * 0.034, "SAR")}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{formatAmount(n * 0.0091, "USD")}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">{formatAmountShort(n)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Bangla Numerals">
              <Demo label="toBanglaDigits() — for Bangla UI mode">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Invoice #",   en: "INV-2847",           bn: `INV-${toBanglaDigits(2847)}` },
                    { label: "Date",        en: "15 Jan 2026",        bn: `${toBanglaDigits(15)} জানুয়ারি ${toBanglaDigits(2026)}` },
                    { label: "Pilgrims",    en: "24 pilgrims",        bn: `${toBanglaDigits(24)} জন হজযাত্রী` },
                    { label: "Balance",     en: "৳ 1,20,000",         bn: `৳ ${toBanglaDigits("1,20,000")}` },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</p>
                      <p className="text-sm text-slate-500 mb-1">{item.en}</p>
                      <p className="text-sm font-bold text-[#0E6BB8]">{item.bn}</p>
                    </div>
                  ))}
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Date Formatting">
              <Demo label="formatDate() — short / medium / long">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["short", "medium", "long"] as const).map(style => (
                    <div key={style} className="bg-white rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{style}</p>
                      <p className="text-sm font-semibold text-slate-700">{formatDate("2026-01-15", style, "en")}</p>
                      <p className="text-sm font-semibold text-[#0E6BB8]">{formatDate("2026-01-15", style, "bn")}</p>
                    </div>
                  ))}
                </div>
              </Demo>
            </SubSection>

            <SubSection title="Common Bangla UI Strings">
              <Demo label="Key terms used in the UI">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    ["Dashboard",   "ড্যাশবোর্ড"],
                    ["Bookings",    "বুকিং"],
                    ["Payments",    "পেমেন্ট"],
                    ["Invoice",     "ইনভয়েস"],
                    ["Hajj",        "হজ"],
                    ["Umrah",       "ওমরাহ"],
                    ["Visa",        "ভিসা"],
                    ["Confirmed",   "নিশ্চিত"],
                    ["Pending",     "অপেক্ষমান"],
                    ["Cancelled",   "বাতিল"],
                    ["Agent",       "এজেন্ট"],
                    ["Pilgrim",     "হজযাত্রী"],
                  ].map(([en, bn]) => (
                    <div key={en} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                      <span className="text-xs text-slate-600">{en}</span>
                      <span className="text-sm font-semibold text-[#0E6BB8]">{bn}</span>
                    </div>
                  ))}
                </div>
              </Demo>
            </SubSection>
          </div>
        </Section>

        {/* ── Project structure summary ──────────────────────────────────── */}
        <Section id="structure" title="Project Structure"
          subtitle="File tree organized for developer handoff. 7 distinct areas.">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-5 py-4">
              <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">{`src/app/
├── lib/
│   ├── ds.tsx          ← DESIGN SYSTEM (canonical source of truth)
│   ├── responsive.tsx  ← Mobile primitives (MobileDrawer, BottomNav, …)
│   └── utils.ts        ← cn(), img()
│
├── pages/              ── PUBLIC WEBSITE (7 service pages + blog, gallery, FAQ…)
│   ├── Home.tsx
│   ├── ServicePage.tsx  (Hajj, Umrah, Visa, Air, Hotel, Manpower, Tour)
│   ├── Packages.tsx
│   ├── Booking.tsx      → /book  (lead capture form)
│   ├── Auth.tsx         → /login /register  (role-select → portal routing)
│   ├── Sitemap.tsx      → /sitemap  (workflow + route map)
│   └── DesignSystem.tsx → /ds  (this page)
│
├── components/
│   └── Layout.tsx       ← Public website shell (nav + footer)
│
├── erp/                ── ERP MODULES (Admin / Super Admin / Executives)
│   ├── ErpLayout.tsx    ← ERP shell (sidebar + topbar + mobile nav)
│   ├── SuperAdminDashboard.tsx  → /erp
│   ├── bookings/BookingsModule.tsx → /erp/bookings  (CRM + leads)
│   ├── PackageManagement.tsx    → /erp/packages
│   ├── ServicesConfig.tsx       → /erp/services
│   ├── AccountsModule.tsx       → /erp/accounts
│   ├── InvoicesModule.tsx       → /erp/invoices
│   ├── ReportsModule.tsx        → /erp/reports
│   ├── ReportsBIModule.tsx      → /erp/reports-bi
│   ├── DocumentsModule.tsx      → /erp/documents
│   ├── CommunicationsModule.tsx → /erp/communications
│   ├── CmsModule.tsx            → /erp/cms
│   ├── OperationsModule.tsx     → /erp/ops
│   └── SettingsModule.tsx       → /erp/settings
│
└── portal/             ── ROLE PORTALS (each standalone route, mobile-first)
    ├── CustomerPortal.tsx   → /portal     (10 screens)
    ├── AgentPortal.tsx      → /agent      (10 screens)
    ├── SupplierPortal.tsx   → /supplier   (10 screens)
    ├── StaffPortal.tsx      → /staff      (10 screens)
    └── AccountantPortal.tsx → /accountant (9 screens)`}</pre>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Public pages",    count: "15", color: BRAND.gold },
                  { label: "ERP modules",     count: "14", color: BRAND.navy },
                  { label: "Portal screens",  count: "49", color: BRAND.emerald },
                  { label: "Shared lib files",count: "3",  color: "#7C3AED" },
                  { label: "Total routes",    count: "32", color: "#0891B2" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-slate-600">{s.label}</span>
                    <span className="text-xs font-black text-slate-800">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-[1300px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#0E6BB8] flex items-center justify-center">
              <Palette size={13} className="text-white" />
            </div>
            <p className="text-xs text-slate-500">BDH Travels ERP Design System · v1.0 · UI/UX only — functionality unchanged</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/sitemap" className="text-xs text-slate-400 hover:text-[#0E6BB8] transition-colors">Sitemap</Link>
            <Link to="/erp" className="text-xs text-slate-400 hover:text-[#0E6BB8] transition-colors">ERP</Link>
            <Link to="/login" className="text-xs text-slate-400 hover:text-[#0E6BB8] transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
