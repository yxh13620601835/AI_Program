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

// 验证环境变量是否存在
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('错误: 未找到DEEPSEEK_API_KEY环境变量');
  process.exit(1);
}

// API路由
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch(process.env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      let errorMessage = '请求API时发生错误';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error || errorMessage;
        console.error('API响应错误:', errorData);
      } catch (parseError) {
        console.error('解析API错误响应失败:', parseError);
        errorMessage = await response.text();
      }
      return res.status(response.status).json({
        error: errorMessage
      });
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      console.error('API响应格式错误:', data);
      return res.status(500).json({
        error: 'API响应格式不正确'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('API请求错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});