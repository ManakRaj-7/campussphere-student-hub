import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: [0, 'Day must be 0-6 (Sun-Sat)'],
      max: [6, 'Day must be 0-6 (Sun-Sat)'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'],
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ user: 1, dayOfWeek: 1 });
scheduleSchema.index({ course: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
