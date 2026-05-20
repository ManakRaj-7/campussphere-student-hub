import express from 'express';
import {
  chatWithAssistant,
  summarizeText,
  getStudyRecommendations,
  getChatHistoryList,
} from '../controllers/aiController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', auth, chatWithAssistant);
router.post('/summarize-text', auth, summarizeText);
router.post('/study-insights', auth, getStudyRecommendations);
router.get('/chat-history', auth, getChatHistoryList);

export default router;
