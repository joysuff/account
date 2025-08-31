import express from 'express';
const router = express.Router();
import {daily,monthly,recent} from '../controllers/analysisController.js';

import auth from '../middleware/auth.js';

router.get('/analysisDaily',auth,daily);
router.get('/analysisMonthly',auth,monthly);
router.get('/analysisRecent',auth,recent);

export default router;