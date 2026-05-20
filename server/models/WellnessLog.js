import mongoose from 'mongoose';

const wellnessLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    mood: {
      type: String,
      enum: {
        values: ['great', 'good', 'okay', 'low', 'bad'],
        message: '{VALUE} is not a valid mood',
      },
      required: [true, 'Mood is required'],
    },
    focusLevel: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low', 'very_low'],
        message: '{VALUE} is not a valid focus level',
      },
      required: [true, 'Focus level is required'],
    },
    note: {
      type: String,
      maxlength: [1000, 'Note cannot exceed 1000 characters'],
      default: '',
    },
    aiRecommendation: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

wellnessLogSchema.index({ user: 1, date: -1 });

const WellnessLog = mongoose.model('WellnessLog', wellnessLogSchema);

export default WellnessLog;
