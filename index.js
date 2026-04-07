import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import openaiRouter from './route/openaiRouter.js';
import geminiRouter from './route/geminiRouter.js';
import geminiGenAiRouter from './route/geminiGenAiRouter.js';
import compareRouter from './route/compareRouter.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use('/openai', openaiRouter);
app.use('/gemini', geminiRouter);
app.use('/gemini-genai', geminiGenAiRouter);
app.use('/compare', compareRouter);

const host = '0.0.0.0';
const port = process.env.PORT || 3005;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    console.log(`Server started on ${port}`);
  });
}

export default app;
