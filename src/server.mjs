import express from 'express';
import { testConnection } from './config/knex.mjs';
import { PORT, testVars } from './config/env.mjs';
import userRoutes from "./modules/user/route/userRoute.mjs";
import loginRoutes from "./modules/user/route/loginRoute.mjs";
import healthRoutes from "./modules/health/router/healthRoutes.mjs";
import cors from "cors";

const app = express();
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('GET request to the homepage')
});

app.use("/api/users", userRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api", healthRoutes);

const startServer = async () => {
  await testConnection();
  await testVars();
  app.listen(PORT, () =>{
    console.log('Servidor online! 🟢');
  });
};

startServer();

