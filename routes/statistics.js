const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const auth = require('../middleware/auth');

router.get('/statistics/daily', auth, statisticsController.daily);
router.get('/statistics/monthly', auth, statisticsController.monthly);
router.get('/statistics/category', auth, statisticsController.category);
router.get('/statistics/trend', auth, statisticsController.trend);

module.exports = router; 