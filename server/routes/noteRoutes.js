import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  summarizeNote,
  uploadLectureFile,
} from '../controllers/noteController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', auth, getNotes);
router.get('/:id', auth, getNoteById);
router.post('/', auth, createNote);
router.put('/:id', auth, updateNote);
router.delete('/:id', auth, deleteNote);
router.post('/:id/summarize', auth, summarizeNote);
router.post('/upload', auth, upload.single('file'), uploadLectureFile);

export default router;
