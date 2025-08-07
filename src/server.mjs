import express from 'express';
import { PORT } from './config/env.mjs';

const app = express();

app.get('/', (req, res) => {
  res.send('GET request to the homepage')
});

app.listen(PORT, () =>{
  console.log('Servidor online! 🟢');
});