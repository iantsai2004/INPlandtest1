// src/app.js

// 引入所需的模組
const express = require('express');
const line = require('@line/bot-sdk'); // 導入整個 line-bot-sdk 套件
const admin = require('firebase-admin'); // 如果您使用 Firebase
//const { OpenAI } = require('openai'); // 如果您使用 OpenAI
const { initOpenAI, sendChatPrompt, classifyMessage } = require('./services/openaiService');
//const { getState, setState } = require('./services/conversationState');
const { getState, setState, clearState } = require('./services/conversationState');
const {
    buildGoalBreakdownPrompt,
    buildMicroTaskPrompt,
    buildEmotionAdjustPrompt,
    buildOutputSummaryPrompt,
    buildGoalQuestionPrompt,
    buildGoalRetryPrompt,
    buildObligationQuestionPrompt,
    buildTimeQuestionPrompt,
    buildMoodCheckPrompt,
    buildGeneralChatPrompt,
    buildConfirmationPrompt,
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

// 初始化 OpenAI
initOpenAI(process.env.OPENAI_API_KEY);
const openaiEnabled = !!process.env.OPENAI_API_KEY;
const COURSE_URL = process.env.COURSE_URL || 'https://example.com/course';

// --- Express 應用程式設定 ---
const app = express();

const client = new line.Client(config); // 使用 line.Client 來創建 LINE Bot 客戶端

// 將過長的訊息切割成多則，以避免單次傳送過多內容
// LINE 的 replyMessage API 最多一次只能回覆 5 則訊息，每則訊息上限 5000 字
// 新增長度分類，並在每則訊息前標示編號與分類
function classifyLength(len) {
    if (len <= 100) return '短';
    if (len <= 1000) return '中';
    return '長';
}
function chunkText(text, size = 4000, maxMessages = 5) {
    const chunks = [];
    let remaining = String(text);
    while (remaining.length > size && chunks.length < maxMessages - 1) {
        let sliceIndex = remaining.lastIndexOf('\n', size);
        if (sliceIndex <= 0 || sliceIndex > size) sliceIndex = size;
        const chunk = remaining.slice(0, sliceIndex).trim();
        chunks.push(chunk);
        remaining = remaining.slice(sliceIndex).trim();
    }
    if (remaining.length > 0 && chunks.length < maxMessages) {
        chunks.push(remaining.slice(0, size).trim());
        remaining = remaining.slice(size).trim();
    }

    const total = chunks.length + (remaining.length > 0 ? 1 : 0);
    const messages = chunks.map((c, i) => {
        const label = classifyLength(c.length);
        return { type: 'text', text: `訊息 ${i + 1}/${total} (${label})\n${c}` };
    });

    if (remaining.length > 0) {
        if (messages.length < maxMessages) {
            const label = classifyLength(remaining.length);
            messages.push({
                type: 'text',
                text: `訊息 ${messages.length + 1}/${total} (${label})\n${remaining}`,
            });
        } else {
            messages.push({
                type: 'text',
                text: '內容過長，如需剩餘內容請輸入「下一段」。',
            });
        }
    }
    return messages;
}

function replyChunked(token, text) {
    const messages = chunkText(text);
    return client.replyMessage(token, messages);
}
function replyGoalMap(token, sections) {
    const messages = [];
    for (const sec of sections) {
        if (messages.length >= 5) break;
        const remaining = 5 - messages.length;
        messages.push(...chunkText(sec, 4000, remaining));
    }
    return client.replyMessage(token, messages);
}

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

    //const userMessage = event.message.text;
    const userMessage = event.message.text.trim();
    const replyToken = event.replyToken;
    //console.log(`User message: "${userMessage}" from userId: ${event.source.userId}`);
    const userId = event.source.userId;
    console.log(`User message: "${userMessage}" from userId: ${userId}`);

    //const state = getState(userId);
    let state = getState(userId) || {};

    const prefixRegex = /^inpland/i;
    const trimmed = userMessage.trim();

    function detectCommand(msg) {
        const m = msg.replace(/\s/g, '');
        return null;
    }

    if (prefixRegex.test(trimmed)) {
        // 使用 INPland 開頭代表重新啟動對話
        clearState(userId);
        state = { phase: 'awaiting_goal' };
        setState(userId, state);
        let intro;
        if (openaiEnabled) {
            const { system, user } = buildGoalQuestionPrompt();
            const q = await sendChatPrompt(system, user);
            intro = `嗨！每次以 INPland 開頭我就會重新為你建立新的 Goal Map。\n${q}`;
        } else {
            intro = '嗨！每次以 INPland 開頭我就會重新為你建立新的 Goal Map。\n請先告訴我你想達成的學習或專案目標，不用一次說完，慢慢來。';
        }
        return replyChunked(replyToken, intro);
    }

    const messageBody = trimmed;

    if (!state || !state.phase) {
        // 自動啟動新對話
        state = { phase: 'awaiting_goal' };
        setState(userId, state);
        let intro;
        if (openaiEnabled) {
            const { system, user } = buildGoalQuestionPrompt();
            intro = await sendChatPrompt(system, user);
        } else {
            intro = '嗨！請分享你想達成的學習或專案目標吧。';
        }
        console.log('New session automatically started.');
        return replyChunked(replyToken, intro);
    }

    let replyText = '很抱歉，您的請求處理時發生了預期外錯誤。\n 用INPland開頭讓我們幫你打造你的Goal Map！';

    // 簡易對話狀態機：依序詢問目標、其他待辦與可投入時間
    if (state.phase === 'awaiting_goal') {
        if (!messageBody) {
            if (openaiEnabled) {
                const { system, user } = buildGoalQuestionPrompt();
                replyText = await sendChatPrompt(system, user);
            } else {
                replyText = '請再次描述您的主要目標。';
            }
            return replyChunked(replyToken, replyText);
        }
        if (openaiEnabled) {
            const type = (await classifyMessage(messageBody)).toUpperCase();
            if (type !== 'GOAL') {
                console.log(`Goal classification mismatch: ${type} for "${messageBody}"`);
                // Continue with provided text instead of re-asking
                return replyChunked(replyToken, replyText);
            }
        }
        state.goal = messageBody;
        state.phase = 'awaiting_obligations';
        setState(userId, state);
        let confirm = `我理解的目標是「${state.goal}」，如果需要更正請告訴我。`;
        if (openaiEnabled) {
            const confirmPrompt = buildConfirmationPrompt(state.goal);
            const ack = await sendChatPrompt(confirmPrompt.system, confirmPrompt.user);
            confirm = ack;
            const { system, user } = buildObligationQuestionPrompt();
            const question = await sendChatPrompt(system, user);
            replyText = `${confirm}\n${question}`;
        } else {
            replyText = `${confirm}\n除此之外，你還有哪些工作或生活上的事情需要同時處理？`;
        }
        return replyChunked(replyToken, replyText);
    }

    if (state.phase === 'awaiting_obligations') {
        if (!messageBody) {
            if (openaiEnabled) {
                const { system, user } = buildObligationQuestionPrompt();
                replyText = await sendChatPrompt(system, user);
            } else {
                replyText = '請再告訴我需要兼顧哪些工作或生活任務。';
            }
            return replyChunked(replyToken, replyText);
        }
        const noObligationRegex = /^(?:沒有|沒有了|沒了|無|沒有其他|沒有啊|沒什麼|none)$/i;
        if (noObligationRegex.test(messageBody)) {
            state.obligations = '無';
        } else {
            if (openaiEnabled) {
                const type = (await classifyMessage(messageBody)).toUpperCase();
                if (type !== 'OBLIGATION') {
                    console.log(`Obligation classification mismatch: ${type} for "${messageBody}"`);
                    // Continue with provided text instead of re-asking
                }
            }
            state.obligations = messageBody;
        }

        state.phase = 'awaiting_time';
        setState(userId, state);
        let confirm = `需同時處理的事項有「${state.obligations}」，如果我理解錯誤請說明。`;
        if (openaiEnabled) {
            const confirmPrompt = buildConfirmationPrompt(state.obligations);
            const ack = await sendChatPrompt(confirmPrompt.system, confirmPrompt.user);
            confirm = ack;
            const { system, user } = buildTimeQuestionPrompt();
            const question = await sendChatPrompt(system, user);
            replyText = `${confirm}\n${question}`;
        } else {
            replyText = `${confirm}\n大約每週能投入多少時間在這個目標上呢？`;
        }
        return replyChunked(replyToken, replyText);
    }

    if (state.phase === 'awaiting_time') {
        if (!messageBody) {
            if (openaiEnabled) {
                const { system, user } = buildTimeQuestionPrompt();
                replyText = await sendChatPrompt(system, user);
            } else {
                replyText = '請告訴我大約能投入的時間。';
            }
            return replyChunked(replyToken, replyText);
        }
        if (openaiEnabled) {
            const type = (await classifyMessage(messageBody)).toUpperCase();
            if (type !== 'TIME') {
                const { system, user } = buildTimeQuestionPrompt();
                replyText = await sendChatPrompt(system, user);
                return replyChunked(replyToken, replyText);
            }
        }
        state.time = messageBody;
        state.phase = 'awaiting_confirmation';
        setState(userId, state);
        const summary = `目標：${state.goal}\n待辦：${state.obligations}\n投入時間：${state.time}`;
        if (openaiEnabled) {
            const confirmPrompt = buildConfirmationPrompt(summary);
            replyText = await sendChatPrompt(confirmPrompt.system, confirmPrompt.user);
            replyText += '\n如果以上內容正確，回覆「是」我會為你生成 Goal Map。';
        } else {
            replyText = `${summary}\n如果沒問題，回覆「是」開始建立 Goal Map。`;
        }
        return replyChunked(replyToken, replyText);
    }

    if (state.phase === 'awaiting_confirmation') {
        const yesRegex = /^(?:是|ok|好的|確認|可以|好啊|好|yes)$/i;
        if (yesRegex.test(messageBody)) {
            state.phase = 'ready';
            setState(userId, state);
            let confirm = `預計投入時間為「${state.time}」，若需要調整請告訴我。`;
            let breakdown = '';
            let micro = '';
            let mood = '';
            if (openaiEnabled) {
                const confirmPrompt = buildConfirmationPrompt(state.time);
                confirm = await sendChatPrompt(confirmPrompt.system, confirmPrompt.user);
                const { system, user } = buildGoalBreakdownPrompt(state.goal, state.time, state.obligations);
                breakdown = await sendChatPrompt(system, user);
                const m = buildMicroTaskPrompt(state.goal);
                micro = await sendChatPrompt(m.system, m.user);
                const emo = buildMoodCheckPrompt();
                mood = await sendChatPrompt(emo.system, emo.user);
            } else {
                breakdown = `目標：${state.goal}\n每週時間：${state.time}`;
                micro = '告訴我任務內容，我可以幫你拆解成微任務。';
                mood = '目前心情如何？有沒有什麼壓力或迷惘？';
            }
            const sections = [
                confirm,
                breakdown,
                `${micro}\n\n${mood}\n\n課程平台：${COURSE_URL}\n完成後可輸入「成果輸出 標題|內容|挑戰|下一步」記錄成果。`
            ];
            return replyGoalMap(replyToken, sections);
        } else {
            replyText = '收到，如需修改請重新輸入目標，或回覆「是」以生成 Goal Map。';
            return replyChunked(replyToken, replyText);
        }
    }


    try {
        // 直接交由 OpenAI 模型生成回覆，不再依賴關鍵字判斷
        if (openaiEnabled) {
            if (state.phase === 'ready') {
                // 把額外資訊存起來並重新生成建議
                state.extra = state.extra || [];
                state.extra.push(messageBody);
                setState(userId, state);
                const more = `${state.obligations || ''}\n${state.extra.join('\n')}`;
                const { system, user } = buildGoalBreakdownPrompt(state.goal, state.time, more);
                replyText = await sendChatPrompt(system, user);
                replyText += '\n如果需要進一步討論，隨時告訴我！';
            } else {
                const { system, user } = buildGeneralChatPrompt(messageBody);
                replyText = await sendChatPrompt(system, user);
                console.log('No specific logic triggered.');
            }
        } else {
            replyText = `您說了：「${messageBody}」。`;
        }

    } catch (error) {
        console.error('ERROR: Uncaught error in handleEvent custom logic (OpenAI/Firebase):', error);
        replyText = '處理您的請求時發生錯誤，請稍後再試。';
    }

    console.log('Attempting to reply with text:', replyText);
    // 回覆訊息給用戶
    // 確保回覆內容是字串類型
    return replyChunked(replyToken, String(replyText));
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
