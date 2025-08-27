import express from 'express';
import { getSwitchStatus } from '../controller/switchController.mjs';

const router = express.Router();

router.get('/status-switches', getSwitchStatus);

export default router;
