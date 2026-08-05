import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className={cn("w-9 h-9 inline-block", className)} />;
  }
  const dark = (resolvedTheme ?? theme) === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "w-9 h-9 inline-flex items-center justify-center rounded-[var(--radius-md)]",
        "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
        "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors",
        className,
      )}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
