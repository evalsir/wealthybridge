//handles posting and getting comments
const Comment = require('../models/Comment');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Post comment (pending approval)
exports.postComment = async (req, res, next)=> {
  const { text } = req.body;
  const userId = req.user._id;

  try {
    const comment = new Comment({
      user: userId,
      text,
      status: 'pending',
    });

    await comment.save();
    logger.info(`User ${userId} posted comment ${comment._id}, pending approval`);
    res.status(201).json({ message: 'Comment submitted for approval', comment });
  } catch (err) {
    logger.error(`Post comment error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during comment posting'));
  }
};

// Get approved comments
exports.getApprovedComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ status: 'approved' })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    logger.error(`Get approved comments error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during fetching comments'));
  }
};