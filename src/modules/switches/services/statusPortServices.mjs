import { Client } from "ssh2";
import dotenv from "dotenv";
import { 
  TENTATIVAS_CONEXAO 
} from "../../../config/sshConfig.mjs";
import { 
  executarComando, 
  executarComandoComPaginacao,
  extrairStatus,
  extrairDescricao,
  extrairValorNumerico,
  extrairEstatisticasCompletas,
  extrairUtilizacaoBanda,
  extrairDuplex,
  extrairNegotiation,
  extrairValor
} from "../util/sshHelpers.mjs";

dotenv.config();
const { SSH_USER, SSH_PASS } = process.env;

export async function conectarComFallback(host) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let tentativaAtual = 0;

    const tentarProximaConfig = () => {
      if (tentativaAtual < TENTATIVAS_CONEXAO.length) {
        console.log(`🔄 ${host} - Tentando ${TENTATIVAS_CONEXAO[tentativaAtual].desc}`);

        conn.connect({
          host,
          port: 22,
          username: SSH_USER,
          password: SSH_PASS,
          ...TENTATIVAS_CONEXAO[tentativaAtual].config,
        });

        tentativaAtual++;
      } else {
        conn.end();
        reject(new Error("Todas as tentativas de conexão falharam"));
      }
    };

    conn
      .on("ready", () => {
        console.log(
          `✅ ${host} - Conexão estabelecida com ${TENTATIVAS_CONEXAO[tentativaAtual - 1].desc}`
        );
        resolve(conn);
      })
      .on("error", (err) => {
        if (
          err.message.includes("algorithm") ||
          err.message.includes("handshake")
        ) {
          tentarProximaConfig();
        } else {
          conn.end();
          reject(err);
        }
      });

    // Primeira tentativa
    tentarProximaConfig();
  });
}

export async function obterStatusPortas(host) {
  let conn;
  try {
    conn = await conectarComFallback(host);
    const output = await executarComando(
      conn,
      "screen-length 0 temporary\ndisplay interface brief\nquit"
    );

    // Processamento simplificado apenas para status básico
    const portas = [];
    const linhas = output.split("\n");
    let cabecalhoEncontrado = false;

    for (const linha of linhas) {
      if (linha.includes("Interface                   PHY   Protocol")) {
        cabecalhoEncontrado = true;
        continue;
      }

      if (cabecalhoEncontrado && linha.includes("GigabitEthernet")) {
        const partes = linha.trim().split(/\s+/);
        if (partes.length >= 3) {
          portas.push({
            interface: partes[0],
            phy: partes[1],
            protocol: partes[2],
            status: partes[1] === "up" && partes[2] === "up" ? "up" : "down",
          });
        }
      }
    }

    return portas.sort((a, b) => {
      const numA = parseInt(a.interface.split("/").pop());
      const numB = parseInt(b.interface.split("/").pop());
      return numA - numB;
    });
  } finally {
    if (conn) {
      try {
        conn.end();
      } catch (e) {
        console.error('Erro ao fechar conexão:', e);
      }
    }
  }
}

export async function obterDetalhesPorta(host, interfaceName) {
  let conn;
  try {
    // 1. Estabelece conexão
    conn = await conectarComFallback(host);

    // 2. Configura para evitar paginação e executa o comando
    const output = await executarComandoComPaginacao(
      conn,
      `screen-length 0 temporary\ndisplay interface ${interfaceName}\nquit`
    );

    // 3. Processamento da saída
    const detalhes = {
      interface: interfaceName,
      status: {
        phy: extrairStatus(output, "current state"),
        protocol: extrairStatus(output, "Line protocol current state"),
      },
      description: extrairDescricao(output),
      speed: extrairValorNumerico(output, "Speed"),
      duplex: extrairDuplex(output),
      negotiation: extrairNegotiation(output),
      lastUpTime: extrairValor(output, "Last physical up time"),
      lastDownTime: extrairValor(output, "Last physical down time"),
      currentTime: extrairValor(output, "Current system time"),
      inputStats: extrairEstatisticasCompletas(output, "Input"),
      outputStats: extrairEstatisticasCompletas(output, "Output"),
      bandwidthUtilization: {
        input: extrairUtilizacaoBanda(output, "Input bandwidth utilization"),
        output: extrairUtilizacaoBanda(output, "Output bandwidth utilization"),
      }
    };

    return detalhes;
  } catch (error) {
    console.error(`Erro ao obter detalhes da porta ${interfaceName}:`, error);
    throw new Error(`Falha ao coletar dados da interface: ${error.message}`);
  } finally {
    // 4. Fecha a conexão de forma segura
    if (conn) {
      try {
        conn.end();
      } catch (e) {
        console.error('Erro ao fechar conexão:', e);
      }
    }
  }
}