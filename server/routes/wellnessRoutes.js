import express from 'express';
import { getHistory, logWellness, getRecommendation, getStats } from '../controllers/wellnessController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getHistory);
router.get('/history', auth, getHistory); // Support both paths
router.post('/', auth, logWellness);
router.post('/log', auth, logWellness); // Support both paths
router.get('/recommendation', auth, getRecommendation);
router.get('/stats', auth, getStats);

export default router;
