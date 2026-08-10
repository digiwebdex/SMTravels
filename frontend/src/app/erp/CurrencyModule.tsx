import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { PageHeader, SectionCard, TextInput, SelectInput, Btn, EmptyState, ErrorBanner } from "../lib/ds";
import { useAuth } from "../auth/AuthContext";
import {
  useExchangeRates, useCurrencySettings, useCreateExchangeRate,
  useDeactivateExchangeRate, useSetCurrencySettings,
} from "../hooks/currency";

// Frontend-local currency list (value import from @contracts isn't bundle-resolvable;
// mirrors the backend Currency enum — BDT/USD/SAR). Types still come from @contracts.
const CURRENCIES = ["BDT", "USD", "SAR"] as const;
const today = () => new Date().toISOString().slice(0, 10);
const currOpts = CURRENCIES.map((c) => ({ value: c, label: c }));

/**
 * Settings → Currency (Module 2). Base + supported currencies and date-effective
 * exchange rates. Changing a rate never recalculates posted transactions — these are
 * defaults for NEW financial entries only. Gated on the "settings" module (manage=write).
 */
export function CurrencyModule() {
  const { can } = useAuth();
  const canManage = can("settings", "manage");

  const ratesQ = useExchangeRates();
  const settingsQ = useCurrencySettings();
  const createRate = useCreateExchangeRate();
  const deactivateRate = useDeactivateExchangeRate();
  const saveSettings = useSetCurrencySettings();

  // Settings form
  const [base, setBase] = useState("BDT");
  const [supported, setSupported] = useState<string[]>([...CURRENCIES]);
  useEffect(() => {
    if (settingsQ.data) { setBase(settingsQ.data.base); setSupported(settingsQ.data.supported); }
  }, [settingsQ.data]);
  const toggleSupported = (c: string) =>
    setSupported((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  // Add-rate form
  const [rc, setRc] = useState("USD");
  const [rate, setRate] = useState("");
  const [eff, setEff] = useState(today());
  const [source, setSource] = useState("");
  const rateNum = Number(rate);
  const canAdd = canManage && rc && rateNum > 0 && !!eff;

  const rows = ratesQ.data?.rates ?? [];
  const kpi = useMemo(() => {
    const byCur: Record<string, string> = {};
    for (const r of rows) if (r.active && !byCur[r.currency]) byCur[r.currency] = r.rate;
    return byCur;
  }, [rows]);

  const submitRate = () => {
    if (!canAdd) return;
    createRate.mutate(
      { currency: rc as (typeof CURRENCIES)[number], baseCurrency: base as (typeof CURRENCIES)[number], rate: rateNum, effectiveDate: eff, source: source.trim() || undefined },
      { onSuccess: () => { setRate(""); setSource(""); } },
    );
  };

  return (
    <div className="p-5 md:p-7 space-y-5">
      <PageHeader title="Currency" subtitle="Base currency, supported currencies & exchange rates" />

      <SectionCard title="Base & Supported Currencies" subtitle="Used as the default currency and the picker options across the ERP">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Base currency</label>
            <SelectInput value={base} onChange={setBase} options={currOpts} disabled={!canManage} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Supported</label>
            <div className="flex gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={!canManage}
                  onClick={() => toggleSupported(c)}
                  className={`px-3 py-1.5 rounded-md border text-[13px] font-semibold transition-colors ${supported.includes(c) ? "bg-[#002D62] text-white border-[#002D62]" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {canManage && (
            <Btn icon={Save} loading={saveSettings.isPending} onClick={() => saveSettings.mutate({ base: base as (typeof CURRENCIES)[number], supported: supported as (typeof CURRENCIES)[number][] })}>
              Save
            </Btn>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Exchange Rates" subtitle="Date-effective rates vs the base currency. Historical transactions are never recalculated.">
        {canManage && (
          <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-slate-100">
            <div className="w-32"><label className="block text-[11px] font-bold text-slate-500 mb-1">Currency</label><SelectInput value={rc} onChange={setRc} options={currOpts} /></div>
            <div className="w-36"><label className="block text-[11px] font-bold text-slate-500 mb-1">Rate (1 {rc} = ? {base})</label><TextInput type="number" value={rate} onChange={setRate} placeholder="0.00" /></div>
            <div className="w-40"><label className="block text-[11px] font-bold text-slate-500 mb-1">Effective date</label><TextInput type="date" value={eff} onChange={setEff} /></div>
            <div className="w-40"><label className="block text-[11px] font-bold text-slate-500 mb-1">Source (optional)</label><TextInput value={source} onChange={setSource} placeholder="e.g. Bank" /></div>
            <Btn icon={Plus} disabled={!canAdd} loading={createRate.isPending} onClick={submitRate}>Add rate</Btn>
          </div>
        )}

        {ratesQ.isError && <ErrorBanner message="Failed to load exchange rates." onRetry={() => ratesQ.refetch()} />}
        {ratesQ.isLoading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading rates…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No exchange rates yet" desc="Add a rate above to set the default conversion for new financial entries." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-3 py-2 font-bold">Currency</th>
                  <th className="px-3 py-2 font-bold">Base</th>
                  <th className="px-3 py-2 font-bold">Rate</th>
                  <th className="px-3 py-2 font-bold">Effective</th>
                  <th className="px-3 py-2 font-bold">Source</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  {canManage && <th className="px-3 py-2 font-bold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-[#002D62]">{r.currency}</td>
                    <td className="px-3 py-2 text-slate-500">{r.baseCurrency}</td>
                    <td className="px-3 py-2 font-mono">{r.rate}</td>
                    <td className="px-3 py-2 text-slate-500">{r.effectiveDate}</td>
                    <td className="px-3 py-2 text-slate-500">{r.source || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${r.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.active ? "ACTIVE" : "INACTIVE"}</span>
                    </td>
                    {canManage && (
                      <td className="px-3 py-2 text-right">
                        <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => { if (confirm(`Remove the ${r.currency} rate effective ${r.effectiveDate}?`)) deactivateRate.mutate(r.id); }}>Remove</Btn>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(kpi).length > 0 && (
              <p className="mt-3 text-[12px] text-slate-400">Current active rates: {Object.entries(kpi).map(([c, v]) => `1 ${c} = ${v} ${base}`).join(" · ")}</p>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default CurrencyModule;
