import Job from '../models/Job.js';
import Application from '../models/Application.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';
import { getPlacementPrep as getAIPlacementPrep } from '../services/aiService.js';

/**
 * Get all jobs
 * GET /api/placement/jobs
 */
export const getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const { type, search, active } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (active !== 'false') filter.isActive = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Job.countDocuments(filter),
    ]);

    res.status(200).json(
      formatResponse(
        { jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Jobs retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get job by ID
 * GET /api/placement/jobs/:id
 */
export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name avatar email');

    if (!job) {
      throw ApiError.notFound('Job not found.');
    }

    res.status(200).json(formatResponse({ job }, 'Job retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a job listing
 * POST /api/placement/jobs
 */
export const createJob = async (req, res, next) => {
  try {
    const { company, title, description, requirements, salary, location, type, deadline } = req.body;

    const job = await Job.create({
      company,
      title,
      description,
      requirements: requirements || [],
      salary: salary || 'Not disclosed',
      location: location || 'Remote',
      type,
      deadline,
      postedBy: req.user._id,
    });

    res.status(201).json(formatResponse({ job }, 'Job listing created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Apply to a job
 * POST /api/placement/jobs/:id/apply
 */
export const applyToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      throw ApiError.notFound('Job not found.');
    }

    if (!job.isActive) {
      throw ApiError.badRequest('This job listing is no longer active.');
    }

    if (new Date() > new Date(job.deadline)) {
      throw ApiError.badRequest('The application deadline has passed.');
    }

    const existingApplication = await Application.findOne({
      user: req.user._id,
      job: job._id,
    });

    if (existingApplication) {
      throw ApiError.conflict('You have already applied to this job.');
    }

    const { coverLetter } = req.body;
    const resume = req.file ? `/uploads/resumes/${req.file.filename}` : '';

    const application = await Application.create({
      user: req.user._id,
      job: job._id,
      coverLetter: coverLetter || '',
      resume,
    });

    // Add user to job applicants
    job.applicants.push(req.user._id);
    await job.save();

    res.status(201).json(formatResponse({ application }, 'Application submitted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get my applications
 * GET /api/placement/applications
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const [applications, total] = await Promise.all([
      Application.find({ user: req.user._id })
        .populate({
          path: 'job',
          select: 'company title type deadline isActive',
        })
        .skip(skip)
        .limit(limit)
        .sort({ appliedAt: -1 }),
      Application.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json(
      formatResponse(
        { applications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Applications retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI placement preparation
 * POST /api/placement/prep
 */
export const getPlacementPrepController = async (req, res, next) => {
  try {
    const { jobType } = req.body;

    const profile = {
      name: req.user.name,
      department: req.user.department,
      year: req.user.year,
      role: req.user.role,
    };

    const prep = await getAIPlacementPrep(profile, jobType || 'full-time');

    res.status(200).json(formatResponse({ prep }, 'Placement prep generated.'));
  } catch (error) {
    next(error);
  }
};
