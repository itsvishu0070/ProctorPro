
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSessionById, downloadReportAPI } from "../services/api";
import io from "socket.io-client"; 

const socket = io("http://localhost:5000"); 

const ReportPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // This useEffect fetches the initial session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await getSessionById(sessionId);
        setSession(response.data);
      } catch (err) {
        setError("Failed to fetch session details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  //  This useEffect listens for live updates
  useEffect(() => {
    // Join the specific room for this session
    socket.emit("join_session", sessionId);

    // Listen for new events broadcasted from the server
    const handleNewEvent = (newEvent) => {
      console.log("New event received:", newEvent);
      // Update the session state to include the new event
      setSession((prevSession) => ({
        ...prevSession,
        events: [...prevSession.events, newEvent],
        // Optionally, update the score live too
        integrityScore: prevSession.integrityScore - (newEvent.deduction || 2), // A default deduction
      }));
    };

    socket.on("event_logged", handleNewEvent);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off("event_logged", handleNewEvent);
    };
  }, [sessionId]);

  const handleDownload = async () => {
    
    setIsDownloading(true);
    try {
      const response = await downloadReportAPI(sessionId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `Report-${session.candidateName.replace(
        /\s/g,
        "_"
      )}.pdf`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report", err);
      setError("Could not download the report.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <p>Loading report...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!session) return <p>Session not found.</p>;

  return (
    <div className="report-page">
      <div className="report-header">
        <h1>Interview Report for {session.candidateName}</h1>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="download-btn"
        >
          {isDownloading ? "Downloading..." : "Download Report (PDF)"}
        </button>
      </div>
      <div className="report-summary">
        <p>
          <strong>Email:</strong> {session.candidateEmail}
        </p>
        <p>
          <strong>Final Integrity Score:</strong>{" "}
          <span className="score">{session.integrityScore}%</span>
        </p>
        <p>
          <strong>Interview Date:</strong>{" "}
          {new Date(session.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="report-details">
        <div className="video-section">
          <h2>Recorded Session</h2>
          {session.videoUrl ? (
            <video controls width="100%">
              <source src={session.videoUrl} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <p>Video is not available for this session.</p>
          )}
        </div>
        <div className="events-section">
          <h2>Flagged Events</h2>
          {session.events.length > 0 ? (
            <ul>
              {session.events.map((event, index) => (
                <li key={index}>
                  <strong>
                    {new Date(event.timestamp).toLocaleTimeString()}:
                  </strong>{" "}
                  {event.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>No suspicious events were flagged during this session.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;





