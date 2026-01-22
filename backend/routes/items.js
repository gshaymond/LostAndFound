const express = require('express');
const router = express.Router();
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getUserItems
} = require('../controllers/itemsController');
const { auth } = require('../middleware/auth');

// @route   POST /api/items
// @desc    Create a new item
// @access  Private
router.post('/', auth, createItem);

// @route   GET /api/items
// @desc    Get all items with filtering and pagination
// @access  Public
router.get('/', getItems);

// @route   GET /api/items/user/:userId
// @desc    Get items by user
// @access  Private (own items) or Public (other users' active items)
router.get('/user/:userId', getUserItems);

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Public
router.get('/:id', getItemById);

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private (owner only)
router.put('/:id', auth, updateItem);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private (owner only)
router.delete('/:id', auth, deleteItem);

module.exports = router;