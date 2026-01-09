import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["anime", "manga", "manhwa"], default: "anime" },
    status: { type: String, required: true },
    rating: Number,
    episodes_watched: { type: Number, default: 0 },
    total_episodes: Number,
    image: { type: String }, // Store image filename
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Media", mediaSchema);