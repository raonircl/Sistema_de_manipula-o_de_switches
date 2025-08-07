import knex from "knex";
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from './env.mjs';

let connection = null;

export const getConnection = () => {
  if (!connection) {
    connection = knex({
      client: 'pg',
      connection: {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
        port: DB_PORT,
        ssl: false,
      },
      pool: {
        min: 2,
        max: 10,
      }
    });
  }
  return connection;
};
//encerramento da conexão do banco
export const closeConnection = async () => {
  if (connection) {
    try {
      await connection.destroy();
      console.log('Conexão com banco encerrada');
    }
    catch (error) {
      console.error('Erro ao encerrar conexão com o banco de dados', error.message);
    }
  }
};

process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});
//teste de conexão com o banco de dados
export const testConnection = async () => {
  try {
    const db = getConnection();
    await db.raw('SELECT 1');
    console.log('Banco online! 🟢');
  } catch (error) {
    console.log('Falha na conexão com o banco de dados 🔴');
    process.exit(1);
  }
};