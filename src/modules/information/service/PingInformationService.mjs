import { obterListaSwitches } from '../util/readSwitches.mjs';
import { obterStatusPortas } from '../../switches/services/statusPortServices.mjs';
import util from 'util';
import child_process from 'child_process';
import pLimit from 'p-limit';

const exec = util.promisify(child_process.exec);
const limit = pLimit(10); // Processa 5 switches ao mesmo tempo

function gerarPortasDesligadas(qtd = 24) {
  return Array.from({ length: qtd }, (_, i) => ({
    nome: `Porta${i + 1}`,
    status: 'down',
  }));
}

export async function pingSwitch(host) {
  try {
    const { stdout } = await exec(`ping -n 1 -w 500 ${host}`);
    return stdout.includes('TTL=') || stdout.toLowerCase().includes('ttl=');
  } catch {
    return false;
  }
}

export async function obterResumoSwitches() {
  const switches = await obterListaSwitches();
  let ativos = 0,
    offline = 0,
    portasAtivas = 0,
    portasDesligadas = 0;

  const detalhes = await Promise.all(
    switches.map((sw) =>
      limit(async () => {
        if (!sw.host)
          return { ...sw, online: false, portas: gerarPortasDesligadas(24) };

        const online = await pingSwitch(sw.host);
        if (online) ativos++;
        else offline++;

        let portas = [];
        if (online) {
          try {
            portas = await obterStatusPortas(sw.host);
          } catch {
            portas = gerarPortasDesligadas(24);
          }
        } else {
          portas = gerarPortasDesligadas(24);
        }

        portasAtivas += portas.filter((p) => p.status === 'up').length;
        portasDesligadas += portas.filter((p) => p.status === 'down').length;

        return { ...sw, online, portas };
      })
    )
  );

  return {
    totalSwitches: switches.length,
    ativos,
    offline,
    portasAtivas,
    portasDesligadas,
    // detalhes,
  };
}