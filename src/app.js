// src/app.js

// 引入所需的模組
const express = require('express');
const line = require('@line/bot-sdk'); // 導入整個 line-bot-sdk 套件
const admin = require('firebase-admin'); // 如果您使用 Firebase
const { OpenAI } = require('openai'); // 如果您使用 OpenAI

// --- 環境變數設定 ---
// 確保這些變數已經在 Render 的環境變數中設定
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 如果您使用 Firebase Admin SDK
// 這裡假設您的 Firebase 服務帳戶憑證是一個 JSON 字串存在環境變數中
// 請務必將您的 Firebase JSON 憑證內容複製貼到 Render 的環境變數裡，變數名稱為 FIREBASE_SERVICE_ACCOUNT_KEY
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

// 如果您使用 OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI initialized successfully.');
} else {
    console.warn('OPENAI_API_KEY environment variable is not set. OpenAI features might not work.');
}


// --- Express 應用程式設定 ---
const app = express();

// Explicitly set up Express to parse JSON and URL-encoded bodies
// This ensures incoming request bodies are handled correctly with UTF-8 encoding.
// 明確設定 Express 來解析 JSON 和 URL 編碼的請求體，確保傳入請求的編碼正確處理
app.use(express.json({
    limit: '5mb', // 限制請求體大小，根據您的需求調整
    type: ['application/json', 'application/x-www-form-urlencoded']
}));
app.use(express.urlencoded({ extended: true }));

const client = new line.Client(config); // 使用 line.Client 來創建 LINE Bot 客戶端

// LINE Webhook 驗證中間件
// 注意：這裡使用 line.middleware(config) 來處理簽名驗證和 JSON 解析
app.post('/webhook', line.middleware(config), async (req, res) => {
    console.log('--- LINE Webhook Event Received ---');
    console.log('Request Headers:', req.headers); // 記錄請求頭，有助於偵錯
    console.log('Request Body:', JSON.stringify(req.body, null, 2)); // 記錄請求體

    // 處理每個傳入的事件
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.status(200).json(result))
        .catch((err) => {
            console.error('Error handling events:', err);
            // 處理錯誤：回應 500 Internal Server Error
            res.status(500).end();
        });
});

// --- 事件處理函式 ---
async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // 如果不是文字訊息，直接回傳
        return Promise.resolve(null);
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    console.log(`User message: "${userMessage}" from userId: ${event.source.userId}`);

    let replyText = '您好！我是您的 LINE Bot。'; // 預設回覆

    try {
        // --- 在這裡加入您的 OpenAI 和 Firebase 邏輯 ---
        // 範例：簡單的 OpenAI 互動
        if (openai && userMessage.includes('問AI')) {
            const prompt = userMessage.replace('問AI', '').trim();
            if (prompt) {
                console.log('Sending prompt to OpenAI:', prompt);
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // 或者您選擇的其他模型，如 "gpt-4"
                    messages: [{ role: "user", content: prompt }],
                });
                replyText = chatCompletion.choices[0].message.content;
                console.log('OpenAI response:', replyText);
            } else {
                replyText = '請問您想問 AI 什麼呢？';
            }
        }
        // 範例：讀取或寫入 Firebase (如果初始化成功)
        else if (firebaseApp && userMessage.includes('寫入資料')) {
            const db = firebaseApp.firestore();
            await db.collection('messages').add({
                userId: event.source.userId,
                message: userMessage,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            replyText = '您的訊息已儲存到 Firebase。';
            console.log('Message written to Firebase.');
        }
        // --- 結束 OpenAI 和 Firebase 邏輯 ---
        else {
            // 如果沒有觸發特定邏輯，則使用預設回覆或簡單的回聲
            replyText = `您說了：「${userMessage}」。`;
        }

    } catch (error) {
        console.error('Error in handling custom logic (OpenAI/Firebase):', error);
        replyText = '處理您的請求時發生錯誤，請稍後再試。';
    }


    // 回覆訊息給用戶
    return client.replyMessage(replyToken, {
        type: 'text',
        text: replyText
    });
}

// --- 測試路由 ---
// 這個路由用於檢查服務是否運行
app.get('/', (req, res) => {
    console.log('GET / route hit - Testing basic server function.');
    res.status(200).send('LINE Bot server is running for testing. Webhook configured at /webhook.');
});

// --- 應用程式監聽埠 ---
// Render 會透過環境變數 PORT 告訴我們應該監聽哪個端口
const port = process.env.PORT || 3000; // 如果環境變數沒有設定，則預設為 3000

// 啟動 Express 伺服器，監聽指定端口
app.listen(port, () => {
    console.log(`LINE Bot server listening on port ${port}`);
});

// 將 Express 應用程式導出
module.exports = app;
