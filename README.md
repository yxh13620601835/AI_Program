# Life Coach AI 项目

## 项目简介
这是一个基于DeepSeek R1 API的个人成长辅导网站。通过与AI进行对话，用户可以获得个性化的建议和指导，帮助个人成长。

## 技术架构
- 前端：HTML5 + CSS3 + JavaScript
- 后端：Node.js + Express
- API：火山方舟 DeepSeek R1

## 功能模块

### 1. 对话界面
- 用户输入区：清晰的文本输入框
- 对话历史展示区：支持滚动的聊天记录显示
- 发送按钮：触发对话请求

### 2. 系统设置
- AI角色设定：作为life coach的系统提示词配置
- 对话参数：温度(0.6)等参数设置

### 3. 响应处理
- 流式输出：实时显示AI响应
- 错误处理：网络异常、超时(60s)等情况的友好提示

## 项目结构
```
lifecoach/
├── public/          # 静态资源
│   ├── css/         # 样式文件
│   ├── js/          # 客户端脚本
│   └── index.html   # 主页面
├── server/          # 后端服务
│   └── server.js    # Express服务器
└── package.json     # 项目配置
```

## 开发规范
- 使用语义化HTML标签
- 采用响应式设计
- 使用Flexbox和Grid布局
- 添加中文注释
- 确保代码符合W3C标准

## 启动说明
1. 安装依赖：`npm install`
2. 启动服务器：`npm start`
3. 访问地址：`http://localhost:3000`