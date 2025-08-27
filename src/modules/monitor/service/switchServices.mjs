import switches from '../model/switchModel.mjs';
import { pingHost } from './pingServices.mjs';
import { testSSH } from './sshService.mjs';
import { testFtpConnection } from './ftpService.mjs';

export async function verificarStatusSwitches() {
  const resultados = [];

  for (const { host, fabricante } of switches) {
    let pingResponseTime = null;

    try {
      const { isAlive, responseTime } = await pingHost(host);
      if (!isAlive) {
        resultados.push({ host, fabricante, status: 'offline', tempoResposta: null, ultimaVerificacao: new Date().toISOString() });
        continue;
      }
      pingResponseTime = responseTime;

      const sshResult = await testSSH(host);

      if (sshResult.success) {
        const ftpSuccess = await testFtpConnection(host);
        resultados.push({
          host,
          fabricante,
          status: 'online',
          tempoResposta: pingResponseTime,
          protocolo: ftpSuccess ? 'ssh+ftp' : 'ssh',
          ultimaVerificacao: new Date().toISOString()
        });
      } else {
        resultados.push({
          host,
          fabricante,
          status: 'ping-only',
          tempoResposta: pingResponseTime,
          ultimaVerificacao: new Date().toISOString(),
          erro: sshResult.error
        });
      }
    } catch (err) {
      resultados.push({
        host,
        fabricante,
        status: 'error',
        tempoResposta: pingResponseTime,
        ultimaVerificacao: new Date().toISOString(),
        erro: err.message
      });
    }
  }

  return resultados;
}
