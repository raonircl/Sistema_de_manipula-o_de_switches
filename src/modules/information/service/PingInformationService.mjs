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

let cache = null;
let lastUpdated = 0;
const CACHE_LIFETIME = 10800 * 1000; // Atualizado a cada 3 horas

export async function obterResumoSwitches() {
  const now = Date.now();

  // Se o cache existir e for "válido" (não expirou), retorne-o
  if (cache && now - lastUpdated < CACHE_LIFETIME) {
    console.log('Retornando dados do cache.');
    return cache;
  }

  // Se o cache não for válido, execute a lógica completa
  console.log('Atualizando dados do switch e salvando no cache.');
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

  // Armazene o novo resultado no cache e atualize o timestamp
  cache = {
    totalSwitches: switches.length,
    ativos,
    offline,
    portasAtivas,
    portasDesligadas,
    // detalhes,
  };
  lastUpdated = now;

  return cache;
}