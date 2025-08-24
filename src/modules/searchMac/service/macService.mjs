import fs from "fs";
import path from "path";
import { conectarComFallback } from "./sshService.mjs";
import { parseMacOutput } from "../util/parseMacOutput.mjs";

const switchesPath = path.resolve("./switches.json");
if (!fs.existsSync(switchesPath)) throw new Error("Arquivo switches.json não encontrado!");
const switches = JSON.parse(fs.readFileSync(switchesPath, "utf8"));

const VLANS_RELEVANTES = [1000, 1100, 1200, 1300, 1400, 1600, 800, 801, 802, 803, 804, 805, 806, 807,
  808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822,
  823, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 100, 200, 300, 500, 700
];

export async function searchMacSwitches(macDigitado) {
  const mac = normalizarMac(macDigitado);

  for (const { host, fabricante } of switches) {
    try {
      const output = await executarComando(host, fabricante, mac);
      const resultado = parseMacOutput(output, mac, VLANS_RELEVANTES, fabricante);

      if (resultado) {
        return { ...resultado, fabricante, timestamp: Date.now() };
      }
    } catch (err) {
      console.warn(`Erro no switch ${host}: ${err.message}`);
    }
  }
  return null;
};

function normalizarMac(mac) {
  if (!/^([0-9A-Fa-f]{2}[:-]?){5}([0-9A-Fa-f]{2})$/.test(mac)) {
    throw new Error("Formato de MAC inválido");
  }
  return mac.replace(/[^a-fA-F0-9]/g, "").toLowerCase().match(/.{1,4}/g)?.join("-");
};

async function executarComando(host, fabricante, mac) {
  const { conn, stream } = await conectarComFallback(host);
  return new Promise((resolve, reject) => {
    let output = "";
    let commandSent = false;

    const cmd = fabricante === "cisco"
      ? `show mac address-table address ${mac}\n`
      : `display mac-address ${mac}\n`;

    const timer = setTimeout(() => {
      cleanUp();
      reject(new Error("Timeout na execução do comando"));
    }, 30000);

    stream.on("data", (data) => {
      output += data.toString();

      if (!commandSent && />\s*$|#\s*$/.test(output)) {
        stream.write(cmd);
        commandSent = true;
        output = "";
      }

      if (commandSent && />\s*$|#\s*$/.test(output)) {
        clearTimeout(timer);
        cleanUp();
        resolve(output.trim());
      }
    });

    stream.on("close", () => {
      clearTimeout(timer);
      cleanUp();
      reject(new Error("Conexão encerrada antes de resposta"));
    });

    const cleanUp = () => {
      stream?.end("quit\n");
      conn?.end();
    };
  });
};
