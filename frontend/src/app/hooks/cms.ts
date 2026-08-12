import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import type {
  BlogPostDto,
  BlogPostCreateInput,
  BlogPostUpdateInput,
  BlogPostListResponse,
  FaqDto,
  FaqCreateInput,
  FaqUpdateInput,
  FaqListResponse,
  CategoryDto,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryListResponse,
  StatisticDto,
  StatisticCreateInput,
  StatisticUpdateInput,
  StatisticListResponse,
  TestimonialDto,
  TestimonialCreateInput,
  TestimonialUpdateInput,
  TestimonialListResponse,
  CmsPageDto,
  CmsPageCreateInput,
  CmsPageUpdateInput,
  CmsPageListResponse,
  MenuDto,
  MenuCreateInput,
  MenuUpdateInput,
  MenuItemDto,
  MenuItemCreateInput,
  MenuItemUpdateInput,
  MenuListResponse,
  BannerDto,
  BannerCreateInput,
  BannerUpdateInput,
  BannerListResponse,
  MediaAssetDto,
  MediaAssetCreateInput,
  MediaAssetUpdateInput,
  MediaAssetListResponse,
} from "@contracts/cms.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const cmsKeys = {
  blog: (p: unknown) => ["cms", "blog", p] as const,
  blogPost: (id: string) => ["cms", "blog", id] as const,
  faqs: (p: unknown) => ["cms", "faqs", p] as const,
  testimonials: (p: unknown) => ["cms", "testimonials", p] as const,
  pages: (p: unknown) => ["cms", "pages", p] as const,
  page: (id: string) => ["cms", "pages", id] as const,
  menus: ["cms", "menus"] as const,
  menu: (id: string) => ["cms", "menus", id] as const,
  banners: (p: unknown) => ["cms", "banners", p] as const,
  media: (p: unknown) => ["cms", "media", p] as const,
};

function qs(p: Record<string, string | number | boolean | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== "all") s.set(k, String(v));
  const q = s.toString();
  return q ? `?${q}` : "";
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export function useBlogPosts(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: cmsKeys.blog(params),
    queryFn: () => apiFetch<BlogPostListResponse>(`/cms/blog${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useBlogPost(id: string | null | undefined) {
  return useQuery({
    queryKey: cmsKeys.blogPost(id ?? ""),
    queryFn: () => apiFetch<BlogPostDto>(`/cms/blog/${id}`),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlogPostCreateInput) =>
      apiFetch<BlogPostDto>("/cms/blog", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "blog"] });
      toast.success("Blog post created");
    },
    onError: err,
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: BlogPostUpdateInput & { id: string }) =>
      apiFetch<BlogPostDto>(`/cms/blog/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["cms", "blog"] });
      qc.invalidateQueries({ queryKey: cmsKeys.blogPost(v.id) });
      toast.success("Blog post updated");
    },
    onError: err,
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/blog/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "blog"] });
      toast.success("Blog post deleted");
    },
    onError: err,
  });
}

// ── FAQs ──────────────────────────────────────────────────────────────────────

export function useFaqs(params: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery({
    queryKey: cmsKeys.faqs(params),
    queryFn: () => apiFetch<FaqListResponse>(`/cms/faqs${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FaqCreateInput) =>
      apiFetch<FaqDto>("/cms/faqs", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "faqs"] });
      toast.success("FAQ created");
    },
    onError: err,
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: FaqUpdateInput & { id: string }) =>
      apiFetch<FaqDto>(`/cms/faqs/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "faqs"] });
      toast.success("FAQ updated");
    },
    onError: err,
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/faqs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "faqs"] });
      toast.success("FAQ deleted");
    },
    onError: err,
  });
}

// ── Blog Categories ─────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({ queryKey: ["cms", "categories"], queryFn: () => apiFetch<CategoryListResponse>("/cms/categories") });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryCreateInput) => apiFetch<CategoryDto>("/cms/categories", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", "categories"] }); toast.success("Category created"); },
    onError: err,
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CategoryUpdateInput & { id: string }) => apiFetch<CategoryDto>(`/cms/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", "categories"] }); toast.success("Category updated"); },
    onError: err,
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", "categories"] }); toast.success("Category deleted"); },
    onError: err,
  });
}

// ── Statistics (homepage stats bar) ─────────────────────────────────────────────
export function useCmsStatistics() {
  return useQuery({ queryKey: ["cms", "statistics"], queryFn: () => apiFetch<StatisticListResponse>("/cms/statistics") });
}
export function useCreateStatistic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StatisticCreateInput) => apiFetch<StatisticDto>("/cms/statistics", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", "statistics"] }); toast.success("Stat added"); },
    onError: err,
  });
}
export function useUpdateStatistic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: StatisticUpdateInput & { id: string }) => apiFetch<StatisticDto>(`/cms/statistics/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", "statistics"] }); toast.success("Stat updated"); },
    onError: err,
  });
}
export function useDeleteStatistic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/statistics/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cms", "statistics"] }); toast.success("Stat deleted"); },
    onError: err,
  });
}

// ── Testimonials ──────────────────────────────────────────────────────────────

export function useTestimonials(params: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery({
    queryKey: cmsKeys.testimonials(params),
    queryFn: () => apiFetch<TestimonialListResponse>(`/cms/testimonials${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TestimonialCreateInput) =>
      apiFetch<TestimonialDto>("/cms/testimonials", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "testimonials"] });
      toast.success("Testimonial created");
    },
    onError: err,
  });
}

export function useUpdateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: TestimonialUpdateInput & { id: string }) =>
      apiFetch<TestimonialDto>(`/cms/testimonials/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "testimonials"] });
      toast.success("Testimonial updated");
    },
    onError: err,
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/testimonials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "testimonials"] });
      toast.success("Testimonial deleted");
    },
    onError: err,
  });
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export function useCmsPages(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: cmsKeys.pages(params),
    queryFn: () => apiFetch<CmsPageListResponse>(`/cms/pages${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCmsPage(id: string | null | undefined) {
  return useQuery({
    queryKey: cmsKeys.page(id ?? ""),
    queryFn: () => apiFetch<CmsPageDto>(`/cms/pages/${id}`),
    enabled: !!id,
  });
}

export function useCreateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CmsPageCreateInput) =>
      apiFetch<CmsPageDto>("/cms/pages", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "pages"] });
      toast.success("Page created");
    },
    onError: err,
  });
}

export function useUpdateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CmsPageUpdateInput & { id: string }) =>
      apiFetch<CmsPageDto>(`/cms/pages/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["cms", "pages"] });
      qc.invalidateQueries({ queryKey: cmsKeys.page(v.id) });
      toast.success("Page updated");
    },
    onError: err,
  });
}

export function useDeleteCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "pages"] });
      toast.success("Page deleted");
    },
    onError: err,
  });
}

// ── Menus ─────────────────────────────────────────────────────────────────────

export function useMenus() {
  return useQuery({
    queryKey: cmsKeys.menus,
    queryFn: () => apiFetch<MenuListResponse>("/cms/menus"),
  });
}

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MenuCreateInput) =>
      apiFetch<MenuDto>("/cms/menus", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus });
      toast.success("Menu created");
    },
    onError: err,
  });
}

export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: MenuUpdateInput & { id: string }) =>
      apiFetch<MenuDto>(`/cms/menus/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus });
      toast.success("Menu updated");
    },
    onError: err,
  });
}

export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/menus/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus });
      toast.success("Menu deleted");
    },
    onError: err,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, ...input }: MenuItemCreateInput & { menuId: string }) =>
      apiFetch<MenuItemDto>(`/cms/menus/${menuId}/items`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus });
      toast.success("Menu item added");
    },
    onError: err,
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, itemId, ...input }: MenuItemUpdateInput & { menuId: string; itemId: string }) =>
      apiFetch<MenuItemDto>(`/cms/menus/${menuId}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus });
      toast.success("Menu item updated");
    },
    onError: err,
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, itemId }: { menuId: string; itemId: string }) =>
      apiFetch<void>(`/cms/menus/${menuId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus });
      toast.success("Menu item deleted");
    },
    onError: err,
  });
}

// ── Banners (also used for hero sliders) ──────────────────────────────────────

export function useBanners(params: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery({
    queryKey: cmsKeys.banners(params),
    queryFn: () => apiFetch<BannerListResponse>(`/cms/banners${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BannerCreateInput) =>
      apiFetch<BannerDto>("/cms/banners", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "banners"] });
      toast.success("Banner created");
    },
    onError: err,
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: BannerUpdateInput & { id: string }) =>
      apiFetch<BannerDto>(`/cms/banners/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "banners"] });
      toast.success("Banner updated");
    },
    onError: err,
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/banners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "banners"] });
      toast.success("Banner deleted");
    },
    onError: err,
  });
}

// ── Media ─────────────────────────────────────────────────────────────────────

export function useMediaAssets(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: cmsKeys.media(params),
    queryFn: () => apiFetch<MediaAssetListResponse>(`/cms/media${qs(params)}`),
    placeholderData: (p) => p,
  });
}

export function useCreateMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MediaAssetCreateInput) =>
      apiFetch<MediaAssetDto>("/cms/media", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "media"] });
      toast.success("Media added");
    },
    onError: err,
  });
}

export function useDeleteMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/cms/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", "media"] });
      toast.success("Media deleted");
    },
    onError: err,
  });
}

export type {
  BlogPostDto,
  FaqDto,
  TestimonialDto,
  CmsPageDto,
  MenuDto,
  MenuItemDto,
  BannerDto,
  MediaAssetDto,
};
