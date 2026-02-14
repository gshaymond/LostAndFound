const express = require('express');
const router = express.Router();
const { createSavedSearch, listSavedSearches, deleteSavedSearch } = require('../controllers/savedSearchesController');
const { auth } = require('../middleware/auth');

// Protected routes
router.post('/', auth, createSavedSearch);
router.get('/', auth, listSavedSearches);
router.delete('/:id', auth, deleteSavedSearch);

module.exports = router;