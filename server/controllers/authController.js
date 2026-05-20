import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateToken, formatResponse } from '../utils/helpers.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, year } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists.');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      department: department || '',
      year: year || 1,
    });

    const token = generateToken(user._id);

    const userData = user.toJSON();

    res.status(201).json(formatResponse({ user: userData, token }, 'Registration successful.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Please provide email and password.');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = generateToken(user._id);
    const userData = user.toJSON();

    res.status(200).json(formatResponse({ user: userData, token }, 'Login successful.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('joinedClubs', 'name icon color');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    res.status(200).json(formatResponse({ user }, 'User profile retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Please provide current and new passwords.');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters.');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.unauthorized('Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json(formatResponse({ token }, 'Password changed successfully.'));
  } catch (error) {
    next(error);
  }
};
