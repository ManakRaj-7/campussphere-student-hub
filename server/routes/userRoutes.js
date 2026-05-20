import express from 'express';
import { getUserProfile, updateProfile, uploadAvatar, getAllUsers } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', auth, getAllUsers);
router.get('/:id', auth, getUserProfile);
router.put('/profile', auth, updateProfile);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);
router.put('/avatar', auth, upload.single('avatar'), uploadAvatar); // Support both PUT and POST for flexibility

export default router;
