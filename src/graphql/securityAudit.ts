import { AuditLog } from "@/models/AuditLog";

export const AUDIT_ACTIONS = {
  MEMBER_INVITED: "member.invited",
  MEMBER_REMOVED: "member.removed",
  COLUMN_ADDED: "column.added",
  COLUMN_RENAMED: "column.renamed",
  COLUMN_DELETED: "column.deleted",
  SPRINT_CREATED: "sprint.created",
  SPRINT_COMPLETED: "sprint.completed",
} as const;

interface LogSecurityEventParams {
  boardId: string;
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
}

/** Persist a board-level security audit entry; failures are logged but never block mutations. */
export async function logSecurityEvent(
  params: LogSecurityEventParams
): Promise<void> {
  try {
    await AuditLog.create({
      boardId: params.boardId,
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details?.slice(0, 500),
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write security event:", err);
  }
}
