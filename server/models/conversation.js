const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        mood: { type: String, enum: ['happy', 'neutral', 'sad', 'angry', 'excited', 'worried'], default: 'neutral' },
        timestamp: { type: Date, default: Date.now }
    }],
    analysis: {
        overallMood: String,
        commonTopics: [String],
        insights: String,
        lastAnalyzed: Date
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);