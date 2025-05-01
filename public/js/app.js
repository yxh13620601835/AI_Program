document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // 存储对话历史
    let messageHistory = [];

    // 添加消息到聊天界面
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.style.margin = '10px 0';
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.backgroundColor = isUser ? '#e3f2fd' : '#f5f5f5';
        messageDiv.style.alignSelf = isUser ? 'flex-end' : 'flex-start';
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 添加消息到历史记录
        messageHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: content
        });
    }

    // 发送消息到服务器
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        try {
            // 显示用户消息并清空输入框
            addMessage(message, true);
            userInput.value = '';
            
            // 准备发送到API的消息历史
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-r1-250120',
                    messages: messageHistory,
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: false
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                const botResponse = data.choices[0].message.content;
                addMessage(botResponse);
            }
        } catch (error) {
            console.error('发送消息时出错:', error);
            addMessage('抱歉，发生了一些错误。请稍后再试。');
        }
    }

    // 事件监听器
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});