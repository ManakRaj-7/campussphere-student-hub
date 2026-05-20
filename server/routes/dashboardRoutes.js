import express from 'express';
import { getDashboardSummary, getAiBriefing } from '../controllers/dashboardController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', auth, getDashboardSummary);
router.get('/ai-briefing', auth, getAiBriefing);

export default router;
