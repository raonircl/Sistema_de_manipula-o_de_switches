import { verificarStatusSwitches } from '../service/switchServices.mjs';

export async function getSwitchStatus(req, res) {
  try {
    const status = await verificarStatusSwitches();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
