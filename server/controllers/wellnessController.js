import WellnessLog from '../models/WellnessLog.js';
import Schedule from '../models/Schedule.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';
import { getWellnessRecommendation as getAIWellnessRec } from '../services/aiService.js';

/**
 * Get wellness history for current user
 * GET /api/wellness
 */
export const getHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { days } = req.query;

    const filter = { user: req.user._id };
    if (days) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - parseInt(days, 10));
      filter.date = { $gte: sinceDate };
    }

    const [logs, total] = await Promise.all([
      WellnessLog.find(filter).skip(skip).limit(limit).sort({ date: -1 }),
      WellnessLog.countDocuments(filter),
    ]);

    res.status(200).json(
      formatResponse(
        { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Wellness history retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Log a wellness entry
 * POST /api/wellness
 */
export const logWellness = async (req, res, next) => {
  try {
    const { mood, focusLevel, subject, note } = req.body;

    if (!mood || !focusLevel) {
      throw ApiError.badRequest('Mood and focus level are required.');
    }

    const log = await WellnessLog.create({
      user: req.user._id,
      subject: subject?.trim() || '',
      mood,
      focusLevel,
      note: note || '',
      date: new Date(),
    });

    res.status(201).json(formatResponse({ log }, 'Wellness logged successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI wellness recommendation
 * GET /api/wellness/recommendation
 */
export const getRecommendation = async (req, res, next) => {
  try {
    // Get recent mood history (last 7 days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);

    const moodHistory = await WellnessLog.find({
      user: req.user._id,
      date: { $gte: sinceDate },
    })
      .sort({ date: -1 })
      .limit(14)
      .lean();

    // Get schedule data
    const scheduleData = await Schedule.find({ user: req.user._id })
      .populate('course', 'title code')
      .lean();

    const recommendation = await getAIWellnessRec(moodHistory, scheduleData);

    // Update the latest log with the recommendation
    if (moodHistory.length > 0) {
      await WellnessLog.findByIdAndUpdate(moodHistory[0]._id, {
        aiRecommendation: recommendation,
      });
    }

    res.status(200).json(formatResponse({ recommendation }, 'Wellness recommendation generated.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get wellness stats
 * GET /api/wellness/stats
 */
export const getStats = async (req, res, next) => {
  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);

    const logs = await WellnessLog.find({
      user: req.user._id,
      date: { $gte: sinceDate },
    }).lean();

    const moodCounts = { great: 0, good: 0, okay: 0, low: 0, bad: 0 };
    const focusCounts = { high: 0, medium: 0, low: 0, very_low: 0 };

    logs.forEach((log) => {
      if (moodCounts[log.mood] !== undefined) moodCounts[log.mood]++;
      if (focusCounts[log.focusLevel] !== undefined) focusCounts[log.focusLevel]++;
    });

    const totalLogs = logs.length;
    const moodScore = totalLogs > 0
      ? Math.round(
          ((moodCounts.great * 5 + moodCounts.good * 4 + moodCounts.okay * 3 + moodCounts.low * 2 + moodCounts.bad * 1) / totalLogs) * 20
        )
      : 0;

    res.status(200).json(
      formatResponse(
        {
          totalLogs,
          moodCounts,
          focusCounts,
          moodScore,
          period: '30 days',
        },
        'Wellness stats retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};
