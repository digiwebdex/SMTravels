import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { dashboardFor } from "../auth/roles";
import { authApi, type ApiError } from "../lib/api";
import {
  Eye, EyeOff, Mail, Phone, Lock, User, Building, Globe, ArrowRight,
  ArrowLeft, CheckCircle, AlertCircle, Shield, Briefcase, Star,
  TrendingUp, ChevronRight, Loader2, AlertTriangle, Key, RefreshCw,
  LayoutDashboard, Calculator, HelpCircle, MapPin, Hotel, Plane, X,
  LogIn,
} from "lucide-react";
import { cn } from "../lib/utils";
import { BrandLogo } from "../components/BrandLogo";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthView =
  | "login" | "register-select" | "register-customer" | "register-agent"
  | "forgot" | "otp-verify" | "reset-password" | "two-factor"
  | "role-select" | "success" | "locked";

type OTPContext = "forgot" | "2fa" | "register-email";

interface AuthState {
  view: AuthView;
  loading: boolean;
  error: string | null;
  identifier: string;
  otpContext: OTPContext;
  successMsg: string;
  successSub: string;
  successRedirect: string;
}

// ─── Roles config ─────────────────────────────────────────────────────────────
const ROLES = [
  { id: "super-admin",  label: "Super Admin",       desc: "Full system access & configuration",     icon: Shield,         color: "#DC2626", bg: "#FEF2F2" },
  { id: "admin",        label: "Admin",              desc: "Branch management & staff oversight",    icon: LayoutDashboard,color: "#1B75BC", bg: "#EEF2FF" },
  { id: "accountant",   label: "Accountant",         desc: "Finance, ledgers & payroll",             icon: Calculator,     color: "#0E7C66", bg: "#ECFDF5" },
  { id: "hajj-exec",    label: "Hajj Executive",     desc: "Pilgrim management & coordination",      icon: Star,           color: "#F15A24", bg: "#FFF9E6" },
  { id: "umrah-exec",   label: "Umrah Executive",    desc: "Umrah packages & pilgrim tracking",      icon: MapPin,         color: "#7C3AED", bg: "#F5F3FF" },
  { id: "visa-exec",    label: "Visa Executive",     desc: "Visa applications & processing",         icon: Globe,          color: "#0891B2", bg: "#F0F9FF" },
  { id: "sales-exec",   label: "Sales Executive",    desc: "Leads, CRM & package sales",             icon: TrendingUp,     color: "#EA580C", bg: "#FFF7ED" },
  { id: "air-exec",     label: "Air Ticket Exec",    desc: "Flight bookings & ticketing",            icon: Plane,          color: "#2563EB", bg: "#EFF6FF" },
  { id: "agent",        label: "Agent Portal",       desc: "B2B partner bookings & commission",      icon: Briefcase,      color: "#374151", bg: "#F9FAFB" },
  { id: "supplier",     label: "Supplier Portal",    desc: "Hotel, transport & vendor services",     icon: Hotel,          color: "#6B7280", bg: "#F9FAFB" },
  { id: "customer",     label: "Customer Portal",    desc: "My bookings, profile & documents",       icon: User,           color: "#1B75BC", bg: "#EEF2FF" },
];

// Demo: user has these roles
const USER_ROLES = ["admin", "hajj-exec", "agent"];

// ─── Shared sub-components ────────────────────────────────────────────────────

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-3 md:py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] bg-white outline-none transition-all min-h-[48px] focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10 placeholder:text-[#D1D5DB]";
const inputErrCls = "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/10";

function PasswordField({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean;
}) {
  const { t } = useTranslation("auth");
  const [show, setShow] = useState(false);
  const ph = placeholder ?? t("fields.passwordPlaceholder");
  return (
    <div className="relative">
      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
      <input type={show ? "text" : "password"} placeholder={ph} value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(inputCls, "pl-9 pr-10", error && inputErrCls)} />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] cursor-pointer">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation("auth");
  const checks = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];
  const score = checks.filter(r => r.test(password)).length + (password.length >= 8 ? 1 : 0);
  const score5 = Math.min(score, 4);
  const cfg = [
    { label: "", color: "bg-[#E5E7EB]" },
    { label: t("strength.weak"),   color: "bg-[#DC2626]" },
    { label: t("strength.fair"),   color: "bg-[#F59E0B]" },
    { label: t("strength.good"),   color: "bg-[#3B82F6]" },
    { label: t("strength.strong"), color: "bg-[#0E7C66]" },
  ];
  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= score5 ? cfg[score5].color : "bg-[#E5E7EB]")} />
        ))}
      </div>
      <span className="text-[10px] font-bold text-[#9CA3AF] w-10 text-right">{cfg[score5].label}</span>
    </div>
  );
}

// 6-digit OTP boxes
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const LEN = 6;

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const arr = (value + "      ").slice(0, LEN).split("");
    arr[i] = v || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (v && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!value[i] && i > 0) {
        const arr = (value + "      ").slice(0, LEN).split("");
        arr[i - 1] = " ";
        onChange(arr.join("").trimEnd());
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    onChange(pasted);
    refs.current[Math.min(pasted.length, LEN - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length: LEN }).map((_, i) => {
        const filled = i < value.length;
        return (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={cn(
              "w-10 h-14 sm:w-12 sm:h-14 text-center text-xl font-black rounded-[12px] border-2 outline-none transition-all cursor-text",
              filled
                ? "border-[#1B75BC] bg-[#1B75BC]/5 text-[#1B75BC]"
                : "border-[#E5E7EB] bg-white text-[#111827] focus:border-[#1B75BC] focus:ring-2 focus:ring-[#1B75BC]/10"
            )}
          />
        );
      })}
    </div>
  );
}

function ResendTimer({ onResend }: { onResend: () => void }) {
  const { t } = useTranslation("auth");
  const [secs, setSecs] = useState(59);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);
  if (secs > 0) return (
    <span className="text-[12px] text-[#9CA3AF] whitespace-nowrap">
      <Trans t={t} i18nKey="resend.in"
        values={{ time: `0:${String(secs).padStart(2, "0")}` }}
        components={{ b: <span className="font-bold text-[#374151]" /> }} />
    </span>
  );
  return (
    <button onClick={() => { onResend(); setSecs(59); }}
      className="text-[12px] font-bold text-[#1B75BC] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap">
      <RefreshCw size={12} /> {t("resend.code")}
    </button>
  );
}

function PrimaryButton({ children, loading, onClick, type = "button", variant = "primary" }: {
  children: React.ReactNode; loading?: boolean; onClick?: () => void; type?: "button" | "submit"; variant?: "primary" | "gold";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={cn(
        "w-full min-h-[52px] flex items-center justify-center gap-2 font-black rounded-[12px] text-[14px] transition-all cursor-pointer",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variant === "gold"
          ? "bg-[#F15A24] hover:bg-[#CC3C17] text-[#1B75BC]"
          : "bg-[#1B75BC] hover:bg-[#14588F] text-white shadow-lg shadow-[#1B75BC]/20"
      )}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : children}
    </button>
  );
}

function ErrorBanner({ msg, onDismiss }: { msg: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-3.5">
      <AlertCircle size={16} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
      <p className="text-[12px] text-[#991B1B] flex-1">{msg}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-[#DC2626]/60 hover:text-[#DC2626] cursor-pointer"><X size={14} /></button>
      )}
    </div>
  );
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#ECFDF5] border border-[#6EE7B7] rounded-[10px] p-3.5">
      <CheckCircle size={16} className="text-[#0E7C66] flex-shrink-0" />
      <p className="text-[12px] text-[#065F46]">{msg}</p>
    </div>
  );
}

// ─── Brand Panel ──────────────────────────────────────────────────────────────
// Views that have dedicated brand-panel copy (keys live in the "auth" namespace).
const BRAND_VIEWS: AuthView[] = [
  "login", "register-select", "register-customer", "register-agent", "forgot",
  "otp-verify", "reset-password", "two-factor", "role-select", "success", "locked",
];

function BrandPanel({ view }: { view: AuthView }) {
  const { t } = useTranslation("auth");
  const key = BRAND_VIEWS.includes(view) ? view : "login";
  const copy = { headline: t(`brandPanel.${key}.headline`), sub: t(`brandPanel.${key}.sub`) };
  const trustItems = ["0", "1", "2", "3", "4"].map(i => t(`brandPanel.trust.${i}`));
  return (
    <div className="relative hidden md:flex flex-col w-[42%] flex-shrink-0 overflow-hidden">
      {/* Background image */}
      <img
        src="/hero-kaaba.jpg"
        alt="Kaaba Makkah"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#062D63]/95 via-[#1B75BC]/75 to-[#041E42]/95" />
      {/* Geometric texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-auto">
          <BrandLogo variant="tile" className="w-11 h-11 rounded-[12px]" />
          <div>
            <div className="text-white font-black text-[17px] leading-tight">{t("common:brand.name")}</div>
            <div className="text-white/40 text-[11px] tracking-wide">{t("common:brand.tagline")}</div>
          </div>
        </Link>

        {/* Center copy */}
        <div className="my-auto">
          <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>{copy.headline}</h2>
          <p className="text-white/60 text-[14px] leading-relaxed max-w-xs">{copy.sub}</p>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {trustItems.map(t => (
              <span key={t} className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-[11px] text-white/70 font-medium">
                <CheckCircle size={10} className="text-[#D64A12]" /> {t}
              </span>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-8 bg-white/8 border border-white/12 rounded-[16px] p-5">
            <p className="text-white/70 text-[12px] leading-relaxed italic mb-3">
              &ldquo;{t("brandPanel.testimonial.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#F15A24]/30 flex items-center justify-center text-[#D64A12] font-black text-[11px]">M</div>
              <div>
                <div className="text-white/80 text-[11px] font-bold">{t("brandPanel.testimonial.name")}</div>
                <div className="text-white/40 text-[10px]">{t("brandPanel.testimonial.meta")}</div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="#F15A24" className="text-[#D64A12]" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-between">
          <div className="text-white/30 text-[10px]">{t("brandPanel.footer.copyright")}</div>
          <div className="flex gap-3">
            {(["privacy", "terms", "support"] as const).map(l => (
              <a key={l} href="#" className="text-white/30 text-[10px] hover:text-white/60 transition-colors">{t(`brandPanel.footer.${l}`)}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile brand strip ───────────────────────────────────────────────────────
function MobileBrandStrip({ view }: { view: AuthView }) {
  const { t } = useTranslation("auth");
  void view;
  return (
    <div className="md:hidden bg-[#062D63] px-5 py-4 flex items-center justify-between flex-shrink-0">
      <Link to="/" className="flex items-center gap-2.5">
        <BrandLogo variant="tile" className="w-9 h-9" />
        <div>
          <div className="text-white font-black text-[14px] leading-tight">{t("brandPanel.mobileBrand.line1")}</div>
          <div className="text-white/40 text-[9px]">{t("brandPanel.mobileBrand.line2")}</div>
        </div>
      </Link>
      <div className="flex gap-1.5">
        {["0", "1"].map(i => (
          <span key={i} className="text-[9px] font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">{t(`brandPanel.trustMobile.${i}`)}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────
function BackLink({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useTranslation("auth");
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-[12px] font-bold text-[#9CA3AF] hover:text-[#374151] mb-5 cursor-pointer transition-colors group whitespace-nowrap">
      <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
      {label ?? t("common:actions.back")}
    </button>
  );
}

// ─── Form screen wrappers ──────────────────────────────────────────────────────
function FormHeader({ icon: Icon, iconColor = "#1B75BC", iconBg = "#EEF2FF", title, sub }: {
  icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
  iconColor?: string; iconBg?: string; title: string; sub?: string;
}) {
  return (
    <div className="mb-7">
      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4" style={{ backgroundColor: iconBg }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <h1 className="text-[22px] md:text-[24px] font-black text-[#111827] leading-tight mb-1">{title}</h1>
      {sub && <p className="text-[13px] text-[#6B7280] leading-relaxed">{sub}</p>}
    </div>
  );
}

// ─── MAIN AUTH SCREEN ─────────────────────────────────────────────────────────
// Role → portal route mapping
const ROLE_ROUTES: Record<string, string> = {
  "super-admin": "/erp",
  "admin":       "/erp",
  "accountant":  "/accountant",
  "hajj-exec":   "/erp/bookings",
  "umrah-exec":  "/erp/bookings",
  "visa-exec":   "/erp/bookings",
  "sales-exec":  "/erp/bookings",
  "air-exec":    "/erp/bookings",
  "agent":       "/agent",
  "supplier":    "/supplier",
  "customer":    "/portal",
};

function AuthScreen({ initialView = "login" }: { initialView?: AuthView }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation("auth");
  const [resetToken, setResetToken] = useState("");
  const [state, setState] = useState<AuthState>({
    view: initialView,
    loading: false,
    error: null,
    identifier: "",
    otpContext: "forgot",
    successMsg: t("success.defaultTitle"),
    successSub: t("success.defaultSub"),
    successRedirect: "/",
  });
  const [otp, setOtp] = useState("");

  const set = useCallback((patch: Partial<AuthState>) => setState(s => ({ ...s, ...patch })), []);

  const go = (view: AuthView, patch?: Partial<AuthState>) => {
    set({ view, error: null, loading: false, ...patch });
    setOtp("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const simulateLoad = (cb: () => void, ms = 1400) => {
    set({ loading: true, error: null });
    setTimeout(() => { set({ loading: false }); cb(); }, ms);
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  // dev builds pre-fill the demo admin for convenience; production starts empty
  const [loginId, setLoginId] = useState(import.meta.env.DEV ? "super_admin@smtravel.com.bd" : "");
  const [loginPass, setLoginPass] = useState("");
  const [loginMode, setLoginMode] = useState<"email" | "phone">("email");
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !loginPass) { set({ error: t("errors.fillAll") }); return; }
    set({ loading: true, error: null });
    try {
      const user = await login(loginId.trim(), loginPass);
      navigate(dashboardFor(user.role), { replace: true });
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 423) { go("locked"); return; }
      set({
        loading: false,
        error: err.status === 401 ? t("errors.invalidCreds")
             : err.status === 403 ? t("errors.notActive")
             : (err.message || t("errors.signInFailed")),
      });
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────
  const handleOTPVerify = async () => {
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) { set({ error: t("errors.otpIncomplete") }); return; }
    if (state.otpContext === "forgot") {
      set({ loading: true, error: null });
      try {
        const { resetToken: rt } = await authApi.verifyOtp(state.identifier, code);
        setResetToken(rt);
        go("reset-password");
      } catch (e) {
        const err = e as ApiError;
        set({ loading: false, error: err.status === 400 ? t("errors.otpInvalid") : (err.message || t("errors.verifyFailed")) });
      }
      return;
    }
    // 2FA / email-verification screens have no backend endpoint yet — left as-is.
    simulateLoad(() => {
      if (state.otpContext === "2fa") go("role-select");
      else go("success", { successMsg: t("success.emailVerifiedTitle"), successSub: t("success.emailVerifiedSub"), successRedirect: "/login" });
    });
  };

  // ── Forms ─────────────────────────────────────────────────────────────────
  const [custForm, setCustForm] = useState({ name: "", email: "", phone: "", city: "", pass: "", confirm: "" });
  const [agentForm, setAgentForm] = useState({ name: "", email: "", phone: "", agency: "", type: "", city: "", atab: "", pass: "", confirm: "" });
  const [resetPass, setResetPass] = useState({ pass: "", confirm: "" });
  const [forgotId, setForgotId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const v = state.view;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F8FA]">
      {/* Brand panel (desktop left) */}
      <BrandPanel view={v} />

      {/* Form panel (right / full on mobile) */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0 overflow-y-auto">
        <MobileBrandStrip view={v} />

        <div className="flex-1 flex items-start md:items-center justify-center p-5 md:p-10">
          <div className="w-full max-w-[440px]">

            {/* ── LOGIN ── */}
            {v === "login" && (
              <div>
                <FormHeader icon={LogIn} title={t("login.title")}
                  sub={t("login.sub")} />

                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}

                {/* Toggle email/phone */}
                <div className="flex bg-[#F3F4F6] rounded-[10px] p-1 mb-5">
                  {(["email", "phone"] as const).map(m => (
                    <button key={m} onClick={() => setLoginMode(m)}
                      className={cn("flex-1 py-2 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] whitespace-nowrap",
                        loginMode === m ? "bg-white text-[#1B75BC] shadow" : "text-[#9CA3AF] hover:text-[#374151]"
                      )}>
                      {m === "email" ? <Mail size={13} /> : <Phone size={13} />}
                      {m === "email" ? t("login.tabEmail") : t("login.tabPhone")}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4 mb-5">
                  <FieldGroup label={loginMode === "email" ? t("fields.emailAddress") : t("fields.phoneNumber")} required>
                    <div className="relative">
                      {loginMode === "email"
                        ? <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        : <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />}
                      <input type={loginMode === "email" ? "email" : "tel"}
                        placeholder={loginMode === "email" ? t("login.emailPlaceholder") : t("fields.phonePlaceholder")}
                        value={loginId} onChange={e => setLoginId(e.target.value)}
                        className={cn(inputCls, "pl-9")} />
                    </div>
                  </FieldGroup>

                  <FieldGroup label={t("fields.password")} required>
                    <PasswordField value={loginPass} onChange={setLoginPass} />
                  </FieldGroup>
                </div>

                <div className="flex items-center justify-between gap-3 mb-5">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      className="w-4 h-4 accent-[#1B75BC] flex-shrink-0" />
                    <span className="text-[12px] text-[#6B7280]">{t("login.remember")}</span>
                  </label>
                  <button onClick={() => go("forgot")}
                    className="text-[12px] font-bold text-[#1B75BC] hover:underline cursor-pointer min-h-[44px] flex items-center whitespace-nowrap">
                    {t("login.forgot")}
                  </button>
                </div>

                <PrimaryButton loading={state.loading} onClick={handleLogin}>
                  {t("login.signIn")} <ArrowRight size={15} />
                </PrimaryButton>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                  <span className="text-[11px] text-[#9CA3AF] font-medium whitespace-nowrap">{t("login.newTo")}</span>
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => go("register-customer")}
                    className="min-h-[48px] flex items-center justify-center gap-1.5 border-2 border-[#1B75BC]/20 text-[#1B75BC] font-bold rounded-[10px] text-[12px] hover:border-[#1B75BC]/50 hover:bg-[#1B75BC]/3 transition-all cursor-pointer whitespace-nowrap">
                    <User size={13} /> {t("login.customer")}
                  </button>
                  <button onClick={() => go("register-agent")}
                    className="min-h-[48px] flex items-center justify-center gap-1.5 border-2 border-[#F15A24]/40 text-[#D64A12] font-bold rounded-[10px] text-[12px] hover:border-[#F15A24] hover:bg-[#F15A24]/5 transition-all cursor-pointer whitespace-nowrap">
                    <Briefcase size={13} /> {t("login.agent")}
                  </button>
                </div>

                {/* Demo credentials hint — DEV BUILDS ONLY. Never advertise a
                    credential pattern on the production login page. */}
                {import.meta.env.DEV && (
                  <div className="mt-5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3 text-[11px] text-[#9CA3AF] text-center">
                    {t("login.demoLabel")} <span className="font-bold text-[#374151]">super_admin@smtravel.com.bd</span> · <span className="font-bold text-[#374151]">Password123!</span>
                  </div>
                )}
              </div>
            )}

            {/* ── REGISTER SELECT ── */}
            {v === "register-select" && (
              <div>
                <BackLink onClick={() => go("login")} label={t("registerSelect.back")} />
                <FormHeader icon={UserPlus} title={t("registerSelect.title")} sub={t("registerSelect.sub")} />
                <div className="flex flex-col gap-4">
                  {[
                    { id: "register-customer", tk: "customer", icon: User, color: "#1B75BC", bg: "#EEF2FF" },
                    { id: "register-agent", tk: "agent", icon: Briefcase, color: "#F15A24", bg: "#FFF9E6" },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => go(opt.id as AuthView)}
                      className="w-full text-left p-5 bg-white border-2 border-[#E5E7EB] hover:border-[#1B75BC]/30 hover:shadow-md rounded-[16px] transition-all group cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: opt.bg }}>
                          <opt.icon size={20} style={{ color: opt.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-black text-[#111827] mb-1 group-hover:text-[#1B75BC] transition-colors">{t(`registerSelect.${opt.tk}.label`)}</div>
                          <div className="text-[12px] text-[#6B7280] leading-relaxed">{t(`registerSelect.${opt.tk}.desc`)}</div>
                        </div>
                        <ChevronRight size={16} className="text-[#D1D5DB] group-hover:text-[#1B75BC] mt-1 transition-colors" />
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#F3F4F6] text-[12px] font-bold flex items-center gap-1.5" style={{ color: opt.color }}>
                        {t(`registerSelect.${opt.tk}.cta`)} <ArrowRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-[12px] text-[#9CA3AF] mt-6">
                  {t("registerSelect.haveAccount")}{" "}
                  <button onClick={() => go("login")} className="text-[#1B75BC] font-bold hover:underline cursor-pointer">{t("signInLink")}</button>
                </p>
              </div>
            )}

            {/* ── REGISTER CUSTOMER ── */}
            {v === "register-customer" && (
              <div>
                <BackLink onClick={() => go("register-select")} />
                <FormHeader icon={User} title={t("registerCustomer.title")} sub={t("registerCustomer.sub")} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); simulateLoad(() => go("otp-verify", { identifier: custForm.email, otpContext: "register-email" })); }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label={t("fields.fullName")} required>
                      <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input className={cn(inputCls, "pl-9")} placeholder={t("fields.fullNamePlaceholder")} value={custForm.name} onChange={e => setCustForm(f => ({ ...f, name: e.target.value }))} /></div>
                    </FieldGroup>
                    <FieldGroup label={t("fields.city")} required>
                      <select className={cn(inputCls, "cursor-pointer")} value={custForm.city} onChange={e => setCustForm(f => ({ ...f, city: e.target.value }))}>
                        <option value="">{t("fields.selectCity")}</option>
                        {["Dhaka","Chittagong","Sylhet","Khulna","Rajshahi"].map(c => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label={t("fields.emailAddress")} required>
                    <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input type="email" className={cn(inputCls, "pl-9")} placeholder={t("fields.emailPlaceholder")} value={custForm.email} onChange={e => setCustForm(f => ({ ...f, email: e.target.value }))} /></div>
                  </FieldGroup>
                  <FieldGroup label={t("fields.phoneWhatsapp")} required>
                    <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input type="tel" className={cn(inputCls, "pl-9")} placeholder={t("fields.phonePlaceholder")} value={custForm.phone} onChange={e => setCustForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  </FieldGroup>
                  <FieldGroup label={t("fields.password")} required>
                    <PasswordField value={custForm.pass} onChange={v => setCustForm(f => ({ ...f, pass: v }))} />
                    <PasswordStrength password={custForm.pass} />
                  </FieldGroup>
                  <FieldGroup label={t("fields.confirmPassword")} required>
                    <PasswordField value={custForm.confirm} onChange={v => setCustForm(f => ({ ...f, confirm: v }))} placeholder={t("fields.repeatPassword")} />
                  </FieldGroup>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1B75BC]" />
                    <span className="text-[12px] text-[#6B7280]">
                      <Trans t={t} i18nKey="registerCustomer.terms"
                        components={{
                          terms: <a href="#" className="text-[#1B75BC] font-semibold hover:underline" />,
                          privacy: <a href="#" className="text-[#1B75BC] font-semibold hover:underline" />,
                        }} />
                    </span>
                  </label>
                  <PrimaryButton type="submit" loading={state.loading}>{t("registerCustomer.createAccount")} <ArrowRight size={14} /></PrimaryButton>
                </form>
                <p className="text-center text-[12px] text-[#9CA3AF] mt-4">
                  {t("registerCustomer.haveAccount")} <button onClick={() => go("login")} className="text-[#1B75BC] font-bold hover:underline cursor-pointer">{t("signInLink")}</button>
                </p>
              </div>
            )}

            {/* ── REGISTER AGENT ── */}
            {v === "register-agent" && (
              <div>
                <BackLink onClick={() => go("register-select")} />
                <FormHeader icon={Briefcase} iconColor="#F15A24" iconBg="#FFF9E6" title={t("registerAgent.title")} sub={t("registerAgent.sub")} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); simulateLoad(() => go("success", { successMsg: t("success.agentSubmittedTitle"), successSub: t("success.agentSubmittedSub"), successRedirect: "/login" })); }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label={t("fields.fullName")} required>
                      <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input className={cn(inputCls, "pl-9")} placeholder={t("fields.fullNamePlaceholder")} value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} /></div>
                    </FieldGroup>
                    <FieldGroup label={t("registerAgent.agencyName")} required>
                      <div className="relative"><Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input className={cn(inputCls, "pl-9")} placeholder={t("registerAgent.agencyPlaceholder")} value={agentForm.agency} onChange={e => setAgentForm(f => ({ ...f, agency: e.target.value }))} /></div>
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label={t("fields.emailAddress")} required>
                      <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input type="email" className={cn(inputCls, "pl-9")} placeholder={t("registerAgent.emailPlaceholder")} value={agentForm.email} onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))} /></div>
                    </FieldGroup>
                    <FieldGroup label={t("fields.phoneWhatsapp")} required>
                      <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input type="tel" className={cn(inputCls, "pl-9")} placeholder={t("fields.phonePlaceholder")} value={agentForm.phone} onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label={t("registerAgent.agentType")} required>
                      <select className={cn(inputCls, "cursor-pointer")} value={agentForm.type} onChange={e => setAgentForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="">{t("registerAgent.selectType")}</option>
                        {["Individual Agent","Travel Agency","Sub-Agent","Corporate Partner"].map(ty => <option key={ty} value={ty}>{t(`agentTypes.${ty}`)}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label={t("fields.city")} required>
                      <select className={cn(inputCls, "cursor-pointer")} value={agentForm.city} onChange={e => setAgentForm(f => ({ ...f, city: e.target.value }))}>
                        <option value="">{t("fields.selectCity")}</option>
                        {["Dhaka","Chittagong","Sylhet","Khulna"].map(c => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label={t("registerAgent.atab")}>
                    <input className={inputCls} placeholder={t("registerAgent.atabPlaceholder")} value={agentForm.atab} onChange={e => setAgentForm(f => ({ ...f, atab: e.target.value }))} />
                  </FieldGroup>
                  <FieldGroup label={t("fields.password")} required>
                    <PasswordField value={agentForm.pass} onChange={v => setAgentForm(f => ({ ...f, pass: v }))} />
                    <PasswordStrength password={agentForm.pass} />
                  </FieldGroup>
                  <FieldGroup label={t("fields.confirmPassword")} required>
                    <PasswordField value={agentForm.confirm} onChange={v => setAgentForm(f => ({ ...f, confirm: v }))} placeholder={t("fields.repeatPassword")} />
                  </FieldGroup>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1B75BC]" />
                    <span className="text-[12px] text-[#6B7280]">
                      <Trans t={t} i18nKey="registerAgent.terms"
                        components={{
                          agreement: <a href="#" className="text-[#1B75BC] font-semibold hover:underline" />,
                          terms: <a href="#" className="text-[#1B75BC] font-semibold hover:underline" />,
                        }} />
                    </span>
                  </label>
                  <PrimaryButton type="submit" loading={state.loading} variant="gold">{t("registerAgent.submit")} <ArrowRight size={14} /></PrimaryButton>
                </form>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {v === "forgot" && (
              <div>
                <BackLink onClick={() => go("login")} label={t("forgot.back")} />
                <FormHeader icon={Key} title={t("forgot.title")} sub={t("forgot.sub")} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <FieldGroup label={t("forgot.label")} required>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input type="text" placeholder={t("forgot.placeholder")} value={forgotId} onChange={e => setForgotId(e.target.value)}
                      className={cn(inputCls, "pl-9")} />
                  </div>
                </FieldGroup>
                <div className="mt-5">
                  <PrimaryButton loading={state.loading}
                    onClick={async () => {
                      const id = forgotId.trim();
                      if (!id) { set({ error: t("errors.enterEmail") }); return; }
                      set({ loading: true, error: null });
                      try {
                        const r = await authApi.forgotPassword(id);
                        if (r.devOtp) setOtp(r.devOtp); // dev only: backend returns the code so the flow is testable
                        go("otp-verify", { identifier: id, otpContext: "forgot" });
                      } catch (e) {
                        set({ loading: false, error: (e as ApiError).message || t("errors.sendFailed") });
                      }
                    }}>
                    {t("forgot.send")} <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ── OTP VERIFY (forgot + register) ── */}
            {v === "otp-verify" && (
              <div>
                <BackLink onClick={() => go(state.otpContext === "forgot" ? "forgot" : "register-customer")} />
                <FormHeader icon={Shield} iconColor="#0E7C66" iconBg="#ECFDF5"
                  title={t("otp.title")}
                  sub={t("otp.sub", { contact: state.identifier || t("otp.contactFallback") })} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <OTPInput value={otp} onChange={setOtp} />
                <div className="flex items-center justify-center mt-4 mb-6">
                  <ResendTimer onResend={() => setOtp("")} />
                </div>
                <PrimaryButton loading={state.loading} onClick={handleOTPVerify}>
                  {t("otp.verify")} <ArrowRight size={14} />
                </PrimaryButton>
                <div className="mt-4 bg-[#FFF9E6] border border-[#F15A24]/30 rounded-[10px] p-3 text-[11px] text-[#78590F] flex items-center gap-2">
                  <AlertTriangle size={13} className="text-[#D64A12] flex-shrink-0" />
                  {t("otp.expiry")}
                </div>
              </div>
            )}

            {/* ── TWO-FACTOR ── */}
            {v === "two-factor" && (
              <div>
                <BackLink onClick={() => go("login")} label={t("twoFactor.back")} />
                <FormHeader icon={Shield} iconColor="#7C3AED" iconBg="#F5F3FF"
                  title={t("twoFactor.title")}
                  sub={t("twoFactor.sub", { last4: state.identifier.slice(-4) || "5678" })} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <OTPInput value={otp} onChange={setOtp} />
                <div className="flex items-center justify-between gap-3 mt-4 mb-6">
                  <ResendTimer onResend={() => setOtp("")} />
                  <button className="text-[12px] text-[#9CA3AF] hover:text-[#374151] cursor-pointer hover:underline whitespace-nowrap">
                    {t("twoFactor.backupCode")}
                  </button>
                </div>
                <PrimaryButton loading={state.loading}
                  onClick={() => simulateLoad(() => go("role-select"))}>
                  {t("twoFactor.verify")} <ArrowRight size={14} />
                </PrimaryButton>
                <div className="mt-3 flex items-center gap-2 p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px]">
                  <HelpCircle size={13} className="text-[#9CA3AF] flex-shrink-0" />
                  <span className="text-[11px] text-[#9CA3AF]">
                    <Trans t={t} i18nKey="twoFactor.lostAccess"
                      components={{ a: <a href="#" className="text-[#1B75BC] font-bold hover:underline" /> }} />
                  </span>
                </div>
              </div>
            )}

            {/* ── RESET PASSWORD ── */}
            {v === "reset-password" && (
              <div>
                <FormHeader icon={Lock} title={t("reset.title")} sub={t("reset.sub")} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <form className="flex flex-col gap-4" onSubmit={async e => {
                  e.preventDefault();
                  if (resetPass.pass !== resetPass.confirm) { set({ error: t("errors.passMismatch") }); return; }
                  if (resetPass.pass.length < 8) { set({ error: t("errors.passTooShort") }); return; }
                  set({ loading: true, error: null });
                  try {
                    await authApi.resetPassword(resetToken, resetPass.pass);
                    go("success", { successMsg: t("success.passwordUpdatedTitle"), successSub: t("success.passwordUpdatedSub"), successRedirect: "/login" });
                  } catch (err) {
                    set({ loading: false, error: (err as ApiError).message || t("errors.resetFailed") });
                  }
                }}>
                  <FieldGroup label={t("reset.newPassword")} required>
                    <PasswordField value={resetPass.pass} onChange={v => setResetPass(f => ({ ...f, pass: v }))} placeholder={t("reset.newPasswordPlaceholder")} />
                    <PasswordStrength password={resetPass.pass} />
                  </FieldGroup>
                  <FieldGroup label={t("reset.confirmNew")} required>
                    <PasswordField value={resetPass.confirm} onChange={v => setResetPass(f => ({ ...f, confirm: v }))} placeholder={t("reset.repeatNew")}
                      error={!!resetPass.confirm && resetPass.pass !== resetPass.confirm} />
                    {resetPass.confirm && resetPass.pass !== resetPass.confirm && (
                      <span className="text-[11px] text-[#DC2626]">{t("reset.mismatch")}</span>
                    )}
                  </FieldGroup>
                  <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3">
                    {(["minChars","uppercase","number","special"] as const).map(rk => (
                      <div key={rk} className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mb-1 last:mb-0">
                        <CheckCircle size={11} className={resetPass.pass.length >= 8 ? "text-[#0E7C66]" : "text-[#E5E7EB]"} /> {t(`passwordRules.${rk}`)}
                      </div>
                    ))}
                  </div>
                  <PrimaryButton type="submit" loading={state.loading}>{t("reset.update")} <ArrowRight size={14} /></PrimaryButton>
                </form>
              </div>
            )}

            {/* ── ROLE SELECT ── */}
            {v === "role-select" && (
              <div>
                <FormHeader icon={LayoutDashboard} title={t("roleSelect.title")}
                  sub={t("roleSelect.sub")} />
                <div className="flex flex-col gap-3 mb-6">
                  {USER_ROLES.map(roleId => {
                    const role = ROLES.find(r => r.id === roleId)!;
                    const Icon = role.icon;
                    const isSelected = selectedRole === roleId;
                    return (
                      <button key={roleId} onClick={() => setSelectedRole(roleId)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-[14px] border-2 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-[#1B75BC] bg-[#1B75BC]/3 shadow-md"
                            : "border-[#E5E7EB] bg-white hover:border-[#1B75BC]/30 hover:shadow-sm"
                        )}>
                        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ backgroundColor: isSelected ? `${role.color}20` : role.bg }}>
                          <Icon size={20} style={{ color: role.color }} />
                        </div>
                        <div className="flex-1">
                          <div className={cn("text-[14px] font-bold transition-colors", isSelected ? "text-[#1B75BC]" : "text-[#111827]")}>{t(`roles.${role.id}.label`)}</div>
                          <div className="text-[11px] text-[#9CA3AF] mt-0.5">{t(`roles.${role.id}.desc`)}</div>
                        </div>
                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          isSelected ? "border-[#1B75BC] bg-[#1B75BC]" : "border-[#D1D5DB]")}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-2.5 mb-5 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#1B75BC] flex-shrink-0" />
                  <span className="text-[12px] text-[#6B7280]">{t("roleSelect.remember")}</span>
                </label>
                <PrimaryButton
                  loading={state.loading}
                  onClick={() => {
                    if (!selectedRole) return;
                    const dest = ROLE_ROUTES[selectedRole] ?? "/erp";
                    simulateLoad(() => navigate(dest));
                  }}>
                  {selectedRole ? t("roleSelect.continueAs", { role: t(`roles.${selectedRole}.label`) }) : t("roleSelect.selectPrompt")} <ArrowRight size={14} />
                </PrimaryButton>
                <button onClick={() => go("login")}
                  className="w-full mt-3 min-h-[44px] text-[13px] text-[#9CA3AF] hover:text-[#374151] transition-colors cursor-pointer">
                  {t("roleSelect.signOut")}
                </button>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {v === "success" && (
              <div className="text-center py-6">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-[#ECFDF5] rounded-full animate-ping opacity-30" />
                  <div className="relative w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center">
                    <CheckCircle size={38} className="text-[#0E7C66]" />
                  </div>
                </div>
                <h1 className="text-[24px] font-black text-[#111827] mb-2">{state.successMsg}</h1>
                <p className="text-[13px] text-[#6B7280] leading-relaxed mb-8 max-w-xs mx-auto">{state.successSub}</p>
                <div className="flex flex-col gap-3">
                  <PrimaryButton onClick={() => {
                    if (state.successRedirect && state.successRedirect !== "/" && state.successRedirect !== "/login") {
                      navigate(state.successRedirect);
                    } else {
                      go("login");
                    }
                  }}>
                    {t("success.continue")} <ArrowRight size={14} />
                  </PrimaryButton>
                  <Link to="/" className="text-[13px] text-[#9CA3AF] hover:text-[#374151] transition-colors min-h-[44px] flex items-center justify-center">
                    {t("success.returnHome")}
                  </Link>
                </div>
              </div>
            )}

            {/* ── LOCKED ── */}
            {v === "locked" && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={36} className="text-[#DC2626]" />
                </div>
                <h1 className="text-[22px] font-black text-[#111827] mb-2">{t("locked.title")}</h1>
                <p className="text-[13px] text-[#6B7280] leading-relaxed mb-2 max-w-xs mx-auto">
                  {t("locked.message")}
                </p>
                <p className="text-[12px] text-[#9CA3AF] mb-8">
                  <Trans t={t} i18nKey="locked.expiresIn"
                    components={{ b: <span className="font-bold text-[#374151]" /> }} />
                </p>
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] p-4 mb-6 text-left">
                  <div className="text-[12px] font-bold text-[#991B1B] mb-2">{t("locked.whatToDo")}</div>
                  <ul className="flex flex-col gap-1.5">
                    {["0", "1", "2"].map(i => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#991B1B]">
                        <span className="mt-0.5 text-[#DC2626]">·</span> {t(`locked.tips.${i}`)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <PrimaryButton onClick={() => go("forgot")}>
                    {t("locked.resetToUnlock")}
                  </PrimaryButton>
                  <a href="mailto:support@smtravel.com.bd"
                    className="min-h-[48px] flex items-center justify-center gap-2 border-2 border-[#E5E7EB] text-[#374151] font-bold rounded-[12px] text-[13px] hover:border-[#1B75BC]/30 transition-colors">
                    <Mail size={14} /> {t("locked.contactSupport")}
                  </a>
                  <button onClick={() => go("login")}
                    className="text-[12px] text-[#9CA3AF] hover:text-[#374151] transition-colors min-h-[44px] cursor-pointer">
                    {t("locked.backToSignIn")}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Mobile bottom link */}
        <div className="md:hidden flex-shrink-0 pb-24 px-5 text-center text-[11px] text-[#9CA3AF]">
          {v !== "login" && (
            <button onClick={() => go("login")} className="text-[#1B75BC] font-bold hover:underline">
              {t("mobileBack")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserPlus(props: { size?: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={props.style} className={props.className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function LoginPage()    { return <AuthScreen initialView="login" />; }
export function RegisterPage() { return <AuthScreen initialView="register-select" />; }
