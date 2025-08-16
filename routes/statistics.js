import express from 'express';
const router = express.Router();
import { daily, monthly, category, trend } from '../controllers/statisticsController.js';
import auth from '../middleware/auth.js';

router.get('/statistics/daily', auth, daily);
router.get('/statistics/monthly', auth, monthly);
router.get('/statistics/category', auth, category);
router.get('/statistics/trend', auth, trend);
export default router; 
