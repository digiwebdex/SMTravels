import React from "react";
import { Link } from "react-router";
import { BrandLogo } from "../../components/BrandLogo";
import { ThemeToggle } from "../navigation/ThemeToggle";
import { cn } from "../../lib/utils";

/** Centered auth card shell for login / register / OTP. */
export function AuthShell({
  children,
  title,
  subtitle,
  footer,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header className="flex items-center justify-between px-5 h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo variant="tile" className="w-8 h-8 rounded-[var(--radius-sm)]" />
          <span className="font-bold text-sm text-[var(--color-text)]">SM Travels</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className={cn(
          "w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--elevation-2)] p-6 sm:p-8",
          className,
        )}>
          {(title || subtitle) && (
            <div className="mb-6 text-center">
              {title && <h1 className="text-xl font-bold text-[var(--color-text)]">{title}</h1>}
              {subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
          {footer && <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)]">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
