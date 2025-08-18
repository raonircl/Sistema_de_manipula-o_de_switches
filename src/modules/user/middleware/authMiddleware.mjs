import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../../config/env.mjs";

export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};