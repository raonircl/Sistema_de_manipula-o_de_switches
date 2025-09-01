export const SSH_CONFIG_SAFE = {
  readyTimeout: 10000,
  keepaliveInterval: 20000,
};

export const SSH_CONFIG_FALLBACK = {
  algorithms: {
    kex: [
      "diffie-hellman-group14-sha1",
      "diffie-hellman-group1-sha1",
      "diffie-hellman-group-exchange-sha1",
      "ecdh-sha2-nistp256",
      "diffie-hellman-group14-sha256",
    ],
    cipher: [
      "aes128-cbc",
      "aes256-cbc",
      "3des-cbc",
      "aes128-ctr",
      "aes256-ctr",
    ],
    hmac: ["hmac-sha1", "hmac-sha2-256", "hmac-md5"],
  },
  readyTimeout: 35000,
  keepaliveInterval: 45000,
};

export const TENTATIVAS_CONEXAO = [
  {
    config: {
      ...SSH_CONFIG_SAFE,
      algorithms: {
        kex: ["ecdh-sha2-nistp256", "diffie-hellman-group14-sha256"],
        cipher: ["aes256-ctr", "aes128-ctr"],
        hmac: ["hmac-sha2-256"],
      },
    },
    desc: "configuração segura moderna",
  },
  {
    config: SSH_CONFIG_FALLBACK,
    desc: "fallback padrão",
  },
  {
    config: {
      ...SSH_CONFIG_FALLBACK,
      algorithms: {
        kex: ["diffie-hellman-group1-sha1", "diffie-hellman-group14-sha1"],
        cipher: ["aes128-cbc", "3des-cbc"],
        hmac: ["hmac-sha1", "hmac-md5"],
      },
    },
    desc: "fallback ultra-compatível",
  },
];