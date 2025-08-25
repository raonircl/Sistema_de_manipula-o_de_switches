import { Router } from "express";
import { searchMacController } from "../controller/macController.mjs";

const router = Router();

router.get("/mac", searchMacController.searchMac);
  
export default router;
