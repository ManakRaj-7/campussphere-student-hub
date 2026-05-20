import mongoose from 'mongoose';

const messageSubSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    context: {
      type: String,
      enum: {
        values: ['notes', 'placement', 'general', 'wellness'],
        message: '{VALUE} is not a valid context',
      },
      required: [true, 'Context is required'],
    },
    contextRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    messages: [messageSubSchema],
  },
  {
    timestamps: true,
  }
);

chatHistorySchema.index({ user: 1, context: 1 });
chatHistorySchema.index({ user: 1, updatedAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
