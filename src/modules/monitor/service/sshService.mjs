import { Client } from 'ssh2';
import { SSH_PASS, SSH_USER } from '../../../config/env.mjs';

export const SSH_CONFIG_FALLBACK = {
  algorithms: {
    kex: [
      'diffie-hellman-group14-sha1',
      'diffie-hellman-group1-sha1',
      'diffie-hellman-group-exchange-sha1',
      'ecdh-sha2-nistp256',
      'diffie-hellman-group14-sha256'
    ],
    cipher: ['aes128-cbc', 'aes256-cbc', '3des-cbc', 'aes128-ctr', 'aes256-ctr'],
    hmac: ['hmac-sha1', 'hmac-sha2-256', 'hmac-md5']
  },
  readyTimeout: 35000,
  keepaliveInterval: 45000
};

export async function testSSH(host) {
  const conn = new Client();

  return new Promise((resolve) => {
    let connected = false;

    conn.on('ready', () => {
      connected = true;
      resolve({ success: true });
    })
    .on('error', (err) => resolve({ success: false, error: err.message }))
    .on('end', () => {
      if (!connected) resolve({ success: false, error: 'Conexão SSH finalizada inesperadamente' });
    })
    .connect({
      host,
      username: SSH_USER,
      password: SSH_PASS,
      ...SSH_CONFIG_FALLBACK,
    });

    setTimeout(() => {
      if (!connected) {
        conn.end();
        resolve({ success: false, error: 'Timeout SSH (20s)' });
      }
    }, SSH_CONFIG_FALLBACK.readyTimeout + 2000);
  }).finally(() => {
    try { conn.end(); } catch {}
  });
}
