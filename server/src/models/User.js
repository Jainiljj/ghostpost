const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    index: true,
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: '',
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    select: false,
  },
  bio: {
    type: String,
    maxlength: 160,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  headerImage: {
    type: String,
    default: '',
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  homeLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Sparse 2dsphere index for home location
UserSchema.index({ homeLocation: '2dsphere' }, { sparse: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: follower count
UserSchema.virtual('followerCount').get(function () {
  return this.followers.length;
});

// Virtual: following count
UserSchema.virtual('followingCount').get(function () {
  return this.following.length;
});

module.exports = mongoose.model('User', UserSchema);
