// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Webcam from "react-webcam";
// import io from "socket.io-client";
// import * as cocoSsd from "@tensorflow-models/coco-ssd"; // We only need this model now
// import "@tensorflow/tfjs-backend-webgl";
// import "@tensorflow/tfjs-backend-cpu"; 
// import { uploadVideo } from "../services/api";

// const socket = io("http://localhost:5000");

// const InterviewPage = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const webcamRef = useRef(null);
//   const detectionIntervalRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const recordedChunksRef = useRef([]);

//   const [model, setModel] = useState(null); // Simplified to one model
//   const [alerts, setAlerts] = useState([]);
//   const [isDetecting, setIsDetecting] = useState(false);
//   const [loadingMessage, setLoadingMessage] = useState("Loading AI Model...");

//   const noPersonTimer = useRef(null);

//   // 1. Load the single AI Model
//   useEffect(() => {
//     const loadModel = async () => {
//       try {
//         const loadedModel = await cocoSsd.load();
//         // const loadedModel = await cocoSsd.load({ base: "mobilenet_v2" });
//         setModel(loadedModel);
//         console.log("COCO-SSD Model loaded successfully.");
//         setLoadingMessage("");
//       } catch (error) {
//         console.error("Failed to load model:", error);
//         addAlert("Error loading AI model. Please refresh.", "MODEL_LOAD_ERROR");
//         setLoadingMessage("Error loading model.");
//       }
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     socket.emit("join_session", sessionId);
//   }, [sessionId]);

//   const addAlert = useCallback(
//     (message, type) => {
//       console.log(`ALERT: ${type} - ${message}`);
//       setAlerts((prev) => [...prev, message]);
//       socket.emit("log_event", {
//         sessionId,
//         event: { type, message },
//       });
//     },
//     [sessionId]
//   );

//   // 3. Simplified Core Detection Logic
//   const runDetections = useCallback(async () => {
//     if (
//       !model ||
//       !webcamRef.current ||
//       !webcamRef.current.video ||
//       webcamRef.current.video.readyState !== 4
//     ) {
//       return;
//     }
//     const video = webcamRef.current.video;
//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       return;
//     }

//     // Run detection once for all objects
//     const predictions = await model.detect(video, undefined, 0.5);

//     // A. Person Detection
//     const personDetections = predictions.filter((p) => p.class === "person");
//     if (personDetections.length === 0) {
//       if (!noPersonTimer.current) {
//         noPersonTimer.current = setTimeout(() => {
//           addAlert("Candidate not visible for 2 seconds.", "NO_FACE");
//         }, 2000);
//       }
//     } else {
//       clearTimeout(noPersonTimer.current);
//       noPersonTimer.current = null;
//       if (personDetections.length > 1) {
//         addAlert("Multiple persons detected in the frame.", "MULTIPLE_FACES");
//       }
//     }

//     // B. Suspicious Object Detection
//     const suspiciousObjects = predictions.filter((p) =>
//       ["cell phone", "book", "laptop"].includes(p.class)
//     );
//     if (suspiciousObjects.length > 0) {
//       const detected = suspiciousObjects.map((p) => p.class).join(", ");
//       addAlert(`Suspicious object detected: ${detected}`, "OBJECT_DETECTED");
//     }
//   }, [model, addAlert]);

//   // startInterview and endInterview functions
//   const startInterview = () => {
//     if (!model) {
//       alert("AI Model is still loading, please wait.");
//       return;
//     }
//     setIsDetecting(true);
//     setAlerts(["Interview started. Monitoring..."]);
//     detectionIntervalRef.current = setInterval(runDetections, 2000);
//     try {
//       const stream = webcamRef.current.video.srcObject;
//       mediaRecorderRef.current = new MediaRecorder(stream, {
//         mimeType: "video/webm",
//       });
//       mediaRecorderRef.current.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           recordedChunksRef.current.push(event.data);
//         }
//       };
//       mediaRecorderRef.current.start();
//       console.log("Recording started.");
//     } catch (error) {
//       console.error("Error starting recording:", error);
//       addAlert("Could not start video recording.", "ERROR");
//     }
//   };

//   const endInterview = async () => {
//     setIsDetecting(false);
//     clearInterval(detectionIntervalRef.current);
//     clearTimeout(noPersonTimer.current);

//     if (
//       mediaRecorderRef.current &&
//       mediaRecorderRef.current.state === "recording"
//     ) {
//       mediaRecorderRef.current.onstop = async () => {
//         console.log("Recording stopped.");
//         const videoBlob = new Blob(recordedChunksRef.current, {
//           type: "video/webm",
//         });
//         recordedChunksRef.current = [];
//         try {
//           alert("Interview ended. Uploading video, please wait...");
//           await uploadVideo(sessionId, videoBlob);
//           alert("Video uploaded successfully!");
//         } catch (error) {
//           console.error("Video upload failed:", error);
//           alert("There was an error uploading your video.");
//         } finally {
//           navigate("/");
//         }
//       };
//       mediaRecorderRef.current.stop();
//     } else {
//       navigate("/");
//     }
//   };

//   useEffect(() => {
//     return () => {
//       clearInterval(detectionIntervalRef.current);
//     };
//   }, []);

//   return (
//     <div className="interview-page">
//       <div className="video-container">
//         <Webcam
//           ref={webcamRef}
//           audio={false}
//           mirrored={true}
//           style={{ width: "100%", height: "auto", borderRadius: "8px" }}
//         />
//         {loadingMessage && (
//           <div className="loading-overlay">{loadingMessage}</div>
//         )}
//       </div>
//       <div className="controls-panel">
//         <h2>Proctoring Session</h2>
//         <div className="buttons">
//           {!isDetecting ? (
//             <button onClick={startInterview} disabled={!!loadingMessage}>
//               Start Interview
//             </button>
//           ) : (
//             <button onClick={endInterview} className="end-button">
//               End Interview
//             </button>
//           )}
//         </div>
//       </div>
//       <div className="alerts-panel">
//         <h3>Live Event Log</h3>
//         <ul>
//           {alerts.map((alert, index) => (
//             <li key={index}>{alert}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default InterviewPage;



// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Webcam from "react-webcam";
// import io from "socket.io-client";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs-backend-webgl";
// import "@tensorflow/tfjs-backend-cpu";
// import { uploadVideo } from "../services/api";

// const socket = io("http://localhost:5000");

// // NEW: 10 dummy questions
// const dummyQuestions = [
//   "Tell us about yourself.",
//   "What is your greatest strength?",
//   "What is your greatest weakness?",
//   "Why should we hire you for this role?",
//   "Describe a challenging situation you've faced and how you resolved it.",
//   "Where do you see yourself in 5 years?",
//   "What are you passionate about?",
//   "How do you handle pressure or stressful situations?",
//   "Tell us about a time you worked successfully in a team.",
//   "Do you have any questions for us?",
// ];

// const InterviewPage = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const webcamRef = useRef(null);
//   const detectionIntervalRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const recordedChunksRef = useRef([]);

//   const [model, setModel] = useState(null);
//   const [alerts, setAlerts] = useState([]);
//   const [isDetecting, setIsDetecting] = useState(false);
//   const [loadingMessage, setLoadingMessage] = useState("Loading AI Model...");
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // NEW: State for questions

//   const noPersonTimer = useRef(null);

//   // This logic remains the same
//   useEffect(() => {
//     const loadModel = async () => {
//       try {
//         const loadedModel = await cocoSsd.load({ base: "mobilenet_v2" });
//         setModel(loadedModel);
//         console.log("COCO-SSD Model loaded successfully.");
//         setLoadingMessage("");
//       } catch (error) {
//         console.error("Failed to load model:", error);
//         setLoadingMessage("Error loading model.");
//       }
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     socket.emit("join_session", sessionId);
//   }, [sessionId]);

//   const addAlert = useCallback(
//     (message, type) => {
//       console.log(`ALERT: ${type} - ${message}`);
//       setAlerts((prev) => [...prev, message]);
//       socket.emit("log_event", {
//         sessionId,
//         event: { type, message },
//       });
//     },
//     [sessionId]
//   );

//   const runDetections = useCallback(async () => {
//     if (
//       !model ||
//       !webcamRef.current ||
//       !webcamRef.current.video ||
//       webcamRef.current.video.readyState !== 4
//     )
//       return;
//     const video = webcamRef.current.video;
//     if (video.videoWidth === 0 || video.videoHeight === 0) return;
//     const predictions = await model.detect(video, undefined, 0.5);
//     const personDetections = predictions.filter((p) => p.class === "person");
//     if (personDetections.length === 0) {
//       if (!noPersonTimer.current) {
//         noPersonTimer.current = setTimeout(() => {
//           addAlert("Candidate not visible for 5 seconds.", "NO_FACE");
//         }, 5000);
//       }
//     } else {
//       clearTimeout(noPersonTimer.current);
//       noPersonTimer.current = null;
//       if (personDetections.length > 1) {
//         addAlert("Multiple persons detected in the frame.", "MULTIPLE_FACES");
//       }
//     }
//     const suspiciousObjects = predictions.filter((p) =>
//       ["cell phone", "book", "laptop"].includes(p.class)
//     );
//     if (suspiciousObjects.length > 0) {
//       const detected = suspiciousObjects.map((p) => p.class).join(", ");
//       addAlert(`Suspicious object detected: ${detected}`, "OBJECT_DETECTED");
//     }
//   }, [model, addAlert]);

//   const startInterview = () => {
//     if (!model) {
//       alert("AI Model is still loading, please wait.");
//       return;
//     }
//     setIsDetecting(true);
//     setAlerts(["Interview started. Monitoring..."]);
//     detectionIntervalRef.current = setInterval(runDetections, 2000);
//     try {
//       const stream = webcamRef.current.video.srcObject;
//       mediaRecorderRef.current = new MediaRecorder(stream, {
//         mimeType: "video/webm",
//       });
//       mediaRecorderRef.current.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           recordedChunksRef.current.push(event.data);
//         }
//       };
//       mediaRecorderRef.current.start();
//       console.log("Recording started.");
//     } catch (error) {
//       console.error("Error starting recording:", error);
//       addAlert("Could not start video recording.", "ERROR");
//     }
//   };

//   const endInterview = async () => {
//     if (window.confirm("Are you sure you want to end the interview?")) {
//       setIsDetecting(false);
//       clearInterval(detectionIntervalRef.current);
//       clearTimeout(noPersonTimer.current);
//       if (
//         mediaRecorderRef.current &&
//         mediaRecorderRef.current.state === "recording"
//       ) {
//         mediaRecorderRef.current.onstop = async () => {
//           console.log("Recording stopped.");
//           const videoBlob = new Blob(recordedChunksRef.current, {
//             type: "video/webm",
//           });
//           recordedChunksRef.current = [];
//           try {
//             alert("Interview ended. Uploading video, please wait...");
//             await uploadVideo(sessionId, videoBlob);
//             alert("Video uploaded successfully!");
//           } catch (error) {
//             console.error("Video upload failed:", error);
//             alert("There was an error uploading your video.");
//           } finally {
//             navigate("/");
//           }
//         };
//         mediaRecorderRef.current.stop();
//       } else {
//         navigate("/");
//       }
//     }
//   };

//   useEffect(() => {
//     return () => {
//       clearInterval(detectionIntervalRef.current);
//     };
//   }, []);

//   // NEW: Handlers for question buttons
//   const handleNextQuestion = () => {
//     setCurrentQuestionIndex((prev) => (prev + 1) % dummyQuestions.length);
//   };

//   const handlePreviousQuestion = () => {
//     setCurrentQuestionIndex(
//       (prev) => (prev - 1 + dummyQuestions.length) % dummyQuestions.length
//     );
//   };

//   return (
//     <div className="interview-page-split">
//       {/* The main content area with questions and controls */}
//       <div className="question-area">
//         {loadingMessage ? (
//           <div className="loading-message-center">{loadingMessage}</div>
//         ) : (
//           <>
//             {!isDetecting ? (
//               <div className="start-interview-panel">
//                 <h1>Ready to Start?</h1>
//                 <p>Click the button below to begin your proctored interview.</p>
//                 <button onClick={startInterview} disabled={!!loadingMessage}>
//                   Start Interview
//                 </button>
//               </div>
//             ) : (
//               <div className="live-interview-panel">
//                 <div className="question-display">
//                   <h2>
//                     Question {currentQuestionIndex + 1} of{" "}
//                     {dummyQuestions.length}
//                   </h2>
//                   <p>{dummyQuestions[currentQuestionIndex]}</p>
//                 </div>
//                 <div className="question-navigation">
//                   <button onClick={handlePreviousQuestion} className="nav-btn">
//                     Previous
//                   </button>
//                   <button onClick={handleNextQuestion} className="nav-btn">
//                     Next
//                   </button>
//                 </div>
//                 <div className="end-interview-footer">
//                   <p>Your session is being proctored.</p>
//                   <button onClick={endInterview} className="end-button">
//                     End Interview
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* The video and alerts area, now on the right */}
//       <div className="video-area">
//         <div className="video-container-corner">
//           <Webcam
//             ref={webcamRef}
//             audio={false}
//             mirrored={true}
//             style={{ width: "100%", height: "auto" }}
//           />
//         </div>
//         <div className="alerts-panel-corner">
//           <h3>Live Event Log</h3>
//           <ul>
//             {alerts.map((alert, index) => (
//               <li key={index}>{alert}</li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InterviewPage;





// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Webcam from "react-webcam";
// import io from "socket.io-client";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs-backend-webgl";
// import "@tensorflow/tfjs-backend-cpu";
// import { uploadVideo } from "../services/api";

// const socket = io("http://localhost:5000");

// const dummyQuestions = [
//   "Tell us about yourself.",
//   "What is your greatest strength?",
//   "What is your greatest weakness?",
//   "Why should we hire you?",
//   "Describe a challenging situation you've faced.",
//   "Where do you see yourself in 5 years?",
// ];

// const InterviewPage = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const webcamRef = useRef(null);
//   const detectionIntervalRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const recordedChunksRef = useRef([]);
//   const recognitionRef = useRef(null); // Ref for Speech Recognition

//   const [model, setModel] = useState(null);
//   const [alerts, setAlerts] = useState([]);
//   const [isDetecting, setIsDetecting] = useState(false);
//   const [loadingMessage, setLoadingMessage] = useState("Loading AI Model...");
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const noPersonTimer = useRef(null);

//   useEffect(() => {
//     const loadModel = async () => {
//       try {
//         setLoadingMessage("Initializing Secure Session...");
//         await new Promise((res) => setTimeout(res, 700)); // Delay for effect

//         setLoadingMessage("Calibrating Proctoring AI...");
//         const loadedModel = await cocoSsd.load({ base: "mobilenet_v2" });
//         setModel(loadedModel);
//         setLoadingMessage("");
//       } catch (error) {
//         console.error("Failed to load model:", error);
//         setLoadingMessage("Error loading model.");
//       }
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     socket.emit("join_session", sessionId);
//   }, [sessionId]);

//   const addAlert = useCallback(
//     (message, type) => {
//       console.log(`ALERT: ${type} - ${message}`);
//       setAlerts((prev) => [...prev.slice(-4), message]);
//       socket.emit("log_event", { sessionId, event: { type, message } });
//     },
//     [sessionId]
//   );

//   const runDetections = useCallback(async () => {
//     if (
//       !model ||
//       !webcamRef.current ||
//       !webcamRef.current.video ||
//       webcamRef.current.video.readyState !== 4
//     )
//       return;
//     const video = webcamRef.current.video;
//     if (video.videoWidth === 0 || video.videoHeight === 0) return;
//     const predictions = await model.detect(video, undefined, 0.5);
//     const personDetections = predictions.filter((p) => p.class === "person");
//     if (personDetections.length === 0) {
//       if (!noPersonTimer.current) {
//         noPersonTimer.current = setTimeout(
//           () => addAlert("Candidate not visible for 5 seconds.", "NO_FACE"),
//           5000
//         );
//       }
//     } else {
//       clearTimeout(noPersonTimer.current);
//       noPersonTimer.current = null;
//       if (personDetections.length > 1) {
//         addAlert("Multiple persons detected in the frame.", "MULTIPLE_FACES");
//       }
//     }
//     const suspiciousObjects = predictions.filter((p) =>
//       ["cell phone", "book", "laptop"].includes(p.class)
//     );
//     if (suspiciousObjects.length > 0) {
//       const detected = suspiciousObjects.map((p) => p.class).join(", ");
//       addAlert(`Suspicious object detected: ${detected}`, "OBJECT_DETECTED");
//     }
//   }, [model, addAlert]);

//   const startInterview = () => {
//     if (!model) {
//       alert("AI Model is still loading, please wait.");
//       return;
//     }
//     setIsDetecting(true);
//     setAlerts(["Interview started. Monitoring..."]);
//     detectionIntervalRef.current = setInterval(runDetections, 2000);
//     try {
//       const stream = webcamRef.current.video.srcObject;
//       mediaRecorderRef.current = new MediaRecorder(stream, {
//         mimeType: "video/webm",
//       });
//       mediaRecorderRef.current.ondataavailable = (event) => {
//         if (event.data.size > 0) recordedChunksRef.current.push(event.data);
//       };
//       mediaRecorderRef.current.start();
//       console.log("Recording started.");

//       // Initialize and start Speech Recognition
//       const SpeechRecognition =
//         window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = true;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.onresult = (event) => {
//           const last = event.results.length - 1;
//           const transcript = event.results[last][0].transcript;
//           addAlert(
//             `Speech detected: "${transcript.trim()}"`,
//             "SPEECH_DETECTED"
//           );
//         };
//         recognitionRef.current.onerror = (event) =>
//           console.error("Speech recognition error:", event.error);
//         recognitionRef.current.start();
//         console.log("Speech recognition started.");
//       }
//     } catch (error) {
//       console.error("Error starting recording:", error);
//       addAlert("Could not start video recording.", "ERROR");
//     }
//   };

//   const endInterview = async () => {
//     if (window.confirm("Are you sure you want to end the interview?")) {
//       setIsDetecting(false);
//       clearInterval(detectionIntervalRef.current);
//       clearTimeout(noPersonTimer.current);

//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//         console.log("Speech recognition stopped.");
//       }

//       if (
//         mediaRecorderRef.current &&
//         mediaRecorderRef.current.state === "recording"
//       ) {
//         mediaRecorderRef.current.onstop = async () => {
//           console.log("Recording stopped.");
//           const videoBlob = new Blob(recordedChunksRef.current, {
//             type: "video/webm",
//           });
//           try {
//             await uploadVideo(sessionId, videoBlob);
//             alert(
//               "Your interview is completed and has been submitted for review."
//             );
//           } catch (error) {
//             console.error("Video upload failed:", error);
//             alert("There was an error submitting your interview.");
//           } finally {
//             navigate("/");
//           }
//         };
//         mediaRecorderRef.current.stop();
//       } else {
//         navigate("/");
//       }
//     }
//   };

//   return (
//     <div className="interview-page-split">
//       <div className="question-area">
//         {loadingMessage ? (
//           <div className="loading-message-center">{loadingMessage}</div>
//         ) : (
//           <>
//             {!isDetecting ? (
//               <div className="start-interview-panel">
//                 <h1>Ready to Start?</h1>
//                 <p>Click the button below to begin your proctored interview.</p>
//                 <button onClick={startInterview}>Start Interview</button>
//               </div>
//             ) : (
//               <div className="live-interview-panel">
//                 <div className="question-display">
//                   <h2>
//                     Question {currentQuestionIndex + 1} of{" "}
//                     {dummyQuestions.length}
//                   </h2>
//                   <p>{dummyQuestions[currentQuestionIndex]}</p>
//                 </div>
//                 <div className="question-navigation">
//                   <button
//                     onClick={() =>
//                       setCurrentQuestionIndex(
//                         (prev) =>
//                           (prev - 1 + dummyQuestions.length) %
//                           dummyQuestions.length
//                       )
//                     }
//                     className="nav-btn"
//                   >
//                     Previous
//                   </button>
//                   <button
//                     onClick={() =>
//                       setCurrentQuestionIndex(
//                         (prev) => (prev + 1) % dummyQuestions.length
//                       )
//                     }
//                     className="nav-btn"
//                   >
//                     Next
//                   </button>
//                 </div>
//                 <div className="end-interview-footer">
//                   <p>Your session is being proctored.</p>
//                   <button onClick={endInterview} className="end-button">
//                     End Interview
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//       <div className="video-area">
//         <div className="video-container-corner">
//           <Webcam
//             ref={webcamRef}
//             audio={true} // Enable audio for speech recognition
//             mirrored={true}
//             muted={true}
//             style={{ width: "100%", height: "auto" }}
//           />
//         </div>
//         <div className="alerts-panel-corner">
//           <h3>Live Event Log</h3>
//           <ul>
//             {alerts.map((alert, index) => (
//               <li key={index}>{alert}</li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InterviewPage;





// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Webcam from "react-webcam";
// import io from "socket.io-client";
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs-backend-webgl";
// import "@tensorflow/tfjs-backend-cpu";
// import { uploadVideo } from "../services/api";

// const socket = io("http://localhost:5000");

// const dummyQuestions = [
//   "Tell us about yourself.",
//   "What is your greatest strength?",
//   "What is your greatest weakness?",
//   "Why should we hire you?",
//   "Describe a challenging situation you've faced.",
//   "Where do you see yourself in 5 years?",
// ];



// const InterviewPage = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const webcamRef = useRef(null);
//   const detectionIntervalRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const recordedChunksRef = useRef([]);
//   const recognitionRef = useRef(null); // Ref for Speech Recognition

//   const [model, setModel] = useState(null);
//   const [alerts, setAlerts] = useState([]);
//   const [isDetecting, setIsDetecting] = useState(false);
//   const [loadingMessage, setLoadingMessage] = useState("Loading AI Model...");
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const noPersonTimer = useRef(null);
//   const [questionStartTime, setQuestionStartTime] = useState(0); // Add state to track question start time
//   const [isRecording, setIsRecording] = useState(false); // Add state to track recording status

//   useEffect(() => {
//     const loadModel = async () => {
//       try {
//         setLoadingMessage("Initializing Secure Session...");
//         await new Promise((res) => setTimeout(res, 700)); // Delay for effect

//         setLoadingMessage("Calibrating Proctoring AI...");
//         const loadedModel = await cocoSsd.load({ base: "mobilenet_v2" });
//         setModel(loadedModel);
//         setLoadingMessage("");
//       } catch (error) {
//         console.error("Failed to load model:", error);
//         setLoadingMessage("Error loading model.");
//       }
//     };
//     loadModel();
//   }, []);

//   useEffect(() => {
//     socket.emit("join_session", sessionId);
//   }, [sessionId]);

//   const addAlert = useCallback(
//     (message, type) => {
//       console.log(`ALERT: ${type} - ${message}`);
//       setAlerts((prev) => [...prev.slice(-4), message]);
//       socket.emit("log_event", { sessionId, event: { type, message } });
//     },
//     [sessionId]
//   );

//   const runDetections = useCallback(async () => {
//     if (
//       !model ||
//       !webcamRef.current ||
//       !webcamRef.current.video ||
//       webcamRef.current.video.readyState !== 4
//     )
//       return;
//     const video = webcamRef.current.video;
//     if (video.videoWidth === 0 || video.videoHeight === 0) return;
//     const predictions = await model.detect(video, undefined, 0.5);
//     const personDetections = predictions.filter((p) => p.class === "person");
//     if (personDetections.length === 0) {
//       if (!noPersonTimer.current) {
//         noPersonTimer.current = setTimeout(
//           () => addAlert("Candidate not visible for 5 seconds.", "NO_FACE"),
//           5000
//         );
//       }
//     } else {
//       clearTimeout(noPersonTimer.current);
//       noPersonTimer.current = null;
//       if (personDetections.length > 1) {
//         addAlert("Multiple persons detected in the frame.", "MULTIPLE_FACES");
//       }
//     }
//     const suspiciousObjects = predictions.filter((p) =>
//       ["cell phone", "book", "laptop"].includes(p.class)
//     );
//     if (suspiciousObjects.length > 0) {
//       const detected = suspiciousObjects.map((p) => p.class).join(", ");
//       addAlert(`Suspicious object detected: ${detected}`, "OBJECT_DETECTED");
//     }
//   }, [model, addAlert]);

//   const startInterview = () => {
//     if (!model) {
//       alert("AI Model is still loading, please wait.");
//       return;
//     }
//     setIsDetecting(true);
//     setIsRecording(true); // Start recording state
//     setAlerts(["Interview started. Monitoring..."]);
//     setQuestionStartTime(Date.now()); // Set start time for the first question
//     detectionIntervalRef.current = setInterval(runDetections, 2000);
//     try {
//       const stream = webcamRef.current.video.srcObject;
//       mediaRecorderRef.current = new MediaRecorder(stream, {
//         mimeType: "video/webm",
//       });
//       mediaRecorderRef.current.ondataavailable = (event) => {
//         if (event.data.size > 0) recordedChunksRef.current.push(event.data);
//       };
//       mediaRecorderRef.current.start();
//       console.log("Recording started.");

//       // Initialize and start Speech Recognition
//       const SpeechRecognition =
//         window.SpeechRecognition || window.webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         recognitionRef.current = new SpeechRecognition();
//         recognitionRef.current.continuous = true;
//         recognitionRef.current.interimResults = false;
//         recognitionRef.current.onresult = (event) => {
//           const last = event.results.length - 1;
//           const transcript = event.results[last][0].transcript;
//           addAlert(
//             `Speech detected: "${transcript.trim()}"`,
//             "SPEECH_DETECTED"
//           );
//         };
//         recognitionRef.current.onerror = (event) =>
//           console.error("Speech recognition error:", event.error);
//         recognitionRef.current.start();
//         console.log("Speech recognition started.");
//       }
//     } catch (error) {
//       console.error("Error starting recording:", error);
//       addAlert("Could not start video recording.", "ERROR");
//     }
//   };

//   const handleNextQuestion = () => {
//     const timeTaken = Date.now() - questionStartTime;
//     socket.emit("log_event", {
//       sessionId,
//       event: {
//         type: "QUESTION_TIMING",
//         message: `Time taken for Q${currentQuestionIndex + 1}: ${
//           timeTaken / 1000
//         } seconds`,
//       },
//     });
//     setCurrentQuestionIndex((prev) => (prev + 1) % dummyQuestions.length);
//     setQuestionStartTime(Date.now()); // Reset timer for the new question
//   };

//   const handlePreviousQuestion = () => {
//     const timeTaken = Date.now() - questionStartTime;
//     socket.emit("log_event", {
//       sessionId,
//       event: {
//         type: "QUESTION_TIMING",
//         message: `Time taken for Q${currentQuestionIndex + 1}: ${
//           timeTaken / 1000
//         } seconds`,
//       },
//     });
//     setCurrentQuestionIndex(
//       (prev) => (prev - 1 + dummyQuestions.length) % dummyQuestions.length
//     );
//     setQuestionStartTime(Date.now()); // Reset timer for the new question
//   };

//   const endInterview = async () => {
//     if (window.confirm("Are you sure you want to end the interview?")) {
//       setIsDetecting(false);
//       setIsRecording(false); // Stop recording state
//       clearInterval(detectionIntervalRef.current);
//       clearTimeout(noPersonTimer.current);

//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//         console.log("Speech recognition stopped.");
//       }

//       if (
//         mediaRecorderRef.current &&
//         mediaRecorderRef.current.state === "recording"
//       ) {
//         mediaRecorderRef.current.onstop = async () => {
//           console.log("Recording stopped.");
//           const videoBlob = new Blob(recordedChunksRef.current, {
//             type: "video/webm",
//           });
//           try {
//             await uploadVideo(sessionId, videoBlob);
//             alert(
//               "Your interview is completed and has been submitted for review."
//             );
//           } catch (error) {
//             console.error("Video upload failed:", error);
//             alert("There was an error submitting your interview.");
//           } finally {
//             navigate("/");
//           }
//         };
//         mediaRecorderRef.current.stop();
//       } else {
//         navigate("/");
//       }
//     }
//   };

//   return (
//     <div className="interview-page-split">
//       <div className="question-area">
//         {loadingMessage ? (
//           <div className="loading-message-center">{loadingMessage}</div>
//         ) : (
//           <>
//             {!isDetecting ? (
//               <div className="start-interview-panel">
//                 <h1>Ready to Start?</h1>
//                 <p>Click the button below to begin your proctored interview.</p>
//                 <button onClick={startInterview}>Start Interview</button>
//               </div>
//             ) : (
//               <div className="live-interview-panel">
//                 <div className="question-display">
//                   <h2>
//                     Question {currentQuestionIndex + 1} of{" "}
//                     {dummyQuestions.length}
//                   </h2>
//                   <p>{dummyQuestions[currentQuestionIndex]}</p>
//                 </div>
//                 <div className="question-navigation">
//                   <button
//                     onClick={handlePreviousQuestion}
//                     className="nav-btn"
//                     disabled={currentQuestionIndex === 0}
//                   >
//                     Previous
//                   </button>
//                   <button
//                     onClick={handleNextQuestion}
//                     className="nav-btn"
//                     disabled={
//                       currentQuestionIndex === dummyQuestions.length - 1
//                     }
//                   >
//                     Next
//                   </button>
//                 </div>
//                 <div className="end-interview-footer">
//                   <p>Your session is being proctored.</p>
//                   <button onClick={endInterview} className="end-button">
//                     End Interview
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//       <div className="video-area">
//         <div className="video-container-corner">
//           <Webcam
//             ref={webcamRef}
//             audio={true} // Enable audio for speech recognition
//             mirrored={true}
//             muted={true}
//             style={{ width: "100%", height: "auto" }}
//           />
//         </div>
//         <div className="alerts-panel-corner">
//           <h3>Live Event Log</h3>
//           <ul>
//             {alerts.map((alert, index) => (
//               <li key={index}>{alert}</li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InterviewPage;









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
