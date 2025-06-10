// src/app.js - �Ȯɪ����ժ���

const express = require('express');
const app = express();

// ²�檺 GET ���ѡA���լO�_��X�ݮڸ��|
app.get('/', (req, res) => {
    console.log('GET / route hit - Testing basic server function.');
    res.status(200).send('Simple LINE BOT server is running for testing.');
});

// ²�檺 POST ���ѡA���� Webhook ���|�O�_�i�F
app.post('/webhook', (req, res) => {
    console.log('POST /webhook route hit - Testing webhook accessibility.');
    // ���F���աA�Ȯɤ��i����� LINE SDK ���ҩγB�z
    res.status(200).send('Webhook received for testing.');
});

// �ץX Express ���ε{�����
module.exports = app;

// �`�N�G�b Vercel Serverless ���Ҥ��Aapp.listen() �|�Q�����A
// ���b���a�}�o�ɤ��M���ΡA���F�̤p�ơA�ڭ̼Ȯɲ������C
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Test server running on port ${PORT}`);
// });