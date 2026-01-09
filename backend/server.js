import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import mediaRoutes from "./routes/mediaRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------- Middleware -----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ----------- Static Uploads Folder -----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------- Serve Frontend Static Files -----------
app.use("/frontend", express.static(path.join(__dirname, "..", "frontend")));

// ----------- MongoDB Connection -----------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/anime-list";

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    });

// ----------- API Routes -----------
app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);

// ----------- Root Route -----------
app.get("/", (req, res) => {
    res.json({ message: "Anime List API is running" });
});

// ----------- Error Handling Middleware -----------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// ----------- Start Server -----------
const PORT = process.env.PORT || 5500;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`🚀 Backend API running on http://127.0.0.1:${PORT}`);
    console.log('Open http://127.0.0.1:5500/frontend/welcome.html to view the frontend welcome page');
});