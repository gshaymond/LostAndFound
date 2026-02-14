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

// @desc    Get all items with filtering and pagination (supports geospatial radius and date ranges)
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
      sortOrder = 'desc',
      lat,
      lng,
      radiusKm,
      dateFrom,
      dateTo
    } = req.query;

    // Base filter
    const filter = { status };

    if (type && ['lost', 'found'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (state) {
      filter['location.state'] = new RegExp(state, 'i');
    }

    // Date range filtering for either lost or found dates
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : new Date(0);
      const to = dateTo ? new Date(dateTo) : new Date();
      filter.$or = [
        { dateFound: { $gte: from, $lte: to } },
        { dateLost: { $gte: from, $lte: to } }
      ];
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If geospatial filter provided, use aggregation with $geoNear
    if (lat && lng) {
      const near = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
      const maxDistance = radiusKm ? parseFloat(radiusKm) * 1000 : 50000; // default 50km

      const pipeline = [
        { $geoNear: { near, distanceField: 'dist.calculated', spherical: true, maxDistance, query: filter } },
        { $sort: { 'dist.calculated': 1, ...sortOptions } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $project: { dist: 1, title:1, description:1, category:1, images:1, location:1, type:1, status:1, tags:1, userId:1, createdAt:1 } }
      ];

      const items = await Item.aggregate(pipeline);

      // Populate user info
      await Item.populate(items, { path: 'userId', select: 'name email phone' });

      const countPipeline = [
        { $geoNear: { near, distanceField: 'dist.calculated', spherical: true, maxDistance, query: filter } },
        { $count: 'total' }
      ];
      const countRes = await Item.aggregate(countPipeline);
      const total = countRes[0] ? countRes[0].total : 0;

      res.json({
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } else {
      // Regular query
      const items = await Item.find(filter)
        .populate('userId', 'name email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Item.countDocuments(filter);

      res.json({
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    }
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