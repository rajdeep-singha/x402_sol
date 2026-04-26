import { Router } from "express";
import { healthCheck, ping } from "../controllers/health.controller";

const router = Router();

router.get("/", healthCheck);
router.get("/ping", ping);

export default router;
