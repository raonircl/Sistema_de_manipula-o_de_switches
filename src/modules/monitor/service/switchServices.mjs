import switches from '../model/switchModel.mjs';
import { pingHost } from './pingServices.mjs';
import { testSSH } from './sshService.mjs';
import { testFtpConnection } from './ftpService.mjs';
import pLimit from 'p-limit';

const limit = pLimit(10); // Limita para 10 operações concorrentes

export async function verificarStatusSwitches() {
  const promises = switches.map(sw =>
    limit(async () => {
      try {
        const { isAlive, responseTime } = await pingHost(sw.host);
        
        if (!isAlive) {
          return { host: sw.host, fabricante: sw.fabricante, status: 'offline', tempoResposta: null, ultimaVerificacao: new Date().toISOString() };
        }

        const sshResult = await testSSH(sw.host);

        if (sshResult.success) {
          const ftpSuccess = await testFtpConnection(sw.host);
          return {
            host: sw.host,
            fabricante: sw.fabricante,
            status: 'online',
            tempoResposta: responseTime,
            protocolo: ftpSuccess ? 'ssh+ftp' : 'ssh',
            ultimaVerificacao: new Date().toISOString()
          };
        } else {
          return {
            host: sw.host,
            fabricante: sw.fabricante,
            status: 'ping-only',
            tempoResposta: responseTime,
            ultimaVerificacao: new Date().toISOString(),
            erro: sshResult.error
          };
        }
      } catch (err) {
        return {
          host: sw.host,
          fabricante: sw.fabricante,
          status: 'error',
          tempoResposta: null,
          ultimaVerificacao: new Date().toISOString(),
          erro: err.message
        };
      }
    })
  );

  const resultados = await Promise.all(promises);

  return resultados;
}
