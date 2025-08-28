const express = require('express');
const { postComment, getApprovedComments } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const { validateComment } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.post('/', protect, validateComment, postComment);
router.get('/', getApprovedComments); // Public

module.exports = router;