import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import trialRoutes from "./routes/trialRoutes.js";

dotenv.config();

// 🧠 Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// 🌍 Allowed frontend origins
  // 🌍 Allowed frontend origins
const allowedOrigins = [
  "https://thsis-full-j6zvugp0c-underrated-james-projects.vercel.app",
  "https://thsis-full-iqy18mv8j-underrated-james-projects.vercel.app",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://s7lkm16q-5173.asse.devtunnels.ms",
  "https://unadmired-phyllotactic-cyrus.ngrok-free.dev",
  "https://thsis-full-j6zvugp0c-underrated-james-projects.vercel.app",
  "https://thsis-full-iqy18mv8j-underrated-james-projects.vercel.app",
  "https://thsis-full-7mjoijs9l-underrated-james-projects.vercel.app"
];


// 🛡️ CORS Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(url => origin.startsWith(url))) {
        callback(null, true);
      } else {
        console.warn("🚫 Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ JSON Middleware
app.use(express.json());

// ✅ API Routes
app.use("/api/trials", trialRoutes);

// 🩺 Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "✅ Voice Metrics API is running successfully!",
    accessibleFrom: allowedOrigins,
  });
});

// 🚀 Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Accessible via: http://localhost:${PORT}`);
  console.log("🔓 Allowed Origins:");
  allowedOrigins.forEach((o) => console.log("   •", o));
});


