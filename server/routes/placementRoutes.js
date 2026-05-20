import express from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  applyToJob,
  getMyApplications,
  getPlacementPrepController,
} from '../controllers/placementController.js';
import auth, { authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/jobs', auth, getJobs);
router.get('/jobs/:id', auth, getJobById);
router.post('/jobs', auth, authorize('admin', 'faculty'), createJob); // Only admins/faculty can create job postings
router.post('/jobs/:id/apply', auth, upload.single('resume'), applyToJob);
router.get('/applications', auth, getMyApplications);
router.post('/prep', auth, getPlacementPrepController);
router.get('/prep', auth, getPlacementPrepController); // Support GET for placement prep too

export default router;
