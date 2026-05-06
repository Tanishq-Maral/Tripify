import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICreatorReport extends Document {
  trip: Types.ObjectId;
  creator: Types.ObjectId;
  reporter: Types.ObjectId;
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const creatorReportSchema = new Schema<ICreatorReport>(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICreatorReport>("CreatorReport", creatorReportSchema);
