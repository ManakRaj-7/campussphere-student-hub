import express from 'express';
import { getEvents, getNearbyEvents, createEvent, attendEvent } from '../controllers/eventController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', auth, getEvents);
router.get('/nearby', auth, getNearbyEvents);
router.post('/', auth, upload.single('image'), createEvent);
router.post('/:id/attend', auth, attendEvent);

export default router;
