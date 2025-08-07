import dotenv from 'dotenv';
dotenv.config();

export const {
  PORT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
  JWT_SECRET,
} = process.env;

