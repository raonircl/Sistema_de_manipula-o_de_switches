import { userModel } from "../model/authModel.mjs";
import bcrypt from "bcrypt";

export const userService = {
  createUser: async (data) => {
    const existingUser = await userModel.findByEmail(data.email);
    
    if (existingUser) {
      throw new Error("Email não autorizado");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role_id: data.role_id
    }

    return userModel.create(newUser);
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