const Message = require('../models/Message');
const Match = require('../models/Match');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { matchId, content, messageType = 'text', metadata } = req.body;

    // Validation
    if (!matchId || !content) {
      return res.status(400).json({
        error: 'Please provide matchId and content'
      });
    }

    // Check if match exists and user is participant
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get the other participant
    let receiverId;
    if (match.lostItemId.toString() === req.user._id.toString()) {
      // User is the one who lost the item, receiver is the one who found it
      const foundItem = await require('../models/Item').findById(match.foundItemId);
      receiverId = foundItem.userId;
    } else if (match.foundItemId.toString() === req.user._id.toString()) {
      // User is the one who found the item, receiver is the one who lost it
      const lostItem = await require('../models/Item').findById(match.lostItemId);
      receiverId = lostItem.userId;
    } else {
      return res.status(403).json({ error: 'Not authorized to send messages in this match' });
    }

    // Create message
    const message = new Message({
      matchId,
      senderId: req.user._id,
      receiverId,
      content,
      messageType,
      metadata
    });

    await message.save();

    // Populate sender info
    await message.populate('senderId', 'name email');
    await message.populate('receiverId', 'name email');

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(matchId).emit('receive_message', {
        message,
        matchId
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get messages for a match
// @route   GET /api/messages/:matchId
// @access  Private (participants only)
const getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if match exists and user is participant
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isParticipant =
      match.lostItemId.toString() === req.user._id.toString() ||
      match.foundItemId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view messages in this match' });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages
    const messages = await Message.find({ matchId })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: 1 }) // Oldest first for chat flow
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Mark messages as read if user is receiver
    await Message.updateMany(
      { matchId, receiverId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    // Get total count
    const total = await Message.countDocuments({ matchId });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's conversations (matches with messages)
// @route   GET /api/messages
// @access  Private
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Find matches where user is participant and has messages
    const matchesWithMessages = await Message.distinct('matchId', {
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    });

    if (matchesWithMessages.length === 0) {
      return res.json({
        conversations: [],
        pagination: {
          page: 1,
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get matches with latest message info
    const conversations = await Match.find({
      _id: { $in: matchesWithMessages },
      $or: [
        { 'lostItemId.userId': req.user._id },
        { 'foundItemId.userId': req.user._id }
      ]
    })
    .populate({
      path: 'lostItemId',
      populate: { path: 'userId', select: 'name email' }
    })
    .populate({
      path: 'foundItemId',
      populate: { path: 'userId', select: 'name email' }
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    // Add latest message info to each conversation
    for (const conversation of conversations) {
      const latestMessage = await Message.findOne({ matchId: conversation._id })
        .populate('senderId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      conversation.latestMessage = latestMessage;

      // Count unread messages for this user
      const unreadCount = await Message.countDocuments({
        matchId: conversation._id,
        receiverId: req.user._id,
        read: false
      });

      conversation.unreadCount = unreadCount;
    }

    const total = matchesWithMessages.length;

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:matchId/read
// @access  Private (participants only)
const markAsRead = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check if match exists and user is participant
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isParticipant =
      match.lostItemId.toString() === req.user._id.toString() ||
      match.foundItemId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to mark messages as read in this match' });
    }

    // Mark messages as read
    const result = await Message.updateMany(
      { matchId, receiverId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead
};