import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get user profile by ID
 * GET /api/users/:id
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('joinedClubs', 'name icon color');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    res.status(200).json(formatResponse({ user }, 'User profile retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'department', 'year'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    res.status(200).json(formatResponse({ user }, 'Profile updated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 * POST /api/users/avatar
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('Please upload an image file.');
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    res.status(200).json(formatResponse({ user }, 'Avatar uploaded successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all registered users except current user
 * GET /api/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email avatar role department year bio streak joinedClubs')
      .populate('joinedClubs', 'name icon color');

    res.status(200).json(formatResponse({ users }, 'All users retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

