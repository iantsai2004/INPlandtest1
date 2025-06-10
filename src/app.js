// src/app.js - 暫時的測試版本

const express = require('express');
const app = express();

// 簡單的 GET 路由，測試是否能訪問根路徑
app.get('/', (req, res) => {
    console.log('GET / route hit - Testing basic server function.');
    res.status(200).send('Simple LINE BOT server is running for testing.');
});

// 簡單的 POST 路由，測試 Webhook 路徑是否可達
app.post('/webhook', (req, res) => {
    console.log('POST /webhook route hit - Testing webhook accessibility.');
    // 為了測試，暫時不進行任何 LINE SDK 驗證或處理
    res.status(200).send('Webhook received for testing.');
});

// 匯出 Express 應用程式實例
module.exports = app;

// 注意：在 Vercel Serverless 環境中，app.listen() 會被忽略，
// 但在本地開發時仍然有用，為了最小化，我們暫時移除它。
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Test server running on port ${PORT}`);
// });