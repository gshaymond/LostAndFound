const Match = require('../models/Match');
const Item = require('../models/Item');
const Message = require('../models/Message');

// @desc    Create a new match
// @route   POST /api/matches
// @access  Private
const createMatch = async (req, res) => {
  try {
    const {
      lostItemId,
      foundItemId,
      confidence,
      matchReasons,
      metadata
    } = req.body;

    // Validation
    if (!lostItemId || !foundItemId) {
      return res.status(400).json({
        error: 'Please provide lostItemId and foundItemId'
      });
    }

    // Check if items exist and are of correct type
    const lostItem = await Item.findById(lostItemId);
    const foundItem = await Item.findById(foundItemId);

    if (!lostItem || !foundItem) {
      return res.status(404).json({ error: 'One or both items not found' });
    }

    if (lostItem.type !== 'lost' || foundItem.type !== 'found') {
      return res.status(400).json({
        error: 'Match must be between a lost item and a found item'
      });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      lostItemId,
      foundItemId
    });

    if (existingMatch) {
      return res.status(400).json({
        error: 'Match already exists between these items'
      });
    }

    // Create match
    const match = new Match({
      lostItemId,
      foundItemId,
      confidence: confidence || 0,
      matchReasons: matchReasons || [],
      metadata: metadata || {}
    });

    await match.save();

    // Populate item details
    await match.populate([
      { path: 'lostItemId', populate: { path: 'userId', select: 'name email phone' } },
      { path: 'foundItemId', populate: { path: 'userId', select: 'name email phone' } }
    ]);

    res.status(201).json({
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    console.error('Create match error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get matches for user
// @route   GET /api/matches
// @access  Private
const getMatches = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - user must be involved in the match
    const query = {
      $or: [
        { 'lostItemId.userId': req.user._id },
        { 'foundItemId.userId': req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const matches = await Match.find(query)
      .populate({
        path: 'lostItemId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'foundItemId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Match.countDocuments(query);

    res.json({
      matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get single match by ID
// @route   GET /api/matches/:id
// @access  Private (participants only)
const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'lostItemId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'foundItemId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is participant
    const isParticipant =
      match.lostItemId.userId._id.toString() === req.user._id.toString() ||
      match.foundItemId.userId._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this match' });
    }

    res.json({ match });
  } catch (error) {
    console.error('Get match by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update match status
// @route   PUT /api/matches/:id
// @access  Private (participants only)
const updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['suggested', 'contacted', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: suggested, contacted, confirmed, or rejected'
      });
    }

    const match = await Match.findById(req.params.id)
      .populate({
        path: 'lostItemId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'foundItemId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is participant
    const isParticipant =
      match.lostItemId.userId._id.toString() === req.user._id.toString() ||
      match.foundItemId.userId._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to update this match' });
    }

    // Update status and timestamp
    match.status = status;
    const now = new Date();

    if (status === 'contacted' && !match.contactedAt) {
      match.contactedAt = now;
    } else if (status === 'confirmed' && !match.confirmedAt) {
      match.confirmedAt = now;
    } else if (status === 'rejected' && !match.rejectedAt) {
      match.rejectedAt = now;
    }

    await match.save();

    res.json({
      message: 'Match status updated successfully',
      match
    });
  } catch (error) {
    console.error('Update match status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private (participants only)
const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if user is participant
    const isParticipant =
      match.lostItemId.toString() === req.user._id.toString() ||
      match.foundItemId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to delete this match' });
    }

    // Delete associated messages
    await Message.deleteMany({ matchId: req.params.id });

    await Match.findByIdAndDelete(req.params.id);

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Delete match error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createMatch,
  getMatches,
  getMatchById,
  updateMatchStatus,
  deleteMatch
};