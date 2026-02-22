import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITrip extends Document {
  title: string;
  description?: string;
  destination: string;
  pickupLocation: string;
  budget?: number;
  date?: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    title: { type: String, required: true },
    description: { type: String },
    destination: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    budget: { type: Number },
    date: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

tripSchema.virtual("isCreator").get(function () {
  return this.createdBy && (this.createdBy as any)._id;
});

export default mongoose.model<ITrip>("Trip", tripSchema);