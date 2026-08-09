import express from "express";
const router = express.Router();
import { chat } from "../controllers/agentController.js";
import auth from "../middleware/auth.js";

router.post("/agent/chat", auth, chat);

export default router;
