import express from 'express';
import { getStatusPortas, getDetalhesPorta } from '../controller/statusPortController.mjs';

const router = express.Router();

/**
 * @route GET /api/status-portas/interfaces
 * @description Obtém o status de todas as portas de um switch
 * @query {string} host - IP do switch
 * @returns {Object} Lista de portas com status
 */
router.get('/interfaces', getStatusPortas);

/**
 * @route GET /api/status-portas/detalhes/:host/:interface
 * @description Obtém detalhes específicos de uma porta
 * @params {string} host - IP do switch
 * @params {string} interface - Nome da interface (ex: GigabitEthernet1/0/1)
 * @returns {Object} Detalhes completos da porta
 */
router.get('/detalhes/:host/:interface', getDetalhesPorta);

/**
 * @route GET /api/status-portas/detalhes
 * @description Obtém detalhes específicos de uma porta (via query params)
 * @query {string} host - IP do switch
 * @query {string} interface - Nome da interface
 * @returns {Object} Detalhes completos da porta
 */
router.get('/detalhes', getDetalhesPorta);

export default router;