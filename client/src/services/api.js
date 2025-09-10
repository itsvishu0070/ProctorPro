import axios from "axios";

// Set up the base URL for your backend API
const API = axios.create({
  // baseURL: "http://localhost:5000/api",
  baseURL: "https://proctorpro-1.onrender.com/api",
});

/**
 * Creates a new interview session.
 * @param {object} candidateData - The candidate's name and email.
 * @param {string} candidateData.candidateName - The name of the candidate.
 * @param {string} candidateData.candidateEmail - The email of the candidate.
 * @returns {Promise<object>} The newly created session object.
 */
export const createSession = (candidateData) =>
  API.post("/sessions", candidateData);

// You will add more API functions here later, e.g., to get all sessions for the admin.
export const uploadVideo = (sessionId, videoBlob) => {
  // We use FormData to send a file
  const formData = new FormData();
  formData.append("video", videoBlob, "recording.webm");

  return API.post(`/sessions/${sessionId}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const downloadReportAPI = (sessionId) => {
  return API.get(`/sessions/${sessionId}/download`, {
    responseType: "blob", // Important: tells axios to handle the response as a file
  });
};


export const getAllSessions = () => API.get("/sessions");
export const getSessionById = (sessionId) => API.get(`/sessions/${sessionId}`);