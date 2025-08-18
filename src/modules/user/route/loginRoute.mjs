import { Router } from "express";
import { loginController } from "../controller/loginController.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = Router();

router.post("/login", loginController.login);
router.post("/logout", authMiddleware, loginController.logout);
router.post("/refresh", authMiddleware, loginController.refreshToken);

export default router;