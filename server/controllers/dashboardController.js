import User from '../models/User.js';
import Course from '../models/Course.js';
import Note from '../models/Note.js';
import Event from '../models/Event.js';
import Job from '../models/Job.js';
import Schedule from '../models/Schedule.js';
import Attendance from '../models/Attendance.js';
import WellnessLog from '../models/WellnessLog.js';
import * as aiService from '../services/aiService.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get aggregated dashboard summary data
 * GET /api/dashboard/summary
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Get user details
    const user = await User.findById(userId).select('name email streak department year avatar');

    // 2. Fetch enrolled courses
    const enrolledCourses = await Course.find({ students: userId }).select('title code color room professor');

    // 3. Fetch next class
    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${currentHours}:${currentMinutes}`;

    const schedule = await Schedule.find({ user: userId })
      .populate('course', 'title code color room professor')
      .sort({ dayOfWeek: 1, startTime: 1 });

    let nextClass = null;
    const classesToday = schedule.filter((entry) => entry.dayOfWeek === currentDay);
    nextClass = classesToday.find((entry) => entry.startTime > currentTimeString);

    if (!nextClass && schedule.length > 0) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDay = (currentDay + offset) % 7;
        const classesOnDay = schedule.filter((entry) => entry.dayOfWeek === nextDay);
        if (classesOnDay.length > 0) {
          nextClass = classesOnDay[0];
          break;
        }
      }
    }

    // 4. Calculate attendance percentage
    const attendanceRecords = await Attendance.find({ user: userId });
    const totalAttendance = attendanceRecords.length;
    const attendedCount = attendanceRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
    const attendancePercentage = totalAttendance > 0 ? Math.round((attendedCount / totalAttendance) * 100) : 100;

    // 5. Recent notes
    const recentNotes = await Note.find({ author: userId })
      .populate('course', 'title code color')
      .sort({ updatedAt: -1 })
      .limit(3);

    // 6. Upcoming events
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(3);

    // 7. Recent jobs
    const activeJobs = await Job.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3);

    // 8. Wellness mood check today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const todayMood = await WellnessLog.findOne({
      user: userId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    res.status(200).json(
      formatResponse(
        {
          user,
          enrolledCourses,
          nextClass,
          attendance: {
            streak: user.streak || 0,
            percentage: attendancePercentage,
            totalRecords: totalAttendance,
          },
          recentNotes,
          upcomingEvents,
          activeJobs,
          todayMood: todayMood ? { mood: todayMood.mood, focusLevel: todayMood.focusLevel } : null,
        },
        'Dashboard summary retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate AI-powered morning briefing
 * GET /api/dashboard/ai-briefing
 */
export const getAiBriefing = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Gather student context
    const user = await User.findById(userId).select('name department year streak');
    const courses = await Course.find({ students: userId }).select('title code');

    // Get today's schedule
    const now = new Date();
    const currentDay = now.getDay();
    const todaySchedule = await Schedule.find({ user: userId, dayOfWeek: currentDay })
      .populate('course', 'title code room startTime')
      .sort({ startTime: 1 });

    const wellnessLogs = await WellnessLog.find({ user: userId }).sort({ createdAt: -1 }).limit(3);

    const userData = {
      name: user.name,
      department: user.department,
      year: user.year,
      streak: user.streak || 0,
      courses: courses.map((c) => c.title),
      todayClassesCount: todaySchedule.length,
      todayClasses: todaySchedule.map((s) => ({
        title: s.course?.title,
        time: s.startTime,
        room: s.room,
      })),
      recentMoods: wellnessLogs.map((l) => l.mood),
    };

    const briefing = await aiService.generateDailyBriefing(userData);

    res.status(200).json(formatResponse({ briefing }, 'AI morning briefing generated.'));
  } catch (error) {
    next(error);
  }
};
