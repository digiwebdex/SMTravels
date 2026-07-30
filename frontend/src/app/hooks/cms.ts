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
  TestimonialDto,
  TestimonialCreateInput,
  TestimonialUpdateInput,
  TestimonialListResponse,
} from "@contracts/cms.contract";

const err = (e: Error) => toast.error(e.message || "Something went wrong");

export const cmsKeys = {
  blog: (p: unknown) => ["cms", "blog", p] as const,
  blogPost: (id: string) => ["cms", "blog", id] as const,
  faqs: (p: unknown) => ["cms", "faqs", p] as const,
  testimonials: (p: unknown) => ["cms", "testimonials", p] as const,
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

export type { BlogPostDto, FaqDto, TestimonialDto };
