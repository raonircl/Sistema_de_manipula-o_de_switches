import express from 'express';
import { getResumoSwitchesController } from '../controller/informationController.mjs';

const router = express.Router();

/**
 * @route GET /api/switches/resumo
 * @description Retorna resumo de switches e portas
 */
router.get('/resumo', getResumoSwitchesController.getResumo);

export default router;