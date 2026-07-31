/**
 * SM Travels Design System — public API
 */
export { BRAND, ELEVATION, RADIUS } from "./tokens";
export { ThemeProvider } from "./ThemeProvider";
export { ModulePage, ModuleCard } from "./patterns/ModulePage";
export { DataTable } from "./data/DataTable";
export type { DataColumn } from "./data/DataTable";
export { AiInsightCard } from "./ai/AiInsightCard";
export { OcrInFlow } from "./ai/OcrInFlow";
export { CommandPalette } from "./overlays/CommandPalette";
export { ThemeToggle } from "./navigation/ThemeToggle";
export { AppShell, ErpLayout } from "./shells/AppShell";
export type { ErpOutletCtx } from "./shells/AppShell";
export { PortalShell } from "./shells/PortalShell";
export type { PortalNavItem } from "./shells/PortalShell";
export { MarketingShell, Header as MarketingHeader, Footer as MarketingFooter } from "./shells/MarketingShell";
export { AuthShell } from "./shells/AuthShell";
export { WizardShell } from "./shells/WizardShell";
export { PrintShell } from "./shells/PrintShell";
export { ReportsShell } from "./shells/ReportsShell";
export { StickySaveBar, FormSection, ErrorSummary } from "./forms/FormChrome";
export { KeyboardShortcutsHelp } from "./overlays/KeyboardShortcutsHelp";

// Re-export legacy primitives (canonical during migration)
export {
  StatusBadge, Btn, KpiTile, PageHeader, SectionCard,
  EmptyState, ErrorBanner, SkeletonKpi, SkeletonRow, SkeletonTable,
  SkeletonCard, SkeletonPage, FormField, TextInput, SelectInput,
  formatAmount, formatAmountShort, formatDate, toBanglaDigits,
  Avatar, Spinner, Divider, ProgressBar, Tag, Tooltip, NotifBadge,
  useLoadingState, STATUS_MAP,
} from "../lib/ds";
export type { StatusKey } from "../lib/ds";

// Low-level Radix primitives
export { Button, buttonVariants } from "../components/ui/button";
export { Input } from "../components/ui/input";
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
export { Badge } from "../components/ui/badge";
export { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
export { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
export {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../components/ui/table";
