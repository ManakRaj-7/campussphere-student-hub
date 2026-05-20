import express from 'express';
import { getCourses, getCourseById, createCourse, enrollInCourse } from '../controllers/courseController.js';
import auth, { authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getCourses);
router.get('/:id', auth, getCourseById);
router.post('/', auth, authorize('admin', 'faculty'), createCourse); // Admin or Faculty only
router.post('/:id/enroll', auth, enrollInCourse);

export default router;
