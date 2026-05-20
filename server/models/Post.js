import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Author is required'],
      refPath: 'authorModel',
    },
    authorModel: {
      type: String,
      required: true,
      enum: ['User', 'Club'],
      default: 'User',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    images: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
