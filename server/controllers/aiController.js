import * as aiService from '../services/aiService.js';
import ChatHistory from '../models/ChatHistory.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Note from '../models/Note.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * General AI chat assistant with history
 * POST /api/ai/chat
 */
export const chatWithAssistant = async (req, res, next) => {
  try {
    const { messages, context, contextRef } = req.body;
    const userId = req.user._id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw ApiError.badRequest('Please provide a message history.');
    }

    const validContexts = ['notes', 'placement', 'general', 'wellness'];
    const activeContext = context && validContexts.includes(context) ? context : 'general';

    // Build system prompt based on context
    let systemContext = '';
    if (activeContext === 'notes' && contextRef) {
      const note = await Note.findById(contextRef).populate('course', 'title code');
      if (note) {
        systemContext = `You are discussing the note "${note.title}" from the course "${note.course?.title || 'General'}". Here is the note content:\n\n${note.content}`;
      }
    } else if (activeContext === 'placement') {
      const user = await User.findById(userId);
      systemContext = `The user is preparing for placements. Student Profile:\nName: ${user.name}\nDepartment: ${user.department}\nYear: ${user.year}\nBio: ${user.bio || 'Not provided'}`;
    }

    // Call OpenRouter-backed Gemini 3 Flash AI service
    const aiResult = await aiService.chatWithContext(messages, systemContext);
    const aiResponseText = aiResult.responseText;

    // Save to ChatHistory DB
    let chat = null;
    if (contextRef) {
      chat = await ChatHistory.findOne({ user: userId, context: activeContext, contextRef });
    }

    const newMessages = [
      { role: 'user', content: messages[messages.length - 1].content },
      { role: 'assistant', content: aiResponseText },
    ];

    if (chat) {
      chat.messages.push(...newMessages);
      await chat.save();
    } else {
      chat = await ChatHistory.create({
        user: userId,
        context: activeContext,
        contextRef: contextRef || null,
        messages: newMessages,
      });
    }

    res.status(200).json(formatResponse({ response: aiResponseText, metadata: aiResult.metadata, chat }, 'AI response generated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize arbitrary text
 * POST /api/ai/summarize-text
 */
export const summarizeText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      throw ApiError.badRequest('Please provide text to summarize.');
    }

    const summaryResult = await aiService.summarizeLecture(text);

    res.status(200).json(formatResponse(summaryResult, 'Text summarized successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get personalized study recommendations based on course notes count
 * POST /api/ai/study-insights
 */
export const getStudyRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user profile and their course counts to generate insights
    const user = await User.findById(userId);
    const courses = await Course.find({ students: userId });
    const notesCount = await Note.countDocuments({ author: userId });

    const performanceData = {
      student: {
        name: user.name,
        department: user.department,
        year: user.year,
        streak: user.streak || 0,
      },
      enrolledCourses: courses.map((c) => ({ title: c.title, code: c.code })),
      totalNotesCreated: notesCount,
    };

    const recommendations = await aiService.getStudyInsights(performanceData);

    res.status(200).json(formatResponse({ recommendations }, 'Study recommendations retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get past AI chat histories
 * GET /api/ai/chat-history
 */
export const getChatHistoryList = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { context } = req.query;

    const query = { user: userId };
    if (context) {
      query.context = context;
    }

    const chatHistories = await ChatHistory.find(query).sort({ updatedAt: -1 });

    res.status(200).json(formatResponse(chatHistories, 'Chat histories retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};
