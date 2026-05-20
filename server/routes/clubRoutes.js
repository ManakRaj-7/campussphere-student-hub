import express from 'express';
import { getClubs, getClubById, createClub, toggleJoinClub } from '../controllers/clubController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getClubs);
router.get('/:id', auth, getClubById);
router.post('/', auth, createClub);
router.post('/:id/join', auth, toggleJoinClub);
router.post('/:id/toggle-join', auth, toggleJoinClub); // Support both join and toggle-join endpoints

export default router;
