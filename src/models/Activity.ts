import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IActivity extends Document {
  cardId: Types.ObjectId;
  type: string;
  actorId?: Types.ObjectId;
  actorName: string;
  actorImage?: string;
  text: string;
}

const ActivitySchema = new Schema<IActivity>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    type: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, required: true },
    actorImage: { type: String },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export const Activity =
  mongoose.models.Activity ?? mongoose.model<IActivity>("Activity", ActivitySchema);
