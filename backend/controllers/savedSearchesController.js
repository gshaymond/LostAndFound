const SavedSearch = require('../models/SavedSearch');

const createSavedSearch = async (req, res) => {
  try {
    const { name, query } = req.body;
    if (!name || !query) return res.status(400).json({ error: 'name and query required' });

    const saved = new SavedSearch({ userId: req.user._id, name, query });
    await saved.save();

    res.status(201).json({ saved });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const listSavedSearches = async (req, res) => {
  try {
    const saves = await SavedSearch.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ saves });
  } catch (error) {
    console.error('List saved searches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteSavedSearch = async (req, res) => {
  try {
    const saved = await SavedSearch.findById(req.params.id);
    if (!saved) return res.status(404).json({ error: 'Not found' });
    if (saved.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    await saved.remove();
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createSavedSearch, listSavedSearches, deleteSavedSearch };