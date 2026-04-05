import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IComment extends Document {
  text: string;
  cardId: Types.ObjectId;
  authorId?: Types.ObjectId;
  authorName: string;
  authorImage?: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true },
    cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, required: true },
    authorImage: { type: String },
  },
  { timestamps: true }
);

export const Comment =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", CommentSchema);
