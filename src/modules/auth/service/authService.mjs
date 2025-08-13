import { userModel } from "../model/authModel.mjs";

export const userService = {
  createUser: async (data) => {
    const existingUser = await userModel.findByEmail(data.email);

    if (existingUser) {
      throw new Error("Email não autorizado");
    }

    return userModel.create(data);
  },

  getUserById: async (id) => {
    const user = await userModel.findById(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  },

  updateUser: async (id, data) => {
    await userService.getUserById(id);
    return userModel.update(id, data);
  },

  deleteUser: async (id) => {
    await userService.getUserById(id);
    return userModel.delete(id);
  }
};