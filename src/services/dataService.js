// src/services/dataService.js
const admin = require('firebase-admin'); // �ݭn�ޤJ admin �Өϥ� FieldValue
const { db } = require('../config/firebase'); // �ޤJ db ���

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'logs'; // �Ω��x�s��ܬ���

/**
 * �x�s�Τ᪺��ܤ�x
 * @param {string} userId - �Τ�ID
 * @param {string} message - �Τ��J
 * @param {string} gpt_reply - GPT�^��
 * @returns {Promise<void>}
 */
async function saveConversationLog(userId, message, gpt_reply) {
    try {
        await db.collection(LOGS_COLLECTION).add({
            userId: userId,
            message: message,
            gpt_reply: gpt_reply,
            timestamp: admin.firestore.FieldValue.serverTimestamp() // �ϥ� Firestore ���A���ɶ��W
        });
        console.log('Conversation log saved successfully to Firestore.');
    } catch (error) {
        console.error('Error saving conversation log to Firestore:', error);
        throw error;
    }
}

/**
 * ���o�Τ᪺���v��ܬ��� (�Ω� AI �ҫ����W�U��)
 * �o�̥u�O�@�Ӱ򥻽d�ҡA�z�i�H�ھڻݭn�վ�d���޿� (�Ҧp�G�u���̪� N ��)
 * @param {string} userId - �Τ�ID
 * @param {number} [limit=10] - �n���o���T���ƶq�W��
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
        return history.reverse(); // �T�O���ɶ����Ǫ�^ (�̦����b�e��)
    } catch (error) {
        console.error('Error getting conversation history from Firestore:', error);
        throw error;
    }
}

module.exports = {
    saveConversationLog,
    getConversationHistory,
};