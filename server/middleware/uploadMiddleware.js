import multer from "multer";

// Configure multer to store files in memory as buffers
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Not a video file!"), false);
    }
  },
});

export default upload;
