
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllSessions } from "../services/api";

// we can set your desired admin password here
const ADMIN_PASSWORD = "admin@1234";

const AdminDashboard = () => {
  // State for the dashboard data
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for the authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (isAuthenticated) {
      const fetchSessions = async () => {
        try {
          const response = await getAllSessions();
          setSessions(response.data);
        } catch (err) {
          setError("Failed to fetch sessions.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSessions();
    }
  }, [isAuthenticated]); // This effect runs when isAuthenticated changes

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  // If not authenticated, show the password prompt
  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Admin Access Required</h2>
        <p>Please enter the password to view the admin dashboard.</p>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter admin password"
            style={{ padding: "10px", width: "250px", marginRight: "10px" }}
          />
          <button type="submit">Login</button>
        </form>
        {authError && (
          <p style={{ color: "red", marginTop: "10px" }}>{authError}</p>
        )}
      </div>
    );
  }

  // If authenticated, show the dashboard
  if (loading) return <p>Loading sessions...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {sessions.length === 0 ? (
        <p>No interview sessions found.</p>
      ) : (
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Email</th>
              <th>Date</th>
              <th>Integrity Score</th>
              <th>Report</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id}>
                <td>{session.candidateName}</td>
                <td>{session.candidateEmail}</td>
                <td>{new Date(session.createdAt).toLocaleString()}</td>
                <td>{session.integrityScore}%</td>
                <td>
                  <Link to={`/report/${session._id}`} className="report-link">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
