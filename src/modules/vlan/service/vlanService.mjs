import { conectarComFallback, SSH_CONFIG_FALLBACK, SSH_CONFIG_SAFE } from '../../../config/sshConfig.mjs';

async function configurarVlan(switchHost, porta, vlanId) {
  const { conn, stream } = await conectarComFallback(switchHost);
  try {
    // Executar comando de configuração de VLAN
    const comando = `vlan ${vlanId} port ${porta}`;
    stream.write(comando + '\n');
    // Aguardar resposta do switch
    const resposta = await stream.read();
    if (resposta.includes('VLAN configurada com sucesso')) {
      return true;
    } else {
      throw new Error('Erro ao configurar VLAN');
    }
  } catch (err) {
    throw err;
  } finally {
    conn.end();
  }
}

export { configurarVlan };