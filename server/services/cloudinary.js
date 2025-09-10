import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import streamifier from "streamifier";

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFromBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // We are uploading a video
        folder: "proctoring-sessions", 
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export default uploadFromBuffer;
