import { getConnection } from "../../../config/knex.mjs";

const db = getConnection();

export const userModel = {
  create: (userData) => {
    return db("users")
      .insert(userData)
      .returning("*")
      .then(([user]) => user);
  },

  findByEmail: (email) => {
    return db("users")
      .where({ email })
      .first();
  },

  findById: (id) => {
    return db("users")
    .select("users.*", "roles.name as role_name")
    .leftJoin("roles", "users.role_id", "roles.id")
    .where("users.id", id)
    .first();
  },

  findAllUsers: () => {
    return db("users")
    .select('*');
  },

  update: (id, userData) => {
    return db("users")
      .where({ id })
      .update(userData)
      .returning("*")
      .then(([user]) => user);
  },

  delete: (id) => {
    return db("users")
      .where({ id })
      .del();
  }
};
