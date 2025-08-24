export function parseMacOutput(output, mac, listaVlans, fabricante = "huawei") {
  if (!output) return null;

  const linhas = output.split("\n").map(l => l.trim());
  let vlan = null, porta = null, hostReal = null;

  for (const linha of linhas) {
    if (linha.includes(mac)) {
      const partes = linha.split(/\s+/);
      if (fabricante === "huawei" && partes.length >= 3) {
        vlan = parseInt(partes[1]);
        porta = partes[2];
      } else if ((fabricante === "hpe" || fabricante === "hpe-cmdline") && partes.length >= 5) {
        vlan = parseInt(partes[1]);
        porta = partes[3];
      }
    }

    const hostMatch = linha.match(/<(\S+)/);
    if (hostMatch) {
      hostReal = hostMatch[1].replace(/[>#]$/, ""); // remove > ou # no final
    }
  }

  if (vlan && listaVlans.includes(vlan) && porta && hostReal) {
    return { mac, vlan, porta, hostReal };
  }
  return null;
}
