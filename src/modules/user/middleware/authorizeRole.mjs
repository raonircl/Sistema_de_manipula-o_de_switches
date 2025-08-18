export const authorizeRole = (allowedRole = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if(!user || !user.role_id) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      if (!allowedRole.includes(user.role_id)) {
        return res.status(403).json({ message: "Acesso negado: permissão insuficiente" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Erro no middleware de autorização", error });
    }
  };
};