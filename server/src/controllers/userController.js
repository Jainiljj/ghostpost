const User = require('../models/User');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');

// Helper: build the public user response shape
const formatUser = (user) => ({
  _id: user._id,
  username: user.username,
  displayName: user.displayName || user.username,
  email: user.email,
  bio: user.bio,
  avatar: user.avatar,
  headerImage: user.headerImage,
  followers: user.followers,
  following: user.following,
  homeLocation: user.homeLocation,
  role: user.role,
  joinedDate: user.joinedDate,
});

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    // Re-fetch fresh user data with populated arrays
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404, 'NOT_FOUND'));

    res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:username — Public profile
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-password -email');

    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    const isFollowing = req.user
      ? user.followers.some((id) => id.toString() === req.user._id.toString())
      : false;

    res.status(200).json({
      success: true,
      data: {
        ...formatUser(user),
        followerCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me — Update own profile
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, avatar, headerImage, username } = req.body;
    const user = req.user;

    // Username change: validate uniqueness
    if (username && username.toLowerCase() !== user.username) {
      const usernameLower = username.toLowerCase();

      if (usernameLower.length < 3 || usernameLower.length > 30) {
        return next(new AppError('Username must be between 3 and 30 characters', 400, 'INVALID_INPUT'));
      }
      if (!/^[a-zA-Z0-9_]+$/.test(usernameLower)) {
        return next(new AppError('Username may only contain letters, numbers, and underscores', 400, 'INVALID_INPUT'));
      }

      const taken = await User.exists({ username: usernameLower, _id: { $ne: user._id } });
      if (taken) {
        return next(new AppError('Username is already taken', 400, 'DUPLICATE_USERNAME'));
      }
      user.username = usernameLower;
    }

    if (displayName !== undefined) user.displayName = displayName.trim().slice(0, 50);
    if (bio !== undefined) user.bio = bio.trim().slice(0, 160);
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (headerImage !== undefined) user.headerImage = headerImage.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/password — Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Current password, new password, and confirmation are required', 400, 'INVALID_INPUT'));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('New password and confirmation do not match', 400, 'INVALID_INPUT'));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long', 400, 'INVALID_INPUT'));
    }

    // Re-fetch with password selected
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return next(new AppError('User not found', 404, 'NOT_FOUND'));

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS'));
    }

    user.password = newPassword;
    await user.save(); // pre-save hook hashes it

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:id/follow
const followUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id;

    if (targetId === currentUserId.toString()) {
      return next(new AppError('You cannot follow yourself', 400, 'INVALID_INPUT'));
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    // Atomically add to followers/following
    await User.findByIdAndUpdate(targetId, {
      $addToSet: { followers: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetId },
    });

    res.status(200).json({
      success: true,
      message: `You are now following @${targetUser.username}`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/:id/unfollow
const unfollowUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    // Atomically remove from followers/following
    await User.findByIdAndUpdate(targetId, {
      $pull: { followers: currentUserId },
    });
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetId },
    });

    res.status(200).json({
      success: true,
      message: `You unfollowed @${targetUser.username}`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/bookmarks/:postId
const bookmarkPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return next(new AppError('Post not found', 404, 'NOT_FOUND'));
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { bookmarks: postId },
    });

    res.status(200).json({
      success: true,
      message: 'Post bookmarked',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me/bookmarks/:postId
const unbookmarkPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { bookmarks: postId },
    });

    res.status(200).json({
      success: true,
      message: 'Bookmark removed',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me/bookmarks
const getBookmarks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        options: {
          skip,
          limit: limit + 1,
          sort: { createdAt: -1 },
        },
        populate: { path: 'author', select: 'username displayName avatar' },
      });

    const bookmarks = user.bookmarks || [];
    const hasMore = bookmarks.length > limit;
    const paginated = hasMore ? bookmarks.slice(0, limit) : bookmarks;

    res.status(200).json({
      success: true,
      data: { bookmarks: paginated, hasMore, page },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/home — Sets home location
const updateHomeLocation = async (req, res, next) => {
  try {
    let { longitude, latitude, coordinates } = req.body;

    let lng, lat;
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      lng = Number(coordinates[0]);
      lat = Number(coordinates[1]);
    } else if (longitude !== undefined && latitude !== undefined) {
      lng = Number(longitude);
      lat = Number(latitude);
    }

    if (lng === undefined || lat === undefined || isNaN(lng) || isNaN(lat)) {
      return next(new AppError('Valid coordinates (latitude and longitude) are required', 400, 'INVALID_INPUT'));
    }

    if (lat < -90 || lat > 90) {
      return next(new AppError('Latitude must be between -90 and 90 degrees', 400, 'INVALID_INPUT'));
    }
    if (lng < -180 || lng > 180) {
      return next(new AppError('Longitude must be between -180 and 180 degrees', 400, 'INVALID_INPUT'));
    }

    req.user.homeLocation = { type: 'Point', coordinates: [lng, lat] };
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Home location updated successfully',
      data: { homeLocation: req.user.homeLocation },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me/home — Removes home location
const removeHomeLocation = async (req, res, next) => {
  try {
    req.user.homeLocation = undefined;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Home location removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/role — Dev-only role toggle
const toggleRole = async (req, res, next) => {
  try {
    const newRole = req.user.role === 'admin' ? 'user' : 'admin';
    req.user.role = newRole;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${newRole} successfully`,
      data: { role: newRole },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  getUserProfile,
  updateProfile,
  changePassword,
  followUser,
  unfollowUser,
  bookmarkPost,
  unbookmarkPost,
  getBookmarks,
  updateHomeLocation,
  removeHomeLocation,
  toggleRole,
};
