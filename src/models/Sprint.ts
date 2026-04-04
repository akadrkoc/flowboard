import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ISprint extends Document {
  name: string;
  boardId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const SprintSchema = new Schema<ISprint>(
  {
    name: { type: String, required: true },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Sprint =
  mongoose.models.Sprint ?? mongoose.model<ISprint>("Sprint", SprintSchema);
