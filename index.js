import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import aiRouter from './route/ai.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/ai', aiRouter);

const host = '0.0.0.0';
const port = process.env.PORT || 3009;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    console.log(`Server started on ${port}`);
  });
}

export default app;
