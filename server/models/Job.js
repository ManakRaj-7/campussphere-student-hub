import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    salary: {
      type: String,
      default: 'Not disclosed',
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    type: {
      type: String,
      enum: {
        values: ['internship', 'full-time', 'part-time'],
        message: '{VALUE} is not a valid job type',
      },
      required: [true, 'Job type is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Posted by is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ type: 1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

const Job = mongoose.model('Job', jobSchema);

export default Job;
