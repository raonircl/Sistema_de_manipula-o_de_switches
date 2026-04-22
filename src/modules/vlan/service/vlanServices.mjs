import fs from 'fs';
import path from 'path';
import { executarComandos, configurarComVerificacaoTrunk } from '../model/vlanModel.mjs';
import logger from '../util/vlanLogger.mjs';

// ---------------------------------------------------------------------------
// Catálogo de switches
// ---------------------------------------------------------------------------
const switchesPath = path.resolve('./switches.json');
const switchesCatalog = JSON.parse(fs.readFileSync(switchesPath, 'utf8'));

const FABRICANTES_SUPORTADOS = ['huawei', 'hpe', 'hpe-cmdline'];

function buscarFabricante(host) {
  const entry = switchesCatalog.find(s => s.host === host);
  if (!entry) throw new Error(`Switch ${host} não encontrado em switches.json`);
  return entry.fabricante.toLowerCase();
}

/**
 * Retorna o nome da interface no formato correto para cada fabricante.
 * Huawei VRP  → GigabitEthernet0/0/X
 * HPE Comware → GigabitEthernet1/0/X  (V1910, 5520 — H3C Comware)
 */
function montarInterfaceName(fabricante, porta) {
  switch (fabricante) {
    case 'huawei':
      return `GigabitEthernet0/0/${porta}`;
    case 'hpe':
    case 'hpe-cmdline':
      return `GigabitEthernet1/0/${porta}`;
    default:
      throw new Error(`Fabricante '${fabricante}' não suportado no módulo de VLAN`);
  }
}

/**
 * Retorna os comandos de configuração específicos para cada fabricante.
 *
 * Diferenças HPE Comware vs Huawei VRP:
 *  - A VLAN precisa existir antes de ser atribuída → criamos com "vlan X / quit"
 *  - Não usa "undo port link-type" antes de "port link-type hybrid" (pode dar erro no Comware)
 *  - voice-vlan, trust dscp e dhcp snooping têm sintaxe diferente ou não existem no Comware
 */
function montarComandosConfiguracao(fabricante, interfaceName, vlan, description) {
  switch (fabricante) {
    case 'huawei':
      return [
        'system-view',
        `interface ${interfaceName}`,
        'undo description',
        'undo port link-type',
        'undo voice-vlan',
        'undo port hybrid pvid vlan',
        'undo port hybrid tagged vlan',
        'undo port hybrid untagged vlan',
        'undo trust dscp',
        'undo dhcp snooping enable',
        `description ${description}`,
        'port link-type hybrid',
        'voice-vlan 1100 enable',
        `port hybrid pvid vlan ${vlan}`,
        'port hybrid tagged vlan 1100',
        `port hybrid untagged vlan ${vlan}`,
        'trust dscp',
        'dhcp snooping enable',
        'return',
        'save force',
      ];

    case 'hpe':
    case 'hpe-cmdline':
      return [
        'system-view',
        // Garante que as VLANs existem antes de atribuir à porta
        `vlan ${vlan}`,
        'quit',
        'vlan 1100',
        'quit',
        `interface ${interfaceName}`,
        'port link-mode bridge',
        'port link-type hybrid',
        'undo port hybrid vlan 1',
        // Remove voice-vlan se existir: quando ativo, gerencia VLAN 1100 como tagged
        // implicitamente e impede que "port hybrid vlan 1100 tagged" seja aplicado
        'undo voice-vlan 1100 enable',
        // Sintaxe HP Comware: "port hybrid vlan X tagged/untagged" (inverso do Huawei VRP)
        `port hybrid vlan 1100 tagged`,
        `port hybrid vlan ${vlan} untagged`,
        `port hybrid pvid vlan ${vlan}`,
        'combo enable auto',
        'dhcp snooping trust',
        'dhcp snooping information enable',
        `description ${description}`,
        'return',
        'save force',
      ];

    default:
      throw new Error(`Fabricante '${fabricante}' não suportado no módulo de VLAN`);
  }
}

// ---------------------------------------------------------------------------
// Utilitários de saída
// ---------------------------------------------------------------------------
function extrairConfiguracao(rawOutput) {
  const text = rawOutput.replace(/\r/g, '');
  const match = text.match(/#\n(interface[\s\S]*?)\n#/);
  if (match) return match[1].trim();
  return text
    .split('\n')
    .filter(l => !/^[\[<].*[\]>]/.test(l) && !/^Info:/.test(l) && l.trim() !== '#')
    .join('\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class SSHService {
  async configurePort(host, _username, _password, porta, vlan, description = 'COMPUTADOR') {
    try {
      logger.info(`Iniciando configuração da porta ${porta} no host ${host}`);

      const fabricante = buscarFabricante(host);

      if (!FABRICANTES_SUPORTADOS.includes(fabricante)) {
        const msg = `Fabricante '${fabricante}' do switch ${host} não é suportado no módulo de VLAN`;
        logger.warn(`⚠️ ${msg}`);
        return { success: false, error: msg };
      }

      const interfaceName = montarInterfaceName(fabricante, porta);
      logger.info(`Fabricante: ${fabricante} | Interface: ${interfaceName}`);

      const configCommands = montarComandosConfiguracao(fabricante, interfaceName, vlan, description);

      const result = await configurarComVerificacaoTrunk(host, interfaceName, configCommands);

      logger.info(`✅ Porta ${porta} configurada com sucesso no host ${host}`);
      return {
        success: true,
        message: `Porta ${porta} configurada com sucesso com VLAN ${vlan}`,
        details: result.output,
      };
    } catch (error) {
      if (error.code === 'TRUNK_PORT') {
        logger.warn(`🚫 Tentativa de alterar porta trunk bloqueada: ${host}:${porta}`);
        return { success: false, trunk: true, error: error.message };
      }
      logger.error(`❌ Falha ao configurar porta ${porta} no host ${host}: ${error.message}`);
      console.error(`[vlanService] configurePort ${host}:${porta}`, error);
      return { success: false, error: `Erro ao configurar porta: ${error.message}` };
    }
  }

  async checkPortConfiguration(host, _username, _password, porta) {
    try {
      logger.info(`Verificando configuração da porta ${porta} no host ${host}`);

      const fabricante = buscarFabricante(host);

      if (!FABRICANTES_SUPORTADOS.includes(fabricante)) {
        const msg = `Fabricante '${fabricante}' do switch ${host} não é suportado no módulo de VLAN`;
        logger.warn(`⚠️ ${msg}`);
        return { success: false, error: msg };
      }

      const interfaceName = montarInterfaceName(fabricante, porta);

      const commands = [
        'screen-length 0 temporary',
        `display current-configuration interface ${interfaceName}`,
      ];

      const result = await executarComandos(host, commands, 30000);

      logger.info(`✅ Configuração da porta ${porta} verificada com sucesso`);
      return { success: true, configuration: extrairConfiguracao(result.output) };
    } catch (error) {
      logger.error(`❌ Falha ao verificar configuração: ${error.message}`);
      console.error(`[vlanService] checkPortConfiguration ${host}:${porta}`, error);
      return { success: false, error: error.message };
    }
  }

  async testConnection(host, _username, _password) {
    try {
      logger.info(`Testando conexão com: ${host}`);
      const result = await executarComandos(host, ['display version | include Version'], 20000);
      return {
        success: true,
        message: `Conexão bem-sucedida com ${host}`,
        versionInfo: result.output,
      };
    } catch (error) {
      logger.error(`Erro no teste de conexão: ${error.message}`);
      console.error(`[vlanService] testConnection ${host}`, error);
      return { success: false, error: error.message };
    }
  }

  async getConnectionStatus(host) {
    return { connected: false, timestamp: new Date().toISOString() };
  }
}

export default new SSHService();
