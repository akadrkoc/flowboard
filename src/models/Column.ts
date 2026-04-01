import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IColumn extends Document {
  name: string;
  boardId: Types.ObjectId;
  order: number;
}

const ColumnSchema = new Schema<IColumn>(
  {
    name: { type: String, required: true },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Column =
  mongoose.models.Column ?? mongoose.model<IColumn>("Column", ColumnSchema);
