import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(path.join(uploadsDir, 'avatars'));
ensureDir(path.join(uploadsDir, 'notes'));
ensureDir(path.join(uploadsDir, 'posts'));
ensureDir(path.join(uploadsDir, 'resumes'));

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;

    if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadsDir, 'avatars');
    } else if (file.fieldname === 'attachment' || file.fieldname === 'lectureFile') {
      uploadPath = path.join(uploadsDir, 'notes');
    } else if (file.fieldname === 'images' || file.fieldname === 'image') {
      uploadPath = path.join(uploadsDir, 'posts');
    } else if (file.fieldname === 'resume') {
      uploadPath = path.join(uploadsDir, 'resumes');
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx|ppt|pptx|txt|md/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  if (file.fieldname === 'avatar') {
    if (allowedImageTypes.test(ext) && /image/.test(mimetype)) {
      return cb(null, true);
    }
    return cb(ApiError.badRequest('Only image files are allowed for avatars.'));
  }

  if (file.fieldname === 'images' || file.fieldname === 'image') {
    if (allowedImageTypes.test(ext) && /image/.test(mimetype)) {
      return cb(null, true);
    }
    return cb(ApiError.badRequest('Only image files are allowed.'));
  }

  if (file.fieldname === 'attachment' || file.fieldname === 'lectureFile') {
    if (allowedDocTypes.test(ext) || allowedImageTypes.test(ext)) {
      return cb(null, true);
    }
    return cb(ApiError.badRequest('Only document and image files are allowed for attachments.'));
  }

  if (file.fieldname === 'resume') {
    if (/pdf|doc|docx/.test(ext)) {
      return cb(null, true);
    }
    return cb(ApiError.badRequest('Only PDF and Word documents are allowed for resumes.'));
  }

  cb(null, true);
};

const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // 10MB default

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
});

// Pre-configured upload middlewares
export const uploadAvatar = upload.single('avatar');
export const uploadPostImages = upload.array('images', 5);
export const uploadNoteAttachment = upload.single('attachment');
export const uploadLectureFile = upload.single('lectureFile');
export const uploadResume = upload.single('resume');
export const uploadEventImage = upload.single('image');

export default upload;
