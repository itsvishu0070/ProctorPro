import express from "express";
import {
  createSession,
  getAllSessions,
  uploadVideoRecording,
  getSessionById,
  downloadReport, 
} from "../controllers/sessionController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Route to get all sessions and create a new session
router.route("/").get(getAllSessions).post(createSession);
router
  .route("/:sessionId/upload")
  .post(upload.single("video"), uploadVideoRecording);
router.route("/:sessionId").get(getSessionById);
router.route("/:sessionId/download").get(downloadReport);


export default router;
