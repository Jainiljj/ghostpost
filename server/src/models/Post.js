const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  tag: {
    type: String,
    required: true,
    enum: ['Confession', 'Event', 'Question', 'Rant', 'Discussion', 'News', 'Help', 'Meme', 'Other'],
    index: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
    index: true,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  repostCount: {
    type: Number,
    default: 0,
  },
  reportsCount: {
    type: Number,
    default: 0,
    index: true,
  },
  hotScore: {
    type: Number,
    default: 0,
    index: true,
  },
  // Repost / Quote Post support
  repostOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  quoteContent: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes for optimal query performance
PostSchema.index({ location: '2dsphere' }, { sparse: true });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

// Text index for content searches
PostSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', PostSchema);
