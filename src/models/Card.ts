import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICard extends Document {
  title: string;
  description?: string;
  labels: string[];
  priority: "high" | "med" | "low";
  dueDate?: string;
  storyPoints: number;
  assigneeId?: Types.ObjectId;
  assigneeInitials: string;
  assigneeColor: string;
  columnId: Types.ObjectId;
  boardId: Types.ObjectId;
  order: number;
  completedAt?: Date;
}

const CardSchema = new Schema<ICard>(
  {
    title: { type: String, required: true },
    description: { type: String },
    labels: [{ type: String }],
    priority: {
      type: String,
      enum: ["high", "med", "low"],
      default: "med",
    },
    dueDate: { type: String },
    storyPoints: { type: Number, default: 0 },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
    assigneeInitials: { type: String, default: "" },
    assigneeColor: { type: String, default: "bg-gray-500" },
    columnId: { type: Schema.Types.ObjectId, ref: "Column", required: true },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    order: { type: Number, required: true, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Card =
  mongoose.models.Card ?? mongoose.model<ICard>("Card", CardSchema);
