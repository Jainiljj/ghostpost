const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  },
  value: {
    type: Number,
    required: true,
    enum: [1, -1], // 1 = upvote, -1 = downvote
  },
}, {
  timestamps: true,
});

// Enforce unique vote per user per post
VoteSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
