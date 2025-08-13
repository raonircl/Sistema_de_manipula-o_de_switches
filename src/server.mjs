import express from 'express';
import { testConnection, getConnection } from './config/knex.mjs';
import { PORT, testVars } from './config/env.mjs';
import userRoutes from "./modules/user/route/userRoute.mjs";

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GET request to the homepage')
});

app.use("/api/users", userRoutes);
//Rota de saúde do servidor
app.get('/health', async (req, res) => {
  try {
    const db = getConnection();
    await db.raw('SELECT 1');
    const envStatus = await testVars();
    return res.status(200).json({
      message: 'Servidor saudável',
      status: 200,
      uptime: process.uptime(),
      timeStamp: new Date().toISOString(),
      env: envStatus, db
    });
  } catch (error) {
    return res.status(500).json({ 
      message: 'Falha ao conectar no banco de dados', 
      status: 500
    });
  }
});

const startServer = async () => {
  //resultado de conexão com o banco de dados no terminal
  await testConnection();
  //Variáveis de ambiente
  await testVars();

  app.listen(PORT, () =>{
    console.log('Servidor online! 🟢');
  });
};

startServer();

