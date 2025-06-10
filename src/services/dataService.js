// src/services/dataService.js
const admin = require('firebase-admin'); // 需要引入 admin 來使用 FieldValue
const { db } = require('../config/firebase'); // 引入 db 實例

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'logs'; // 用於儲存對話紀錄

/**
 * 儲存用戶的對話日誌
 * @param {string} userId - 用戶ID
 * @param {string} message - 用戶輸入
 * @param {string} gpt_reply - GPT回應
 * @returns {Promise<void>}
 */
async function saveConversationLog(userId, message, gpt_reply) {
    try {
        await db.collection(LOGS_COLLECTION).add({
            userId: userId,
            message: message,
            gpt_reply: gpt_reply,
            timestamp: admin.firestore.FieldValue.serverTimestamp() // 使用 Firestore 伺服器時間戳
        });
        console.log('Conversation log saved successfully to Firestore.');
    } catch (error) {
        console.error('Error saving conversation log to Firestore:', error);
        throw error;
    }
}

/**
 * 取得用戶的歷史對話紀錄 (用於 AI 模型的上下文)
 * 這裡只是一個基本範例，您可以根據需要調整查詢邏輯 (例如：只取最近 N 條)
 * @param {string} userId - 用戶ID
 * @param {number} [limit=10] - 要取得的訊息數量上限
 * @returns {Promise<Array<Object>>}
 */
async function getConversationHistory(userId, limit = 10) {
    try {
        const snapshot = await db.collection(LOGS_COLLECTION)
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push(doc.data());
        });
        return history.reverse(); // 確保按時間順序返回 (最早的在前面)
    } catch (error) {
        console.error('Error getting conversation history from Firestore:', error);
        throw error;
    }
}

module.exports = {
    saveConversationLog,
    getConversationHistory,
};