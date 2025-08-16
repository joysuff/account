import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import userRouter from './routes/user.js';
import categoryRouter from './routes/category.js';
import recordRouter from './routes/record.js';
import statisticsRouter from './routes/statistics.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', userRouter);
app.use('/api', categoryRouter);
app.use('/api', recordRouter);
app.use('/api', statisticsRouter);

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url);
// 获取当前文件所在目录
const __dirname = path.dirname(__filename);

const frontendDistPath = path.join(__dirname, 'public/spa');


app.use(express.static(frontendDistPath));

// 所有非 API 路由重定向到 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).json({ code: 404, msg: '接口不存在' });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});