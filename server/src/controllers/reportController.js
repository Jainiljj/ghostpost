const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const AppError = require('../utils/AppError');

// POST /api/reports
// Submit a new report for a post or comment
const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return next(new AppError('Target type, target ID, and reason are required', 400, 'INVALID_INPUT'));
    }

    if (targetType !== 'post' && targetType !== 'comment') {
      return next(new AppError('Target type must be post or comment', 400, 'INVALID_INPUT'));
    }

    const allowedReasons = ['Spam', 'Harassment', 'Hate/abuse', 'Sexual content', 'Violence', 'Misinformation', 'Illegal content', 'Other'];
    if (!allowedReasons.includes(reason)) {
      return next(new AppError('Invalid report reason selected', 400, 'INVALID_INPUT'));
    }

    // Verify target content exists
    let targetExists = false;
    if (targetType === 'post') {
      targetExists = await Post.exists({ _id: targetId });
    } else {
      targetExists = await Comment.exists({ _id: targetId });
    }

    if (!targetExists) {
      return next(new AppError('Reported content not found', 404, 'NOT_FOUND'));
    }

    // Check for duplicate reports
    const duplicate = await Report.findOne({ reporterId: req.user._id, targetId });
    if (duplicate) {
      return next(new AppError('You have already reported this content', 409, 'DUPLICATE_REPORT'));
    }

    // Create report
    const report = await Report.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
      description: description || '',
      status: 'pending'
    });

    // If it's a post, increment reportsCount
    if (targetType === 'post') {
      await Post.findByIdAndUpdate(targetId, { $inc: { reportsCount: 1 } });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for keeping GhostPost safe.',
      data: report
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('You have already reported this content', 409, 'DUPLICATE_REPORT'));
    }
    next(error);
  }
};

// GET /api/admin/reports
// Fetch all reports (Admin only)
const getAdminReports = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Populate targets dynamically
    const populatedReports = [];
    for (const report of reports) {
      let targetContent = null;
      if (report.targetType === 'post') {
        targetContent = await Post.findById(report.targetId);
      } else {
        targetContent = await Comment.findById(report.targetId);
      }
      
      populatedReports.push({
        _id: report._id,
        reporterId: report.reporterId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        target: targetContent
      });
    }

    res.status(200).json({
      success: true,
      data: populatedReports
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/reports/:id
// Resolve or dismiss report (Admin only)
const resolveAdminReport = async (req, res, next) => {
  try {
    const { status, action } = req.body; // status: resolved/dismissed, action: remove/keep
    const reportId = req.params.id;

    if (!status || !['resolved', 'dismissed'].includes(status)) {
      return next(new AppError('Valid status (resolved or dismissed) is required', 400, 'INVALID_INPUT'));
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return next(new AppError('Report not found', 404, 'NOT_FOUND'));
    }

    report.status = status;
    await report.save();

    // Take action on content
    if (action === 'remove') {
      if (report.targetType === 'post') {
        await Post.findByIdAndDelete(report.targetId);
        await Vote.deleteMany({ postId: report.targetId });
        await Comment.deleteMany({ postId: report.targetId });
      } else {
        // Prune or mark comment as deleted
        const comment = await Comment.findById(report.targetId);
        if (comment) {
          const hasReplies = await Comment.exists({ parentCommentId: comment._id });
          if (hasReplies) {
            comment.content = '[Removed by Moderator]';
            comment.isDeleted = true;
            await comment.save();
          } else {
            await Comment.findByIdAndDelete(comment._id);
          }
          // Decrement commentCount
          await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
        }
      }
    } else if (status === 'dismissed' && report.targetType === 'post') {
      // If report is dismissed, decrement reportsCount to make it visible again
      await Post.findByIdAndUpdate(report.targetId, { $set: { reportsCount: 0 } });
    }

    res.status(200).json({
      success: true,
      message: `Report updated to ${status} successfully. Action taken: ${action || 'none'}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getAdminReports,
  resolveAdminReport
};
