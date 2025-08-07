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

export const testVars = async () => {
  const requiredVars = {
    PORT,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS,
    DB_NAME,
    JWT_SECRET,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length) {
    throw new Error(`⚠️ Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
  }

  console.log('Variáveis de ambiente! 🟢');
  return { ok: true, loaded: Object.keys(requiredVars) };
};
