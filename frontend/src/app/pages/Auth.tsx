import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
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
import { cn, img } from "../lib/utils";
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

function PasswordField({ value, onChange, placeholder = "Enter password", error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
      <input type={show ? "text" : "password"} placeholder={placeholder} value={value}
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
  const checks = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];
  const score = checks.filter(r => r.test(password)).length + (password.length >= 8 ? 1 : 0);
  const score5 = Math.min(score, 4);
  const cfg = [
    { label: "", color: "bg-[#E5E7EB]" },
    { label: "Weak",   color: "bg-[#DC2626]" },
    { label: "Fair",   color: "bg-[#F59E0B]" },
    { label: "Good",   color: "bg-[#3B82F6]" },
    { label: "Strong", color: "bg-[#0E7C66]" },
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
  const [secs, setSecs] = useState(59);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  if (secs > 0) return (
    <span className="text-[12px] text-[#9CA3AF]">
      Resend in <span className="font-bold text-[#374151]">0:{String(secs).padStart(2, "0")}</span>
    </span>
  );
  return (
    <button onClick={() => { onResend(); setSecs(59); }}
      className="text-[12px] font-bold text-[#1B75BC] hover:underline flex items-center gap-1 cursor-pointer">
      <RefreshCw size={12} /> Resend code
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
const BRAND_COPY: Partial<Record<AuthView, { headline: string; sub: string }>> = {
  "login":             { headline: "Welcome back.", sub: "Sign in to manage your Hajj, Umrah & travel operations." },
  "register-select":   { headline: "Join SMTravel.", sub: "Create your account and start your journey today." },
  "register-customer": { headline: "Book your journey.", sub: "Create a customer account to track your bookings." },
  "register-agent":    { headline: "Grow with us.", sub: "Partner with SMTravel and earn commissions on every booking." },
  "forgot":            { headline: "Recover access.", sub: "We'll send a secure code to your registered contact." },
  "otp-verify":        { headline: "Verify your identity.", sub: "Enter the one-time code we sent to your device." },
  "reset-password":    { headline: "Set a new password.", sub: "Choose something secure and memorable." },
  "two-factor":        { headline: "Extra security.", sub: "Two-factor authentication keeps your account safe." },
  "role-select":       { headline: "Your workspaces.", sub: "You have access to multiple portals — choose where to continue." },
  "success":           { headline: "All done!", sub: "Your action was completed successfully." },
  "locked":            { headline: "Account locked.", sub: "Too many failed attempts. Please contact support." },
};

function BrandPanel({ view }: { view: AuthView }) {
  const copy = BRAND_COPY[view] || BRAND_COPY["login"]!;
  const trustItems = ["ATAB Licensed", "Govt. Approved", "25+ Years", "10,000+ Pilgrims", "ISO 9001:2015"];
  return (
    <div className="relative hidden md:flex flex-col w-[42%] flex-shrink-0 overflow-hidden">
      {/* Background image */}
      <img
        src={img("photo-1770786106021-52580470e31e", 900, 1200)}
        alt="Kaaba Makkah"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B75BC]/95 via-[#1B75BC]/80 to-[#0a1e3d]/95" />
      {/* Geometric texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-auto">
          <BrandLogo variant="tile" className="w-11 h-11 rounded-[12px]" />
          <div>
            <div className="text-white font-black text-[17px] leading-tight">SM Travels International</div>
            <div className="text-white/40 text-[11px] tracking-wide">Your Trusted Travel Partner</div>
          </div>
        </Link>

        {/* Center copy */}
        <div className="my-auto">
          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-3">{copy.headline}</h2>
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
              "SMTravel made our Hajj experience flawless — from registration to return. Their system is professional and their team truly cares."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#F15A24]/30 flex items-center justify-center text-[#D64A12] font-black text-[11px]">M</div>
              <div>
                <div className="text-white/80 text-[11px] font-bold">Md. Harunur Rashid</div>
                <div className="text-white/40 text-[10px]">Hajj Pilgrim 2024 · Dhaka</div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="#F15A24" className="text-[#D64A12]" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-between">
          <div className="text-white/30 text-[10px]">© 2025 SMTravel International</div>
          <div className="flex gap-3">
            {["Privacy", "Terms", "Support"].map(l => (
              <a key={l} href="#" className="text-white/30 text-[10px] hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile brand strip ───────────────────────────────────────────────────────
function MobileBrandStrip({ view }: { view: AuthView }) {
  return (
    <div className="md:hidden bg-[#1B75BC] px-5 py-4 flex items-center justify-between flex-shrink-0">
      <Link to="/" className="flex items-center gap-2.5">
        <BrandLogo variant="tile" className="w-9 h-9" />
        <div>
          <div className="text-white font-black text-[14px] leading-tight">SM Travels</div>
          <div className="text-white/40 text-[9px]">International</div>
        </div>
      </Link>
      <div className="flex gap-1.5">
        {["ATAB", "Govt. Approved"].map(t => (
          <span key={t} className="text-[9px] font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────
function BackLink({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-[12px] font-bold text-[#9CA3AF] hover:text-[#374151] mb-5 cursor-pointer transition-colors group">
      <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
      {label}
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
  const [resetToken, setResetToken] = useState("");
  const [state, setState] = useState<AuthState>({
    view: initialView,
    loading: false,
    error: null,
    identifier: "",
    otpContext: "forgot",
    successMsg: "You're all set!",
    successSub: "Redirecting you to your dashboard...",
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
  const [loginId, setLoginId] = useState("super_admin@smtravel.com.bd");
  const [loginPass, setLoginPass] = useState("");
  const [loginMode, setLoginMode] = useState<"email" | "phone">("email");
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
    if (!loginId || !loginPass) { set({ error: "Please fill in all fields." }); return; }
    set({ loading: true, error: null });
    try {
      const user = await login(loginId.trim(), loginPass);
      navigate(dashboardFor(user.role), { replace: true });
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 423) { go("locked"); return; }
      set({
        loading: false,
        error: err.status === 401 ? "Invalid email or password."
             : err.status === 403 ? "This account is not active. Contact your administrator."
             : (err.message || "Sign in failed. Please try again."),
      });
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────────
  const handleOTPVerify = async () => {
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) { set({ error: "Please enter the complete 6-digit code." }); return; }
    if (state.otpContext === "forgot") {
      set({ loading: true, error: null });
      try {
        const { resetToken: rt } = await authApi.verifyOtp(state.identifier, code);
        setResetToken(rt);
        go("reset-password");
      } catch (e) {
        const err = e as ApiError;
        set({ loading: false, error: err.status === 400 ? "Invalid or expired code." : (err.message || "Verification failed.") });
      }
      return;
    }
    // 2FA / email-verification screens have no backend endpoint yet — left as-is.
    simulateLoad(() => {
      if (state.otpContext === "2fa") go("role-select");
      else go("success", { successMsg: "Email verified!", successSub: "Your account is now active. Welcome to SMTravel!", successRedirect: "/login" });
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
                <FormHeader icon={LogIn} title="Sign in to your account"
                  sub="Access the SMTravel management portal" />

                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}

                {/* Toggle email/phone */}
                <div className="flex bg-[#F3F4F6] rounded-[10px] p-1 mb-5">
                  {(["email", "phone"] as const).map(m => (
                    <button key={m} onClick={() => setLoginMode(m)}
                      className={cn("flex-1 py-2 rounded-[8px] text-[12px] font-bold transition-all capitalize cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]",
                        loginMode === m ? "bg-white text-[#1B75BC] shadow" : "text-[#9CA3AF] hover:text-[#374151]"
                      )}>
                      {m === "email" ? <Mail size={13} /> : <Phone size={13} />}
                      {m === "email" ? "Email" : "Phone"}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4 mb-5">
                  <FieldGroup label={loginMode === "email" ? "Email Address" : "Phone Number"} required>
                    <div className="relative">
                      {loginMode === "email"
                        ? <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        : <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />}
                      <input type={loginMode === "email" ? "email" : "tel"}
                        placeholder={loginMode === "email" ? "you@example.com" : "+880 1X XXX XXXXX"}
                        value={loginId} onChange={e => setLoginId(e.target.value)}
                        className={cn(inputCls, "pl-9")} />
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Password" required>
                    <PasswordField value={loginPass} onChange={setLoginPass} />
                  </FieldGroup>
                </div>

                <div className="flex items-center justify-between mb-5">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      className="w-4 h-4 accent-[#1B75BC]" />
                    <span className="text-[12px] text-[#6B7280]">Remember me for 30 days</span>
                  </label>
                  <button onClick={() => go("forgot")}
                    className="text-[12px] font-bold text-[#1B75BC] hover:underline cursor-pointer min-h-[44px] flex items-center">
                    Forgot password?
                  </button>
                </div>

                <PrimaryButton loading={state.loading} onClick={handleLogin}>
                  Sign In <ArrowRight size={15} />
                </PrimaryButton>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                  <span className="text-[11px] text-[#9CA3AF] font-medium">New to SMTravel?</span>
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => go("register-customer")}
                    className="min-h-[48px] flex items-center justify-center gap-1.5 border-2 border-[#1B75BC]/20 text-[#1B75BC] font-bold rounded-[10px] text-[12px] hover:border-[#1B75BC]/50 hover:bg-[#1B75BC]/3 transition-all cursor-pointer">
                    <User size={13} /> Customer
                  </button>
                  <button onClick={() => go("register-agent")}
                    className="min-h-[48px] flex items-center justify-center gap-1.5 border-2 border-[#F15A24]/40 text-[#D64A12] font-bold rounded-[10px] text-[12px] hover:border-[#F15A24] hover:bg-[#F15A24]/5 transition-all cursor-pointer">
                    <Briefcase size={13} /> Agent
                  </button>
                </div>

                {/* Demo credentials hint */}
                <div className="mt-5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3 text-[11px] text-[#9CA3AF] text-center">
                  Demo: <span className="font-bold text-[#374151]">super_admin@smtravel.com.bd</span> · <span className="font-bold text-[#374151]">Password123!</span>
                </div>
              </div>
            )}

            {/* ── REGISTER SELECT ── */}
            {v === "register-select" && (
              <div>
                <BackLink onClick={() => go("login")} label="Back to sign in" />
                <FormHeader icon={UserPlus} title="Create your account" sub="Choose the account type that fits your role" />
                <div className="flex flex-col gap-4">
                  {[
                    { id: "register-customer", icon: User, label: "Customer Account", desc: "Book Hajj, Umrah & travel packages. Track your bookings, upload documents, and communicate with our team.", color: "#1B75BC", bg: "#EEF2FF", cta: "Register as Customer" },
                    { id: "register-agent", icon: Briefcase, label: "Travel Agent Account", desc: "B2B partner portal. Access wholesale rates, manage client bookings, and earn commissions.", color: "#F15A24", bg: "#FFF9E6", cta: "Register as Agent" },
                  ].map(t => (
                    <button key={t.id} onClick={() => go(t.id as AuthView)}
                      className="w-full text-left p-5 bg-white border-2 border-[#E5E7EB] hover:border-[#1B75BC]/30 hover:shadow-md rounded-[16px] transition-all group cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                          <t.icon size={20} style={{ color: t.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-black text-[#111827] mb-1 group-hover:text-[#1B75BC] transition-colors">{t.label}</div>
                          <div className="text-[12px] text-[#6B7280] leading-relaxed">{t.desc}</div>
                        </div>
                        <ChevronRight size={16} className="text-[#D1D5DB] group-hover:text-[#1B75BC] mt-1 transition-colors" />
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#F3F4F6] text-[12px] font-bold flex items-center gap-1.5" style={{ color: t.color }}>
                        {t.cta} <ArrowRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-center text-[12px] text-[#9CA3AF] mt-6">
                  Already have an account?{" "}
                  <button onClick={() => go("login")} className="text-[#1B75BC] font-bold hover:underline cursor-pointer">Sign in</button>
                </p>
              </div>
            )}

            {/* ── REGISTER CUSTOMER ── */}
            {v === "register-customer" && (
              <div>
                <BackLink onClick={() => go("register-select")} />
                <FormHeader icon={User} title="Customer Registration" sub="Create your free account to book and manage travel" />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); simulateLoad(() => go("otp-verify", { identifier: custForm.email, otpContext: "register-email" })); }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Full Name" required>
                      <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input className={cn(inputCls, "pl-9")} placeholder="Your full name" value={custForm.name} onChange={e => setCustForm(f => ({ ...f, name: e.target.value }))} /></div>
                    </FieldGroup>
                    <FieldGroup label="City" required>
                      <select className={cn(inputCls, "cursor-pointer")} value={custForm.city} onChange={e => setCustForm(f => ({ ...f, city: e.target.value }))}>
                        <option value="">Select city</option>
                        {["Dhaka","Chittagong","Sylhet","Khulna","Rajshahi"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Email Address" required>
                    <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input type="email" className={cn(inputCls, "pl-9")} placeholder="email@example.com" value={custForm.email} onChange={e => setCustForm(f => ({ ...f, email: e.target.value }))} /></div>
                  </FieldGroup>
                  <FieldGroup label="Phone / WhatsApp" required>
                    <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input type="tel" className={cn(inputCls, "pl-9")} placeholder="+880 1X XXX XXXXX" value={custForm.phone} onChange={e => setCustForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  </FieldGroup>
                  <FieldGroup label="Password" required>
                    <PasswordField value={custForm.pass} onChange={v => setCustForm(f => ({ ...f, pass: v }))} />
                    <PasswordStrength password={custForm.pass} />
                  </FieldGroup>
                  <FieldGroup label="Confirm Password" required>
                    <PasswordField value={custForm.confirm} onChange={v => setCustForm(f => ({ ...f, confirm: v }))} placeholder="Repeat password" />
                  </FieldGroup>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1B75BC]" />
                    <span className="text-[12px] text-[#6B7280]">I agree to the <a href="#" className="text-[#1B75BC] font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-[#1B75BC] font-semibold hover:underline">Privacy Policy</a></span>
                  </label>
                  <PrimaryButton type="submit" loading={state.loading}>Create Account <ArrowRight size={14} /></PrimaryButton>
                </form>
                <p className="text-center text-[12px] text-[#9CA3AF] mt-4">
                  Already have an account? <button onClick={() => go("login")} className="text-[#1B75BC] font-bold hover:underline cursor-pointer">Sign in</button>
                </p>
              </div>
            )}

            {/* ── REGISTER AGENT ── */}
            {v === "register-agent" && (
              <div>
                <BackLink onClick={() => go("register-select")} />
                <FormHeader icon={Briefcase} iconColor="#F15A24" iconBg="#FFF9E6" title="Agent Registration" sub="Join our B2B partner network — approval within 24 hours" />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); simulateLoad(() => go("success", { successMsg: "Application submitted!", successSub: "We'll review your agent application within 24 business hours and contact you by email.", successRedirect: "/login" })); }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Full Name" required>
                      <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input className={cn(inputCls, "pl-9")} placeholder="Your full name" value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} /></div>
                    </FieldGroup>
                    <FieldGroup label="Agency / Business Name" required>
                      <div className="relative"><Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input className={cn(inputCls, "pl-9")} placeholder="Agency name" value={agentForm.agency} onChange={e => setAgentForm(f => ({ ...f, agency: e.target.value }))} /></div>
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Email Address" required>
                      <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input type="email" className={cn(inputCls, "pl-9")} placeholder="email@agency.com" value={agentForm.email} onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))} /></div>
                    </FieldGroup>
                    <FieldGroup label="Phone / WhatsApp" required>
                      <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input type="tel" className={cn(inputCls, "pl-9")} placeholder="+880 1X XXX XXXXX" value={agentForm.phone} onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))} /></div>
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Agent Type" required>
                      <select className={cn(inputCls, "cursor-pointer")} value={agentForm.type} onChange={e => setAgentForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="">Select type</option>
                        {["Individual Agent","Travel Agency","Sub-Agent","Corporate Partner"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="City" required>
                      <select className={cn(inputCls, "cursor-pointer")} value={agentForm.city} onChange={e => setAgentForm(f => ({ ...f, city: e.target.value }))}>
                        <option value="">Select city</option>
                        {["Dhaka","Chittagong","Sylhet","Khulna"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="ATAB / License No. (optional)">
                    <input className={inputCls} placeholder="e.g. ATAB-01234" value={agentForm.atab} onChange={e => setAgentForm(f => ({ ...f, atab: e.target.value }))} />
                  </FieldGroup>
                  <FieldGroup label="Password" required>
                    <PasswordField value={agentForm.pass} onChange={v => setAgentForm(f => ({ ...f, pass: v }))} />
                    <PasswordStrength password={agentForm.pass} />
                  </FieldGroup>
                  <FieldGroup label="Confirm Password" required>
                    <PasswordField value={agentForm.confirm} onChange={v => setAgentForm(f => ({ ...f, confirm: v }))} placeholder="Repeat password" />
                  </FieldGroup>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1B75BC]" />
                    <span className="text-[12px] text-[#6B7280]">I agree to the <a href="#" className="text-[#1B75BC] font-semibold hover:underline">Agent Agreement</a> and <a href="#" className="text-[#1B75BC] font-semibold hover:underline">Terms of Service</a></span>
                  </label>
                  <PrimaryButton type="submit" loading={state.loading} variant="gold">Submit Application <ArrowRight size={14} /></PrimaryButton>
                </form>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {v === "forgot" && (
              <div>
                <BackLink onClick={() => go("login")} label="Back to sign in" />
                <FormHeader icon={Key} title="Forgot your password?" sub="Enter your email or phone and we'll send a 6-digit reset code." />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <FieldGroup label="Email or Phone Number" required>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input type="text" placeholder="email@example.com or +880 1X..." value={forgotId} onChange={e => setForgotId(e.target.value)}
                      className={cn(inputCls, "pl-9")} />
                  </div>
                </FieldGroup>
                <div className="mt-5">
                  <PrimaryButton loading={state.loading}
                    onClick={async () => {
                      const id = forgotId.trim();
                      if (!id) { set({ error: "Enter your email address." }); return; }
                      set({ loading: true, error: null });
                      try {
                        const r = await authApi.forgotPassword(id);
                        if (r.devOtp) setOtp(r.devOtp); // dev only: backend returns the code so the flow is testable
                        go("otp-verify", { identifier: id, otpContext: "forgot" });
                      } catch (e) {
                        set({ loading: false, error: (e as ApiError).message || "Could not send a reset code." });
                      }
                    }}>
                    Send Reset Code <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ── OTP VERIFY (forgot + register) ── */}
            {v === "otp-verify" && (
              <div>
                <BackLink onClick={() => go(state.otpContext === "forgot" ? "forgot" : "register-customer")} />
                <FormHeader icon={Shield} iconColor="#0E7C66" iconBg="#ECFDF5"
                  title="Enter verification code"
                  sub={`We sent a 6-digit code to ${state.identifier || "your email/phone"}. Check your inbox or SMS.`} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <OTPInput value={otp} onChange={setOtp} />
                <div className="flex items-center justify-center mt-4 mb-6">
                  <ResendTimer onResend={() => setOtp("")} />
                </div>
                <PrimaryButton loading={state.loading} onClick={handleOTPVerify}>
                  Verify Code <ArrowRight size={14} />
                </PrimaryButton>
                <div className="mt-4 bg-[#FFF9E6] border border-[#F15A24]/30 rounded-[10px] p-3 text-[11px] text-[#78590F] flex items-center gap-2">
                  <AlertTriangle size={13} className="text-[#D64A12] flex-shrink-0" />
                  Code expires in 10 minutes. Do not share this code with anyone.
                </div>
              </div>
            )}

            {/* ── TWO-FACTOR ── */}
            {v === "two-factor" && (
              <div>
                <BackLink onClick={() => go("login")} label="Use a different account" />
                <FormHeader icon={Shield} iconColor="#7C3AED" iconBg="#F5F3FF"
                  title="Two-factor authentication"
                  sub={`A 6-digit code was sent to the device ending in •••${state.identifier.slice(-4) || "5678"}`} />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <OTPInput value={otp} onChange={setOtp} />
                <div className="flex items-center justify-between mt-4 mb-6">
                  <ResendTimer onResend={() => setOtp("")} />
                  <button className="text-[12px] text-[#9CA3AF] hover:text-[#374151] cursor-pointer hover:underline">
                    Use backup code
                  </button>
                </div>
                <PrimaryButton loading={state.loading}
                  onClick={() => simulateLoad(() => go("role-select"))}>
                  Verify & Sign In <ArrowRight size={14} />
                </PrimaryButton>
                <div className="mt-3 flex items-center gap-2 p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px]">
                  <HelpCircle size={13} className="text-[#9CA3AF] flex-shrink-0" />
                  <span className="text-[11px] text-[#9CA3AF]">Lost access to your device? <a href="#" className="text-[#1B75BC] font-bold hover:underline">Contact support</a></span>
                </div>
              </div>
            )}

            {/* ── RESET PASSWORD ── */}
            {v === "reset-password" && (
              <div>
                <FormHeader icon={Lock} title="Set new password" sub="Choose a strong password that you haven't used before." />
                {state.error && <div className="mb-4"><ErrorBanner msg={state.error} onDismiss={() => set({ error: null })} /></div>}
                <form className="flex flex-col gap-4" onSubmit={async e => {
                  e.preventDefault();
                  if (resetPass.pass !== resetPass.confirm) { set({ error: "Passwords don't match." }); return; }
                  if (resetPass.pass.length < 8) { set({ error: "Password must be at least 8 characters." }); return; }
                  set({ loading: true, error: null });
                  try {
                    await authApi.resetPassword(resetToken, resetPass.pass);
                    go("success", { successMsg: "Password updated!", successSub: "Your password has been changed. Sign in with your new credentials.", successRedirect: "/login" });
                  } catch (err) {
                    set({ loading: false, error: (err as ApiError).message || "Could not reset password." });
                  }
                }}>
                  <FieldGroup label="New Password" required>
                    <PasswordField value={resetPass.pass} onChange={v => setResetPass(f => ({ ...f, pass: v }))} placeholder="Choose a strong password" />
                    <PasswordStrength password={resetPass.pass} />
                  </FieldGroup>
                  <FieldGroup label="Confirm New Password" required>
                    <PasswordField value={resetPass.confirm} onChange={v => setResetPass(f => ({ ...f, confirm: v }))} placeholder="Repeat new password"
                      error={!!resetPass.confirm && resetPass.pass !== resetPass.confirm} />
                    {resetPass.confirm && resetPass.pass !== resetPass.confirm && (
                      <span className="text-[11px] text-[#DC2626]">Passwords don't match</span>
                    )}
                  </FieldGroup>
                  <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[10px] p-3">
                    {["At least 8 characters","One uppercase letter","One number","One special character"].map(r => (
                      <div key={r} className="flex items-center gap-2 text-[11px] text-[#9CA3AF] mb-1 last:mb-0">
                        <CheckCircle size={11} className={resetPass.pass.length >= 8 ? "text-[#0E7C66]" : "text-[#E5E7EB]"} /> {r}
                      </div>
                    ))}
                  </div>
                  <PrimaryButton type="submit" loading={state.loading}>Update Password <ArrowRight size={14} /></PrimaryButton>
                </form>
              </div>
            )}

            {/* ── ROLE SELECT ── */}
            {v === "role-select" && (
              <div>
                <FormHeader icon={LayoutDashboard} title="Choose your workspace"
                  sub="Your account has access to multiple portals. Where would you like to go?" />
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
                          <div className={cn("text-[14px] font-bold transition-colors", isSelected ? "text-[#1B75BC]" : "text-[#111827]")}>{role.label}</div>
                          <div className="text-[11px] text-[#9CA3AF] mt-0.5">{role.desc}</div>
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
                  <input type="checkbox" className="w-4 h-4 accent-[#1B75BC]" />
                  <span className="text-[12px] text-[#6B7280]">Remember my selection and skip this screen next time</span>
                </label>
                <PrimaryButton
                  loading={state.loading}
                  onClick={() => {
                    if (!selectedRole) return;
                    const dest = ROLE_ROUTES[selectedRole] ?? "/erp";
                    simulateLoad(() => navigate(dest));
                  }}>
                  {selectedRole ? `Continue as ${ROLES.find(r => r.id === selectedRole)?.label}` : "Select a workspace"} <ArrowRight size={14} />
                </PrimaryButton>
                <button onClick={() => go("login")}
                  className="w-full mt-3 min-h-[44px] text-[13px] text-[#9CA3AF] hover:text-[#374151] transition-colors cursor-pointer">
                  Sign out
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
                    Continue to Sign In <ArrowRight size={14} />
                  </PrimaryButton>
                  <Link to="/" className="text-[13px] text-[#9CA3AF] hover:text-[#374151] transition-colors min-h-[44px] flex items-center justify-center">
                    Return to Home
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
                <h1 className="text-[22px] font-black text-[#111827] mb-2">Account Locked</h1>
                <p className="text-[13px] text-[#6B7280] leading-relaxed mb-2 max-w-xs mx-auto">
                  Your account has been temporarily locked after too many failed sign-in attempts.
                </p>
                <p className="text-[12px] text-[#9CA3AF] mb-8">Lock expires in <span className="font-bold text-[#374151]">29 minutes</span></p>
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] p-4 mb-6 text-left">
                  <div className="text-[12px] font-bold text-[#991B1B] mb-2">What you can do:</div>
                  <ul className="flex flex-col gap-1.5">
                    {[
                      "Wait 30 minutes for the lock to expire",
                      "Use 'Forgot Password' to reset and unlock",
                      "Contact our support team for immediate help",
                    ].map(t => (
                      <li key={t} className="flex items-start gap-2 text-[12px] text-[#991B1B]">
                        <span className="mt-0.5 text-[#DC2626]">·</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <PrimaryButton onClick={() => go("forgot")}>
                    Reset Password to Unlock
                  </PrimaryButton>
                  <a href="mailto:support@smtravel.com.bd"
                    className="min-h-[48px] flex items-center justify-center gap-2 border-2 border-[#E5E7EB] text-[#374151] font-bold rounded-[12px] text-[13px] hover:border-[#1B75BC]/30 transition-colors">
                    <Mail size={14} /> Contact Support
                  </a>
                  <button onClick={() => go("login")}
                    className="text-[12px] text-[#9CA3AF] hover:text-[#374151] transition-colors min-h-[44px] cursor-pointer">
                    Back to Sign In
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
              Back to Sign In
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
