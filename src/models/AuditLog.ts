import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IAuditLog extends Document {
  boardId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    details: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

AuditLogSchema.index({ boardId: 1, createdAt: -1 });

export const AuditLog =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
