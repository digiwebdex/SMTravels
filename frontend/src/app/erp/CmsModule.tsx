import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText, Menu, Image, Layout, BookOpen, Tag, Star, HelpCircle,
  FolderOpen, Settings, Plus, Search, Eye, Edit2, Trash2, Copy,
  ChevronUp, ChevronDown, GripVertical, MoreHorizontal, Globe,
  Upload, X, Check, Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, Link, Code, Heading1, Heading2, Quote, Undo,
  Redo, Save, ArrowLeft, ExternalLink, Monitor, Tablet, Smartphone,
  RefreshCw, AlertCircle, Clock, ChevronRight,
  ToggleLeft, ToggleRight, Megaphone, Layers,
  BarChart2, Users,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Drawer, Field, inputCls, selectCls, PrimaryBtn, GhostBtn } from "./crm/ui";
import {
  useBlogPosts, useBlogPost, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost,
  useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq,
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCmsStatistics, useCreateStatistic, useUpdateStatistic, useDeleteStatistic,
  useCmsHomeServices, useCreateHomeService, useUpdateHomeService, useDeleteHomeService,
  useCmsHomeSections, useUpdateHomeSection,
  useCmsHeroes, useUpdateHero,
  useTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial,
  useCmsPages, useCmsPage, useCreateCmsPage, useUpdateCmsPage, useDeleteCmsPage,
  useMenus, useCreateMenu, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner,
  useMediaAssets, useCreateMediaAsset, useDeleteMediaAsset,
  type FaqDto, type TestimonialDto, type BannerDto, type MenuItemDto,
} from "../hooks/cms";

// ─── Types ────────────────────────────────────────────────────────────────────
type CmsView =
  | "pages" | "page-editor"
  | "menus" | "sliders" | "banners" | "statistics" | "home-services" | "home-sections" | "hero"
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
      { id: "hero" as CmsView, label: "Hero", icon: Image },
      { id: "statistics" as CmsView, label: "Statistics", icon: BarChart2 },
      { id: "home-services" as CmsView, label: "Services", icon: Layers },
      { id: "home-sections" as CmsView, label: "Sections", icon: Layout },
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

// ─── Static helpers ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, name: "Hajj",   slug: "hajj",    count: 14, color: "#1B75BC" },
  { id: 2, name: "Umrah",  slug: "umrah",   count: 11, color: "#0E7C66" },
  { id: 3, name: "Visa",   slug: "visa",    count: 8,  color: "#F15A24" },
  { id: 4, name: "Hotel",  slug: "hotel",   count: 5,  color: "#7C3AED" },
  { id: 5, name: "Tour",   slug: "tour",    count: 7,  color: "#2563EB" },
  { id: 6, name: "News",   slug: "news",    count: 12, color: "#EF4444" },
];


// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const key = status.toLowerCase();
  const cfg: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft:     "bg-slate-100 text-slate-500 border-[var(--color-border)]",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    archived:  "bg-slate-100 text-slate-400 border-[var(--color-border)]",
    active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive:  "bg-slate-100 text-slate-400 border-[var(--color-border)]",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize", cfg[key] ?? cfg.draft)}>
      {key}
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
            className="pl-8 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 w-56" />
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
        <div className="absolute right-0 top-8 w-36 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg z-20 py-1">
          {onEdit && <button onClick={() => { onEdit(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Edit2 size={13} /> Edit</button>}
          {onDuplicate && <button onClick={() => { onDuplicate(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Copy size={13} /> Duplicate</button>}
          {onDelete && <button onClick={() => { onDelete(); setOpen(false); }}
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
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="flex items-center flex-wrap gap-0.5 p-2 border-b border-slate-100 bg-slate-50">
        {tools.map((t, i) =>
          t === null
            ? <div key={i} className="w-px h-5 bg-slate-200 mx-1" />
            : (
              <button key={i} disabled title={`${t.label} is not available in this build`}
                className="p-1.5 rounded text-[#9CA3AF] opacity-60 cursor-not-allowed">
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
    <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
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
        drag ? "border-[#1B75BC] bg-[#1B75BC]/5" : "border-[var(--color-border)] hover:border-slate-300 hover:bg-slate-50"
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
  postId = null,
  onBack,
}: {
  type?: "page" | "blog"; title?: string; postId?: string | null; onBack: () => void;
}) {
  const isBlog = type === "blog";
  const isPage = type === "page";
  const { data: existingPost, isLoading: loadingPost } = useBlogPost(isBlog ? postId : null);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: existingPage, isLoading: loadingPage } = useCmsPage(isPage ? postId : null);
  const createPage = useCreateCmsPage();
  const updatePage = useUpdateCmsPage();

  const [title, setTitle] = useState(initTitle || (type === "page" ? "New Page" : "New Blog Post"));
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featImg, setFeatImg] = useState("");
  const [slug, setSlug] = useState(initTitle ? initTitle.toLowerCase().replace(/\s+/g, "-") : "");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [category, setCategory] = useState("Hajj");
  const [preview, setPreview] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(!postId);

  useEffect(() => {
    if (!isBlog || !existingPost) return;
    setTitle(existingPost.title);
    setBody(existingPost.body ?? "");
    setExcerpt(existingPost.excerpt ?? "");
    setFeatImg(existingPost.featImg ?? "");
    setSlug(existingPost.slug);
    setMetaTitle(existingPost.metaTitle ?? "");
    setMetaDesc(existingPost.metaDesc ?? "");
    setStatus(existingPost.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
    setHydrated(true);
  }, [isBlog, existingPost]);

  useEffect(() => {
    if (!isPage || !existingPage) return;
    setTitle(existingPage.title);
    setBody(existingPage.body ?? "");
    setSlug(existingPage.slug);
    setMetaTitle(existingPage.metaTitle ?? "");
    setMetaDesc(existingPage.metaDesc ?? "");
    setStatus(existingPage.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
    setHydrated(true);
  }, [isPage, existingPage]);

  const handleSave = async (pub?: boolean) => {
    const nextStatus = pub ? "PUBLISHED" : status;
    if (pub) setStatus("PUBLISHED");

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      body: body.trim() || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDesc: metaDesc.trim() || undefined,
      status: nextStatus as "DRAFT" | "PUBLISHED",
    };

    if (isBlog) {
      const blogPayload = {
        ...payload,
        excerpt: excerpt.trim() || undefined,
        featImg: featImg.trim() || undefined,
      };
      if (postId) await updatePost.mutateAsync({ id: postId, ...blogPayload });
      else await createPost.mutateAsync(blogPayload);
    } else {
      if (postId) await updatePage.mutateAsync({ id: postId, ...payload });
      else await createPage.mutateAsync(payload);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saving = createPost.isPending || updatePost.isPending || createPage.isPending || updatePage.isPending;

  if (postId && ((isBlog && (loadingPost || !hydrated)) || (isPage && (loadingPage || !hydrated)))) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">Loading…</div>
    );
  }

  const displayStatus = status.toLowerCase();

  return (
    <div className="flex flex-col h-full">
      {/* Editor topbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm text-slate-400">/</span>
          <span className="text-sm font-medium text-slate-700">{type === "page" ? "Pages" : "Blog"}</span>
          <span className="text-sm text-slate-400">/</span>
          <span className="text-sm text-slate-600 truncate max-w-48">{title}</span>
          <StatusChip status={displayStatus} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(v => !v)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
              showPreview ? "bg-[#1B75BC] text-white border-[#1B75BC]" : "border-[var(--color-border)] text-slate-600 hover:bg-slate-50")}>
            <Eye size={13} /> Preview
          </button>
          <button onClick={() => handleSave()} disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50">
            {saved ? <><Check size={13} className="text-emerald-500" /> Saved</> : <><Save size={13} /> Save Draft</>}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
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
                className={cn("p-2 rounded-lg", preview === k ? "bg-[var(--color-surface)] shadow text-[#1B75BC]" : "text-slate-400 hover:text-slate-600")}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          <div className={cn("bg-[var(--color-surface)] shadow-xl rounded-xl overflow-hidden transition-all",
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
              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
                <input
                  value={title}
                  onChange={e => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
                  placeholder="Page title…"
                  className="w-full text-2xl font-bold text-slate-800 border-none outline-none placeholder:text-slate-300 mb-1"
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Globe size={11} />
                  <span>smtravelsinternational.com</span>
                  <span>/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                    className="text-[#1B75BC] underline-offset-2 hover:underline focus:outline-none bg-transparent" />
                </div>
              </div>

              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Content</label>
                {isBlog && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Excerpt</label>
                    <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
                      placeholder="Short summary shown in blog listings…"
                      className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none mb-3" />
                  </div>
                )}
                <RichEditor value={body} onChange={setBody} />
              </div>

              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">SEO</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Meta Title</label>
                    <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                      placeholder={title || "Enter meta title…"}
                      className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                    <p className="text-xs text-slate-400 mt-1">{metaTitle.length}/60 chars</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Meta Description</label>
                    <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                      rows={3} placeholder="Describe this page for search engines…"
                      className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
                    <p className="text-xs text-slate-400 mt-1">{metaDesc.length}/160 chars</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">Google Preview</p>
                    <p className="text-sm text-blue-700 font-medium">{metaTitle || title || "Page Title"}</p>
                    <p className="text-xs text-green-700">https://smtravelsinternational.com/{slug || "page-slug"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {metaDesc || "Enter a meta description to see how this page appears in search results…"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar column */}
            <div className="space-y-4">
              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Publish</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <select value={status} onChange={e => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                      className="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1 focus:outline-none">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Visibility</span>
                    <select className="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1 focus:outline-none">
                      <option>Public</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Schedule</span>
                    <input type="date" className="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button onClick={() => handleSave()} className="flex-1 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-slate-50 text-slate-600">
                      Save Draft
                    </button>
                    <button onClick={() => handleSave(true)} className="flex-1 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]">
                      Publish
                    </button>
                  </div>
                </div>
              </div>

              {type === "blog" && (
                <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Category & Tags</label>
                  <div className="space-y-2">
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none">
                      {CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <input placeholder="Add tags, comma-separated…"
                      className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
                  </div>
                </div>
              )}

              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Featured Image</label>
                <FeaturedImagePicker value={featImg} onChange={setFeatImg} />
              </div>

              <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Page Attributes</label>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Template</label>
                    <select className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none">
                      <option>Default</option>
                      <option>Full Width</option>
                      <option>Landing Page</option>
                      <option>Sidebar Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Parent Page</label>
                    <select className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none">
                      <option>— None —</option>
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
function PagesView({ onEdit }: { onEdit: (id: string | null) => void }) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useCmsPages({ q: search || undefined, pageSize: 100 });
  const del = useDeleteCmsPage();
  const pages = data?.data ?? [];
  const fmtDate = (iso: string | null) => iso ? iso.slice(0, 10) : "—";

  return (
    <div>
      <Toolbar onNew={() => onEdit(null)} newLabel="New Page" onSearch={setSearch} />
      {isError && <p className="text-sm text-red-500 mb-3">Could not load pages.</p>}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Title","Slug","Status","Views","Last Updated",""].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Loading…</td></tr>
            )}
            {!isLoading && pages.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No pages yet.</td></tr>
            )}
            {pages.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(p.id)}
                    className="text-sm font-medium text-[#1B75BC] hover:underline text-left">{p.title}</button>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">/{p.slug}</td>
                <td className="px-4 py-3"><StatusChip status={p.status} /></td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{fmtDate(p.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => onEdit(p.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13} /></button>
                    <button
                      onClick={() => { if (confirm("Delete this page?")) del.mutate(p.id); }}
                      className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
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
function BlogView({ onEdit }: { onEdit: (id: string | null) => void }) {
  const [tab, setTab] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const [search, setSearch] = useState("");
  const statusParam = tab === "all" ? undefined : tab === "published" ? "PUBLISHED" : tab === "draft" ? "DRAFT" : "SCHEDULED";
  const { data, isLoading, isError } = useBlogPosts({ status: statusParam, q: search || undefined, pageSize: 50 });
  const del = useDeleteBlogPost();
  const posts = data?.data ?? [];

  const fmtDate = (iso: string | null) => iso ? iso.slice(0, 10) : "—";

  return (
    <div>
      <Toolbar onNew={() => onEdit(null)} newLabel="New Post" onSearch={setSearch}>
        <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
          {(["all","published","draft","scheduled"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-md capitalize transition-colors",
                tab === t ? "bg-[var(--color-surface)] shadow text-slate-700 font-medium" : "text-slate-500 hover:text-slate-700")}>
              {t}
            </button>
          ))}
        </div>
      </Toolbar>
      {isError && <p className="text-sm text-red-500 mb-3">Could not load blog posts.</p>}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full min-w-[680px] md:min-w-0">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["","Title","Category","Status","Author","Date","Views",""].map((h,i) => (
                <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">Loading…</td></tr>
            )}
            {!isLoading && posts.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No posts yet.</td></tr>
            )}
            {posts.map(p => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                <td className="px-4 py-3">
                  {p.featured && (
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star size={10} className="text-amber-500 fill-amber-500" />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(p.id)}
                    className="text-sm font-medium text-[#1B75BC] hover:underline text-left">{p.title}</button>
                  {p.excerpt && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.excerpt}</p>}
                </td>
                <td className="px-4 py-3">
                  {p.categoryName ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.categoryName}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3"><StatusChip status={p.status} /></td>
                <td className="px-4 py-3 text-sm text-slate-500">{p.authorName ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{fmtDate(p.publishedAt ?? p.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{p.views > 0 ? p.views.toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => onEdit(p.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13} /></button>
                    <button
                      onClick={() => { if (confirm("Delete this post?")) del.mutate(p.id); }}
                      className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
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
  const { data, isLoading, isError } = useMenus();
  const createMenu = useCreateMenu();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const menus = data?.data ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("/");
  const active = menus.find(m => m.id === activeId) ?? menus[0] ?? null;

  useEffect(() => {
    if (!activeId && menus[0]) setActiveId(menus[0].id);
  }, [menus, activeId]);

  const LOC_LABELS: Record<string, string> = {
    MAIN_NAV: "Primary Navigation",
    FOOTER_NAV: "Footer Links",
    MOBILE_NAV: "Mobile Menu",
  };

  const ensureLocation = async (location: "MAIN_NAV" | "FOOTER_NAV" | "MOBILE_NAV") => {
    const existing = menus.find(m => m.location === location);
    if (existing) { setActiveId(existing.id); return; }
    const created = await createMenu.mutateAsync({ location, name: LOC_LABELS[location] });
    setActiveId(created.id);
  };

  const addItem = async () => {
    if (!active || !newLabel.trim()) return;
    await createItem.mutateAsync({ menuId: active.id, label: newLabel.trim(), url: newUrl.trim() || "/", sortOrder: active.items.length });
    setNewLabel("");
    setNewUrl("/");
  };

  const moveItem = async (item: MenuItemDto, dir: -1 | 1) => {
    if (!active) return;
    const siblings = active.items;
    const idx = siblings.findIndex(i => i.id === item.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await updateItem.mutateAsync({ menuId: active.id, itemId: item.id, sortOrder: swap.sortOrder });
    await updateItem.mutateAsync({ menuId: active.id, itemId: swap.id, sortOrder: item.sortOrder });
  };

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <p className="text-sm font-semibold text-slate-800 mb-3">Menu Locations</p>
        {(["MAIN_NAV", "FOOTER_NAV", "MOBILE_NAV"] as const).map(loc => {
          const m = menus.find(x => x.location === loc);
          return (
            <button key={loc} onClick={() => m ? setActiveId(m.id) : ensureLocation(loc)}
              className={cn("w-full text-left py-2.5 border-b border-slate-50 last:border-0",
                active?.location === loc ? "text-[#1B75BC]" : "text-slate-700")}>
              <p className="text-sm font-medium">{LOC_LABELS[loc]}</p>
              <p className="text-xs text-slate-400 font-mono">{loc}{m ? ` · ${m.items.length} items` : " · not created"}</p>
            </button>
          );
        })}
        {isError && <p className="text-xs text-red-500 mt-2">Could not load menus.</p>}
      </div>

      <div className="col-span-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {!isLoading && !active && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500 mb-3">No menus yet. Create the primary navigation to get started.</p>
            <button onClick={() => ensureLocation("MAIN_NAV")}
              className="px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg">Create Main Menu</button>
          </div>
        )}
        {active && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-slate-800">{active.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{active.location}</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label"
                className="flex-1 text-sm border border-[var(--color-border)] rounded-lg px-3 py-2" />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="/url"
                className="flex-1 text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 font-mono" />
              <button onClick={addItem} disabled={!newLabel.trim() || createItem.isPending}
                className="px-3 py-2 text-sm bg-[#1B75BC] text-white rounded-lg disabled:opacity-50 flex items-center gap-1">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {active.items.map((item, idx) => (
                <div key={item.id} className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--color-surface)]">
                    <GripVertical size={14} className="text-slate-300" />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-xs text-slate-400 font-mono">{item.url}</span>
                      {item.children.length > 0 && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{item.children.length} sub</span>
                      )}
                    </div>
                    <button onClick={() => moveItem(item, -1)} disabled={idx === 0} className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"><ChevronUp size={12} /></button>
                    <button onClick={() => moveItem(item, 1)} disabled={idx === active.items.length - 1} className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"><ChevronDown size={12} /></button>
                    <button onClick={() => { if (confirm("Delete menu item?")) deleteItem.mutate({ menuId: active.id, itemId: item.id }); }}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                  {item.children.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50 px-2 py-2 space-y-1.5">
                      {item.children.map(child => (
                        <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border border-slate-100 rounded-lg ml-4">
                          <ChevronRight size={11} className="text-slate-300" />
                          <span className="text-sm text-slate-600">{child.label}</span>
                          <span className="text-xs text-slate-400 font-mono">{child.url}</span>
                          <button onClick={() => deleteItem.mutate({ menuId: active.id, itemId: child.id })}
                            className="ml-auto p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><X size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {active.items.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No items yet. Add a link above.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SLIDERS ──────────────────────────────────────────────────────────────────
const SLIDE_COLORS = ["#1B75BC","#0E7C66","#2563EB","#7C3AED"];

function SlidersView() {
  const { data, isLoading, isError } = useBanners({ type: "HERO", pageSize: 50 });
  const create = useCreateBanner();
  const update = useUpdateBanner();
  const del = useDeleteBanner();
  const slides = data?.data ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", position: "", linkUrl: "", image: "" });

  const openEdit = (b: BannerDto) => {
    setEditing(b.id);
    setDraft({ title: b.title, position: b.position, linkUrl: b.linkUrl ?? "", image: b.image ?? "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await update.mutateAsync({
      id: editing,
      title: draft.title.trim(),
      position: draft.position.trim() || "Homepage Hero",
      linkUrl: draft.linkUrl.trim() || undefined,
      image: draft.image.trim() || undefined,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Toolbar onNew={() => create.mutate({ title: "New Hero Slide", position: "Homepage Hero", type: "HERO", active: true })} newLabel="Add Slide" />
      {isError && <p className="text-sm text-red-500">Could not load sliders.</p>}
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      <div className="grid grid-cols-2 gap-4">
        {slides.map((slide, idx) => (
          <div key={slide.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="relative h-32 flex items-center justify-center overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${SLIDE_COLORS[idx % 4]} 0%, ${SLIDE_COLORS[(idx+1) % 4]} 100%)` }}>
              <div className="text-center text-white z-10 px-4">
                <p className="text-lg font-bold">{slide.title}</p>
                <p className="text-sm opacity-75">{slide.position}</p>
              </div>
              <div className="absolute top-2 right-2">
                <button onClick={() => update.mutate({ id: slide.id, active: !slide.active })}
                  className={cn("w-8 h-4 rounded-full transition-colors flex items-center",
                    slide.active ? "bg-emerald-500 justify-end" : "bg-white/30 justify-start")}>
                  <div className="w-3.5 h-3.5 bg-white rounded-full mx-0.5 shadow" />
                </button>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className={cn("text-xs font-medium", slide.active ? "text-emerald-600" : "text-slate-400")}>
                {slide.active ? "Active" : "Hidden"}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(slide)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={13} /></button>
                <button onClick={() => { if (confirm("Delete this slide?")) del.mutate(slide.id); }}
                  className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
            {editing === slide.id && (
              <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50">
                <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5" placeholder="Title" />
                <input value={draft.position} onChange={e => setDraft(d => ({ ...d, position: e.target.value }))} className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5" placeholder="Subtitle / position" />
                <input value={draft.linkUrl} onChange={e => setDraft(d => ({ ...d, linkUrl: e.target.value }))} className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5" placeholder="Link URL" />
                <input value={draft.image} onChange={e => setDraft(d => ({ ...d, image: e.target.value }))} className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5" placeholder="Image URL" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg">Save</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg text-slate-500">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!isLoading && slides.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No hero slides yet.</p>
      )}
    </div>
  );
}

// ─── BANNERS ──────────────────────────────────────────────────────────────────
function BannersView() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useBanners({ q: search || undefined, pageSize: 100 });
  const create = useCreateBanner();
  const update = useUpdateBanner();
  const del = useDeleteBanner();
  const banners = data?.data ?? [];

  const typeColor = (t: string) =>
    t === "HERO" ? "#1B75BC" : t === "PROMO" ? "#F15A24" : t === "CTA" ? "#0E7C66" : "#64748B";

  return (
    <div className="space-y-4">
      <Toolbar
        onNew={() => create.mutate({ title: "New Banner", position: "Homepage Top", type: "PROMO", active: true })}
        newLabel="New Banner"
        onSearch={setSearch}
      />
      {isError && <p className="text-sm text-red-500">Could not load banners.</p>}
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      <div className="space-y-3">
        {banners.map(b => (
          <div key={b.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-4">
            <div className="w-24 h-14 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: typeColor(b.type) }}>
              {b.type}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                <StatusChip status={b.active ? "active" : "inactive"} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Layout size={10} /> {b.position}</span>
                {b.expiresAt && <span className="flex items-center gap-1"><Clock size={10} /> Expires {b.expiresAt}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => update.mutate({ id: b.id, active: !b.active })}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors",
                  b.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "border-[var(--color-border)] text-slate-500 hover:bg-slate-50")}>
                {b.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                {b.active ? "Active" : "Inactive"}
              </button>
              <button onClick={() => { if (confirm("Delete this banner?")) del.mutate(b.id); }}
                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {!isLoading && banners.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No banners yet.</p>
      )}
    </div>
  );
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
function HeroEditView() {
  const { data } = useCmsHeroes();
  const heroes = data?.data ?? [];
  const update = useUpdateHero();
  const onImg = (id: string, file: File) => {
    if (file.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB"); return; }
    const r = new FileReader();
    r.onload = () => update.mutate({ id, backgroundImage: String(r.result) });
    r.readAsDataURL(file);
  };
  const fld = (label: string, val: string, on: (v: string) => void) => (
    <label className="block" key={label}>
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <input className="mt-1 w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2" defaultValue={val} onBlur={e => { if (e.target.value !== val) on(e.target.value); }} />
    </label>
  );
  return (
    <div className="space-y-6">
      {heroes.map(h => (
        <div key={h.id} className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">{h.key}</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-500"><input type="checkbox" checked={h.visible} onChange={e => update.mutate({ id: h.id, visible: e.target.checked })} /> Visible on site</label>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-44 h-24 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center text-xs text-slate-400">
              {h.backgroundImage ? <img src={h.backgroundImage} alt="Hero background" className="w-full h-full object-cover" /> : "No image"}
            </div>
            <label className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Image size={13} /> Upload Background
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onImg(h.id, f); e.target.value = ""; }} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fld("Title (Bangla)", h.titleBn ?? "", v => update.mutate({ id: h.id, titleBn: v }))}
            {fld("Title (English)", h.title, v => update.mutate({ id: h.id, title: v }))}
            {fld("Highlight word (Bangla)", h.highlightBn ?? "", v => update.mutate({ id: h.id, highlightBn: v }))}
            {fld("Highlight word (English)", h.highlight ?? "", v => update.mutate({ id: h.id, highlight: v }))}
            {fld("Subtitle (Bangla)", h.subtitleBn ?? "", v => update.mutate({ id: h.id, subtitleBn: v }))}
            {fld("Subtitle (English)", h.subtitle ?? "", v => update.mutate({ id: h.id, subtitle: v }))}
            {fld("Primary button (Bangla)", h.primaryLabelBn ?? "", v => update.mutate({ id: h.id, primaryLabelBn: v }))}
            {fld("Primary button link", h.primaryUrl ?? "", v => update.mutate({ id: h.id, primaryUrl: v }))}
            {fld("Secondary button (Bangla)", h.secondaryLabelBn ?? "", v => update.mutate({ id: h.id, secondaryLabelBn: v }))}
            {fld("Secondary button link", h.secondaryUrl ?? "", v => update.mutate({ id: h.id, secondaryUrl: v }))}
          </div>
        </div>
      ))}
      {heroes.length === 0 && <p className="text-sm text-slate-400">No hero configured.</p>}
    </div>
  );
}

function HomeSectionsView() {
  const { data } = useCmsHomeSections();
  const sections = data?.data ?? [];
  const update = useUpdateHomeSection();
  const [editJson, setEditJson] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");
  const saveJson = (id: string) => {
    try {
      const parsed = jsonText.trim() ? JSON.parse(jsonText) : null;
      update.mutate({ id, config: parsed }, { onSuccess: () => setEditJson(null) });
    } catch { toast.error("Invalid JSON — check your brackets/quotes."); }
  };
  return (
    <div className="space-y-2">
      {sections.map(s => (
        <div key={s.id} className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-28 shrink-0">{s.key}</span>
            <input className="flex-1 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.titleBn ?? s.title ?? ""} placeholder="Section title" onBlur={e => { const v = e.target.value; if (v !== (s.titleBn ?? s.title ?? "")) update.mutate({ id: s.id, titleBn: v, title: v }); }} />
            <label className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <input type="checkbox" checked={s.visible} onChange={e => update.mutate({ id: s.id, visible: e.target.checked })} /> Visible
            </label>
            <input type="number" className="w-16 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.sortOrder} onBlur={e => { if (Number(e.target.value) !== s.sortOrder) update.mutate({ id: s.id, sortOrder: Number(e.target.value) }); }} title="Order" />
            <button onClick={() => { setEditJson(editJson === s.id ? null : s.id); setJsonText(JSON.stringify(s.config ?? {}, null, 2)); }} className="text-xs px-2.5 py-1.5 border border-[var(--color-border)] rounded-lg text-slate-600 hover:bg-slate-50 shrink-0 cursor-pointer">{editJson === s.id ? "Close" : "Content (JSON)"}</button>
          </div>
          {editJson === s.id && (
            <div className="mt-3">
              <p className="text-[11px] text-slate-400 mb-1">Section content (e.g. the sunnah / prohibitions lists). Edit the JSON, then Save.</p>
              <textarea className="w-full h-48 text-xs font-mono border border-[var(--color-border)] rounded-lg p-2" value={jsonText} onChange={e => setJsonText(e.target.value)} />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setEditJson(null)} className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg text-slate-500 cursor-pointer">Cancel</button>
                <button onClick={() => saveJson(s.id)} className="px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg cursor-pointer">Save Content</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {sections.length === 0 && <p className="text-sm text-slate-400">No sections configured.</p>}
    </div>
  );
}

function HomeServicesView() {
  const { data } = useCmsHomeServices();
  const items = data?.data ?? [];
  const create = useCreateHomeService();
  const update = useUpdateHomeService();
  const del = useDeleteHomeService();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: "", buttonUrl: "", icon: "", shortDesc: "" });
  const inp = "text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Service Icons</h3>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]"><Plus size={13} /> Add Service</button>
      </div>
      {adding && (
        <div className="p-3 bg-[var(--color-surface)] border border-[#1B75BC]/30 rounded-xl grid grid-cols-2 gap-2">
          <input className={inp} placeholder="Title (e.g. Hajj Package)" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} autoFocus />
          <input className={inp} placeholder="Link (e.g. /hajj)" value={f.buttonUrl} onChange={e => setF({ ...f, buttonUrl: e.target.value })} />
          <input className={inp} placeholder="Icon key (optional)" value={f.icon} onChange={e => setF({ ...f, icon: e.target.value })} />
          <input className={inp} placeholder="Short description (optional)" value={f.shortDesc} onChange={e => setF({ ...f, shortDesc: e.target.value })} />
          <div className="col-span-2 flex gap-2">
            <button onClick={() => { if (f.title.trim() && f.buttonUrl.trim()) create.mutate({ title: f.title.trim(), buttonUrl: f.buttonUrl.trim(), icon: f.icon || undefined, shortDesc: f.shortDesc || undefined }, { onSuccess: () => { setAdding(false); setF({ title: "", buttonUrl: "", icon: "", shortDesc: "" }); } }); }} className="px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg">Add</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg text-slate-500">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <input className="w-48 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.title} onBlur={e => { if (e.target.value.trim() && e.target.value !== s.title) update.mutate({ id: s.id, title: e.target.value.trim() }); }} />
            <input className="w-40 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.buttonUrl} onBlur={e => { if (e.target.value.trim() && e.target.value !== s.buttonUrl) update.mutate({ id: s.id, buttonUrl: e.target.value.trim() }); }} />
            <input className="flex-1 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.shortDesc ?? ""} placeholder="short description" onBlur={e => { if (e.target.value !== (s.shortDesc ?? "")) update.mutate({ id: s.id, shortDesc: e.target.value }); }} />
            <button onClick={() => { if (window.confirm(`Delete "${s.title}"?`)) del.mutate(s.id); }} className="p-1.5 rounded text-[#DC2626] hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No services yet.</p>}
      </div>
    </div>
  );
}

function StatisticsView() {
  const { data } = useCmsStatistics();
  const stats = data?.data ?? [];
  const create = useCreateStatistic();
  const update = useUpdateStatistic();
  const del = useDeleteStatistic();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: "", value: "", suffix: "+" });
  const inp = "text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Homepage Counters</h3>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F]"><Plus size={13} /> Add Stat</button>
      </div>
      {adding && (
        <div className="p-3 bg-[var(--color-surface)] border border-[#1B75BC]/30 rounded-xl grid grid-cols-3 gap-2">
          <input className={inp} placeholder="Label (e.g. Happy Pilgrims)" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} autoFocus />
          <input className={inp} type="number" placeholder="Value (e.g. 100000)" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} />
          <input className={inp} placeholder="Suffix (+, K+, %)" value={f.suffix} onChange={e => setF({ ...f, suffix: e.target.value })} />
          <div className="col-span-3 flex gap-2">
            <button onClick={() => { if (f.title.trim() && f.value !== "") create.mutate({ title: f.title.trim(), value: Number(f.value), suffix: f.suffix || undefined }, { onSuccess: () => { setAdding(false); setF({ title: "", value: "", suffix: "+" }); } }); }} className="px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg">Add</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg text-slate-500">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {stats.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <input className="w-44 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.title} onBlur={e => { if (e.target.value.trim() && e.target.value !== s.title) update.mutate({ id: s.id, title: e.target.value.trim() }); }} />
            <input className="w-28 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" type="number" defaultValue={s.value} onBlur={e => { if (Number(e.target.value) !== s.value) update.mutate({ id: s.id, value: Number(e.target.value) }); }} />
            <input className="w-20 text-sm border border-[var(--color-border)] rounded-lg px-2 py-1.5" defaultValue={s.suffix ?? ""} onBlur={e => { if (e.target.value !== (s.suffix ?? "")) update.mutate({ id: s.id, suffix: e.target.value }); }} />
            <span className="text-xs text-slate-400 flex-1">→ <b>{s.value.toLocaleString()}{s.suffix ?? ""}</b></span>
            <button onClick={() => { if (window.confirm(`Delete "${s.title}"?`)) del.mutate(s.id); }} className="p-1.5 rounded text-[#DC2626] hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
        {stats.length === 0 && <p className="text-sm text-slate-400">No stats yet — Add Stat to show counters on the homepage.</p>}
      </div>
    </div>
  );
}

function CategoriesView() {
  const { data } = useCategories();
  const cats = data?.data ?? [];
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
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
          <div className="mb-3 p-3 bg-[var(--color-surface)] border border-[#1B75BC]/30 rounded-xl space-y-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Category name…" autoFocus
              className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => { if (newName.trim()) createCat.mutate({ name: newName.trim() }, { onSuccess: () => { setAdding(false); setNewName(""); } }); else { setAdding(false); setNewName(""); } }}
                className="px-3 py-1.5 text-sm bg-[#1B75BC] text-white rounded-lg">Add</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg text-slate-500">Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {cats.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] group">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color ?? "#64748B" }} />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                <p className="text-xs text-slate-400 font-mono">/{cat.slug}</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{cat.postCount} posts</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => { const n = window.prompt("Rename category", cat.name); if (n?.trim()) updateCat.mutate({ id: cat.id, name: n.trim() }); }} title="Rename"
                  className="p-1.5 rounded text-[#6B7280] hover:bg-slate-100 cursor-pointer"><Edit2 size={12} /></button>
                <button onClick={() => { if (window.confirm(`Delete category "${cat.name}"?`)) deleteCat.mutate(cat.id); }} title="Delete"
                  className="p-1.5 rounded text-[#DC2626] hover:bg-red-50 cursor-pointer"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
        <div className="space-y-3">
          {cats.map(cat => (
            <div key={cat.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (cat.color ?? "#64748B") + "20" }}>
                <Tag size={14} style={{ color: cat.color ?? "#64748B" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (cat.postCount / 14) * 100)}%`, background: cat.color ?? "#64748B" }} />
                  </div>
                  <span className="text-xs text-slate-500">{cat.postCount}</span>
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
function TestimonialFormDrawer({ open, onClose, item }: { open: boolean; onClose: () => void; item?: TestimonialDto | null }) {
  const create = useCreateTestimonial();
  const update = useUpdateTestimonial();
  const editing = !!item;
  const [name, setName] = useState(item?.name ?? "");
  const [text, setText] = useState(item?.text ?? "");
  const [rating, setRating] = useState(item?.rating ?? 5);
  const [approved, setApproved] = useState(item?.approved ?? false);

  useEffect(() => {
    setName(item?.name ?? "");
    setText(item?.text ?? "");
    setRating(item?.rating ?? 5);
    setApproved(item?.approved ?? false);
  }, [item, open]);

  const submit = async () => {
    const payload = { name: name.trim(), text: text.trim(), rating, approved };
    if (editing && item) await update.mutateAsync({ id: item.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  const busy = create.isPending || update.isPending;

  return (
    <Drawer open={open} onClose={onClose}
      title={editing ? "Edit Testimonial" : "New Testimonial"}
      subtitle="Customer review shown on the website"
      footer={<>
        <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={busy || !name.trim() || !text.trim()}>Save</PrimaryBtn>
      </>}>
      <div className="space-y-4">
        <Field label="Name" required>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Customer name" />
        </Field>
        <Field label="Review" required>
          <textarea className={inputCls} rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="What they said…" />
        </Field>
        <Field label="Rating">
          <select className={selectCls} value={rating} onChange={e => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="rounded" />
          Approved — show on website
        </label>
      </div>
    </Drawer>
  );
}

function TestimonialsView() {
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; item?: TestimonialDto | null }>({ open: false });
  const { data, isLoading, isError } = useTestimonials({ q: search || undefined, pageSize: 50 });
  const del = useDeleteTestimonial();
  const update = useUpdateTestimonial();
  const items = data?.data ?? [];

  return (
    <div>
      <Toolbar onNew={() => setDrawer({ open: true, item: null })} newLabel="Add Testimonial" onSearch={setSearch} />
      {isError && <p className="text-sm text-red-500 mb-3">Could not load testimonials.</p>}
      {isLoading && <p className="text-sm text-slate-400 mb-3">Loading…</p>}
      <div className="grid grid-cols-2 gap-4">
        {items.map(t => (
          <div key={t.id} className={cn("bg-[var(--color-surface)] rounded-xl border p-4", t.approved ? "border-[var(--color-border)]" : "border-amber-200 bg-amber-50/30")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#1B75BC] flex items-center justify-center text-white text-sm font-bold">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  {t.location && <p className="text-xs text-slate-400">{t.location}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!t.approved && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                )}
                <ActionMenu
                  onEdit={() => setDrawer({ open: true, item: t })}
                  onDelete={() => { if (confirm("Delete this testimonial?")) del.mutate(t.id); }}
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
              <button onClick={() => update.mutate({ id: t.id, approved: true })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Check size={11} /> Approve & Publish
              </button>
            )}
          </div>
        ))}
      </div>
      {!isLoading && items.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No testimonials yet.</p>
      )}
      <TestimonialFormDrawer open={drawer.open} item={drawer.item} onClose={() => setDrawer({ open: false })} />
    </div>
  );
}

// ─── FAQs ────────────────────────────────────────────────────────────────────
function FaqFormDrawer({ open, onClose, item }: { open: boolean; onClose: () => void; item?: FaqDto | null }) {
  const create = useCreateFaq();
  const update = useUpdateFaq();
  const editing = !!item;
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const [published, setPublished] = useState(item?.published ?? true);

  useEffect(() => {
    setQuestion(item?.question ?? "");
    setAnswer(item?.answer ?? "");
    setPublished(item?.published ?? true);
  }, [item, open]);

  const submit = async () => {
    const payload = { question: question.trim(), answer: answer.trim(), published };
    if (editing && item) await update.mutateAsync({ id: item.id, ...payload });
    else await create.mutateAsync(payload);
    onClose();
  };

  const busy = create.isPending || update.isPending;

  return (
    <Drawer open={open} onClose={onClose}
      title={editing ? "Edit FAQ" : "New FAQ"}
      subtitle="Question & answer shown on the website"
      footer={<>
        <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={busy || !question.trim() || !answer.trim()}>Save</PrimaryBtn>
      </>}>
      <div className="space-y-4">
        <Field label="Question" required>
          <input className={inputCls} value={question} onChange={e => setQuestion(e.target.value)} placeholder="What do customers ask?" />
        </Field>
        <Field label="Answer" required>
          <textarea className={inputCls} rows={5} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Clear, helpful answer…" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="rounded" />
          Published — visible on website
        </label>
      </div>
    </Drawer>
  );
}

function FaqsView() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<{ open: boolean; item?: FaqDto | null }>({ open: false });
  const { data, isLoading, isError } = useFaqs({ q: search || undefined, pageSize: 100 });
  const del = useDeleteFaq();
  const update = useUpdateFaq();
  const faqs = data?.data ?? [];

  return (
    <div>
      <Toolbar onNew={() => setDrawer({ open: true, item: null })} newLabel="Add FAQ" onSearch={setSearch} />
      {isError && <p className="text-sm text-red-500 mb-3">Could not load FAQs.</p>}
      {isLoading && <p className="text-sm text-slate-400 mb-3">Loading…</p>}
      <div className="space-y-2">
        {faqs.map((faq, idx) => (
          <div key={faq.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}>
              <span className="text-xs font-mono text-slate-400 w-5">#{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{faq.question}</p>
                {faq.category && <span className="text-xs text-slate-400">{faq.category}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); update.mutate({ id: faq.id, published: !faq.published }); }}
                  className={cn("text-xs px-2 py-0.5 rounded-full border",
                    faq.published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-[var(--color-border)]")}>
                  {faq.published ? "Published" : "Draft"}
                </button>
                <button onClick={e => { e.stopPropagation(); setDrawer({ open: true, item: faq }); }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={12} /></button>
                <button onClick={e => { e.stopPropagation(); if (confirm("Delete this FAQ?")) del.mutate(faq.id); }}
                  className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                <ChevronRight size={14} className={cn("text-slate-300 transition-transform", expanded === faq.id && "rotate-90")} />
              </div>
            </div>
            {expanded === faq.id && (
              <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {!isLoading && faqs.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No FAQs yet.</p>
      )}
      <FaqFormDrawer open={drawer.open} item={drawer.item} onClose={() => setDrawer({ open: false })} />
    </div>
  );
}

// ─── MEDIA LIBRARY ────────────────────────────────────────────────────────────
function formatBytes(n: number | null) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const MEDIA_COLORS = ["#1B75BC","#0E7C66","#F15A24","#2563EB","#7C3AED","#EF4444","#F59E0B","#06B6D4"];

function MediaView() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [filePath, setFilePath] = useState("");
  const { data, isLoading, isError } = useMediaAssets({ q: search || undefined, pageSize: 100 });
  const create = useCreateMediaAsset();
  const del = useDeleteMediaAsset();
  const files = data?.data ?? [];

  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const addAsset = async () => {
    if (!name.trim() || !filePath.trim()) return;
    const lower = filePath.toLowerCase();
    const type = lower.endsWith(".pdf") ? "PDF" as const : lower.match(/\.(doc|docx)$/) ? "DOC" as const : "IMAGE" as const;
    await create.mutateAsync({ name: name.trim(), filePath: filePath.trim(), type });
    setName("");
    setFilePath("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
              className="pl-8 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none w-52" />
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md", view === "grid" ? "bg-[var(--color-surface)] shadow text-slate-700" : "text-slate-400")}><Layout size={14} /></button>
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md", view === "list" ? "bg-[var(--color-surface)] shadow text-slate-700" : "text-slate-400")}><List size={14} /></button>
          </div>
          {selected.length > 0 && <span className="text-sm text-slate-500">{selected.length} selected</span>}
        </div>
        {selected.length > 0 && (
          <button onClick={() => { if (confirm(`Delete ${selected.length} file(s)?`)) { selected.forEach(id => del.mutate(id)); setSelected([]); } }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
            <Trash2 size={13} /> Delete ({selected.length})
          </button>
        )}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-slate-500 mb-1 block">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="hajj-hero.jpg"
            className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2" />
        </div>
        <div className="flex-[2] min-w-[220px]">
          <label className="text-xs text-slate-500 mb-1 block">File path / URL</label>
          <input value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="/uploads/… or https://…"
            className="w-full text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 font-mono" />
        </div>
        <button onClick={addAsset} disabled={!name.trim() || !filePath.trim() || create.isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50">
          <Upload size={13} /> Add Media
        </button>
      </div>

      {isError && <p className="text-sm text-red-500">Could not load media.</p>}
      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}

      {view === "grid" ? (
        <div className="grid grid-cols-4 gap-3">
          {files.map((file, i) => {
            const color = MEDIA_COLORS[i % MEDIA_COLORS.length];
            return (
              <div key={file.id} onClick={() => toggle(file.id)}
                className={cn("relative rounded-xl overflow-hidden border-2 cursor-pointer group transition-all",
                  selected.includes(file.id) ? "border-[#1B75BC] shadow-lg shadow-[#1B75BC]/20" : "border-transparent hover:border-[var(--color-border)]")}>
                <div className="h-28 flex items-center justify-center relative" style={{ background: color + "20" }}>
                  {file.type === "IMAGE" ? (
                    <Image size={24} style={{ color }} className="opacity-60" />
                  ) : (
                    <div className="text-center">
                      <FileText size={24} style={{ color }} className="mx-auto" />
                      <span className="text-xs font-bold uppercase mt-1 block" style={{ color }}>{file.type}</span>
                    </div>
                  )}
                  {selected.includes(file.id) && (
                    <div className="absolute inset-0 bg-[#1B75BC]/10 flex items-center justify-center">
                      <div className="w-6 h-6 bg-[#1B75BC] rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></div>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-[var(--color-surface)] border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-400">{formatBytes(file.sizeBytes)}</span>
                    {file.dimensions && <span className="text-xs text-slate-400">{file.dimensions}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full min-w-[680px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["","File","Type","Size","Dimensions","Uploaded",""].map((h,i) => (
                  <th key={i} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => {
                const color = MEDIA_COLORS[i % MEDIA_COLORS.length];
                return (
                  <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.includes(file.id)} onChange={() => toggle(file.id)} className="rounded border-slate-300" />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
                          {file.type === "IMAGE" ? <Image size={14} style={{ color }} /> : <FileText size={14} style={{ color }} />}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 uppercase">{file.type}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600 font-mono">{formatBytes(file.sizeBytes)}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-400">{file.dimensions ?? "—"}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-400">{file.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => { if (confirm("Delete this file?")) del.mutate(file.id); }}
                        className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!isLoading && files.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No media assets yet.</p>
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
        { label: "Site Title",       type: "text",     default: "SM Travels International" },
        { label: "Tagline",          type: "text",     default: "Your Trusted Travel Partner" },
        { label: "Site URL",         type: "url",      default: "https://smtravelsinternational.com" },
        { label: "Admin Email",      type: "email",    default: "admin@smtravelsinternational.com" },
        { label: "Phone",            type: "text",     default: "+880 31 123 4567" },
        { label: "Address",          type: "textarea", default: "144/A CDA Commercial Area, Agrabad, Chattogram" },
      ],
    },
    {
      title: "SEO & Analytics",
      icon: BarChart2,
      fields: [
        { label: "Default Meta Title",    type: "text",     default: "SM Travels International | Hajj, Umrah & Tour" },
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
        { label: "Copyright Text",    type: "text",   default: "© 2024 SM Travels International. All rights reserved." },
        { label: "Footer Description",type: "textarea",default: "SM Travels International is a leading Hajj, Umrah & travel agency in Bangladesh." },
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
        <button disabled title="Saving website settings is not available in this build (configured on the server)"
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed">
          <Save size={13} /> Save All Changes
        </button>
      </div>

      {/* Toggle settings */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
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
        <div key={group.title} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
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
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20 resize-none" />
                ) : (
                  <input type={f.type} defaultValue={f.default}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20" />
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
          <button disabled title="Clear Cache is not available in this build"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg text-[#9CA3AF] opacity-60 cursor-not-allowed">
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
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"page" | "blog">("page");

  const isEditor = view === "page-editor" || view === "blog-editor";

  const openPageEditor = (id: string | null) => {
    setEditType("page");
    setEditPostId(id);
    setEditTarget("");
    setView("page-editor");
  };

  const openBlogEditor = (id: string | null) => {
    setEditType("blog");
    setEditPostId(id);
    setEditTarget("");
    setView("blog-editor");
  };

  return (
    <div className="flex h-full min-h-screen bg-[#F0F2F5]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
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
          <button onClick={() => window.open("/", "_blank")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1B75BC] border border-[#1B75BC]/30 rounded-lg hover:bg-[#1B75BC]/5">
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
            postId={editPostId}
            onBack={() => setView(editType === "page" ? "pages" : "blog")}
          />
        ) : (
          <div className="p-6 flex-1">
            {view === "pages" && (
              <>
                <SectionHeader title="Pages" subtitle="Manage static pages on your website" />
                <PagesView onEdit={openPageEditor} />
              </>
            )}
            {view === "blog" && (
              <>
                <SectionHeader title="Blog" subtitle="Write and manage blog posts" />
                <BlogView onEdit={openBlogEditor} />
              </>
            )}
            {view === "categories" && (
              <>
                <SectionHeader title="Categories" subtitle="Organise blog content into categories" />
                <CategoriesView />
              </>
            )}
            {view === "statistics" && (
              <>
                <SectionHeader title="Homepage Statistics" subtitle="The counters (100K+ / 12+ / …) shown on the website" />
                <StatisticsView />
              </>
            )}
            {view === "home-services" && (
              <>
                <SectionHeader title="Homepage Services" subtitle="The service icons row on the homepage" />
                <HomeServicesView />
              </>
            )}
            {view === "home-sections" && (
              <>
                <SectionHeader title="Homepage Sections" subtitle="Show/hide, reorder and edit each homepage section (incl. Sunnah & Prohibitions)" />
                <HomeSectionsView />
              </>
            )}
            {view === "hero" && (
              <>
                <SectionHeader title="Homepage Hero" subtitle="The main banner (title, buttons, background image) on the homepage" />
                <HeroEditView />
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
                <SectionHeader title="FAQs" subtitle="Frequently asked questions" />
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
