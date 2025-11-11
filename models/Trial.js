import mongoose from "mongoose";

const trialSchema = new mongoose.Schema({
  person: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ["webkit", "onnx"],
    required: true,
  },
  command: {
    type: String,
    enum: [
      "protan", "tritan", "deu", "disable", "settings", "games", "about",
      "ghost", "night", "yellow", "red", "neon", "classic", "bubble", "three",
      "four", "five", "undo", "unknown"
    ],
    default: "unknown",
  },
  responseTime: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  errorRate: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Trial = mongoose.model("Trial", trialSchema);
export default Trial;
