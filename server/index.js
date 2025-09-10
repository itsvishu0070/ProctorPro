import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { handleSocketConnection } from "./services/socketHandler.js"; 
import sessionRoutes from "./routes/sessionRoutes.js"; 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: "http://localhost:5173",
    origin: "https://proctorpro-2.onrender.com",

    methods: ["GET", "POST", "PUT"],
  },
});


connectDB();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/api/sessions", sessionRoutes); 


app.get("/", (req, res) => {
  res.json({ message: "Welcome to the AI Proctoring API" });
});


handleSocketConnection(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
