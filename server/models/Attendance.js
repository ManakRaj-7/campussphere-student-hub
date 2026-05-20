import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late'],
        message: '{VALUE} is not a valid status',
      },
      required: [true, 'Attendance status is required'],
    },
    markedBy: {
      type: String,
      enum: {
        values: ['self', 'faculty', 'system'],
        message: '{VALUE} is not a valid marker',
      },
      default: 'self',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ user: 1, course: 1, date: 1 });
attendanceSchema.index({ course: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
