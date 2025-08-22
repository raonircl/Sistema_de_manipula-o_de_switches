// routes/healthRoutes.js
import express from 'express';
import { healthController } from '../controller/healthController.mjs';

const router = express.Router();

router.get('/health', healthController.healthCheck);

export default router;