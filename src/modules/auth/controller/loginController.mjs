import { userService  } from "../service/authService.mjs";
import { userSchema } from "../util/validates/userSchema.mjs"

export const userController = {
  create: async (req, res) => {
    try {
      const { error } = userSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: error.details[0].message
        });
      }
      const user = await userService.createUser(req.body);
      res.status(201).json({ 
        message: "Usuário cadastrado com sucesso",
        user: user.name,
        email: user.email
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Erro ao cadastrar novo usuário"
      });
    }
  },

  update: async (req, res) => {
    try {
      const { error } = userSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: error.details[0].message
        });
      }

      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({
        message: "Usuário atualizado com sucesso!"
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Erro ao atualizar usuário"
      });
    }
  },

  delete: async (req, res) => {
    try {
      await userService.deleteUser(req.params.id);
      res.status(204).json({ message: "Usuário deletado com sucesso!" });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
        message: "Erro ao deletar usuário"
      })
    }
  }
}