import Session from "../models/Session.js";

// Define deductions for each event type
const DEDUCTIONS = {
  FOCUS_LOST: 2,
  NO_FACE: 5,
  MULTIPLE_FACES: 10,
  OBJECT_DETECTED: 10,
  SPEECH_DETECTED: 0,
  
};

export const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on("join_session", (sessionId) => {
      socket.join(sessionId);
      console.log(`Client ${socket.id} joined session room: ${sessionId}`);
    });

    socket.on("log_event", async (data) => {
      try {
        const { sessionId, event } = data;

        
        const session = await Session.findByIdAndUpdate(
          sessionId,
          {
            $push: { events: event },
            // Deduct points from the integrity score
            $inc: { integrityScore: -DEDUCTIONS[event.type] || 0 },
          },
          { new: true } // Return the updated document
        );

        if (session) {
          
          io.to(sessionId).emit("event_logged", event);
          console.log(`Event logged for session ${sessionId}:`, event.type);
        }
      } catch (error) {
        console.error("Error logging event:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
