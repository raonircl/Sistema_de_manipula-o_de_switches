import { JWT_SECRET } from "../../../config/env.mjs";
import { userService } from "../service/authService.mjs";
import { userSchema } from "../util/validates/userSchema.mjs";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

export const loginController = {
  login: async (req, res) => {
    try {
      const loginSchema = userSchema.fork(['name', 'role_id'], field => field.optional());

      const { error } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { email, password } = req.body;
      const user = await userService.getUserByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role_id },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ token, user: user.name });
    } catch (error) {
      if (error.statusCode && error.statusCode !== 500) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao realizar login.' });
    }
  },

  logout: async (req, res) => {
    try {
      return res.status(200).json({ message: "Logout realizado com sucesso!" });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao realizar logout" });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        return res.status(400).json({ error: "Refresh token ausente" });
      }

      const refreshToken = authHeader.split(" ")[1];

      const decoded = jwt.verify(refreshToken, JWT_SECRET);

      const newToken = jwt.sign(
        { id: decoded.id, role: decoded.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ token: newToken });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: "Refresh token inválido ou expirado." });
    }
  }
};