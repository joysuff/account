const express = require('express');
const cors = require('cors');
const userRouter = require('./routes/user');
const categoryRouter = require('./routes/category');
const recordRouter = require('./routes/record');
const statisticsRouter = require('./routes/statistics');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', userRouter);
app.use('/api', categoryRouter);
app.use('/api', recordRouter);
app.use('/api', statisticsRouter);

app.use((req, res) => {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

const PORT = 3000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 