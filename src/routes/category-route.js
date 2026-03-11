import { Router } from "express";
import { index, store, get, update, destroy } from "../controllers/category.controller.js";

const router = Router();

router.get("/", index);
router.post("/", store);
router.get("/:id", get);
router.put("/:id", update);
router.delete("/:id", destroy);

export default router;
