import express from 'express';
import { getCourses, getCourseById, createCourse, enrollInCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getCourses);
router.get('/:id', auth, getCourseById);
router.post('/', auth, createCourse);
router.post('/:id/enroll', auth, enrollInCourse);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);

export default router;
