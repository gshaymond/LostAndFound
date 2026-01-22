const express = require('express');
const router = express.Router();
const {
  createMatch,
  getMatches,
  getMatchById,
  updateMatchStatus,
  deleteMatch
} = require('../controllers/matchesController');
const { auth } = require('../middleware/auth');

// @route   POST /api/matches
// @desc    Create a new match
// @access  Private
router.post('/', auth, createMatch);

// @route   GET /api/matches
// @desc    Get user's matches
// @access  Private
router.get('/', auth, getMatches);

// @route   GET /api/matches/:id
// @desc    Get single match by ID
// @access  Private (participants only)
router.get('/:id', auth, getMatchById);

// @route   PUT /api/matches/:id
// @desc    Update match status
// @access  Private (participants only)
router.put('/:id', auth, updateMatchStatus);

// @route   DELETE /api/matches/:id
// @desc    Delete match
// @access  Private (participants only)
router.delete('/:id', auth, deleteMatch);

module.exports = router;