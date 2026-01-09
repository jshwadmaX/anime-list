import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Media from "../models/Media.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes below require authentication
router.use(authMiddleware);

// Get all media for logged-in user
router.get("/", async (req, res) => {
    try {
        const items = await Media.find({ userId: req.userId });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get by type for logged-in user
router.get("/type/:type", async (req, res) => {
    try {
        const items = await Media.find({
            userId: req.userId,
            type: req.params.type
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Add new media with image upload
router.post("/", upload.single('image'), async (req, res) => {
    try {
        const mediaData = {
            ...req.body,
            userId: req.userId
        };

        // If image was uploaded, add the filename
        if (req.file) {
            mediaData.image = req.file.filename;
        }

        const newMedia = new Media(mediaData);
        await newMedia.save();
        res.json({ message: "Added Successfully", newMedia });
    } catch (error) {
        // If there's an error and a file was uploaded, delete it
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update media with optional new image
router.put("/:id", upload.single('image'), async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!media) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ message: "Media not found or unauthorized" });
        }

        const updateData = { ...req.body };

        // If new image was uploaded
        if (req.file) {
            // Delete old image if it exists
            if (media.image) {
                const oldImagePath = `./uploads/${media.image}`;
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.image = req.file.filename;
        }

        const updated = await Media.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete media and its image
router.delete("/:id", async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!media) {
            return res.status(404).json({ message: "Media not found or unauthorized" });
        }

        // Delete image file if it exists
        if (media.image) {
            const imagePath = `./uploads/${media.image}`;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Media.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;