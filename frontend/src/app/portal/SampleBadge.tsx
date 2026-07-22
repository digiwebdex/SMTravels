// Honest label for portal screens still rendering Figma mock data. A clearly
// labeled sample is fine; an unlabeled mock that looks live is not.
export function SampleBadge() {
  return (
    <div data-sample-badge className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
      Sample data — this screen isn’t connected to live data yet.
    </div>
  );
}
