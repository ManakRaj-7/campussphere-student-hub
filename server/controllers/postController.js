import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import ApiError from '../utils/ApiError.js';
import { formatResponse, paginate } from '../utils/helpers.js';

/**
 * Get feed (paginated posts)
 * GET /api/posts
 */
export const getFeed = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const [posts, total] = await Promise.all([
      Post.find()
        .populate('author', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Post.countDocuments(),
    ]);

    res.status(200).json(
      formatResponse(
        { posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Feed retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single post
 * GET /api/posts/:id
 */
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name avatar');

    if (!post) {
      throw ApiError.notFound('Post not found.');
    }

    res.status(200).json(formatResponse({ post }, 'Post retrieved.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a post
 * POST /api/posts
 */
export const createPost = async (req, res, next) => {
  try {
    const { content, authorModel } = req.body;

    const images = req.files
      ? req.files.map((file) => `/uploads/posts/${file.filename}`)
      : [];

    const post = await Post.create({
      author: req.user._id,
      authorModel: authorModel || 'User',
      content,
      images,
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar');

    res.status(201).json(formatResponse({ post: populatedPost }, 'Post created successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update a post
 * PUT /api/posts/:id
 */
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw ApiError.notFound('Post not found.');
    }

    if (post.author.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('You can only edit your own posts.');
    }

    if (req.body.content !== undefined) {
      post.content = req.body.content;
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/posts/${file.filename}`);
      post.images = [...post.images, ...newImages];
    }

    await post.save();

    const updatedPost = await Post.findById(post._id).populate('author', 'name avatar');

    res.status(200).json(formatResponse({ post: updatedPost }, 'Post updated successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a post
 * DELETE /api/posts/:id
 */
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw ApiError.notFound('Post not found.');
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only delete your own posts.');
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(post._id);

    res.status(200).json(formatResponse(null, 'Post deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like on a post
 * POST /api/posts/:id/like
 */
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw ApiError.notFound('Post not found.');
    }

    const userId = req.user._id;
    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    let liked;
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      liked = false;
    } else {
      post.likes.push(userId);
      liked = true;
    }

    await post.save();

    res.status(200).json(
      formatResponse(
        { liked, likeCount: post.likes.length },
        liked ? 'Post liked.' : 'Post unliked.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add a comment to a post
 * POST /api/posts/:id/comments
 */
export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      throw ApiError.notFound('Post not found.');
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
    });

    post.commentCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name avatar'
    );

    res.status(201).json(formatResponse({ comment: populatedComment }, 'Comment added.'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a post
 * GET /api/posts/:id/comments
 */
export const getComments = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);

    const [comments, total] = await Promise.all([
      Comment.find({ post: req.params.id })
        .populate('author', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Comment.countDocuments({ post: req.params.id }),
    ]);

    res.status(200).json(
      formatResponse(
        { comments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        'Comments retrieved.'
      )
    );
  } catch (error) {
    next(error);
  }
};
