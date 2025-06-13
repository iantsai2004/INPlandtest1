// src/services/openaiService.js

const { OpenAI } = require('openai');

const MODEL = 'o4-mini';

let openaiInstance;

function initOpenAI(apiKey) {
    if (!apiKey) {
        console.warn('OpenAI API key not provided. openaiService will not work.');
        return;
    }
    openaiInstance = new OpenAI({ apiKey });
}

async function sendChatPrompt(systemPrompt, userContent) {
    if (!openaiInstance) {
        throw new Error('OpenAI is not initialized.');
    }
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
    ];
    const response = await openaiInstance.chat.completions.create({
        model: MODEL,
        messages,
    });
    return response.choices[0].message.content;
}

async function classifyMessage(content) {
    if (!openaiInstance) {
        throw new Error('OpenAI is not initialized.');
    }
    const systemPrompt = '請判斷使用者輸入主要屬於「目標」、「待辦」、「時間」或「其他」四種類別，僅回覆 GOAL、OBLIGATION、TIME 或 OTHER。';
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
    ];
    const response = await openaiInstance.chat.completions.create({
        model: MODEL,
        messages,
    });
    return response.choices[0].message.content.trim();
}

module.exports = {
    initOpenAI,
    sendChatPrompt,
    MODEL,
    classifyMessage,
};