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
    const systemPrompt = '�ЧP�_�ϥΪ̿�J�D�n�ݩ�u�ؼСv�B�u�ݿ�v�B�u�ɶ��v�Ρu��L�v�|�����O�A�Ȧ^�� GOAL�BOBLIGATION�BTIME �� OTHER�C';
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