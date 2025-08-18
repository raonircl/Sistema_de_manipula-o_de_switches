import { Router } from "express";
import { userController } from "../controller/userController.mjs";
import { authorizeRole } from "../middleware/authorizeRole.mjs";
import { authMiddleware } from "../middleware/authMiddleware.mjs";

const router = Router();

router.post("/create", authMiddleware, authorizeRole(['ADMIN']), userController.create);
router.put("/update", authMiddleware, authorizeRole(['ADMIN']), userController.update);
router.delete("/delete", authMiddleware, authorizeRole(['ADMIN']), userController.delete);
router.get(
  "/getAll",
  authMiddleware,
  authorizeRole(['ADMIN']),
  userController.getAll
);

export default router;