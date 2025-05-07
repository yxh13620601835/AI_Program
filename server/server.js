require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务配置
app.use(express.static('public'));

// 根路由处理
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// 检查环境变量
const checkEnvVariables = () => {
  const missingVars = [];
  if (!process.env.DEEPSEEK_API_KEY) missingVars.push('DEEPSEEK_API_KEY');
  if (!process.env.DEEPSEEK_API_URL) missingVars.push('DEEPSEEK_API_URL');
  
  if (missingVars.length > 0) {
    console.warn(`警告: 以下环境变量未设置: ${missingVars.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('生产环境必须设置所有环境变量！');
      process.exit(1);
    }
    return false;
  }
  return true;
}

// 环境变量检查
const envValid = checkEnvVariables();

// API路由
app.post('/api/chat', async (req, res) => {
  try {
    // 如果环境变量未设置，返回适当的错误响应
    if (!envValid) {
      console.error('API调用失败：环境变量未正确配置');
      return res.status(503).json({
        error: '服务暂时不可用',
        message: '系统配置不完整，请稍后再试'
      });
    }

    const response = await fetch(process.env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API响应错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return res.status(response.status).json({
        error: '请求处理失败',
        message: errorData.error || '与AI服务通信时发生错误'
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API请求错误:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '处理请求时发生意外错误，请稍后重试'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});