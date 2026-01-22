const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead
} = require('../controllers/messagesController');
const { auth } = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, sendMessage);

// @route   GET /api/messages
// @desc    Get user's conversations
// @access  Private
router.get('/', auth, getConversations);

// @route   GET /api/messages/:matchId
// @desc    Get messages for a match
// @access  Private (participants only)
router.get('/:matchId', auth, getMessages);

// @route   PUT /api/messages/:matchId/read
// @desc    Mark messages as read
// @access  Private (participants only)
router.put('/:matchId/read', auth, markAsRead);

module.exports = router;