import { getConnection } from '../../../config/knex.mjs';
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER, PORT, JWT_SECRET } from '../../../config/env.mjs';

export const testVars = () => {
  const requiredVars = {
    PORT: PORT,
    DB_HOST: DB_HOST,
    DB_PORT: DB_PORT,
    DB_USER: DB_USER,
    DB_PASS: DB_PASS,
    DB_NAME: DB_NAME,
    JWT_SECRET: JWT_SECRET,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const loadedVars = Object.keys(requiredVars).filter(key => requiredVars[key]);

  return {
    ok: missingVars.length === 0,
    loaded: loadedVars,
    missing: missingVars,
    total_required: Object.keys(requiredVars).length,
    total_loaded: loadedVars.length,
    total_missing: missingVars.length
  };
};

export const testDatabase = async () => {
  try {
    const db = await getConnection();
    await db.raw('SELECT 1');
    return { 
      connected: true, 
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    throw new Error('Falha ao conectar no banco de dados');
  }
};

export const getSystemInfo = () => {
  return {
    node_version: process.version,
    platform: process.platform,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
};