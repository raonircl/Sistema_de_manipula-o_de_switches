import { obterResumoSwitches } from '../service/PingInformationService.mjs';

export const getResumoSwitchesController = {
  getResumo: async (req, res) => {
    try {
      const resumo = await obterResumoSwitches();
      // console.log('Resumo dos switches:', JSON.stringify(resumo, null, 2)); // Mostra no console
      return res.status(200).json({ success: true, resumo });
    } catch (error) {
      console.error('Erro ao obter resumo dos switches:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
}