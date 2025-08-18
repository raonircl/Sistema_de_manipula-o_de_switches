import { Router } from "express";
import { loginController } from "../controller/loginController.mjs";

const router = Router();

router.post("/login", loginController.login);

export default router;