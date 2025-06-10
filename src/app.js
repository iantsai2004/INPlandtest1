// src/app.js

// �ޤJ�һݪ��Ҳ�
const express = require('express');
const line = require('@line/bot-sdk'); // �ɤJ��� line-bot-sdk �M��
const admin = require('firebase-admin'); // �p�G�z�ϥ� Firebase
const { OpenAI } = require('openai'); // �p�G�z�ϥ� OpenAI

// --- �����ܼƳ]�w ---
// �T�O�o���ܼƤw�g�b Render �������ܼƤ��]�w
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// �p�G�z�ϥ� Firebase Admin SDK
// �o�̰��]�z�� Firebase �A�ȱb����ҬO�@�� JSON �r��s�b�����ܼƤ�
// �аȥ��N�z�� Firebase JSON ���Ҥ��e�ƻs�K�� Render �������ܼƸ̡A�ܼƦW�٬� FIREBASE_SERVICE_ACCOUNT_KEY
let firebaseApp;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('Failed to parse Firebase Service Account Key:', error);
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY content:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }
} else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Firebase features might not work.');
}

// �p�G�z�ϥ� OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI initialized successfully.');
} else {
    console.warn('OPENAI_API_KEY environment variable is not set. OpenAI features might not work.');
}


// --- Express ���ε{���]�w ---
const app = express();

// Explicitly set up Express to parse JSON and URL-encoded bodies
// This ensures incoming request bodies are handled correctly with UTF-8 encoding.
// ���T�]�w Express �ӸѪR JSON �M URL �s�X���ШD��A�T�O�ǤJ�ШD���s�X���T�B�z
app.use(express.json({
    limit: '5mb', // ����ШD��j�p�A�ھڱz���ݨD�վ�
    type: ['application/json', 'application/x-www-form-urlencoded']
}));
app.use(express.urlencoded({ extended: true }));

const client = new line.Client(config); // �ϥ� line.Client �ӳЫ� LINE Bot �Ȥ��

// LINE Webhook ���Ҥ�����
// �`�N�G�o�̨ϥ� line.middleware(config) �ӳB�zñ�W���ҩM JSON �ѪR
app.post('/webhook', line.middleware(config), async (req, res) => {
    console.log('--- LINE Webhook Event Received ---');
    console.log('Request Headers:', req.headers); // �O���ШD�Y�A���U�󰻿�
    console.log('Request Body:', JSON.stringify(req.body, null, 2)); // �O���ШD��

    // �B�z�C�ӶǤJ���ƥ�
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.status(200).json(result))
        .catch((err) => {
            console.error('Error handling events:', err);
            // �B�z���~�G�^�� 500 Internal Server Error
            res.status(500).end();
        });
});

// --- �ƥ�B�z�禡 ---
async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // �p�G���O��r�T���A�����^��
        return Promise.resolve(null);
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    console.log(`User message: "${userMessage}" from userId: ${event.source.userId}`);

    let replyText = '�z�n�I�ڬO�z�� LINE Bot�C'; // �w�]�^��

    try {
        // --- �b�o�̥[�J�z�� OpenAI �M Firebase �޿� ---
        // �d�ҡG²�檺 OpenAI ����
        if (openai && userMessage.includes('��AI')) {
            const prompt = userMessage.replace('��AI', '').trim();
            if (prompt) {
                console.log('Sending prompt to OpenAI:', prompt);
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // �Ϊ̱z��ܪ���L�ҫ��A�p "gpt-4"
                    messages: [{ role: "user", content: prompt }],
                });
                replyText = chatCompletion.choices[0].message.content;
                console.log('OpenAI response:', replyText);
            } else {
                replyText = '�аݱz�Q�� AI ����O�H';
            }
        }
        // �d�ҡGŪ���μg�J Firebase (�p�G��l�Ʀ��\)
        else if (firebaseApp && userMessage.includes('�g�J���')) {
            const db = firebaseApp.firestore();
            await db.collection('messages').add({
                userId: event.source.userId,
                message: userMessage,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            replyText = '�z���T���w�x�s�� Firebase�C';
            console.log('Message written to Firebase.');
        }
        // --- ���� OpenAI �M Firebase �޿� ---
        else {
            // �p�G�S��Ĳ�o�S�w�޿�A�h�ϥιw�]�^�Щ�²�檺�^�n
            replyText = `�z���F�G�u${userMessage}�v�C`;
        }

    } catch (error) {
        console.error('Error in handling custom logic (OpenAI/Firebase):', error);
        replyText = '�B�z�z���ШD�ɵo�Ϳ��~�A�еy��A�աC';
    }


    // �^�аT�����Τ�
    return client.replyMessage(replyToken, {
        type: 'text',
        text: replyText
    });
}

// --- ���ո��� ---
// �o�Ӹ��ѥΩ��ˬd�A�ȬO�_�B��
app.get('/', (req, res) => {
    console.log('GET / route hit - Testing basic server function.');
    res.status(200).send('LINE Bot server is running for testing. Webhook configured at /webhook.');
});

// --- ���ε{����ť�� ---
// Render �|�z�L�����ܼ� PORT �i�D�ڭ����Ӻ�ť���Ӻݤf
const port = process.env.PORT || 3000; // �p�G�����ܼƨS���]�w�A�h�w�]�� 3000

// �Ұ� Express ���A���A��ť���w�ݤf
app.listen(port, () => {
    console.log(`LINE Bot server listening on port ${port}`);
});

// �N Express ���ε{���ɥX
module.exports = app;
