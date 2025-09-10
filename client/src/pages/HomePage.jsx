
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../services/api";

const HomePage = () => {
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [newSessionId, setNewSessionId] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.candidateName || !formData.candidateEmail) {
      setError("Both name and email are required.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await createSession(formData);
      setNewSessionId(response.data._id);
      setShowGuidelines(true);
    } catch (err) {
      setError("Failed to start session. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToInterview = () => {
    navigate(`/interview/${newSessionId}`);
  };

  return (
    <div className="homepage-container">
      <div className="homepage-left-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="logo-text">ProctorPro</h1>
          </div>
          {showGuidelines ? (
            <div className="guidelines-content">
              <h2 className="form-title">Interview Guidelines</h2>
              <ul className="guidelines-list">
                <li style={{fontWeight:'bold'}}>
                  Please do not refresh the page during the interview, as doing
                  so will automatically terminate the session.
                </li>
                <li>Ensure you are in a quiet, well-lit room.</li>
                <li>Your webcam will be monitored throughout the session.</li>
                <li>
                  Do not use any unauthorized materials like phones or books.
                </li>
                <li>Keep your face clearly visible in the frame.</li>
                <li>Any suspicious activity will be flagged automatically.</li>
              </ul>
              <p className="guidelines-warning">
                By proceeding, you agree to be recorded and monitored.
              </p>
              <button onClick={proceedToInterview} className="form-button">
                I Understand, Start Interview
              </button>
            </div>
          ) : (
            <>
              <h1 className="form-title">Secure Assessment Portal</h1>
              <p className="form-subtitle">
                Enter your details to begin your proctored interview.
              </p>
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="candidateName">Full Name</label>
                  <input
                    type="text"
                    id="candidateName"
                    name="candidateName"
                    placeholder="John Doe"
                    value={formData.candidateName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="candidateEmail">Email Address</label>
                  <input
                    type="email"
                    id="candidateEmail"
                    name="candidateEmail"
                    placeholder="john.doe@example.com"
                    value={formData.candidateEmail}
                    onChange={handleChange}
                    required
                  />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="form-button"
                >
                  {isLoading ? "Verifying..." : "Start Secure Interview"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <div className="homepage-right-panel">
        <div className="branding-content">
          <h2>Ensuring Integrity with AI</h2>
          <p>
            Our platform leverages state-of-the-art technology to provide a fair
            and secure assessment environment for everyone.
          </p>
          <ul className="features-list">
            <li>✔️ Real-time Object & Speech Detection</li>
            <li>✔️ Candidate Presence & Focus Monitoring</li>
            <li>✔️ End-to-End Encrypted Video Storage</li>
            <li>✔️ Comprehensive Post-Session Integrity Reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;