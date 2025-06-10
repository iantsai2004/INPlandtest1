// src/config/firebase.js
const admin = require('firebase-admin');
const path = require('path'); // �s�W�G�ޤJ path �Ҳ�
require('dotenv').config(); // �T�O .env �ɮ׳Q���J

// --- �[�J�H�U��氻���{���X ---
console.log('--- Debugging .env variable ---');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME);
console.log('-----------------------------');
// --- �����{���X���� ---

// �ϥ� path.resolve �c�ت��_�ɮת�������|
// __dirname ���V��e�ɮ� (firebase.js) �Ҧb���ؿ� (src/config/)
// �ڭ̻ݭn�^��M�׮ڥؿ� (..) �A�i�J secrets ��Ƨ�
const serviceAccountPath = path.resolve(__dirname, '../../secrets', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME);

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME) { // �ˬd .env �����s�ܼƦW
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY_FILENAME is not set in .env');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    // ���ѧ���骺���~�H���A�]�t���ե[�������|
    console.error(`Error loading service account key from ${serviceAccountPath}:`, error);
    console.error('Please ensure the path is correct and the file is a valid JSON.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { db };