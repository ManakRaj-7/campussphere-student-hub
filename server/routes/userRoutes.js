import express from 'express';
import { getUserProfile, updateProfile, uploadAvatar, setDefaultAvatar, getAllUsers } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', auth, getAllUsers);
router.get('/:id', auth, getUserProfile);
router.put('/profile', auth, updateProfile);
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);
router.put('/avatar', auth, upload.single('avatar'), uploadAvatar); // Support both PUT and POST for flexibility
router.put('/avatar/default', auth, setDefaultAvatar);

export default router;
