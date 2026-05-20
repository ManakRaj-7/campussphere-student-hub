import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';

/**
 * Get all courses
 * GET /api/courses
 */
export const getCourses = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { department, search } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(filter).skip(skip).limit(limit).sort({ title: 1 }),
      Course.countDocuments(filter),
    ]);

    res.status(200).json(
      formatResponse(
        { courses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Courses retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get course by ID
 * GET /api/courses/:id
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('students', 'name email avatar');

    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    res.status(200).json(formatResponse({ course }, 'Course retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new course
 * POST /api/courses
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, code, department, professor, room, icon, color } = req.body;

    const existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      throw ApiError.conflict('A course with this code already exists.');
    }

    const course = await Course.create({
      title,
      code: code.toUpperCase(),
      department,
      professor: professor || '',
      room: room || '',
      icon: icon || undefined,
      color: color || undefined,
    });

    res.status(201).json(formatResponse({ course }, 'Course created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Enroll in a course
 * POST /api/courses/:id/enroll
 */
export const enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      throw ApiError.notFound('Course not found.');
    }

    const userId = req.user._id;

    if (course.students.includes(userId)) {
      throw ApiError.conflict('You are already enrolled in this course.');
    }

    course.students.push(userId);
    await course.save();

    res.status(200).json(formatResponse({ course }, 'Enrolled in course successfully.'));
  } catch (error) {
    next(error);
  }
};
