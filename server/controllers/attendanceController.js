import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get attendance stats for the current user
 * GET /api/attendance/stats
 */
export const getAttendanceStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user streak
    const user = await User.findById(userId).select('streak');
    const streak = user ? user.streak || 0 : 0;

    // Find all attendance records for user
    const records = await Attendance.find({ user: userId }).populate('course', 'title code color');

    // Group stats by course
    const courseStats = {};
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;

    records.forEach((record) => {
      if (!record.course) return;
      const courseId = record.course._id.toString();

      if (!courseStats[courseId]) {
        courseStats[courseId] = {
          course: record.course,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }

      courseStats[courseId].total += 1;
      if (record.status === 'present') {
        courseStats[courseId].present += 1;
        totalPresent += 1;
      } else if (record.status === 'late') {
        courseStats[courseId].late += 1;
        totalLate += 1;
      } else {
        courseStats[courseId].absent += 1;
        totalAbsent += 1;
      }
    });

    const formattedStats = Object.values(courseStats).map((stat) => {
      // Late counts as 0.7 or full present for simplified grading? Let's treat present and late as "attended" but calculate percentage
      const totalAttended = stat.present + stat.late;
      const percentage = stat.total > 0 ? Math.round((totalAttended / stat.total) * 100) : 100;
      return {
        ...stat,
        percentage,
      };
    });

    const overallTotal = totalPresent + totalLate + totalAbsent;
    const overallAttended = totalPresent + totalLate;
    const overallPercentage = overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 100;

    res.status(200).json(
      formatResponse(
        {
          streak,
          stats: formattedStats,
          overall: {
            total: overallTotal,
            present: totalPresent,
            late: totalLate,
            absent: totalAbsent,
            percentage: overallPercentage,
          },
        },
        'Attendance stats retrieved successfully.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark attendance for a course
 * POST /api/attendance/mark
 */
export const markAttendance = async (req, res, next) => {
  try {
    const { courseId, status, date } = req.body;
    const userId = req.user._id;

    if (!courseId || !status) {
      throw ApiError.badRequest('Course ID and status are required.');
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      throw ApiError.badRequest('Invalid status. Must be present, absent, or late.');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    // Set date to today if not provided (start of day to prevent multiple marks in a day)
    const recordDate = date ? new Date(date) : new Date();
    recordDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this user, course, and day
    const startOfDay = new Date(recordDate);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await Attendance.findOne({
      user: userId,
      course: courseId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const isNew = !attendance;

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        user: userId,
        course: courseId,
        date: recordDate,
        status,
        markedBy: 'self',
      });
    }

    // Handle user streak adjustments
    if (status === 'present' || status === 'late') {
      // Fetch user and increment streak if it's a new present/late record today
      if (isNew) {
        await User.findByIdAndUpdate(userId, { $inc: { streak: 1 } });
      }
    } else if (status === 'absent') {
      // Reset streak on absence
      await User.findByIdAndUpdate(userId, { $set: { streak: 0 } });
    }

    res.status(200).json(formatResponse(attendance, `Attendance marked as ${status}.`));
  } catch (error) {
    next(error);
  }
};
