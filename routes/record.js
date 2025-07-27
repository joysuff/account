const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const auth = require('../middleware/auth');

router.post('/records', auth, recordController.add);
router.put('/records/:id', auth, recordController.update);
router.delete('/records/:id', auth, recordController.remove);
router.get('/records', auth, recordController.list);
router.get('/records/:id', auth, recordController.getById);

module.exports = router; 