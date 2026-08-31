const Post = require('../models/Post');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { calculateHotScore } = require('../services/rankingService');
const { maskPost } = require('../services/privacyService');
const AppError = require('../utils/AppError');

// Author fields to always populate
const AUTHOR_SELECT = 'username displayName avatar';

// Base64 Cursor helpers
const encodeCursor = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');
const decodeCursor = (str) => {
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString('utf-8'));
  } catch (e) {
    return null;
  }
};

// Helper: fetch user votes map for a list of posts
const getUserVotesMap = async (userId, postIds) => {
  if (!userId || !postIds.length) return {};
  const votes = await Vote.find({ userId, postId: { $in: postIds } });
  const map = {};
  votes.forEach((v) => { map[v.postId.toString()] = v.value; });
  return map;
};

// Helper: fetch bookmark IDs set for current user
const getUserBookmarkSet = async (userId, postIds) => {
  if (!userId || !postIds.length) return new Set();
  const user = await User.findById(userId).select('bookmarks');
  if (!user) return new Set();
  const bookmarkSet = new Set(user.bookmarks.map((id) => id.toString()));
  return bookmarkSet;
};

// POST /api/posts — Create a new post
const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl, tag, latitude, longitude, repostOf, quoteContent } = req.body;

    if (!content && !repostOf) {
      return next(new AppError('Content is required', 400, 'INVALID_INPUT'));
    }

    if (!tag) {
      return next(new AppError('Tag/flair is required', 400, 'INVALID_INPUT'));
    }

    const allowedTags = ['Confession', 'Event', 'Question', 'Rant', 'Discussion', 'News', 'Help', 'Meme', 'Other'];
    if (!allowedTags.includes(tag)) {
      return next(new AppError('Invalid tag/flair selected', 400, 'INVALID_INPUT'));
    }

    // Validate repost target
    if (repostOf) {
      const original = await Post.findById(repostOf);
      if (!original) {
        return next(new AppError('Original post not found', 404, 'NOT_FOUND'));
      }
      // Increment original post repostCount
      await Post.findByIdAndUpdate(repostOf, { $inc: { repostCount: 1 } });
    }

    let postLocation = undefined;
    if (latitude !== undefined && longitude !== undefined) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return next(new AppError('Invalid coordinates supplied', 400, 'INVALID_INPUT'));
      }
      postLocation = { type: 'Point', coordinates: [lng, lat] };
    }

    const post = await Post.create({
      author: req.user._id,
      content: content ? content.trim() : '',
      imageUrl: imageUrl || '',
      tag,
      location: postLocation,
      repostOf: repostOf || null,
      quoteContent: quoteContent ? quoteContent.trim().slice(0, 500) : '',
    });

    post.hotScore = calculateHotScore(0, 0, post.createdAt);
    await post.save();

    const populated = await Post.findById(post._id).populate('author', AUTHOR_SELECT).populate('repostOf');

    res.status(201).json({
      success: true,
      data: maskPost(populated, postLocation ? postLocation.coordinates : null),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/global — Cursor-paginated Global Feed
const getGlobalFeed = async (req, res, next) => {
  try {
    const sortType = req.query.sort || 'hot';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    const query = { reportsCount: { $lt: 5 }, repostOf: null };
    let sortQuery = {};
    const decodedCursor = cursor ? decodeCursor(cursor) : null;

    if (sortType === 'new') {
      sortQuery = { createdAt: -1, _id: -1 };
      if (decodedCursor) {
        query.$or = [
          { createdAt: { $lt: new Date(decodedCursor.lastCreatedAt) } },
          { createdAt: new Date(decodedCursor.lastCreatedAt), _id: { $lt: decodedCursor.lastId } },
        ];
      }
    } else if (sortType === 'top') {
      sortQuery = { score: -1, _id: -1 };
      if (decodedCursor) {
        query.$or = [
          { score: { $lt: Number(decodedCursor.lastScore) } },
          { score: Number(decodedCursor.lastScore), _id: { $lt: decodedCursor.lastId } },
        ];
      }
    } else {
      sortQuery = { hotScore: -1, _id: -1 };
      if (decodedCursor) {
        query.$or = [
          { hotScore: { $lt: Number(decodedCursor.lastHotScore) } },
          { hotScore: Number(decodedCursor.lastHotScore), _id: { $lt: decodedCursor.lastId } },
        ];
      }
    }

    const posts = await Post.find(query)
      .populate('author', AUTHOR_SELECT)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_SELECT } })
      .sort(sortQuery)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user?._id, postIds),
      getUserBookmarkSet(req.user?._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, null, userVotesMap, bookmarkSet)
    );

    let nextCursor = null;
    if (hasMore && paginatedPosts.length > 0) {
      const last = paginatedPosts[paginatedPosts.length - 1];
      if (sortType === 'new') nextCursor = encodeCursor({ lastId: last._id, lastCreatedAt: last.createdAt });
      else if (sortType === 'top') nextCursor = encodeCursor({ lastId: last._id, lastScore: last.score });
      else nextCursor = encodeCursor({ lastId: last._id, lastHotScore: last.hotScore });
    }

    res.status(200).json({ success: true, data: { posts: formattedPosts, nextCursor, hasMore } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/following — Feed of posts by followed users
const getFollowingFeed = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor;

    const following = req.user.following || [];
    if (!following.length) {
      return res.status(200).json({
        success: true,
        data: { posts: [], nextCursor: null, hasMore: false },
      });
    }

    const query = { author: { $in: following }, reportsCount: { $lt: 5 } };
    const sortQuery = { createdAt: -1, _id: -1 };
    const decodedCursor = cursor ? decodeCursor(cursor) : null;

    if (decodedCursor) {
      query.$or = [
        { createdAt: { $lt: new Date(decodedCursor.lastCreatedAt) } },
        { createdAt: new Date(decodedCursor.lastCreatedAt), _id: { $lt: decodedCursor.lastId } },
      ];
    }

    const posts = await Post.find(query)
      .populate('author', AUTHOR_SELECT)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_SELECT } })
      .sort(sortQuery)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user._id, postIds),
      getUserBookmarkSet(req.user._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, null, userVotesMap, bookmarkSet)
    );

    let nextCursor = null;
    if (hasMore && paginatedPosts.length > 0) {
      const last = paginatedPosts[paginatedPosts.length - 1];
      nextCursor = encodeCursor({ lastId: last._id, lastCreatedAt: last.createdAt });
    }

    res.status(200).json({ success: true, data: { posts: formattedPosts, nextCursor, hasMore } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/user/:username — All posts by a specific user
const getUserPosts = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!targetUser) return next(new AppError('User not found', 404, 'NOT_FOUND'));

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: targetUser._id, reportsCount: { $lt: 5 } })
      .populate('author', AUTHOR_SELECT)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_SELECT } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user?._id, postIds),
      getUserBookmarkSet(req.user?._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, null, userVotesMap, bookmarkSet)
    );

    res.status(200).json({ success: true, data: { posts: formattedPosts, hasMore, page } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/user/:username/replies — Posts that user commented on
const getUserReplies = async (req, res, next) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!targetUser) return next(new AppError('User not found', 404, 'NOT_FOUND'));

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Get distinct post IDs the user has commented on
    const comments = await Comment.find({ author: targetUser._id })
      .distinct('postId');

    const posts = await Post.find({ _id: { $in: comments }, reportsCount: { $lt: 5 } })
      .populate('author', AUTHOR_SELECT)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user?._id, postIds),
      getUserBookmarkSet(req.user?._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, null, userVotesMap, bookmarkSet)
    );

    res.status(200).json({ success: true, data: { posts: formattedPosts, hasMore, page } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/nearby — Geolocation nearby feed
const getNearbyFeed = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const radius = parseFloat(req.query.radius) || 10;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!lat || !lng) {
      return next(new AppError('Coordinates (lat, lng) are required for Nearby feed', 400, 'INVALID_INPUT'));
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return next(new AppError('Invalid coordinates supplied', 400, 'INVALID_INPUT'));
    }

    const allowedRadii = [1, 5, 10, 25];
    if (!allowedRadii.includes(radius)) {
      return next(new AppError('Radius must be 1, 5, 10, or 25 km', 400, 'INVALID_INPUT'));
    }

    const geoQuery = {
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radius * 1000,
        },
      },
      reportsCount: { $lt: 5 },
    };

    const skip = (page - 1) * limit;
    const posts = await Post.find(geoQuery)
      .populate('author', AUTHOR_SELECT)
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user?._id, postIds),
      getUserBookmarkSet(req.user?._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, [longitude, latitude], userVotesMap, bookmarkSet)
    );

    res.status(200).json({ success: true, data: { posts: formattedPosts, hasMore, page } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/home — Home circle feed using saved location
const getHomeFeed = async (req, res, next) => {
  try {
    if (!req.user.homeLocation || !req.user.homeLocation.coordinates) {
      return next(new AppError('Home location is not configured. Please set a Home location.', 400, 'USER_HOME_NOT_SET'));
    }

    const [longitude, latitude] = req.user.homeLocation.coordinates;
    const radius = parseFloat(req.query.radius) || 10;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const allowedRadii = [1, 5, 10, 25];
    if (!allowedRadii.includes(radius)) {
      return next(new AppError('Radius must be 1, 5, 10, or 25 km', 400, 'INVALID_INPUT'));
    }

    const query = {
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radius * 1000,
        },
      },
      reportsCount: { $lt: 5 },
    };

    const skip = (page - 1) * limit;
    const posts = await Post.find(query)
      .populate('author', AUTHOR_SELECT)
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user._id, postIds),
      getUserBookmarkSet(req.user._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, [longitude, latitude], userVotesMap, bookmarkSet)
    );

    res.status(200).json({ success: true, data: { posts: formattedPosts, hasMore, page } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/:id — Post detail
const getPostDetail = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', AUTHOR_SELECT)
      .populate({ path: 'repostOf', populate: { path: 'author', select: AUTHOR_SELECT } });

    if (!post) return next(new AppError('Post not found', 404, 'NOT_FOUND'));
    if (post.reportsCount >= 5) return next(new AppError('Post unavailable due to reports', 404, 'UNAVAILABLE'));

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user?._id, [post._id]),
      getUserBookmarkSet(req.user?._id, [post._id]),
    ]);

    res.status(200).json({ success: true, data: maskPost(post, null, userVotesMap, bookmarkSet) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError('Post not found', 404, 'NOT_FOUND'));

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to delete this post', 403, 'FORBIDDEN'));
    }

    await Post.findByIdAndDelete(post._id);
    await Vote.deleteMany({ postId: post._id });
    await Comment.deleteMany({ postId: post._id });

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/vote
const votePost = async (req, res, next) => {
  try {
    const { value } = req.body;
    const postId = req.params.id;

    if (value !== 1 && value !== -1) {
      return next(new AppError('Vote value must be 1 (upvote) or -1 (downvote)', 400, 'INVALID_INPUT'));
    }

    const post = await Post.findById(postId);
    if (!post) return next(new AppError('Post not found', 404, 'NOT_FOUND'));

    const userId = req.user._id;
    const existingVote = await Vote.findOne({ userId, postId });

    if (!existingVote) {
      await Vote.create({ userId, postId, value });
      if (value === 1) post.upvotes += 1;
      else post.downvotes += 1;
    } else if (existingVote.value === value) {
      await Vote.findByIdAndDelete(existingVote._id);
      if (value === 1) post.upvotes -= 1;
      else post.downvotes -= 1;
    } else {
      existingVote.value = value;
      await existingVote.save();
      if (value === 1) { post.upvotes += 1; post.downvotes -= 1; }
      else { post.downvotes += 1; post.upvotes -= 1; }
    }

    post.score = post.upvotes - post.downvotes;
    post.hotScore = calculateHotScore(post.upvotes, post.downvotes, post.createdAt);
    await post.save();

    res.status(200).json({ success: true, data: { score: post.score, upvotes: post.upvotes, downvotes: post.downvotes } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/posts/:id/vote
const removeVote = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return next(new AppError('Post not found', 404, 'NOT_FOUND'));

    const existingVote = await Vote.findOne({ userId, postId });
    if (existingVote) {
      const val = existingVote.value;
      await Vote.findByIdAndDelete(existingVote._id);
      if (val === 1) post.upvotes = Math.max(0, post.upvotes - 1);
      else post.downvotes = Math.max(0, post.downvotes - 1);
      post.score = post.upvotes - post.downvotes;
      post.hotScore = calculateHotScore(post.upvotes, post.downvotes, post.createdAt);
      await post.save();
    }

    res.status(200).json({ success: true, data: { score: post.score, upvotes: post.upvotes, downvotes: post.downvotes } });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/search
const searchPosts = async (req, res, next) => {
  try {
    const { q, tag, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const query = { reportsCount: { $lt: 5 } };
    if (q) query.$text = { $search: q };
    if (tag && tag !== 'All') query.tag = tag;

    let sortQuery = {};
    if (sort === 'newest' || sort === 'new') sortQuery = { createdAt: -1 };
    else if (sort === 'oldest' || sort === 'old') sortQuery = { createdAt: 1 };
    else if (sort === 'top' || sort === 'upvoted') sortQuery = { score: -1 };
    else if (sort === 'discussed' || sort === 'comments') sortQuery = { commentCount: -1 };
    else sortQuery = q ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

    const posts = await Post.find(query, q ? { score: { $meta: 'textScore' } } : {})
      .populate('author', AUTHOR_SELECT)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit + 1);

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const postIds = paginatedPosts.map((p) => p._id);

    const [userVotesMap, bookmarkSet] = await Promise.all([
      getUserVotesMap(req.user?._id, postIds),
      getUserBookmarkSet(req.user?._id, postIds),
    ]);

    const formattedPosts = paginatedPosts.map((post) =>
      maskPost(post, null, userVotesMap, bookmarkSet)
    );

    res.status(200).json({ success: true, data: { posts: formattedPosts, hasMore, page } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getGlobalFeed,
  getFollowingFeed,
  getUserPosts,
  getUserReplies,
  getNearbyFeed,
  getHomeFeed,
  getPostDetail,
  deletePost,
  votePost,
  removeVote,
  searchPosts,
};
