import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IBoard extends Document {
  name: string;
  ownerId: Types.ObjectId;
  memberIds: Types.ObjectId[];
  columnIds: Types.ObjectId[];
}

const BoardSchema = new Schema<IBoard>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    columnIds: [{ type: Schema.Types.ObjectId, ref: "Column" }],
  },
  { timestamps: true }
);

export const Board =
  mongoose.models.Board ?? mongoose.model<IBoard>("Board", BoardSchema);
