const Comment = require('../models/Comment');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');

const AUTHOR_SELECT = 'username displayName avatar';

// GET /api/posts/:id/comments
const getPostComments = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return next(new AppError('Post not found', 404, 'NOT_FOUND'));
    }

    const comments = await Comment.find({ postId })
      .populate('author', AUTHOR_SELECT)
      .sort({ createdAt: 1 });

    // Build hierarchical tree O(N) using map
    const commentMap = {};
    const commentsTree = [];

    comments.forEach((comment) => {
      const obj = comment.toObject();
      // Mask deleted comments
      if (obj.isDeleted) {
        obj.content = '[Deleted]';
        obj.author = { username: '[deleted]', displayName: '[deleted]', avatar: '' };
      }
      commentMap[obj._id.toString()] = { ...obj, replies: [] };
    });

    comments.forEach((comment) => {
      const commentId = comment._id.toString();
      const parentId = comment.parentCommentId ? comment.parentCommentId.toString() : null;

      if (parentId && commentMap[parentId]) {
        commentMap[parentId].replies.push(commentMap[commentId]);
      } else {
        commentsTree.push(commentMap[commentId]);
      }
    });

    res.status(200).json({ success: true, data: commentsTree });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/comments
const createComment = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { content, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return next(new AppError('Comment content is required', 400, 'INVALID_INPUT'));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(new AppError('Post not found', 404, 'NOT_FOUND'));
    }

    if (parentCommentId) {
      const parentExists = await Comment.exists({ _id: parentCommentId, postId });
      if (!parentExists) {
        return next(new AppError('Parent comment not found in this post context', 404, 'NOT_FOUND'));
      }
    }

    const comment = await Comment.create({
      postId,
      author: req.user._id,
      parentCommentId: parentCommentId || null,
      content: content.trim(),
    });

    await comment.populate('author', AUTHOR_SELECT);

    post.commentCount += 1;
    await post.save();

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return next(new AppError('Comment not found', 404, 'NOT_FOUND'));
    }

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Unauthorized to delete this comment', 403, 'FORBIDDEN'));
    }

    const hasReplies = await Comment.exists({ parentCommentId: comment._id });

    if (hasReplies) {
      // Soft-delete: mark as deleted to preserve nested structure
      comment.isDeleted = true;
      comment.content = '[Deleted]';
      await comment.save();
    } else {
      await Comment.findByIdAndDelete(comment._id);
    }

    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments/:id/vote
const voteComment = async (req, res, next) => {
  try {
    const { value } = req.body;
    if (value !== 1 && value !== -1) {
      return next(new AppError('Vote value must be 1 or -1', 400, 'INVALID_INPUT'));
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return next(new AppError('Comment not found', 404, 'NOT_FOUND'));
    }

    comment.score = Math.max(-1000, Math.min(1000, comment.score + value));
    await comment.save();

    res.status(200).json({ success: true, data: { score: comment.score } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPostComments,
  createComment,
  deleteComment,
  voteComment,
};
