import Note from '../models/Note.js';
import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';
import { summarizeLecture } from '../services/aiService.js';

/**
 * Get notes (filtered by course, author, or search)
 * GET /api/notes
 */
export const getNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { course, search, tag } = req.query;

    const filter = {
      $or: [{ isPublic: true }, { author: req.user._id }],
    };

    if (course) filter.course = course;
    if (tag) filter.tags = { $in: [tag] };
    if (search) {
      filter.$and = [
        { $or: filter.$or },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete filter.$or;
    }

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate('author', 'name avatar')
        .populate('course', 'title code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Note.countDocuments(filter),
    ]);

    res.status(200).json(
      formatResponse(
        { notes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Notes retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get note by ID
 * GET /api/notes/:id
 */
export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('course', 'title code');

    if (!note) {
      throw ApiError.notFound('Note not found.');
    }

    if (!note.isPublic && note.author._id.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You do not have access to this note.');
    }

    res.status(200).json(formatResponse({ note }, 'Note retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new note
 * POST /api/notes
 */
export const createNote = async (req, res, next) => {
  try {
    const { title, content, course, tags, isPublic } = req.body;

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      throw ApiError.notFound('Course not found.');
    }

    const note = await Note.create({
      title,
      content,
      course,
      author: req.user._id,
      tags: tags || [],
      isPublic: isPublic || false,
    });

    // Update note count on course
    await Course.findByIdAndUpdate(course, { $inc: { noteCount: 1 } });

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name avatar')
      .populate('course', 'title code');

    res.status(201).json(formatResponse({ note: populatedNote }, 'Note created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update a note
 * PUT /api/notes/:id
 */
export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      throw ApiError.notFound('Note not found.');
    }

    if (note.author.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You can only edit your own notes.');
    }

    const allowedFields = ['title', 'content', 'tags', 'isPublic'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('author', 'name avatar')
      .populate('course', 'title code');

    res.status(200).json(formatResponse({ note: updatedNote }, 'Note updated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a note
 * DELETE /api/notes/:id
 */
export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      throw ApiError.notFound('Note not found.');
    }

    if (note.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only delete your own notes.');
    }

    await Course.findByIdAndUpdate(note.course, { $inc: { noteCount: -1 } });
    await Note.findByIdAndDelete(note._id);

    res.status(200).json(formatResponse(null, 'Note deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize a note using AI
 * POST /api/notes/:id/summarize
 */
export const summarizeNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      throw ApiError.notFound('Note not found.');
    }

    const result = await summarizeLecture(note.content);

    note.aiSummary = result.summary;
    note.keyInsights = result.keyInsights;
    note.transcriptionQuality = result.quality;
    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('author', 'name avatar')
      .populate('course', 'title code');

    res.status(200).json(formatResponse({ note: updatedNote }, 'Note summarized successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a lecture file and create a note
 * POST /api/notes/upload
 */
export const uploadLectureFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('Please upload a file.');
    }

    const { title, course, tags, isPublic } = req.body;

    if (!title || !course) {
      throw ApiError.badRequest('Title and course are required.');
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      throw ApiError.notFound('Course not found.');
    }

    const filePath = `/uploads/notes/${req.file.filename}`;

    const note = await Note.create({
      title,
      content: `Lecture file uploaded: ${req.file.originalname}`,
      course,
      author: req.user._id,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
      isPublic: isPublic === 'true' || isPublic === true,
      attachments: [filePath],
    });

    await Course.findByIdAndUpdate(course, { $inc: { noteCount: 1 } });

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name avatar')
      .populate('course', 'title code');

    res.status(201).json(formatResponse({ note: populatedNote }, 'Lecture file uploaded and note created.'));
  } catch (error) {
    next(error);
  }
};
