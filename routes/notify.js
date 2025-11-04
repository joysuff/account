import express from 'express';
const router = express.Router();
import { getAllNotifyMethods,getEnabledNotifyMethod,updateNotifySetting,setNotifySettingEnabled} from '../controllers/notifyController.js';
import auth from '../middleware/auth.js'; 

router.get('/notify/methods',auth,getAllNotifyMethods);
router.get('/notify/enabled',auth,getEnabledNotifyMethod);
router.put('/notify/enabled/:id',auth,setNotifySettingEnabled);
router.put('/notify/:id',auth,updateNotifySetting);
export default router;