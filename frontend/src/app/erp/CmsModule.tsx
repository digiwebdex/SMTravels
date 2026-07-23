import React, { useState, useRef } from "react";
import {
  FileText, Menu, Image, Layout, BookOpen, Tag, Star, HelpCircle,
  FolderOpen, Settings, Plus, Search, Eye, Edit2, Trash2, Copy,
  ChevronUp, ChevronDown, GripVertical, MoreHorizontal, Globe,
  Upload, X, Check, Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, Link, Code, Heading1, Heading2, Quote, Undo,
  Redo, Save, ArrowLeft, ExternalLink, Monitor, Tablet, Smartphone,
  RefreshCw, AlertCircle, CheckCircle, Clock, ChevronRight,
  ToggleLeft, ToggleRight, Megaphone, Layers, Hash, Type, Palette,
  BarChart2, Users, Calendar, Filter,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type CmsView =
  | "pages" | "page-editor"
  | "menus" | "sliders" | "banners"
  | "blog" | "blog-editor"
  | "categories" | "testimonials" | "faqs"
  | "media" | "settings";

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Content",
    items: [
      { id: "pages"        as CmsView, label: "Pages",          icon: FileText   },
      { id: "blog"         as CmsView, label: "Blog",           icon: BookOpen   },
      { id: "categories"   as CmsView, label: "Categories",     icon: Tag        },
      { id: "testimonials" as CmsView, label: "Testimonials",   icon: Star       },
      { id: "faqs"         as CmsView, label: "FAQs",           icon: HelpCircle },
    ],
  },
  {
    label: "Structure",
    items: [
      { id: "menus"   as CmsView, label: "Menus",    icon: Menu   },
      { id: "sliders" as CmsView, label: "Sliders",  icon: Layers },
      { id: "banners" as CmsView, label: "Banners",  icon: Megaphone },
    ],
  },
  {
    label: "Assets & Config",
    items: [
      { id: "media"    as CmsView, label: "Media Library", icon: FolderOpen },
      { id: "settings" as CmsView, label: "Web Settings",  icon: Settings   },
    ],
  },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const PAGES = [
  { id: 1, title: "Home",         slug: "/",            status: "published", updatedAt: "Jul 14, 2024", author: "Admin", views: 12840 },
  { id: 2, title: "About Us",     slug: "/about",       status: "published", updatedAt: "Jul 10, 2024", author: "Admin", views: 3210  },
  { id: 3, title: "Services",     slug: "/services",    status: "published", updatedAt: "Jul 8, 2024",  author: "Admin", views: 5670  },
  { id: 4, title: "Contact",      slug: "/contact",     status: "published", updatedAt: "Jul 5, 2024",  author: "Admin", views: 2180  },
  { id: 5, title: "Privacy Policy",slug: "/privacy",   status: "draft",     updatedAt: "Jul 1, 2024",  author: "Admin", views: 410   },
  { id: 6, title: "Terms of Use", slug: "/terms",       status: "draft",     updatedAt: "Jun 28, 2024", author: "Admin", views: 320   },
];

const POSTS = [
  { id: 1, title: "Complete Guide to Hajj 2024",          category: "Hajj",  status: "published", date: "Jul 12, 2024", author: "Abdullah C.", views: 4820, featured: true  },
  { id: 2, title: "Umrah Packages: What to Expect",        category: "Umrah", status: "published", date: "Jul 9, 2024",  author: "Fatema B.",   views: 3140, featured: false },
  { id: 3, title: "Saudi Visa Application Step-by-Step",   category: "Visa",  status: "published", date: "Jul 6, 2024",  author: "Rahim K.",    views: 6310, featured: true  },
  { id: 4, title: "Top 10 Hotels Near Masjid al-Haram",    category: "Hotel", status: "draft",     date: "Jul 3, 2024",  author: "Salma T.",    views: 0,    featured: false },
  { id: 5, title: "Malaysia Tour Package Review 2024",     category: "Tour",  status: "draft",     date: "Jun 30, 2024", author: "Kamal H.",    views: 0,    featured: false },
  { id: 6, title: "Manpower Opportunities in Middle East", category: "News",  status: "scheduled", date: "Jul 20, 2024", author: "Nasir A.",    views: 0,    featured: false },
];

const MENU_ITEMS = [
  { id: 1, label: "Home",         url: "/",             children: [] },
  { id: 2, label: "Services",     url: "/services",     children: [
    { id: 21, label: "Hajj",       url: "/hajj"       },
    { id: 22, label: "Umrah",      url: "/umrah"      },
    { id: 23, label: "Visa",       url: "/visa"       },
    { id: 24, label: "Air Ticket", url: "/air-ticket" },
  ]},
  { id: 3, label: "Packages",     url: "/packages",     children: [] },
  { id: 4, label: "Blog",         url: "/blog",         children: [] },
  { id: 5, label: "About",        url: "/about",        children: [] },
  { id: 6, label: "Contact",      url: "/contact",      children: [] },
];

const SLIDES = [
  { id: 1, title: "Hajj Packages 2024",   subtitle: "Book your sacred journey",    image: "slide-hajj",   cta: "Book Now",   active: true  },
  { id: 2, title: "Umrah Year Round",     subtitle: "Affordable spiritual travel",  image: "slide-umrah",  cta: "Learn More", active: true  },
  { id: 3, title: "Malaysia Tour",        subtitle: "Explore Southeast Asia",       image: "slide-malaysia",cta: "View Packages",active: false },
  { id: 4, title: "Manpower Solutions",   subtitle: "Trusted overseas employment",  image: "slide-manpower",cta: "Apply Now",  active: true  },
];

const BANNERS = [
  { id: 1, title: "Ramadan Umrah Deal",   position: "Homepage Top",    type: "promo",   active: true,  expires: "Apr 10" },
  { id: 2, title: "Hajj 2024 Open",       position: "Homepage Hero",   type: "hero",    active: true,  expires: "Mar 1"  },
  { id: 3, title: "Visa Assistance",      position: "Sidebar Right",   type: "sidebar", active: false, expires: "—"      },
  { id: 4, title: "Newsletter Signup",    position: "Footer Top",      type: "cta",     active: true,  expires: "—"      },
];

const TESTIMONIALS = [
  { id: 1, name: "Md. Karim Ullah",   role: "Hajj Pilgrim",      rating: 5, text: "Excellent service from BDH. Everything was perfectly arranged.",       approved: true  },
  { id: 2, name: "Rabeya Akter",      role: "Umrah Traveler",    rating: 5, text: "Very professional team. Would highly recommend to everyone.",           approved: true  },
  { id: 3, name: "Ahmed Hossain",     role: "Malaysia Tour",     rating: 4, text: "Great trip overall. Hotel was good and guide was very helpful.",         approved: false },
  { id: 4, name: "Fatema Khanam",     role: "Visa Client",       rating: 5, text: "Got my Saudi visa in just 3 days. Amazing support throughout.",          approved: true  },
  { id: 5, name: "Nasir Uddin",       role: "Manpower Client",   rating: 4, text: "Smooth process for overseas job placement. Transparent and honest.",     approved: false },
];

const FAQS = [
  { id: 1, question: "What documents are required for Hajj?",           category: "Hajj",  order: 1, published: true  },
  { id: 2, question: "How early should I book for Umrah?",              category: "Umrah", order: 2, published: true  },
  { id: 3, question: "What is the Saudi visa processing time?",         category: "Visa",  order: 3, published: true  },
  { id: 4, question: "Do you offer installment payment plans?",         category: "Payment",order:4, published: true  },
  { id: 5, question: "Can I change my package after booking?",          category: "Policy",order: 5, published: false },
  { id: 6, question: "What is your cancellation and refund policy?",    category: "Policy",order: 6, published: true  },
];

const CATEGORIES = [
  { id: 1, name: "Hajj",   slug: "hajj",    count: 14, color: "#1B75BC" },
  { id: 2, name: "Umrah",  slug: "umrah",   count: 11, color: "#0E7C66" },
  { id: 3, name: "Visa",   slug: "visa",    count: 8,  color: "#F15A24" },
  { id: 4, name: "Hotel",  slug: "hotel",   count: 5,  color: "#7C3AED" },
  { id: 5, name: "Tour",   slug: "tour",    count: 7,  color: "#2563EB" },
  { id: 6, name: "News",   slug: "news",    count: 12, color: "#EF4444" },
];

type MediaFile = {
  id: number; name: string; type: "image" | "pdf" | "doc";
  size: string; dims?: string; uploaded: string; color: string;
};
const MEDIA: MediaFile[] = [
  { id: 1, name: "hajj-hero.jpg",       type: "image", size: "248 KB", dims: "1920×640", uploaded: "Jul 14", color: "#1B75BC"  },
  { id: 2, name: "umrah-banner.jpg",    type: "image", size: "185 KB", dims: "1280×480", uploaded: "Jul 12", color: "#0E7C66"  },
  { id: 3, name: "makkah-aerial.jpg",   type: "image", size: "412 KB", dims: "2400×1600",uploaded: "Jul 10", color: "#F15A24"  },
  { id: 4, name: "madinah-hotel.jpg",   type: "image", size: "320 KB", dims: "1600×900", uploaded: "Jul 8",  color: "#2563EB"  },
  { id: 5, name: "malaysia-tour.jpg",   type: "image", size: "196 KB", dims: "1280×720", uploaded: "Jul 6",  color: "#7C3AED"  },
  { id: 6, name: "team-photo.jpg",      type: "image", size: "512 KB", dims: "2000×1333",uploaded: "Jul 4",  color: "#EF4444"  },
  { id: 7, name: "brochure-2024.pdf",   type: "pdf",   size: "1.4 MB", uploaded: "Jul 2", color: "#F59E0B"  },
  { id: 8, name: "visa-guide.pdf",      type: "pdf",   size: "820 KB", uploaded: "Jun 30",color: "#F97316"  },
  { id: 9, name: "hajj-package.jpg",    type: "image", size: "274 KB", dims: "1920×1080",uploaded: "Jun 28", color: "#06B6D4"  },
  { id:10, name: "office-exterior.jpg", type: "image", size: "390 KB", dims: "1600×1200",uploaded: "Jun 26", color: "#84CC16"  },
  { id:11, name: "visa-stamp.jpg",      type: "image", size: "88 KB",  dims: "800×600",  uploaded: "Jun 24", color: "#EC4899"  },
  { id:12, name: "group-tour.jpg",      type: "image", size: "455 KB", dims: "2400×1600",uploaded: "Jun 22", color: "#14B8A6"  },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft:     "bg-slate-100 text-slate-500 border-slate-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive:  "bg-slate-100 text-slate-400 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize", cfg[status] ?? cfg.draft)}>
      {status}
    </span>
  );
}

function Toolbar({ onNew, onSearch, newLabel = "New", children }: {
  onNew?: () => void; onSearch?: (q: string) => void;
  newLabel?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input onChange={e => onSearch?.(e.target.value)} placeholder="Search…"
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 w-56" />
        </div>
        {children}
      </div>
      {onNew && (
        <button onClick={onNew}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
          <Plus size={14} /> {newLabel}
        </button>
      )}
    </div>
  );
}

function ActionMenu({ onEdit, onDelete, onDuplicate }: {
  onEdit?: () => void; onDelete?: () => void; onDuplicate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
          {onEdit && <button onClick={() => { onEdit(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Edit2 size={13} /> Edit</button>}
          {onDuplicate && <button onClick={() => { onDuplicate(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Copy size={13} /> Duplicate</button>}
          {onDelete && <button onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 size={13} /> Delete</button>}
        </div>
      )}
    </div>
  );
}

// ─── PAGE / BLOG EDITOR ───────────────────────────────────────────────────────
function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tools = [
    { icon: Undo, label: "Undo" }, { icon: Redo, label: "Redo" },
    null,
    { icon: Heading1, label: "H1" }, { icon: Heading2, label: "H2" },
    null,
    { icon: Bold, label: "Bold" }, { icon: Italic, label: "Italic" },
    { icon: Underline, label: "Underline" },
    null,
    { icon: AlignLeft, label: "Left" }, { icon: AlignCenter, label: "Center" },
    { icon: AlignRight, label: "Right" },
    null,
    { icon: List, label: "List" }, { icon: Quote, label: "Quote" },
    { icon: Link, label: "Link" }, { icon: Code, label: "Code" },
  ];
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center flex-wrap gap-0.5 p-2 border-b border-slate-100 bg-slate-50">
        {tools.map((t, i) =>
          t === null
            ? <div key={i} className="w-px h-5 bg-slate-200 mx-1" />
            : (
              <button key={i} title={t.label}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
                <t.icon size={14} />
              </button>
            )
        )}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-64 p-4 text-sm text-slate-700 focus:outline-none resize-none leading-relaxed"
        placeholder="Start writing your content here…

Use the toolbar above to format text, add headings, insert links, and more.

Tip: Write engaging, informative content that helps your readers plan their journey."
      />
    </div>
  );
}

function FeaturedImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [drag, setDrag] = useState(false);
  if (value) return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200">
      <div className="h-40 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B75BC 0%, #0E7C66 100%)" }}>
        <div className="text-center text-white">
          <Image size={28} className="mx-auto mb-1 opacity-60" />
          <p className="text-sm opacity-80">{value}</p>
        </div>
      </div>
      <button onClick={() => onChange("")}
        className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white">
        <X size={12} />
      </button>
    </div>
  );
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); onChange("dropped-image.jpg"); }}
      className={cn(
        "h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
        drag ? "border-[#1B75BC] bg-[#1B75BC]/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}>
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
        <Upload size={18} className="text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-600">Drop image or click to browse</p>
        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP — max 5 MB</p>
      </div>
    </div>
  );
}

function ContentEditor({
  type = "page",
  title: initTitle = "",
  onBack,
}: {
  type?: "page" | "blog"; title?: string; onBack: () => void;
}) {
  const [title, setTitle] = useState(initTitle || (type === "page" ? "New Page" : "New Blog Post"));
  const [body, setBody] = useState("");
  const [featImg, setFeatImg] = useState("");
  const [slug, setSlug] = useState(initTitle ? initTitle.toLowerCase().replace(/\s+/g, "-") : "");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [category, setCategory] = useState("Hajj");
  const [preview, setPreview] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (pub?: boolean) => {
    if (pub) setStatus("published");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor topbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-700">{type === "page" ? "Pages" : "Blog"}</span>
          <span className="text-sm text-slate-400">/</span>
          <span className="text-sm text-slate-600 truncate max-w-48">{title}</span>
          <StatusChip status={status} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(v => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
              showPreview ? "bg-[#1B75BC] text-white border-[#1B75BC]" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <Eye size={13} /> Preview
          </button>
          <button onClick={() => handleSave()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            {saved ? <><Check size={13} className="text-emerald-500" /> Saved</> : <><Save size={13} /> Save Draft</>}
          </button>
          <button onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Globe size={13} /> Publish
          </button>
        </div>
      </div>

      {showPreview ? (
        /* Preview pane */
        <div className="flex-1 bg-slate-100 p-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([k, Icon]) => (
              <button key={k} onClick={() => setPreview(k)}
                className={cn("p-2 rounded-lg", preview === k ? "bg-white shadow text-[#1B75BC]" : "text-slate-400 hover:text-slate-600")}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          <div className={cn("bg-white shadow-xl rounded-xl overflow-hidden transition-all",
            preview === "desktop" ? "w-full max-w-3xl" : preview === "tablet" ? "w-[768px] max-w-full" : "w-[375px]")}>
            <div className="bg-[#1B75BC] px-6 py-4">
              <div className="h-4 bg-white/20 rounded w-1/3 mb-2" />
              <div className="flex gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-white/15 rounded w-12" />)}
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-3">{title || "Untitled"}</h1>
              {body ? (
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{body}</p>
              ) : (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={cn("h-3 bg-slate-100 rounded", i === 4 ? "w-2/3" : "w-full")} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Editor pane */
        <div className="flex-1 overflow-y-auto bg-[#F0F2F5]">
          <div className="max-w-5xl mx-auto p-6 grid grid-cols-3 gap-5">
            {/* Main column */}
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <input
                  value={title}
                  onChange={e => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                  placeholder="Page title…"
                  className="w-full text-2xl font-bold text-slate-800 border-none outline-none placeholder:text-slate-300 mb-1"
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Globe size={11} />
                  <span>bdhtravels.com</span>
                  <span>/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                    className="text-[#1B75BC] underline-offset-2 hover:underline focus:outline-none bg-transparent" />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Content</label>
                <RichEditor value={body} onChange={setBody} />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">SEO</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Meta Title</label>
                    <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                      placeholder={title || "Enter meta title…"}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                    <p className="text-xs text-slate-400 mt-1">{metaTitle.length}/60 chars</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Meta Description</label>
                    <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                      rows={3} placeholder="Describe this page for search engines…"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
                    <p className="text-xs text-slate-400 mt-1">{metaDesc.length}/160 chars</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">Google Preview</p>
                    <p className="text-sm text-blue-700 font-medium">{metaTitle || title || "Page Title"}</p>
                    <p className="text-xs text-green-700">https://bdhtravels.com/{slug || "page-slug"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {metaDesc || "Enter a meta description to see how this page appears in search results…"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar column */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Publish</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <select value={status} onChange={e => setStatus(e.target.value as any)}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Visibility</span>
                    <select className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none">
                      <option>Public</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Schedule</span>
                    <input type="date" className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button onClick={() => handleSave()} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                      Save Draft
                    </button>
                    <button onClick={() => handleSave(true)} className="flex-1 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
                      Publish
                    </button>
                  </div>
                </div>
              </div>

              {type === "blog" && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Category & Tags</label>
                  <div className="space-y-2">
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                      {CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <input placeholder="Add tags, comma-separated…"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Featured Image</label>
                <FeaturedImagePicker value={featImg} onChange={setFeatImg} />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Page Attributes</label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Template</label>
                    <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                      <option>Default</option>
                      <option>Full Width</option>
                      <option>Landing Page</option>
                      <option>Sidebar Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Parent Page</label>
                    <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                      <option>— None —</option>
                      {PAGES.map(p => <option key={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────
function PagesView({ onEdit }: { onEdit: (title: string) => void }) {
  return (
    <div>
      <Toolbar onNew={() => onEdit("")} newLabel="New Page" />
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Title","Slug","Status","Author","Views","Last Updated",""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PAGES.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(p.title)}
                    className="text-sm font-medium text-[#1B75BC] hover:underline">{p.title}</button>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{p.slug}</td>
                <td className="px-4 py-3"><StatusChip status={p.status} /></td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.author}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{p.updatedAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => onEdit(p.title)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13} /></button>
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Eye size={13} /></button>
                    <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── BLOG ─────────────────────────────────────────────────────────────────────
function BlogView({ onEdit }: { onEdit: (title: string) => void }) {
  const [tab, setTab] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const filtered = tab === "all" ? POSTS : POSTS.filter(p => p.status === tab);
  return (
    <div>
      <Toolbar onNew={() => onEdit("")} newLabel="New Post">
        <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
          {(["all","published","draft","scheduled"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-md capitalize transition-colors",
                tab === t ? "bg-white shadow text-slate-700 font-medium" : "text-slate-500 hover:text-slate-700")}>
              {t}
            </button>
          ))}
        </div>
      </Toolbar>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["","Title","Category","Status","Author","Date","Views",""].map((h,i) => (
                <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3">
                  {p.featured && (
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star size={10} className="text-amber-500 fill-amber-500" />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(p.title)}
                    className="text-sm font-medium text-[#1B75BC] hover:underline text-left">{p.title}</button>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: CATEGORIES.find(c=>c.name===p.category)?.color+"15", color: CATEGORIES.find(c=>c.name===p.category)?.color }}>
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusChip status={p.status} /></td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.author}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{p.date}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{p.views > 0 ? p.views.toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => onEdit(p.title)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13} /></button>
                    <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Eye size={13} /></button>
                    <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MENUS ────────────────────────────────────────────────────────────────────
function MenusView() {
  const [items, setItems] = useState(MENU_ITEMS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number[]>([2]);

  const move = (from: number, dir: -1 | 1) => {
    const arr = [...items];
    const to = from + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[from], arr[to]] = [arr[to], arr[from]];
    setItems(arr);
  };

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Menu locations */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-800 mb-3">Menu Locations</p>
        {[["Primary Navigation", "main-nav"], ["Footer Links", "footer-nav"], ["Mobile Menu", "mobile-nav"]].map(([label, id]) => (
          <div key={id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 font-mono">{id}</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1">
              <option>Main Menu</option>
              <option>— None —</option>
            </select>
          </div>
        ))}
        <button className="mt-3 w-full py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] flex items-center justify-center gap-1.5">
          <Save size={13} /> Save Locations
        </button>
      </div>

      {/* Menu builder */}
      <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-slate-800">Main Menu</p>
            <p className="text-xs text-slate-400 mt-0.5">Drag items to reorder · Click arrow to expand</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
              <Plus size={13} /> Add Item
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
              <Save size={13} /> Save Menu
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id}
              className={cn("border border-slate-200 rounded-xl overflow-hidden transition-all",
                dragging === item.id ? "opacity-50 border-[#1B75BC]" : "")}>
              <div
                draggable
                onDragStart={() => setDragging(item.id)}
                onDragEnd={() => setDragging(null)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 cursor-grab active:cursor-grabbing">
                <GripVertical size={14} className="text-slate-300" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-xs text-slate-400 font-mono">{item.url}</span>
                  {item.children.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{item.children.length} sub</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(idx, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronUp size={12} /></button>
                  <button onClick={() => move(idx, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronDown size={12} /></button>
                  {item.children.length > 0 && (
                    <button onClick={() => setExpanded(e => e.includes(item.id) ? e.filter(x=>x!==item.id) : [...e, item.id])}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400">
                      <ChevronRight size={12} className={cn("transition-transform", expanded.includes(item.id) && "rotate-90")} />
                    </button>
                  )}
                  <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={12} /></button>
                  <button className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><X size={12} /></button>
                </div>
              </div>
              {expanded.includes(item.id) && item.children.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 px-2 py-2 space-y-1.5">
                  {item.children.map(child => (
                    <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg ml-4">
                      <GripVertical size={12} className="text-slate-300 cursor-grab" />
                      <ChevronRight size={11} className="text-slate-300" />
                      <span className="text-sm text-slate-600">{child.label}</span>
                      <span className="text-xs text-slate-400 font-mono">{child.url}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={11} /></button>
                        <button className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><X size={11} /></button>
                      </div>
                    </div>
                  ))}
                  <button className="flex items-center gap-1 text-xs text-[#1B75BC] hover:underline ml-4 px-1">
                    <Plus size={11} /> Add sub-item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDERS ──────────────────────────────────────────────────────────────────
const SLIDE_COLORS = ["#1B75BC","#0E7C66","#2563EB","#7C3AED"];

function SlidersView() {
  const [slides, setSlides] = useState(SLIDES);
  const [editing, setEditing] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const move = (from: number, dir: -1 | 1) => {
    const arr = [...slides];
    const to = from + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[from], arr[to]] = [arr[to], arr[from]];
    setSlides(arr);
  };

  const toggleActive = (id: number) =>
    setSlides(s => s.map(sl => sl.id === id ? { ...sl, active: !sl.active } : sl));

  return (
    <div className="space-y-4">
      <Toolbar onNew={() => {}} newLabel="Add Slide" />
      <div className="grid grid-cols-2 gap-4">
        {slides.map((slide, idx) => (
          <div key={slide.id}
            draggable onDragStart={() => setDragging(slide.id)} onDragEnd={() => setDragging(null)}
            className={cn("bg-white rounded-xl border overflow-hidden transition-all",
              dragging === slide.id ? "opacity-50 border-[#1B75BC] scale-95" : "border-slate-200")}>
            {/* Slide preview */}
            <div className="relative h-32 flex items-center justify-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${SLIDE_COLORS[idx % 4]} 0%, ${SLIDE_COLORS[(idx+1) % 4]} 100%)` }}>
              <div className="text-center text-white z-10">
                <p className="text-lg font-bold">{slide.title}</p>
                <p className="text-sm opacity-75">{slide.subtitle}</p>
                <span className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-xs border border-white/30">
                  {slide.cta}
                </span>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <GripVertical size={14} className="text-white/50 cursor-grab" />
                <span className="text-xs text-white/60">#{idx + 1}</span>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button onClick={() => toggleActive(slide.id)}
                  className={cn("w-8 h-4 rounded-full transition-colors flex items-center",
                    slide.active ? "bg-emerald-500 justify-end" : "bg-white/30 justify-start")}>
                  <div className="w-3.5 h-3.5 bg-white rounded-full mx-0.5 shadow" />
                </button>
              </div>
            </div>
            {/* Controls */}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} disabled={idx === 0}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"><ChevronUp size={13} /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === slides.length - 1}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"><ChevronDown size={13} /></button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-xs font-medium", slide.active ? "text-emerald-600" : "text-slate-400")}>
                  {slide.active ? "Active" : "Hidden"}
                </span>
                <button onClick={() => setEditing(slide.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13} /></button>
                <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            {editing === slide.id && (
              <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50">
                <input defaultValue={slide.title} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="Title" />
                <input defaultValue={slide.subtitle} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="Subtitle" />
                <div className="flex gap-2">
                  <input defaultValue={slide.cta} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="CTA text" />
                  <input placeholder="Link URL" className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(null)}
                    className="flex-1 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">Save</button>
                  <button onClick={() => setEditing(null)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BANNERS ──────────────────────────────────────────────────────────────────
function BannersView() {
  const [banners, setBanners] = useState(BANNERS);
  return (
    <div className="space-y-4">
      <Toolbar onNew={() => {}} newLabel="New Banner" />
      <div className="space-y-3">
        {banners.map(b => (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-24 h-14 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: b.type === "hero" ? "#1B75BC" : b.type === "promo" ? "#F15A24" : b.type === "cta" ? "#0E7C66" : "#64748B" }}>
              {b.type.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                <StatusChip status={b.active ? "active" : "inactive"} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Layout size={10} /> {b.position}</span>
                {b.expires !== "—" && <span className="flex items-center gap-1"><Clock size={10} /> Expires {b.expires}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBanners(bns => bns.map(bn => bn.id === b.id ? { ...bn, active: !bn.active } : bn))}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors",
                  b.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "border-slate-200 text-slate-500 hover:bg-slate-50")}>
                {b.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                {b.active ? "Active" : "Inactive"}
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Edit2 size={14} /></button>
              <button className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
function CategoriesView() {
  const [cats, setCats] = useState(CATEGORIES);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  return (
    <div className="grid grid-cols-2 gap-5">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Blog Categories</h3>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
            <Plus size={13} /> Add Category
          </button>
        </div>
        {adding && (
          <div className="mb-3 p-3 bg-white border border-[#1B75BC]/30 rounded-xl space-y-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Category name…" autoFocus
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => { if (newName.trim()) { setCats(c => [...c, { id: Date.now(), name: newName, slug: newName.toLowerCase(), count: 0, color: "#64748B" }]); } setAdding(false); setNewName(""); }}
                className="px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg">Add</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500">Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 group">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                <p className="text-xs text-slate-400 font-mono">/{cat.slug}</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{cat.count} posts</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={12} /></button>
                <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
        <div className="space-y-3">
          {cats.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cat.color + "20" }}>
                <Tag size={14} style={{ color: cat.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(cat.count / 14) * 100}%`, background: cat.color }} />
                  </div>
                  <span className="text-xs text-slate-500">{cat.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function TestimonialsView() {
  const [items, setItems] = useState(TESTIMONIALS);
  return (
    <div>
      <Toolbar onNew={() => {}} newLabel="Add Testimonial" />
      <div className="grid grid-cols-2 gap-4">
        {items.map(t => (
          <div key={t.id} className={cn("bg-white rounded-xl border p-4", t.approved ? "border-slate-200" : "border-amber-200 bg-amber-50/30")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-sm font-bold">
                  {t.name.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!t.approved && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                )}
                <ActionMenu
                  onEdit={() => {}}
                  onDelete={() => setItems(x => x.filter(i => i.id !== t.id))}
                />
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className={i < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
              ))}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">"{t.text}"</p>
            {!t.approved && (
              <button onClick={() => setItems(x => x.map(i => i.id === t.id ? { ...i, approved: true } : i))}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Check size={11} /> Approve & Publish
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQs ────────────────────────────────────────────────────────────────────
function FaqsView() {
  const [faqs, setFaqs] = useState(FAQS);
  const [dragging, setDragging] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const move = (from: number, dir: -1 | 1) => {
    const arr = [...faqs];
    const to = from + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[from], arr[to]] = [arr[to], arr[from]];
    setFaqs(arr.map((f, i) => ({ ...f, order: i + 1 })));
  };

  return (
    <div>
      <Toolbar onNew={() => {}} newLabel="Add FAQ" />
      <div className="space-y-2">
        {faqs.map((faq, idx) => (
          <div key={faq.id}
            className={cn("bg-white rounded-xl border overflow-hidden transition-all",
              dragging === faq.id ? "opacity-50 border-[#1B75BC]" : "border-slate-200")}>
            <div
              draggable onDragStart={() => setDragging(faq.id)} onDragEnd={() => setDragging(null)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}>
              <GripVertical size={14} className="text-slate-300 cursor-grab flex-shrink-0" />
              <span className="text-xs font-mono text-slate-400 w-5">#{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{faq.question}</p>
                <span className="text-xs text-slate-400">{faq.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); setFaqs(f => f.map(x => x.id === faq.id ? { ...x, published: !x.published } : x)); }}
                  className={cn("text-xs px-2 py-0.5 rounded-full border",
                    faq.published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                  {faq.published ? "Published" : "Draft"}
                </button>
                <button onClick={e => { e.stopPropagation(); move(idx, -1); }} disabled={idx===0}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"><ChevronUp size={12} /></button>
                <button onClick={e => { e.stopPropagation(); move(idx, 1); }} disabled={idx===faqs.length-1}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"><ChevronDown size={12} /></button>
                <button onClick={e => e.stopPropagation()} className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={12} /></button>
                <button onClick={e => { e.stopPropagation(); setFaqs(f => f.filter(x => x.id !== faq.id)); }}
                  className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                <ChevronRight size={14} className={cn("text-slate-300 transition-transform", expanded === faq.id && "rotate-90")} />
              </div>
            </div>
            {expanded === faq.id && (
              <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                <textarea rows={3} placeholder="Type the answer here…"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none" />
                <div className="flex gap-2 mt-2">
                  <button className="px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">Save Answer</button>
                  <button onClick={() => setExpanded(null)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MEDIA LIBRARY ────────────────────────────────────────────────────────────
type UploadState = { name: string; progress: number; done: boolean };

function MediaView() {
  const [selected, setSelected] = useState<number[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dropping, setDropping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (names: string[]) => {
    const newUps = names.map(name => ({ name, progress: 0, done: false }));
    setUploads(u => [...u, ...newUps]);
    newUps.forEach((_, i) => {
      const interval = setInterval(() => {
        setUploads(u => u.map((up, j) => {
          if (j < u.length - newUps.length + i) return up;
          if (up.name !== newUps[i].name || up.done) return up;
          const next = Math.min(up.progress + Math.random() * 25 + 10, 100);
          return { ...up, progress: next, done: next >= 100 };
        }));
      }, 200);
      setTimeout(() => {
        clearInterval(interval);
        setUploads(u => u.map(up => up.name === newUps[i].name ? { ...up, progress: 100, done: true } : up));
        setTimeout(() => setUploads(u => u.filter(up => up.name !== newUps[i].name)), 1500);
      }, 2500 + i * 300);
    });
  };

  const toggle = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search files…"
              className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none w-52" />
          </div>
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none text-slate-600">
            <option>All Types</option>
            <option>Images</option>
            <option>PDFs</option>
            <option>Documents</option>
          </select>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView("grid")}
              className={cn("p-1.5 rounded-md", view === "grid" ? "bg-white shadow text-slate-700" : "text-slate-400")}>
              <Layout size={14} />
            </button>
            <button onClick={() => setView("list")}
              className={cn("p-1.5 rounded-md", view === "list" ? "bg-white shadow text-slate-700" : "text-slate-400")}>
              <List size={14} />
            </button>
          </div>
          {selected.length > 0 && (
            <span className="text-sm text-slate-500">{selected.length} selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
              <Trash2 size={13} /> Delete ({selected.length})
            </button>
          )}
          <input ref={fileRef} type="file" multiple className="hidden"
            onChange={e => { if (e.target.files) simulateUpload([...e.target.files].map(f => f.name)); }} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
            <Upload size={13} /> Upload Files
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDropping(true); }}
        onDragLeave={() => setDropping(false)}
        onDrop={e => {
          e.preventDefault(); setDropping(false);
          simulateUpload([...e.dataTransfer.files].map(f => f.name));
        }}
        className={cn("border-2 border-dashed rounded-xl p-4 text-center transition-all",
          dropping ? "border-[#1B75BC] bg-[#1B75BC]/5" : "border-slate-200 hover:border-slate-300")}>
        <div className="flex items-center justify-center gap-3">
          <Upload size={16} className="text-slate-400" />
          <span className="text-sm text-slate-400">Drag & drop files here, or <button className="text-[#1B75BC] hover:underline" onClick={() => fileRef.current?.click()}>browse</button></span>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Upload size={14} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-700">{u.name}</p>
                  {u.done
                    ? <CheckCircle size={14} className="text-emerald-500" />
                    : <span className="text-xs text-slate-400">{Math.round(u.progress)}%</span>
                  }
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", u.done ? "bg-emerald-500" : "bg-[#1B75BC]")}
                    style={{ width: `${u.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-4 gap-3">
          {MEDIA.map(file => (
            <div key={file.id}
              onClick={() => toggle(file.id)}
              className={cn("relative rounded-xl overflow-hidden border-2 cursor-pointer group transition-all",
                selected.includes(file.id) ? "border-[#1B75BC] shadow-lg shadow-[#1B75BC]/20" : "border-transparent hover:border-slate-200")}>
              {/* Thumbnail */}
              <div className="h-28 flex items-center justify-center relative"
                style={{ background: file.color + "20" }}>
                {file.type === "image" ? (
                  <>
                    <div className="w-full h-full absolute inset-0" style={{
                      background: `radial-gradient(circle at 30% 40%, ${file.color}40, ${file.color}15)`,
                    }} />
                    <Image size={24} style={{ color: file.color }} className="relative z-10 opacity-60" />
                  </>
                ) : (
                  <div className="text-center">
                    <FileText size={24} style={{ color: file.color }} className="mx-auto" />
                    <span className="text-xs font-bold uppercase mt-1 block" style={{ color: file.color }}>
                      {file.type}
                    </span>
                  </div>
                )}
                {selected.includes(file.id) && (
                  <div className="absolute inset-0 bg-[#1B75BC]/10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#1B75BC] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow"><Eye size={10} className="text-slate-600" /></button>
                  <button className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow"><Copy size={10} className="text-slate-600" /></button>
                </div>
              </div>
              {/* Meta */}
              <div className="p-2 bg-white border-t border-slate-100">
                <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-slate-400">{file.size}</span>
                  {file.dims && <span className="text-xs text-slate-400">{file.dims}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["","File","Type","Size","Dimensions","Uploaded",""].map((h,i) => (
                  <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEDIA.map(file => (
                <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={selected.includes(file.id)} onChange={() => toggle(file.id)}
                      className="rounded border-slate-300" />
                  </td>
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: file.color + "20" }}>
                      {file.type === "image" ? <Image size={14} style={{ color: file.color }} /> : <FileText size={14} style={{ color: file.color }} />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 uppercase">{file.type}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600 font-mono">{file.size}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-400">{file.dims ?? "—"}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-400">{file.uploaded}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Eye size={13} /></button>
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Copy size={13} /></button>
                      <button className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── WEB SETTINGS ────────────────────────────────────────────────────────────
function SettingsView() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const groups = [
    {
      title: "General",
      icon: Globe,
      fields: [
        { label: "Site Title",       type: "text",     default: "BDH Travels & Tourism" },
        { label: "Tagline",          type: "text",     default: "Your Trusted Travel Partner" },
        { label: "Site URL",         type: "url",      default: "https://bdhtravels.com" },
        { label: "Admin Email",      type: "email",    default: "admin@bdhtravels.com" },
        { label: "Phone",            type: "text",     default: "+880 31 123 4567" },
        { label: "Address",          type: "textarea", default: "144/A CDA Commercial Area, Agrabad, Chattogram" },
      ],
    },
    {
      title: "SEO & Analytics",
      icon: BarChart2,
      fields: [
        { label: "Default Meta Title",    type: "text",     default: "BDH Travels & Tourism | Hajj, Umrah & Tour" },
        { label: "Default Meta Desc",     type: "textarea", default: "Bangladesh's trusted travel agency for Hajj, Umrah, Visa, Air Tickets and overseas manpower services." },
        { label: "Google Analytics ID",   type: "text",     default: "G-XXXXXXXXXX" },
        { label: "Facebook Pixel ID",     type: "text",     default: "" },
        { label: "Google Tag Manager ID", type: "text",     default: "" },
      ],
    },
    {
      title: "Social Media",
      icon: Users,
      fields: [
        { label: "Facebook URL",   type: "url", default: "https://facebook.com/bdhtravels" },
        { label: "Instagram URL",  type: "url", default: "" },
        { label: "YouTube URL",    type: "url", default: "" },
        { label: "WhatsApp No.",   type: "text",default: "+8801XXXXXXXXX" },
      ],
    },
    {
      title: "Content Defaults",
      icon: FileText,
      fields: [
        { label: "Posts Per Page",    type: "number", default: "10" },
        { label: "Copyright Text",    type: "text",   default: "© 2024 BDH Travels & Tourism. All rights reserved." },
        { label: "Footer Description",type: "textarea",default: "BDH Travels & Tourism is a leading travel agency in Bangladesh." },
      ],
    },
  ];

  const toggles = [
    { label: "Maintenance Mode",        desc: "Show maintenance page to visitors",  default: false },
    { label: "Blog Comments",           desc: "Allow comments on blog posts",        default: true  },
    { label: "Online Booking",          desc: "Enable public booking form",          default: true  },
    { label: "Live Chat Widget",        desc: "Show live chat button on site",       default: false },
    { label: "Cookie Consent Banner",   desc: "Show GDPR cookie consent on load",   default: true  },
    { label: "WhatsApp Float Button",   desc: "Floating WhatsApp contact button",   default: true  },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Web Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">Global configuration for the public website</p>
        </div>
        <button onClick={save}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
          {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save All Changes</>}
        </button>
      </div>

      {/* Toggle settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-800 mb-4">Site Features</p>
        <div className="grid grid-cols-2 gap-3">
          {toggles.map(t => {
            const [on, setOn] = useState(t.default);
            return (
              <div key={t.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-700">{t.label}</p>
                  <p className="text-xs text-slate-400">{t.desc}</p>
                </div>
                <button onClick={() => setOn(v => !v)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors flex-shrink-0",
                    on ? "bg-[#1B75BC]" : "bg-slate-300")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                    on ? "left-5" : "left-0.5")} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Field groups */}
      {groups.map(group => (
        <div key={group.title} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <group.icon size={16} className="text-[#1B75BC]" />
            <p className="font-semibold text-slate-800">{group.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {group.fields.map(f => (
              <div key={f.label} className={f.type === "textarea" ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea rows={2} defaultValue={f.default}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
                ) : (
                  <input type={f.type} defaultValue={f.default}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Danger zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-red-500" />
          <p className="font-semibold text-red-700">Danger Zone</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Clear Site Cache</p>
            <p className="text-xs text-red-400">Forces all cached pages to regenerate on next visit</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-100">
            <RefreshCw size={13} /> Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export function CmsModule() {
  const [view, setView] = useState<CmsView>("pages");
  const [editTarget, setEditTarget] = useState("");
  const [editType, setEditType] = useState<"page" | "blog">("page");

  const isEditor = view === "page-editor" || view === "blog-editor";

  const openEditor = (type: "page" | "blog", title: string) => {
    setEditType(type);
    setEditTarget(title);
    setView(type === "page" ? "page-editor" : "blog-editor");
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CMS</h2>
          <p className="text-xs text-slate-400 mt-0.5">Website Content</p>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto no-scrollbar">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{group.label}</p>
              {group.items.map(item => (
                <button key={item.id} onClick={() => setView(item.id)}
                  className={cn("w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                    (view === item.id || (view === "page-editor" && item.id === "pages") || (view === "blog-editor" && item.id === "blog"))
                      ? "bg-[#1B75BC]/8 text-[#1B75BC] font-medium border-r-2 border-[#1B75BC]"
                      : "text-slate-600 hover:bg-slate-50")}>
                  <item.icon size={15} className={cn(
                    (view === item.id || (view === "page-editor" && item.id === "pages") || (view === "blog-editor" && item.id === "blog"))
                      ? "text-[#1B75BC]" : "text-slate-400"
                  )} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1B75BC] border border-[#1B75BC]/30 rounded-lg hover:bg-[#1B75BC]/5">
            <ExternalLink size={12} /> Preview Website
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {isEditor ? (
          <ContentEditor
            type={editType}
            title={editTarget}
            onBack={() => setView(editType === "page" ? "pages" : "blog")}
          />
        ) : (
          <div className="p-6 flex-1">
            {view === "pages" && (
              <>
                <SectionHeader title="Pages" subtitle="Manage static pages on your website" />
                <PagesView onEdit={t => openEditor("page", t)} />
              </>
            )}
            {view === "blog" && (
              <>
                <SectionHeader title="Blog" subtitle="Write and manage blog posts" />
                <BlogView onEdit={t => openEditor("blog", t)} />
              </>
            )}
            {view === "categories" && (
              <>
                <SectionHeader title="Categories" subtitle="Organise blog content into categories" />
                <CategoriesView />
              </>
            )}
            {view === "testimonials" && (
              <>
                <SectionHeader title="Testimonials" subtitle="Customer reviews shown on the website" />
                <TestimonialsView />
              </>
            )}
            {view === "faqs" && (
              <>
                <SectionHeader title="FAQs" subtitle="Frequently asked questions · drag to reorder" />
                <FaqsView />
              </>
            )}
            {view === "menus" && (
              <>
                <SectionHeader title="Menus" subtitle="Configure navigation menus and structure" />
                <MenusView />
              </>
            )}
            {view === "sliders" && (
              <>
                <SectionHeader title="Sliders" subtitle="Manage homepage hero sliders · drag to reorder" />
                <SlidersView />
              </>
            )}
            {view === "banners" && (
              <>
                <SectionHeader title="Banners" subtitle="Promotional banners and announcement bars" />
                <BannersView />
              </>
            )}
            {view === "media" && (
              <>
                <SectionHeader title="Media Library" subtitle="Upload and manage images, PDFs, and documents" />
                <MediaView />
              </>
            )}
            {view === "settings" && <SettingsView />}
          </div>
        )}
      </div>
    </div>
  );
}
