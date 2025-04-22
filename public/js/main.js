// 全局变量
let isWaitingForResponse = false;

// DOM 元素
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 事件监听
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// 处理发送消息
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message || isWaitingForResponse) return;

    // 添加用户消息到聊天历史
    appendMessage(message, 'user');
    userInput.value = '';
    isWaitingForResponse = true;

    try {
        // 发送请求到后端
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) throw new Error('网络请求失败');

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            aiResponse += chunk;
            
            // 更新AI回复
            updateAIMessage(aiResponse);
        }

    } catch (error) {
        console.error('Error:', error);
        appendMessage('抱歉，发生了一些错误，请稍后重试。', 'ai');
    } finally {
        isWaitingForResponse = false;
    }
}

// 添加消息到聊天历史
function appendMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// 更新AI消息
function updateAIMessage(text) {
    let lastMessage = chatHistory.lastElementChild;
    if (!lastMessage || !lastMessage.classList.contains('ai-message')) {
        lastMessage = document.createElement('div');
        lastMessage.className = 'message ai-message';
        chatHistory.appendChild(lastMessage);
    }
    lastMessage.textContent = text;
    chatHistory.scrollTop = chatHistory.scrollHeight;
}