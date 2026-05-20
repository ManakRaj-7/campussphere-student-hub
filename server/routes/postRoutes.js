import express from 'express';
import {
  getFeed,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
} from '../controllers/postController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', auth, getFeed);
router.get('/:id', auth, getPost);
router.post('/', auth, upload.array('images', 5), createPost); // Allow up to 5 images
router.put('/:id', auth, upload.array('images', 5), updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);
router.post('/:id/comments', auth, addComment); // Support both endpoints
router.get('/:id/comments', auth, getComments);

export default router;
