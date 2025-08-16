import express from 'express';
const router = express.Router();
import { list, add, remove, update } from '../controllers/categoryController.js';

import auth from '../middleware/auth.js';

router.get('/categories', auth, list);
router.post('/categories', auth, add);
router.delete('/categories/:id', auth, remove);
router.put('/categories/:id', auth, update);
export default router; 
