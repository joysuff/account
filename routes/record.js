import express from 'express';
const router = express.Router();
import { add, update, remove, list, getById } from '../controllers/recordController.js';

import auth from '../middleware/auth.js';

router.post('/records', auth, add);
router.put('/records/:id', auth, update);
router.delete('/records/:id', auth, remove);
router.get('/records', auth, list);
router.get('/records/:id', auth, getById);

export default router;
