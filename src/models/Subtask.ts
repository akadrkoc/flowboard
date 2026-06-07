import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ISubtask extends Document {
  cardId: Types.ObjectId;
  title: string;
  completed: boolean;
  order: number;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Subtask =
  mongoose.models.Subtask ?? mongoose.model<ISubtask>("Subtask", SubtaskSchema);
