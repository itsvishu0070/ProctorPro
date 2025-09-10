
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import io from "socket.io-client";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import { uploadVideo } from "../services/api"; 

// const socket = io("http://localhost:5000");

const socket = io("https://proctorpro-1.onrender.com");


const mernStackQuestions = [
  "Explain the role of MongoDB in the MERN stack.",
  "What is the use of Express.js in server-side development?",
  "How do you manage state in a complex React application?",
  "Describe the lifecycle of a React class component.",
  "What is the Virtual DOM and how does React use it for performance?",
  "Explain the difference between controlled and uncontrolled components in React.",
  "How do you handle authentication and authorization in a MERN stack app?",
  "What is middleware in Express.js? Provide an example of its use.",
  "Explain how to perform CRUD operations in MongoDB using Mongoose.",
  "What is JSX and how is it different from HTML?",
  "What are React Hooks? Name three common hooks and their purpose.",
  "Describe the concept of 'props drilling' and how to avoid it.",
  "What is the purpose of the `useEffect` hook? Explain its dependency array.",
  "How does Node.js handle asynchronous operations?",
  "What is the difference between `let`, `const`, and `var` in JavaScript?",
  "Explain the `populate()` method in Mongoose.",
  "What are JWTs (JSON Web Tokens) and how are they used for security?",
  "Describe RESTful API principles.",
  "What is the purpose of `package.json` in a Node.js project?",
  "How do you handle errors in an Express application?",
];

// Function to get a random subset of questions from the bank
const getRandomQuestions = (allQuestions, numQuestions) => {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numQuestions);
};

// Helper to get duration from a video blob
const getVideoDuration = (videoBlob) => {
  return new Promise((resolve, reject) => {
    const videoElement = document.createElement("video");
    videoElement.preload = "metadata";
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      resolve(videoElement.duration);
    };
    videoElement.onerror = (err) =>
      reject("Error loading video metadata: " + err);
    videoElement.src = window.URL.createObjectURL(videoBlob);
  });
};

const InterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const [model, setModel] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading AI Model...");

  // State to hold the randomly selected questions for this specific interview
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const noPersonTimer = useRef(null);
  const questionStartTimeRef = useRef(Date.now());

  useEffect(() => {
    // Set the random questions when the component first loads
    setInterviewQuestions(getRandomQuestions(mernStackQuestions, 5));

    // Load the AI model
    cocoSsd
      .load({ base: "mobilenet_v2" })
      .then(setModel)
      .catch(console.error)
      .finally(() => setLoadingMessage(""));
  }, []);

  useEffect(() => {
    socket.emit("join_session", sessionId);
  }, [sessionId]);

  const addAlert = useCallback(
    (message, type) => {
      console.log(`ALERT: ${type} - ${message}`);
      setAlerts((prev) => [message, ...prev.slice(0, 4)]);
      socket.emit("log_event", { sessionId, event: { type, message } });
    },
    [sessionId]
  );

  const runDetections = useCallback(async () => {
    if (
      !model ||
      !webcamRef.current?.video ||
      webcamRef.current.video.readyState !== 4
    )
      return;
    const video = webcamRef.current.video;
    if (video.videoWidth === 0) return;

    const predictions = await model.detect(video);
    const personDetections = predictions.filter((p) => p.class === "person");

    if (personDetections.length === 0) {
      if (!noPersonTimer.current)
        noPersonTimer.current = setTimeout(
          () => addAlert("Candidate not visible.", "NO_FACE"),
          5000
        );
    } else {
      clearTimeout(noPersonTimer.current);
      noPersonTimer.current = null;
      if (personDetections.length > 1)
        addAlert("Multiple persons detected.", "MULTIPLE_FACES");
    }

    const suspiciousObjects = predictions.filter((p) =>
      ["cell phone", "book", "laptop"].includes(p.class)
    );
    if (suspiciousObjects.length > 0)
      addAlert(
        `Suspicious object: ${suspiciousObjects[0].class}`,
        "OBJECT_DETECTED"
      );
  }, [model, addAlert]);

  useEffect(() => {
    if (isDetecting) {
      detectionIntervalRef.current = setInterval(runDetections, 2000);
      return () => clearInterval(detectionIntervalRef.current);
    }
  }, [isDetecting, runDetections]);

  const startInterview = () => {
    if (!model) return;
    setIsDetecting(true);
    setAlerts(["Interview started. Monitoring..."]);
    questionStartTimeRef.current = Date.now();

    try {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.onresult = () =>
          addAlert(`Speech detected`, "SPEECH_DETECTED");
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error starting media services:", error);
    }
  };

  const handleQuestionChange = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < interviewQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const endInterview = async () => {
    if (!window.confirm("Are you sure you want to end the interview?")) return;

    setIsDetecting(false);
    clearTimeout(noPersonTimer.current);
    if (recognitionRef.current) recognitionRef.current.stop();

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = async () => {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        try {
          const durationInSeconds = await getVideoDuration(videoBlob);
          await uploadVideo(sessionId, videoBlob, durationInSeconds);
          alert("Interview completed and submitted.");
          navigate('/');
        } catch (error) {
          console.error("Submission failed:", error);
          alert("Error submitting your interview.");
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="interview-page-split">
      <div className="question-area">
        {loadingMessage ? (
          <div className="loading-message-center">{loadingMessage}</div>
        ) : !isDetecting ? (
          <div className="start-interview-panel">
            <h1>Ready to Start?</h1>
            <p>The interview will consist of 5 random MERN stack questions.</p>
            <button onClick={startInterview}>Start Interview</button>
          </div>
        ) : (
          <div className="live-interview-panel">
            <div className="question-display">
              <h2>
                Question {currentQuestionIndex + 1} of{" "}
                {interviewQuestions.length}
              </h2>
              <p>{interviewQuestions[currentQuestionIndex]}</p>
            </div>
            <div className="question-navigation">
              {currentQuestionIndex < interviewQuestions.length - 1 ? (
                <button onClick={handleQuestionChange}>Next Question</button>
              ) : (
                <p>
                  This is the last question. Click "End Interview" to finish.
                </p>
              )}
            </div>
            <button onClick={endInterview} className="end-button">
              End Interview
            </button>
          </div>
        )}
      </div>
      <div className="video-area">
        <div className="video-container-corner">
          <Webcam
            ref={webcamRef}
            audio={true}
            muted={true}
            mirrored={true}
            style={{ width: "100%" }}
          />
        </div>
        <div className="alerts-panel-corner">
          <h3>Live Event Log</h3>
          <ul>
            {alerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
