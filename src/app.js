// src/app.js

// 引入所需的模組
const express = require('express');
const line = require('@line/bot-sdk'); // 導入整個 line-bot-sdk 套件
const admin = require('firebase-admin'); // 如果您使用 Firebase
//const { OpenAI } = require('openai'); // 如果您使用 OpenAI
const { initOpenAI, sendChatPrompt } = require('./services/openaiService');
const {
    buildGoalBreakdownPrompt,
    buildMicroTaskPrompt,
    buildEmotionAdjustPrompt,
    buildOutputSummaryPrompt,
} = require('./services/prompts');

// --- 環境變數設定 ---
// 確保這些變數已經在 Render 的環境變數中設定
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 如果 LINE Channel Access Token 或 Channel Secret 未設定，應用程式將無法運行
if (!config.channelAccessToken || !config.channelSecret) {
    console.error('ERROR: LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not set.');
    // 這裡可以選擇退出應用程式，或只是記錄錯誤
    // process.exit(1);
}

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
        console.error('ERROR: Failed to parse Firebase Service Account Key. Firebase features will not work.');
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY content (first 50 chars):', String(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).substring(0, 50) + '...');
        firebaseApp = undefined; // 確保如果解析失敗，firebaseApp 是 undefined
    }
} else {
    console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Firebase features might not work.');
}

// 如果您使用 OpenAI
//    let openai;
//    if (process.env.OPENAI_API_KEY) {
//        openai = new OpenAI({
//            apiKey: process.env.OPENAI_API_KEY,
//        });
//        console.log('OpenAI initialized successfully.');
//    } else {
//        console.warn('WARNING: OPENAI_API_KEY environment variable is not set. OpenAI features might not work.');
//    }
// 初始化 OpenAI
initOpenAI(process.env.OPENAI_API_KEY);
const openaiEnabled = !!process.env.OPENAI_API_KEY;

// --- Express 應用程式設定 ---
const app = express();

// Explicitly set up Express to parse JSON and URL-encoded bodies with UTF-8
// 這確保傳入請求的編碼正確處理
//app.use(express.json({
 //   limit: '5mb', // 限制請求體大小，根據您的需求調整
//    type: ['application/json', 'application/x-www-form-urlencoded']
//}));
//app.use(express.urlencoded({ extended: true }));

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
        .then((result) => {
            console.log('All events handled successfully. Sending 200 OK.');
            res.status(200).json(result);
        })
        .catch((err) => {
            console.error('CRITICAL ERROR: Failed to process LINE webhook events. Responding with 500.', err);
            // 處理錯誤：回應 500 Internal Server Error
            res.status(500).end();
        });
});

// --- 事件處理函式 ---
async function handleEvent(event) {
    console.log(`Processing event: ${event.type}`);

    if (event.type !== 'message' || event.message.type !== 'text') {
        // 如果不是文字訊息，直接回傳
        console.log(`Skipping non-text message or non-message event: ${event.type}`);
        return Promise.resolve(null);
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    console.log(`User message: "${userMessage}" from userId: ${event.source.userId}`);

    let replyText = '很抱歉，您的請求處理時發生了預期外錯誤。'; // 預設一個明確的錯誤回覆

    try {
        // --- 在這裡加入您的 OpenAI 和 Firebase 邏輯 ---
        // 範例：簡單的 OpenAI 互動
        //if (openai && userMessage.includes('問AI')) {
        if (openaiEnabled && userMessage.startsWith('目標拆解')) {
            const input = userMessage.replace('目標拆解', '').trim();
            const { system, user } = buildGoalBreakdownPrompt(input);
            replyText = await sendChatPrompt(system, user);
        } else if (openaiEnabled && userMessage.startsWith('碎片任務')) {
            const task = userMessage.replace('碎片任務', '').trim();
            const { system, user } = buildMicroTaskPrompt(task);
            replyText = await sendChatPrompt(system, user);
        } else if (openaiEnabled && userMessage.startsWith('情緒調整')) {
            const input = userMessage.replace('情緒調整', '').trim();
            const [taskName = '', feedback = ''] = input.split('|').map(s => s.trim());
            const { system, user } = buildEmotionAdjustPrompt(feedback, taskName);
            replyText = await sendChatPrompt(system, user);
        } else if (openaiEnabled && userMessage.startsWith('成果輸出')) {
            const input = userMessage.replace('成果輸出', '').trim();
            const parts = input.split('|').map(s => s.trim());
            const [title = '', summary = '', challenge = '', next = ''] = parts;
            const { system, user } = buildOutputSummaryPrompt(title, summary, challenge, next);
            replyText = await sendChatPrompt(system, user);
        } else if (openaiEnabled && userMessage.includes('問AI')) {
            const prompt = userMessage.replace('問AI', '').trim();
            if (prompt) {
                console.log('Attempting to send prompt to OpenAI:', prompt);
                //const chatCompletion = await openai.chat.completions.create({
                //    model: "o4-mini", // 或者您選擇的其他模型，如 "gpt-4"
                //    messages: [{ role: "user", content: prompt }],
                //});
                //replyText = chatCompletion.choices[0].message.content;
                replyText = await sendChatPrompt('', prompt);
                console.log('OpenAI response received:', replyText);
            } else {
                replyText = '請問您想問 AI 什麼呢？';
                console.log('OpenAI prompt empty. Responding with default.');
            }
        }
        // 範例：讀取或寫入 Firebase (如果初始化成功)
        else if (firebaseApp && userMessage.includes('寫入資料')) {
            try {
                console.log('Attempting to write message to Firebase.');
                const db = admin.firestore(); // 使用 admin.firestore() 而不是 firebaseApp.firestore()
                await db.collection('messages').add({
                    userId: event.source.userId,
                    message: userMessage,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                replyText = '您的訊息已儲存到 Firebase。';
                console.log('Message successfully written to Firebase.');
            } catch (fbError) {
                console.error('ERROR: Failed to write to Firebase:', fbError);
                replyText = '儲存到 Firebase 失敗，請檢查憑證或網路。';
            }
        }
        // --- 結束 OpenAI 和 Firebase 邏輯 ---
        else {
            // 如果沒有觸發特定邏輯，則使用預設回覆或簡單的回聲
            replyText = `您說了：「${userMessage}」。`;
            console.log('No specific logic triggered. Echoing message.');
        }

    } catch (error) {
        console.error('ERROR: Uncaught error in handleEvent custom logic (OpenAI/Firebase):', error);
        replyText = '處理您的請求時發生錯誤，請稍後再試。';
    }

    console.log('Attempting to reply with text:', replyText);
    // 回覆訊息給用戶
    // 確保回覆內容是字串類型
    return client.replyMessage(replyToken, {
        type: 'text',
        text: String(replyText) // 確保 replyText 是字串
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
