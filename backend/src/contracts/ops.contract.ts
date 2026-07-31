import { z } from "zod";

export const taskListQuerySchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  q: z.string().trim().optional(),
});
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

export const opsTaskCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  category: z.string().trim().max(60).optional(),
  assigneeId: z.string().trim().optional(),
  dueAt: z.string().trim().optional(),
});
export type OpsTaskCreateInput = z.infer<typeof opsTaskCreateSchema>;

export const opsTaskUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
    assigneeId: z.string().trim().nullable().optional(),
    dueAt: z.string().trim().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });
export type OpsTaskUpdateInput = z.infer<typeof opsTaskUpdateSchema>;

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(8000),
  audience: z.string().trim().max(60).optional(),
  pinned: z.boolean().optional(),
  branchId: z.string().trim().optional(),
});
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

export interface OpsTaskDto {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpsAnnouncementDto {
  id: string;
  title: string;
  body: string;
  audience: string | null;
  pinned: boolean;
  branchId: string | null;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface OpsAuditLogDto {
  id: string;
  userId: string | null;
  userName: string | null;
  ip: string | null;
  event: string;
  resource: string | null;
  severity: string;
  detail: string | null;
  createdAt: string;
}
