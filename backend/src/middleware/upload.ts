import fs from "fs";
import multer from "multer";
import path from "path";
import { newId } from "../utils/ids";
import { propertyUploadDir } from "../utils/propertyPhotos";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED.has(file.mimetype)) {
    cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    return;
  }
  cb(null, true);
};

const videoFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_VIDEO.has(file.mimetype)) {
    cb(new Error("Only MP4, WebM, and MOV videos are allowed"));
    return;
  }
  cb(null, true);
};

/** New listing + photos in one request (memory → disk after property id is created). */
export const listingPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 10 },
  fileFilter: imageFileFilter,
});

export const propertyPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const propertyId = String(req.params.id);
      if (!propertyId) {
        cb(new Error("Property id required"), "");
        return;
      }
      const dir = propertyUploadDir(propertyId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `${newId("img")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_BYTES, files: 10 },
  fileFilter: imageFileFilter,
});

export const propertyVideoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const propertyId = String(req.params.id);
      if (!propertyId) {
        cb(new Error("Property id required"), "");
        return;
      }
      const dir = path.join(propertyUploadDir(propertyId), "videos");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
      cb(null, `${newId("vid")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 3 },
  fileFilter: videoFileFilter,
});
