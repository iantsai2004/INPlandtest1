// src/config/firebase.js
const admin = require('firebase-admin');
const path = require('path'); // 新增：引入 path 模組
require('dotenv').config(); // 確保 .env 檔案被載入

// --- 加入以下兩行偵錯程式碼 ---
console.log('--- Debugging .env variable ---');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME);
console.log('-----------------------------');
// --- 偵錯程式碼結束 ---

// 使用 path.resolve 構建金鑰檔案的絕對路徑
// __dirname 指向當前檔案 (firebase.js) 所在的目錄 (src/config/)
// 我們需要回到專案根目錄 (..) 再進入 secrets 資料夾
const serviceAccountPath = path.resolve(__dirname, '../../secrets', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME);

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME) { // 檢查 .env 中的新變數名
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME is not set in .env');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    // 提供更具體的錯誤信息，包含嘗試加載的路徑
    console.error(`Error loading service account key from ${serviceAccountPath}:`, error);
    console.error('Please ensure the path is correct and the file is a valid JSON.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };