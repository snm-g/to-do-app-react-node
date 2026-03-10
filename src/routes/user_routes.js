import { Router } from "express";
import { registerUser } from "../controllers/user_controller.js";

const router = Router();

router.post("/register", registerUser);

export default router;
