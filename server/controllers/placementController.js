import Job from '../models/Job.js';
import Application from '../models/Application.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';
import { getPlacementPrep as getAIPlacementPrep } from '../services/aiService.js';
import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { getModel } from '../config/gemini.js';

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

/**
 * Diagnose a resume (either pasted text or uploaded file: PDF, Word, LaTeX, txt, md)
 * POST /api/placements/diagnose-resume
 */
export const diagnoseResumeController = async (req, res, next) => {
  let tempFilePath = null;
  try {
    let resumeContent = '';

    if (req.file) {
      tempFilePath = req.file.path;
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      
      console.log(`📄 Parsing resume file of type: ${ext}`);

      if (ext === 'pdf') {
        const dataBuffer = fs.readFileSync(tempFilePath);
        const parsed = await pdf(dataBuffer);
        resumeContent = parsed.text;
      } else if (ext === 'docx' || ext === 'doc') {
        const parsed = await mammoth.extractRawText({ path: tempFilePath });
        resumeContent = parsed.value;
      } else if (ext === 'tex' || ext === 'txt' || ext === 'md') {
        resumeContent = fs.readFileSync(tempFilePath, 'utf8');
      } else {
        throw ApiError.badRequest('Unsupported file type.');
      }
    } else if (req.body.resumeText) {
      resumeContent = req.body.resumeText;
    } else {
      throw ApiError.badRequest('Please upload a resume file or paste your resume details.');
    }

    if (!resumeContent || !resumeContent.trim()) {
      throw ApiError.badRequest('No readable text content found in resume.');
    }

    // Call OpenRouter / Gemini to critique the resume
    const model = getModel();
    if (!model) {
      throw ApiError.internal('AI Service is currently unavailable.');
    }

    const prompt = `Act as an expert technical recruiter and ATS (Applicant Tracking System) parser. Analyze the following resume details and provide a comprehensive and detailed critique.
    Return your response ONLY as a JSON object matching this exact schema structure:
    {
      "score": 82,
      "metrics": {
        "typos": "Excellent - Grammatically correct and completely free of spell errors.",
        "formatting": "Good - Structure is readable but sections can be visually separated better.",
        "actionVerbs": "Fair - Power verbs can be enhanced. Replace standard verbs like 'made' or 'worked' with action verbs.",
        "impactMetrics": "Poor - Needs quantitative proof. Focus on concrete results instead of duties."
      },
      "suggestions": [
        "Quantify your accomplishments. For example: 'Reduced database queries response time by 35% through indexing'.",
        "Ensure your professional summary highlights your key expertise and primary developer stack directly.",
        "Move skills section to the top to enhance ATS scan visibility."
      ]
    }

    Resume content:
    ${resumeContent}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('AI returned invalid response format.');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
    }

    res.status(200).json(formatResponse(parsedData, 'Resume diagnostics completed successfully.'));
  } catch (error) {
    // Clean up temporary file in case of failure
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Error deleting temp file on failure:', e);
      }
    }
    next(error);
  }
};

