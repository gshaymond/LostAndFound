const Item = require('../models/Item');

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
const createItem = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      category,
      images,
      location,
      locationDescription,
      dateFound,
      dateLost,
      tags,
      contactInfo
    } = req.body;

    // Validation
    if (!type || !title || !description || !category) {
      return res.status(400).json({
        error: 'Please provide type, title, description, and category'
      });
    }

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be either "lost" or "found"'
      });
    }

    // Create item
    const item = new Item({
      type,
      title,
      description,
      category,
      images: images || [],
      location,
      locationDescription,
      dateFound: type === 'found' ? dateFound : undefined,
      dateLost: type === 'lost' ? dateLost : undefined,
      userId: req.user._id,
      tags: tags || [],
      contactInfo: contactInfo || {}
    });

    await item.save();

    // Populate user info
    await item.populate('userId', 'name email phone');

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all items with filtering and pagination
// @route   GET /api/items
// @access  Public
const getItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      status = 'active',
      search,
      city,
      state,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { status };

    if (type && ['lost', 'found'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (state) {
      query['location.state'] = new RegExp(state, 'i');
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const items = await Item.find(query)
      .populate('userId', 'name email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Item.countDocuments(query);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private (owner only)
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    // Prevent updating certain fields
    const allowedUpdates = [
      'title', 'description', 'category', 'images', 'location',
      'locationDescription', 'dateFound', 'dateLost', 'tags', 'contactInfo'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update item
    Object.assign(item, updates);
    await item.save();

    // Populate user info
    await item.populate('userId', 'name email phone');

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private (owner only)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user's items
// @route   GET /api/items/user/:userId
// @access  Private (own items) or Public (other users' active items)
const getUserItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { userId };

    // If not the owner, only show active items
    if (req.user?._id.toString() !== userId) {
      query.status = 'active';
    } else if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Item.countDocuments(query);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getUserItems
};