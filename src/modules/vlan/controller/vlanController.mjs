import sshService from '../service/vlanServices.mjs';
import { SSH_PASS, SSH_USER } from '../../../config/env.mjs';
import logger from '../util/vlanLogger.mjs';

class VlanController {
  async configurePort(req, res) {
    try {
      const { host, porta, vlan, description } = req.body;
      
      if (!host || !porta || !vlan) {
        logger.warn('Requisição inválida: host, porta ou VLAN faltando');
        return res.status(400).json({
          success: false,
          error: 'Host, porta e VLAN são obrigatórios'
        });
      }

      const username = SSH_USER || 'raoni.cerqueira';
      const password = SSH_PASS || 'Uisti2024';

      logger.info(`Solicitando configuração: ${host}:${porta} -> VLAN ${vlan}`);

      const result = await sshService.configurePort(
        host, 
        username, 
        password, 
        porta, 
        vlan, 
        description
      );

      if (result.success) {
        logger.info(`Configuração bem-sucedida: ${host}:${porta}`);
        res.json({
          success: true,
          message: result.message,
          data: result.details
        });
      } else if (result.trunk) {
        logger.warn(`Bloqueado — porta trunk: ${host}:${porta}`);
        res.status(403).json({
          success: false,
          error: result.error
        });
      } else {
        logger.error(`Falha na configuração: ${host}:${porta} - ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          details: result.details
        });
      }
      
    } catch (error) {
      logger.error(`Erro no controller ao configurar porta: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async checkPortConfiguration(req, res) {
    try {
      const { host, porta } = req.params;
      
      if (!host || !porta) {
        logger.warn('Requisição inválida: host ou porta faltando');
        return res.status(400).json({
          success: false,
          error: 'Host e porta são obrigatórios'
        });
      }

      const username = SSH_USER || 'raoni.cerqueira';
      const password = SSH_PASS || 'Uisti2024';

      logger.info(`Solicitando verificação: ${host}:${porta}`);

      const result = await sshService.checkPortConfiguration(
        host, 
        username, 
        password, 
        porta
      );

      if (result.success) {
        logger.info(`Verificação bem-sucedida: ${host}:${porta}`);
        res.json({
          success: true,
          data: {
            configuration: result.configuration,
            rawOutput: result.rawOutput
          }
        });
      } else {
        logger.error(`Falha na verificação: ${host}:${porta} - ${result.error}`);
        res.status(500).json({
          success: false,
          error: result.error,
          details: result.rawOutput
        });
      }
      
    } catch (error) {
      logger.error(`Erro no controller ao verificar configuração: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getConnectionStatus(req, res) {
    try {
      const { host } = req.params;
      
      if (!host) {
        return res.status(400).json({
          success: false,
          error: 'Host é obrigatório'
        });
      }

      const status = await sshService.getConnectionStatus(host);
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      logger.error(`Erro ao verificar status da conexão: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new VlanController();