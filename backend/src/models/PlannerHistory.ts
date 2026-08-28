import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPlannerDay {
  day: number;
  title: string;
  activities: string[];
}

export interface IPlannerPlan {
  title: string;
  summary: string;
  bestTime: string;
  estimatedBudget: string;
  tips: string[];
  itinerary: IPlannerDay[];
}

export interface IPlannerHistory extends Document {
  user: Types.ObjectId;
  prompt: string;
  plan: IPlannerPlan;
  createdAt: Date;
  updatedAt: Date;
}

const plannerDaySchema = new Schema<IPlannerDay>(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    activities: { type: [String], required: true },
  },
  { _id: false }
);

const plannerHistorySchema = new Schema<IPlannerHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: String, required: true, maxlength: 4000 },
    plan: {
      title: { type: String, required: true },
      summary: { type: String, required: true },
      bestTime: { type: String, required: true },
      estimatedBudget: { type: String, required: true },
      tips: { type: [String], required: true },
      itinerary: { type: [plannerDaySchema], required: true },
    },
  },
  { timestamps: true }
);

plannerHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IPlannerHistory>("PlannerHistory", plannerHistorySchema);