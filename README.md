# ProctorPro


  A secure, full-stack MERN application designed to conduct proctored interviews, ensuring integrity through AI-powered monitoring of candidate behavior.



## Installation & Setup

Follow these steps to set up and run the project locally.

### Prerequisites

-   Node.js (v14 or later)
-   npm (Node Package Manager)
-   MongoDB (local instance or a cloud-based service like MongoDB Atlas)

### 1. Clone the Repository


### 2. Backend Setup

Navigate to the `server` directory and install the dependencies.

cd server
npm install



Create a `.env` file in the `server` directory and add the following environment variables:

MONGO_URI= your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME= your_cloudinary_cloud_name
CLOUDINARY_API_KEY= your_cloudinary_api_key
CLOUDINARY_API_SECRET= your_cloudinary_api_secret



### 3. Frontend Setup

Navigate to the `client` directory and install the dependencies.

cd ../client
npm install


### 4. Run the Application


Terminal 1: Start the Backend Server

cd server
npm run dev

The backend will be running on `http://localhost:5000` (or your configured port).

Terminal 2: Start the Frontend Development Server

cd client
npm run dev

The frontend will be available at `http://localhost:5173` (or as specified by Vite).

---

## Usage

1.  **Start an Interview:**
    -   Navigate to the home page (`http://localhost:5173`).
    -   Enter your name and email to start a new session.
    -   You will be redirected to the interview page. Grant camera and microphone permissions when prompted.
    -   Click "Start Interview" to begin answering the randomly selected questions.

2.  **Admin Dashboard:**
    -   Navigate to the admin page (`/admin`).
    -   Enter the admin password (default: `admin@1234`) to gain access.
    -   View a list of all completed and ongoing interview sessions.
    -   Click on any session to view the detailed report, including the video recording and flagged events.


## Environment Variables

To run this project, you will need to create a `.env` file in the `server` directory and add the following:

-   `MONGO_URI`: Your connection string for the MongoDB database.
-   `CLOUDINARY_CLOUD_NAME`: Your cloud name from your Cloudinary account.
-   `CLOUDINARY_API_KEY`: Your API key from Cloudinary.
-   `CLOUDINARY_API_SECRET`: Your API secret from Cloudinary.


## Key Features

- Real-Time Proctoring: Monitors the candidate during the interview using their webcam.
- AI-Powered Event Detection:
    -   No Face Detected: Flags when the candidate is not visible in the frame.
    -   Multiple Faces Detected: Alerts if more than one person is present.
    -   Suspicious Object Detection: Identifies prohibited items like cell phones and books.
    -   Speech Detection: Logs instances of speech during the test.
-   Dynamic Question Bank: Presents a random selection of technical questions for each session.
-   Secure Admin Dashboard: A password-protected area for admins to review all interview sessions and reports.
-   Comprehensive Reporting: Generates a detailed report for each session, including an integrity score, flagged events, and a full video recording.
-   Cloud Video Storage: Securely uploads and stores interview recordings using Cloudinary.

---

## Tech Stack

### Frontend

-   React.js: For building the user interface.
-   React Router: For client-side routing.
-   Axios: For making API requests to the backend.
-   Socket.IO Client: For real-time communication with the server.
-   TensorFlow.js: For running machine learning models in the browser.
    -   COCO-SSD Model: For object and person detection.

### Backend

-   Node.js: JavaScript runtime environment.
-   Express.js: Web framework for building the API.
-   MongoDB: NoSQL database for storing session data.
-   Mongoose: Object Data Modeling (ODM) library for MongoDB.
-   Socket.IO: For enabling real-time, bidirectional event-based communication.
-   Cloudinary: For cloud-based video storage.
  


