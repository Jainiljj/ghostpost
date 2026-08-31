const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    required: true,
    enum: ['post', 'comment'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
    enum: ['Spam', 'Harassment', 'Hate/abuse', 'Sexual content', 'Violence', 'Misinformation', 'Illegal content', 'Other'],
  },
  description: {
    type: String,
    default: '',
    maxlength: 300,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
    index: true,
  },
}, {
  timestamps: true,
});

// Enforce unique report per user per content to prevent double reporting
ReportSchema.index({ reporterId: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Report', ReportSchema);
