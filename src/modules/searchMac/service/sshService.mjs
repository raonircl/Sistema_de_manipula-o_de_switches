import { Client } from "ssh2";
import { SSH_USER, SSH_PASS } from "../../../config/env.mjs";

if (!SSH_USER || !SSH_PASS) {
  throw new Error("Variáveis SSH_USER e SSH_PASS são obrigatórias");
}

const SSH_CONFIG_SAFE = {
  readyTimeout: 10000,
  keepAliveInterval: 20000,
};

const SSH_CONFIG_FALLBACK = {
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

export async function conectarComFallback(host) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let tentativas = [
      { config: SSH_CONFIG_SAFE, desc: "configuração segura" },
      { config: SSH_CONFIG_FALLBACK, desc: "fallback padrão" },
      {
        config: {
          ...SSH_CONFIG_FALLBACK,
          algorithms: {
            kex: ['diffie-hellman-group1-sha1', 'diffie-hellman-group14-sha1'],
            cipher: ['aes128-cbc', '3des-cbc'],
            hmac: ['hmac-sha1', 'hmac-md5']
          }
        },
        desc: "fallback ultra-compatível"
      }
    ];
    let tentativaAtual = 0;

    const tentarProximaConfig = () => {
      if (tentativaAtual < tentativas.length) {
        console.log(`🔄 ${host} - Tentando ${tentativas[tentativaAtual].desc}`);
        conn.connect({
          host,
          username: SSH_USER,
          password: SSH_PASS,
          ...tentativas[tentativaAtual].config
        });
        tentativaAtual++;
      } else {
        conn.end();
        reject(new Error("Todas as tentativas de conexão falharam"));
      }
    };

    conn.on("ready", () => {
      conn.shell((err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        resolve({ conn, stream });
      });
    }).on("error", (err) => {
      if (err.message.includes('algorithm') || err.message.includes('handshake')) {
        tentarProximaConfig();
      } else {
        conn.end();
        reject(err);
      }
    });

    tentarProximaConfig();
  });
};