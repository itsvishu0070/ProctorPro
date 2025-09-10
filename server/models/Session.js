import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      
      "FOCUS_LOST",
      "NO_FACE",
      "MULTIPLE_FACES",
      "OBJECT_DETECTED",
      "SPEECH_DETECTED",
      
    ],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  message: {
    type: String,
    required: true,
  },
});

const sessionSchema = new mongoose.Schema(
  {
    candidateName: {
      type: String,
      required: [true, "Candidate name is required."],
      trim: true,
    },
    candidateEmail: {
      type: String,
      required: [true, "Candidate email is required."],
      trim: true,
    },
    videoUrl: {
      type: String, // This will be the URL from Cloudinary
      default: null,
    },
    events: [eventSchema], // An array to store all flagged events
    integrityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
