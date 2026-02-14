const express = require('express');
const router = express.Router();
const { geocodeAddress } = require('../controllers/geocodeController');

// POST /api/geocode
router.post('/', geocodeAddress);

module.exports = router;