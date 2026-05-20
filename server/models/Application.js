import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'shortlisted', 'interview', 'offered', 'rejected'],
        message: '{VALUE} is not a valid status',
      },
      default: 'applied',
    },
    resume: {
      type: String,
      default: '',
    },
    coverLetter: {
      type: String,
      maxlength: [5000, 'Cover letter cannot exceed 5000 characters'],
      default: '',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });
applicationSchema.index({ status: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
