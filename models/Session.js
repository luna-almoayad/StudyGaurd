import mongoose from "mongoose";

const ParticipantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
  },
  { _id: false }
);

const ResultSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
    points: { type: Number, required: true },
    distractions: { type: Number, required: true },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    sessionName: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    hostProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
    participants: { type: [ParticipantSchema], default: [] },
    results: { type: [ResultSchema], default: [] },
    duration: { type: Number, default: 0 },
    startedAt: { type: Number },
    endedAt: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.Session ||
  mongoose.model("Session", SessionSchema);
