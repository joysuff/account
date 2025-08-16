import express from 'express';
const router = express.Router();
import { register, login, getUserProfile } from '../controllers/userController.js';

import auth from '../middleware/auth.js';

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getUserProfile);

export default router;