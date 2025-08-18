import { Router } from "express";
import { userController } from "../controller/userController.mjs";

const router = Router();

router.post("/create", userController.create);
router.put("/update", userController.update);
router.delete("/delete", userController.delete);
router.get("/getAll", userController.getAll);

export default router;