import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: String, required: true },
    category: { type: String, required: true },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);
