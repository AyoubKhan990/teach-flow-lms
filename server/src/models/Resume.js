import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    templateId: { type: String, default: "modern" },
    status: { type: String, enum: ["draft", "completed"], default: "draft" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("Resume", resumeSchema);

