import { searchMacSwitches } from "../service/macService.mjs";

export const searchMacController = {
  searchMac: async (req, res) => {
    try {
      const mac = req.query.mac;
      console.log("MAC recebido:", mac);

      if (!mac) {
        return res.status(400).json({ message: "MAC não pode ser vázio." });
      }

      const result = await searchMacSwitches(mac);
      if (!result) {
        return res.status(404).json({ message: "MAC não encontrado" });
      }
      console.log(result);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

