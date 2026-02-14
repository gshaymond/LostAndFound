const express = require('express');
const router = express.Router();
const { presign } = require('../controllers/uploadsController');

// POST /api/uploads/presign
router.post('/presign', presign);

module.exports = router;