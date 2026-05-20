import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    icon: {
      type: String,
      default: '🎯',
    },
    color: {
      type: String,
      default: '#8b5cf6',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Club admin is required'],
    },
  },
  {
    timestamps: true,
  }
);

clubSchema.index({ name: 1 });
clubSchema.index({ admin: 1 });

const Club = mongoose.model('Club', clubSchema);

export default Club;
