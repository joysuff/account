const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

router.get('/categories', auth, categoryController.list);
router.post('/categories', auth, categoryController.add);
router.delete('/categories/:id', auth, categoryController.remove);

module.exports = router; 