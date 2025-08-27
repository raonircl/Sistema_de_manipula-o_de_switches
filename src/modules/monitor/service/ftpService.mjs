import ftp from 'basic-ftp';
import { SSH_PASS, SSH_USER } from '../../../config/env.mjs';

export async function testFtpConnection(host) {
  const client = new ftp.Client(5000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      user: SSH_USER,
      password: SSH_PASS,
      secure: false,
      timeout: 5000,
    });
    await client.close();
    return true;
  } catch {
    await client.close();
    return false;
  }
}
