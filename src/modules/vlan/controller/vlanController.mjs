import express from 'express';
import { configurarVlan } from './vlanService.mjs';

const router = express.Router();

router.post('/vlan', async (req, res) => {
  const { switchHost, porta, vlanId } = req.body;
  try {
    await configurarVlan(switchHost, porta, vlanId);
    res.status(200).send({ mensagem: 'VLAN configurada com sucesso' });
  } catch (err) {
    res.status(500).send({ mensagem: 'Erro ao configurar VLAN' });
  }
});

export default router;