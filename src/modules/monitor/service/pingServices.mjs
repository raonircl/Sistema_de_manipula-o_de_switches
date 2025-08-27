import pingPackage from 'ping';
const { sys: ping } = pingPackage;

export async function pingHost(host) {
  return new Promise((resolve) => {
    ping.probe(host, (isAlive, responseTime) => {
      resolve({ isAlive, responseTime });
    }, { timeout: 2 });
  });
}
