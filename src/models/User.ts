import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  provider: "google" | "github" | "credentials";
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    provider: {
      type: String,
      enum: ["google", "github", "credentials"],
      required: true,
    },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
