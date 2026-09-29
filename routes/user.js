import express from 'express';
const router = express.Router();
import { register, login, getUserProfile, updatePassword, getTokenUsage } from '../controllers/userController.js';

import auth from '../middleware/auth.js';

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getUserProfile);
router.post('/update-password', auth, updatePassword);
router.get('/token-usage', auth, getTokenUsage);


export default router;