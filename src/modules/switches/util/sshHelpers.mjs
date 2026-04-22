import { Client } from "ssh2";

export function executarComando(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);

      let output = "";
      stream
        .on("data", (data) => (output += data))
        .on("close", () => resolve(output))
        .on("error", reject);
    });
  });
}

export function executarComandoComPaginacao(conn, command) {
  return new Promise((resolve, reject) => {
    let output = "";
    conn.exec(command, { pty: true }, (err, stream) => {
      if (err) return reject(err);

      stream
        .on("data", (data) => {
          output += data.toString();
          if (
            data.includes("---- More ----") ||
            data.includes("--- More ---")
          ) {
            stream.write(" "); // Envia espaço para continuar
          }
        })
        .on("close", () => resolve(output))
        .on("error", reject);

      // Timeout de segurança
      setTimeout(() => {
        if (!output.includes("Current system time")) {
          stream.end();
          reject(new Error("Timeout ao executar comando"));
        }
      }, 10000);
    });
  });
}

/**
 * 🚀 Novo: executa uma sequência de comandos no mesmo shell
 */
export function executarComandos(conn, comandos = []) {
  return new Promise((resolve, reject) => {
    conn.shell((err, stream) => {
      if (err) return reject(err);

      let output = "";

      stream.on("data", (chunk) => {
        output += chunk.toString();
      });

      stream.stderr.on("data", (chunk) => {
        output += chunk.toString();
      });

      stream.on("close", () => {
        resolve(output);
      });

      // envia os comandos
      for (const cmd of comandos) {
        stream.write(cmd + "\n");
      }

      // finaliza salvando a configuração
      stream.end("save force\n");
    });
  });
}

// ----------------------------
// Parsers de saída (mantidos)
// ----------------------------
export function extrairStatus(output, chave) {
  const regex = new RegExp(`${chave}\\s*:\\s*(UP|DOWN)`, "i");
  const match = output.match(regex);
  return match ? match[1].toLowerCase() : "unknown";
}

export function extrairDescricao(output) {
  const match = output.match(/Description\s*:\s*(.*?)(\n|$)/i);
  return match ? match[1].trim() : "Sem descrição";
}

export function extrairValorNumerico(output, chave) {
  const match = output.match(new RegExp(`${chave}\\s*:\\s*(\\d+)`));
  return match ? parseInt(match[1]) : 0;
}

export function extrairEstatisticasCompletas(output, tipo) {
  const sectionRegex = new RegExp(
    `${tipo}:.*?(\\n\\s{2}\\S+.*?)*\\n\\s+\\S`,
    "s"
  );
  const sectionMatch = output.match(sectionRegex);
  if (!sectionMatch) return {};

  const stats = {};
  const lines = sectionMatch[0].split("\n");

  lines.forEach((line) => {
    const parts = line.trim().split(/\s*:\s*|\s*,\s*/);
    if (parts.length === 2) {
      stats[parts[0].toLowerCase()] = parts[1];
    } else if (line.includes(",")) {
      line.split(",").forEach((pair) => {
        const [key, val] = pair.trim().split(/\s*:\s*/);
        if (key && val) stats[key.toLowerCase()] = val;
      });
    }
  });

  return stats;
}

export function extrairUtilizacaoBanda(output, chave) {
  const match = output.match(new RegExp(`${chave}\\s*:\\s*(\\d+\\.?\\d*%?)`));
  return match ? match[1] : "0%";
}

export function extrairDuplex(output) {
  const match = output.match(/Duplex\s*:\s*(\w+)(,|$)/);
  return match ? match[1] : "N/A";
}

export function extrairNegotiation(output) {
  const match = output.match(/Negotiation\s*:\s*(\w+)/);
  return match ? match[1] : "N/A";
}

export function extrairValor(texto, chave) {
  const regex = new RegExp(`${chave}\\s*:\\s*(.+)`);
  const match = texto.match(regex);
  return match ? match[1].trim() : "Não disponível";
}
