import express from 'express';
import vlanController from '../controller/vlanController.mjs';

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  // Implemente sua lógica de verificação JWT aqui
  // jwt.verify(token, process.env.JWT_SECRET, (err, user) => {...})
  
  next();
};

// Configurar porta VLAN
router.post('/configurar-porta', authenticateToken, vlanController.configurePort);

// Verificar configuração da porta
router.get('/verificar-configuracao/:host/:porta', authenticateToken, vlanController.checkPortConfiguration);

// Status da conexão
router.get('/status-conexao/:host', authenticateToken, vlanController.getConnectionStatus);

export default router;