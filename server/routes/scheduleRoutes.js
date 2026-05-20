import express from 'express';
import { getMySchedule, addScheduleEntry, getNextClass } from '../controllers/scheduleController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getMySchedule);
router.post('/', auth, addScheduleEntry);
router.get('/next-class', auth, getNextClass);

export default router;
