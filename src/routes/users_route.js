import { Router } from "express";
import { store } from "../controllers/users_controller.js";

const router = Router();

router.post("/", store);

export default router;
