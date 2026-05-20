import Schedule from '../models/Schedule.js';
import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get user's weekly schedule
 * GET /api/schedule
 */
export const getMySchedule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const schedule = await Schedule.find({ user: userId })
      .populate('course', 'title code color room professor')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json(formatResponse(schedule, 'Weekly schedule retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new entry to the user's schedule
 * POST /api/schedule
 */
export const addScheduleEntry = async (req, res, next) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime, room, priority } = req.body;
    const userId = req.user._id;

    if (!courseId || dayOfWeek === undefined || !startTime || !endTime) {
      throw ApiError.badRequest('Course ID, day of week, start time, and end time are required.');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const scheduleEntry = await Schedule.create({
      user: userId,
      course: courseId,
      dayOfWeek,
      startTime,
      endTime,
      room: room || course.room || '',
      priority: priority || 'medium',
    });

    const populatedEntry = await scheduleEntry.populate('course', 'title code color room professor');

    res.status(201).json(formatResponse(populatedEntry, 'Schedule entry added successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get the next upcoming class
 * GET /api/schedule/next-class
 */
export const getNextClass = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get current time details
    const now = new Date();
    const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${currentHours}:${currentMinutes}`;

    // Get all schedule entries for user
    const schedule = await Schedule.find({ user: userId })
      .populate('course', 'title code color room professor')
      .sort({ dayOfWeek: 1, startTime: 1 });

    if (schedule.length === 0) {
      return res.status(200).json(formatResponse(null, 'No classes scheduled.'));
    }

    let nextClass = null;

    // 1. Look for remaining classes today
    const classesToday = schedule.filter((entry) => entry.dayOfWeek === currentDay);
    nextClass = classesToday.find((entry) => entry.startTime > currentTimeString);

    // 2. If no more classes today, find the closest class in the upcoming days of the week
    if (!nextClass) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDay = (currentDay + offset) % 7;
        const classesOnDay = schedule.filter((entry) => entry.dayOfWeek === nextDay);
        if (classesOnDay.length > 0) {
          nextClass = classesOnDay[0]; // Get the earliest class on that day
          break;
        }
      }
    }

    res.status(200).json(formatResponse(nextClass, 'Next class retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};
