require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DeepSeek API配置
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = process.env.DEEPSEEK_API_URL;

// 系统角色设定
const SYSTEM_PROMPT = `你是一位专业的Life Coach，你的目标是通过对话帮助用户实现个人成长。
请遵循以下原则：
1. 倾听和理解用户的需求
2. 提供具体、可行的建议
3. 保持积极和支持的态度
4. 引导用户进行自我反思
5. 帮助用户制定可实现的目标`;

// 处理聊天请求
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // 设置响应头以支持流式输出
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 准备请求体
        const requestBody = {
            model: 'deepseek-r1-250120',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ],
            stream: true,
            temperature: 0.6
        };

        // 发送请求到DeepSeek API
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!apiResponse.ok) {
            throw new Error(`API请求失败: ${apiResponse.status}`);
        }

        // 处理流式响应
        const reader = apiResponse.body;
        
        reader.on('data', chunk => {
            try {
                // 将Buffer转换为字符串
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    // 移除"data: "前缀
                    const jsonLine = line.replace(/^data: /, '').trim();
                    if (jsonLine === '[DONE]') continue;
                    
                    try {
                        // 解析JSON数据
                        const jsonData = JSON.parse(jsonLine);
                        const content = jsonData.choices[0]?.delta?.content || '';
                        
                        // 发送解析后的文本内容给客户端
                        if (content) {
                            res.write(content);
                        }
                    } catch (parseError) {
                        console.error('解析JSON数据时出错:', parseError);
                    }
                }
            } catch (error) {
                console.error('处理响应数据时出错:', error);
            }
        });
        
        reader.on('end', () => {
            res.end();
        });
        
        reader.on('error', error => {
            console.error('读取响应流时出错:', error);
            res.status(500).end();
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 设置超时
app.timeout = 60000; // 60秒

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});