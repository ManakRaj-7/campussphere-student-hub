import express from 'express';
import { getAttendanceStats, markAttendance } from '../controllers/attendanceController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', auth, getAttendanceStats);
router.post('/mark', auth, markAttendance);

export default router;
