import express from 'express';
import https from 'https';
import fs from 'fs';
import { testConnection } from './config/knex.mjs';
import { PORT, testVars } from './config/env.mjs';
import userRoutes from "./modules/user/route/userRoute.mjs";
import loginRoutes from "./modules/user/route/loginRoute.mjs";
import healthRoutes from "./modules/health/router/healthRoutes.mjs";
import switchRoutes from './modules/monitor/route/monitorRoute.mjs';
import macRoutes from "./modules/searchMac/route/macRoutes.mjs";
import statusPort from './modules/switches/route/statusPort.mjs';
import informationRoutes from './modules/information/route/routeInformation.mjs';
import vlanRoutes from './modules/vlan/route/vlanRoutes.mjs';
import cors from "cors";
import { authMiddleware } from './modules/user/middleware/authMiddleware.mjs';

const app = express();
app.use(express.json());

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('GET request to the homepage')
});

const options = {
  key: fs.readFileSync('C:/xampp/apache/conf/ssl.key/server.key'),
  cert: fs.readFileSync('C:/xampp/apache/conf/ssl.crt/server.crt'),
};

app.use("/api/users", userRoutes);
app.use("/api/auth", loginRoutes);
app.use('/api', authMiddleware, switchRoutes);
app.use("/api", authMiddleware, macRoutes);
app.use("/api/status-portas", authMiddleware, statusPort);
app.use("/api/switches", authMiddleware, informationRoutes);
app.use("/api/vlan", authMiddleware, vlanRoutes);
app.use("/api", healthRoutes);

const startServer = async () => {
  await testConnection();
  await testVars();
  https.createServer(options, app).listen(PORT, () => {
    console.log(`Servidor online! 🟢 HTTPS ativo em https://10.46.20.75:${PORT}`);
  });
};

startServer();

