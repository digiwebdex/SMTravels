import { useEffect, useState } from "react";
import { MessageCircle, Save, Send, Mail, Phone, Sparkles, ScanLine, CheckCircle2, XCircle } from "lucide-react";
import { SectionCard, TextInput, Btn, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import {
  useIntegrationsStatus,
  useWasenderConfig,
  useSaveWasender,
  useTestWasender,
} from "../hooks/integrations";

function StatusPill({ ok, onLabel = "Connected", offLabel = "Not configured" }: { ok: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold " +
        (ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200")
      }
    >
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {ok ? onLabel : offLabel}
    </span>
  );
}

/** Administration → Integrations. Admin-set the Wasender WhatsApp key + see the
 *  status of every delivery integration. Gated on the "settings" module. */
export function IntegrationsModule() {
  const { can } = useAuth();
  const canManage = can("settings", "manage");

  const statusQ = useIntegrationsStatus();
  const cfgQ = useWasenderConfig();
  const save = useSaveWasender();
  const test = useTestWasender();

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    if (cfgQ.data) {
      setBaseUrl(cfgQ.data.baseUrl);
      setEnabled(cfgQ.data.enabled);
    }
  }, [cfgQ.data]);

  const cfg = cfgQ.data;
  const onSave = () => {
    const input: { enabled: boolean; baseUrl: string; apiKey?: string } = { enabled, baseUrl };
    if (apiKey.trim()) input.apiKey = apiKey.trim();
    save.mutate(input, { onSuccess: () => setApiKey("") });
  };

  const st = statusQ.data;
  const others = [
    { key: "email", label: "Email (SMTP)", icon: Mail, ok: !!st?.email },
    { key: "sms", label: "SMS (BulkSMSBD)", icon: Phone, ok: !!st?.sms },
    { key: "gemini", label: "Gemini AI", icon: Sparkles, ok: !!st?.gemini },
    { key: "vision", label: "Vision OCR", icon: ScanLine, ok: !!st?.vision },
  ];

  return (
    <div className="p-5 md:p-7 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-[20px] font-extrabold text-[var(--color-text)]">Integrations</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Connect the services the ERP uses to send messages and read documents.</p>
      </div>

      {cfgQ.isError && <ErrorBanner message="Could not load integration settings." />}

      <SectionCard
        title="WhatsApp — Wasender API"
        subtitle="Send WhatsApp to customers and leads through wasenderapi.com"
        actions={<StatusPill ok={!!cfg?.configured} />}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-[var(--color-bg)] p-3 text-[12px] text-[var(--color-text-muted)]">
            <MessageCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              Get your API key from your <b>wasenderapi.com</b> dashboard, paste it below, turn on <b>Enable</b>, and Save.
              Until a key is set, WhatsApp messages are simulated (logged, not sent).
            </span>
          </div>

          <label className="block">
            <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">API Base URL</span>
            <div className="mt-1">
              <TextInput value={baseUrl} onChange={setBaseUrl} placeholder="https://wasenderapi.com/api" disabled={!canManage} />
            </div>
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">
              API Key {cfg?.hasApiKey && <span className="font-normal text-[var(--color-text-faint)]">· saved: {cfg.apiKeyMasked} (leave blank to keep)</span>}
            </span>
            <div className="mt-1">
              <TextInput
                type="password"
                value={apiKey}
                onChange={setApiKey}
                placeholder={cfg?.hasApiKey ? "•••••••••• (enter a new key to replace)" : "Paste your Wasender API key"}
                disabled={!canManage}
              />
            </div>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!canManage}
              className="h-4 w-4 rounded accent-[#1B75BC]"
            />
            <span className="text-[13px] font-semibold text-[var(--color-text)]">Enable WhatsApp sending via Wasender</span>
          </label>

          <div className="flex items-center gap-2 pt-1">
            <Btn icon={Save} onClick={onSave} loading={save.isPending} disabled={!canManage}>Save settings</Btn>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">Send a test message</span>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 max-w-[240px]">
                <TextInput value={testPhone} onChange={setTestPhone} placeholder="+8801XXXXXXXXX" disabled={!canManage} />
              </div>
              <Btn variant="secondary" icon={Send} onClick={() => test.mutate(testPhone)} loading={test.isPending} disabled={!canManage || testPhone.trim().length < 6}>
                Send test
              </Btn>
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)] mt-1.5">Save your key and enable first — the test uses the live Wasender connection.</p>
          </div>
        </div>
      </SectionCard>

      <div className="mt-5">
        <SectionCard title="Other integrations" subtitle="Status of the ERP's delivery & document services">
          <div className="grid sm:grid-cols-2 gap-2.5">
            {others.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.key} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-text)]">
                    <Icon size={15} className="text-[var(--color-text-muted)]" /> {o.label}
                  </span>
                  <StatusPill ok={o.ok} />
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
