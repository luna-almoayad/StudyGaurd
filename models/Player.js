import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, unique: true, index: true },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);

