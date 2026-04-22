import { Client } from 'ssh2';
import { TENTATIVAS_CONEXAO } from '../../../config/sshConfig.mjs';
import { SSH_USER, SSH_PASS } from '../../../config/env.mjs';
import logger from '../util/vlanLogger.mjs';

// Prompt Huawei VRP: <hostname> (user view) ou [hostname...] (config views)
const PROMPT_RE = /^[\[<][^\n]+[\]>]\s*$/m;

// Confirmações interativas do Huawei: [Y/N]: ou [y/n]:
const CONFIRM_RE = /\[Y\/N\]\s*:\s*$|\[y\/n\]\s*:\s*$/i;

async function conectar(host) {
  logger.info(`Tentando conectar ao switch: ${host}`);
  let lastError;

  for (let i = 0; i < TENTATIVAS_CONEXAO.length; i++) {
    const tentativa = TENTATIVAS_CONEXAO[i];
    logger.info(`Tentativa ${i + 1}: ${tentativa.desc}`);

    try {
      const conn = await new Promise((resolve, reject) => {
        const client = new Client();
        let settled = false;

        client
          .on('ready', () => { settled = true; resolve(client); })
          .on('error', (err) => {
            if (!settled) { settled = true; reject(err); }
          })
          .connect({
            host,
            port: 22,
            username: SSH_USER,
            password: SSH_PASS,
            ...tentativa.config,
          });
      });

      logger.info(`✅ Conectado ao switch ${host} usando ${tentativa.desc}`);
      return conn;
    } catch (err) {
      lastError = err;
      logger.warn(`❌ Falha na tentativa ${i + 1}: ${err.message}`);
      console.error(`[vlanModel] Tentativa ${i + 1} falhou em ${host}: ${err.message}`);
      if (i < TENTATIVAS_CONEXAO.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  const erro = new Error(`Falha ao conectar ao switch ${host}: ${lastError?.message}`);
  console.error(`[vlanModel] ${erro.message}`);
  throw erro;
}

// Base: executa uma lista fixa de comandos em uma conexão SSH.
export async function executarComandos(host, commands, timeoutMs = 60000) {
  const conn = await conectar(host);

  return new Promise((resolve, reject) => {
    conn.shell({ term: 'vt100', cols: 200, rows: 50 }, (err, stream) => {
      if (err) {
        console.error(`[vlanModel] Erro ao abrir shell em ${host}: ${err.message}`);
        conn.end();
        return reject(err);
      }

      let buffer = '';
      let lastSentAt = 0;
      let cmdIndex = 0;
      let done = false;

      const timer = setTimeout(() => {
        const pendente = commands.slice(cmdIndex).join(', ');
        console.error(`[vlanModel] Timeout em ${host}. Comandos pendentes: ${pendente || 'nenhum'}`);
        console.error(`[vlanModel] Último output recebido:\n${buffer.slice(-500)}`);
        finish(null, new Error('Timeout aguardando resposta do switch'));
      }, timeoutMs);

      function finish(result, error) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { conn.end(); } catch {}
        if (error) reject(error);
        else resolve(result);
      }

      function sendNext() {
        if (cmdIndex >= commands.length) {
          return finish({ success: true, output: buffer });
        }
        const cmd = commands[cmdIndex++];
        logger.debug(`> ${cmd}`);
        console.log(`[vlanModel] Enviando (${cmdIndex}/${commands.length}): ${cmd}`);
        lastSentAt = buffer.length;
        stream.write(cmd + '\n');
      }

      stream.on('data', (data) => {
        buffer += data.toString();
        const newData = buffer.slice(lastSentAt);

        if (CONFIRM_RE.test(newData)) {
          console.log(`[vlanModel] Confirmação detectada — respondendo Y`);
          lastSentAt = buffer.length;
          stream.write('y\n');
        } else if (PROMPT_RE.test(newData)) {
          sendNext();
        }
      });

      stream.on('close', () => finish({ success: true, output: buffer }));
      stream.on('error', (err) => {
        console.error(`[vlanModel] Erro no stream SSH em ${host}: ${err.message}`);
        finish(null, err);
      });
    });
  });
}

/**
 * Verifica se a porta é trunk e, na mesma sessão SSH, executa os comandos
 * de configuração. Lança erro com code 'TRUNK_PORT' se a porta for trunk.
 *
 * Fluxo de uma única conexão:
 *   [check phase]  screen-length + display → analisa output
 *   [config phase] system-view + comandos de configuração (só se não for trunk)
 */
export async function configurarComVerificacaoTrunk(host, interfaceName, configCommands, timeoutMs = 90000) {
  const conn = await conectar(host);

  const checkCommands = [
    'screen-length 0 temporary',
    `display current-configuration interface ${interfaceName}`,
  ];
  const checkPhaseEnd = checkCommands.length;

  // activeCommands começa só com os comandos de verificação.
  // Se a porta não for trunk, os configCommands são anexados dinamicamente.
  let activeCommands = [...checkCommands];

  return new Promise((resolve, reject) => {
    conn.shell({ term: 'vt100', cols: 200, rows: 50 }, (err, stream) => {
      if (err) {
        console.error(`[vlanModel] Erro ao abrir shell em ${host}: ${err.message}`);
        conn.end();
        return reject(err);
      }

      let buffer = '';
      let lastSentAt = 0;
      let cmdIndex = 0;
      let done = false;

      const timer = setTimeout(() => {
        const pendente = activeCommands.slice(cmdIndex).join(', ');
        console.error(`[vlanModel] Timeout em ${host}. Comandos pendentes: ${pendente || 'nenhum'}`);
        console.error(`[vlanModel] Último output:\n${buffer.slice(-500)}`);
        finish(null, new Error('Timeout aguardando resposta do switch'));
      }, timeoutMs);

      function finish(result, error) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { conn.end(); } catch {}
        if (error) reject(error);
        else resolve(result);
      }

      function sendNext() {
        // Fase de verificação concluída: analisar antes de prosseguir
        if (cmdIndex === checkPhaseEnd) {
          if (/port link-type trunk/i.test(buffer)) {
            const msg = `Porta ${interfaceName} é trunk e não pode ser alterada`;
            logger.warn(`🚫 ${msg} no host ${host}`);
            console.warn(`[vlanModel] 🚫 Bloqueado: ${msg}`);
            stream.write('quit\n');
            const err = new Error(msg);
            err.code = 'TRUNK_PORT';
            return finish(null, err);
          }

          // Porta não é trunk: anexa os comandos de configuração e continua
          logger.info(`✅ Porta ${interfaceName} não é trunk — prosseguindo com configuração`);
          console.log(`[vlanModel] Porta ${interfaceName} liberada. Iniciando configuração...`);
          activeCommands = [...checkCommands, ...configCommands];
        }

        if (cmdIndex >= activeCommands.length) {
          return finish({ success: true, output: buffer });
        }

        const cmd = activeCommands[cmdIndex++];
        logger.debug(`> ${cmd}`);
        console.log(`[vlanModel] Enviando (${cmdIndex}/${activeCommands.length}): ${cmd}`);
        lastSentAt = buffer.length;
        stream.write(cmd + '\n');
      }

      stream.on('data', (data) => {
        buffer += data.toString();
        const newData = buffer.slice(lastSentAt);

        if (CONFIRM_RE.test(newData)) {
          console.log(`[vlanModel] Confirmação detectada — respondendo Y`);
          lastSentAt = buffer.length;
          stream.write('y\n');
        } else if (PROMPT_RE.test(newData)) {
          sendNext();
        }
      });

      stream.on('close', () => finish({ success: true, output: buffer }));
      stream.on('error', (err) => {
        console.error(`[vlanModel] Erro no stream SSH: ${err.message}`);
        finish(null, err);
      });
    });
  });
}
