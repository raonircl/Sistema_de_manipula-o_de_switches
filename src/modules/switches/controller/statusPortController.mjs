import { obterStatusPortas, obterDetalhesPorta } from '../services/statusPortServices.mjs';

export async function getStatusPortas(req, res) {
  const { host } = req.query;
  
  if (!host) {
    return res.status(400).json({ 
      success: false, 
      error: 'IP do switch não fornecido',
      portas: []
    });
  }

  try {
    const portas = await obterStatusPortas(host);
    
    return res.json({ 
      success: true, 
      portas,
      stats: {
        total: portas.length,
        up: portas.filter(p => p.status === 'up').length,
        down: portas.filter(p => p.status === 'down').length
      }
    });
  } catch (error) {
    console.error('Erro no controller getStatusPortas:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      portas: []
    });
  }
}

export async function getDetalhesPorta(req, res) {
  // Suporta ambos os formatos de parâmetros
  const host = req.params.host || req.query.host;
  const interfaceName = req.params.interface || req.query.interface;
  
  if (!host || !interfaceName) {
    return res.status(400).json({ 
      success: false, 
      error: 'Host e interface são obrigatórios'
    });
  }

  try {
    const detalhes = await obterDetalhesPorta(host, interfaceName);
    return res.json({ 
      success: true, 
      detalhes 
    });
  } catch (error) {
    console.error('Erro no controller getDetalhesPorta:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}