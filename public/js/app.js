document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const moodSelect = document.getElementById('mood-select');
    const overallMoodElement = document.getElementById('overall-mood');
    const commonTopicsElement = document.getElementById('common-topics');
    const conversationInsightsElement = document.getElementById('conversation-insights');
    
    // 存储对话历史
    const messageHistory = [];

    // 添加消息到聊天界面
    function addMessage(content, isUser = false, mood = 'neutral') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

        // 如果是用户消息，添加心情图标
        if (isUser) {
            const moodEmoji = getMoodEmoji(mood);
            messageDiv.textContent = `${moodEmoji} ${content}`;
        } else {
            messageDiv.textContent = content;
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 添加消息到历史记录
        messageHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: content,
            mood: isUser ? mood : 'neutral'
        });

        // 更新对话分析
        updateConversationAnalysis();
    }

    // 获取心情对应的表情
    function getMoodEmoji(mood) {
        const moodEmojis = {
            happy: '😊',
            neutral: '😐',
            sad: '😢',
            angry: '😠',
            excited: '🤩',
            worried: '😟'
        };
        return moodEmojis[mood] || moodEmojis.neutral;
    }

    // 更新对话分析
    function updateConversationAnalysis() {
        if (messageHistory.length === 0) return;

        // 分析整体情绪
        const userMoods = messageHistory
            .filter(msg => msg.role === 'user' && msg.mood)
            .map(msg => msg.mood);
        
        const moodCounts = userMoods.reduce((acc, mood) => {
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
        }, {});

        const overallMood = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        // 分析常见话题（简单实现，可以根据需要扩展）
        const userMessages = messageHistory
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content);

        const topics = new Set();
        userMessages.forEach(msg => {
            // 这里可以添加更复杂的主题提取逻辑
            const words = msg.split(/\s+/);
            words.forEach(word => {
                if (word.length > 2) topics.add(word);
            });
        });

        // 更新UI
        overallMoodElement.textContent = `${getMoodEmoji(overallMood)} ${overallMood}`;
        commonTopicsElement.textContent = Array.from(topics).slice(0, 5).join(', ') || '暂无主题';
        conversationInsightsElement.textContent = `共${messageHistory.length}条消息，其中用户消息${userMessages.length}条`;
    }

    // 发送消息到服务器
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        const currentMood = moodSelect.value;

        // 显示用户消息并清空输入框
        addMessage(message, true, currentMood);
        userInput.value = '';

        try {
            
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