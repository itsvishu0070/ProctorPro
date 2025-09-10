import Session from "../models/Session.js";
import uploadFromBuffer from "../services/cloudinary.js";
import PDFDocument from "pdfkit";

const createSession = async (req, res) => {
  try {
    const { candidateName, candidateEmail } = req.body;

    if (!candidateName || !candidateEmail) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const newSession = new Session({
      candidateName,
      candidateEmail,
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({}).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const uploadVideoRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded." });
    }

    // Upload the file buffer to Cloudinary
    const result = await uploadFromBuffer(req.file.buffer);

    // Update the session document with the video URL
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { videoUrl: result.secure_url },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    res.status(200).json({
      message: "Video uploaded successfully!",
      videoUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Server error during video upload." });
  }
};
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching session by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const downloadReport = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).send("Session not found");
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set headers to trigger browser download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Report-${session.candidateName.replace(
        /\s/g,
        "_"
      )}.pdf"`
    );

    // Pipe the PDF document directly to the response
    doc.pipe(res);

    
    doc.fontSize(20).text("Proctoring Interview Report", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(16).text("Candidate Summary");
    doc.fontSize(12).text(`Name: ${session.candidateName}`);
    doc.text(`Email: ${session.candidateEmail}`);
    doc.text(`Date: ${new Date(session.createdAt).toLocaleString()}`);
    doc.moveDown();

    doc
      .fontSize(14)
      .fillColor("red")
      .text(`Final Integrity Score: ${session.integrityScore}%`);
    doc.fillColor("black"); 
    doc.moveDown(2);

    doc.fontSize(16).text("Flagged Events Log");
    doc.lineCap("butt").moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    if (session.events.length > 0) {
      session.events.forEach((event) => {
        doc
          .fontSize(10)
          .text(
            `${new Date(event.timestamp).toLocaleTimeString()} - [${
              event.type
            }] - ${event.message}`
          );
        doc.moveDown(0.5);
      });
    } else {
      doc
        .fontSize(10)
        .text("No suspicious events were flagged during this session.");
    }

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).send("Error generating report");
  }
};


export {
  createSession,
  getAllSessions,
  getSessionById,
  uploadVideoRecording,
  downloadReport,
};

