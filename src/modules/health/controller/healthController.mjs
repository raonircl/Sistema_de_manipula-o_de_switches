import * as healthService from '../services/healthServices.mjs';

export const healthController = {
  healthCheck: async (req, res) => {
    try {
      // Testar variáveis de ambiente
      const envStatus = healthService.testVars();

      // Testar conexão com banco de dados
      const dbStatus = await healthService.testDatabase();

      // Obter informações do sistema
      const systemInfo = healthService.getSystemInfo();

      return res.status(200).json({
        status: 'healthy',
        message: 'Servidor saudável',
        uptime: systemInfo.uptime,
        timestamp: systemInfo.timestamp,
        environment: {
          status: envStatus.ok ? 'ok' : 'error',
          loaded_variables: envStatus.loaded,
          missing_variables: envStatus.missing,
          total_required: envStatus.total_required,
          total_loaded: envStatus.total_loaded,
          total_missing: envStatus.total_missing
        },
        database: {
          status: 'connected',
          connection_tested_at: dbStatus.timestamp
        },
        system: {
          node_version: systemInfo.node_version,
          platform: systemInfo.platform,
          memory_usage: systemInfo.memory_usage
        }
      });

    } catch (error) {
      return res.status(500).json({
        status: 'unhealthy',
        message: error.message.includes('banco de dados')
          ? 'Falha ao conectar no banco de dados'
          : 'Erro no servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
};