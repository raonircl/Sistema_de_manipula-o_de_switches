import { connection } from "../../../config/knex.mjs";

export const userModel = {
  create: (userData) => {
    return connection("users")
      .insert(userData)
      .returning("*")
      .then(([user]) => user);
  },

  findByEmail: (email) => {
    return connection("users")
      .where({ email })
      .first();
  },

  findById: (id) => {
    return connection("users")
      .where({ id })
      .first();
  },

  update: (id, userData) => {
    return connection("users")
      .where({ id })
      .update(userData)
      .returning("*")
      .then(([user]) => user);
  },

  delete: (id) => {
    return connection("users")
      .where({ id })
      .del();
  }
};
