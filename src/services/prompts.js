// src/services/prompts.js

function buildGoalBreakdownPrompt(goal, time, obligations = '') {
    const system = `你是一位具備心理諮商專業又擅長 TRIZ 任務拆解的教練。回覆請精簡，分兩段：第一段重述目標，第二段列出 5~8 個階段任務，每項僅 1 行並附預期產出。`;
    const user = `目標：${goal}\n每週可投入時間：約 ${time}\n同時需要兼顧：${obligations}`;
    return { system, user };
}

function buildMicroTaskPrompt(task) {
    const system = `請將以下任務：「{{某一階段任務描述}}」  \n分解成 3～5 個可分段執行的「微任務」，每個任務應能在 10～30 分鐘內完成。\n\n請考慮以下條件：\n- 使用者為工程背景，時間破碎，可能在通勤、晚上、實驗室空檔學習\n- 每項微任務要包含具體行為與輸出（例如：「閱讀範例程式碼並標記3個重點」）\n- 請附上建議時段與所需工具\n\n請用以下格式輸出：\n\n【微任務建議】：\n1. 任務內容 – 建議時間段 – 需使用工具\n2. ...`;
    const user = `任務描述：${task}`;
    return { system, user };
}

function buildEmotionAdjustPrompt(feedback, taskName) {
    const system = `你是具備心理諮商背景的教練，協助使用者調整心情並找到替代任務。回答精簡。

【調整建議】：
- 原任務：{{任務名稱／目標}}
- 替代任務提案：{{新的任務方式，控制在 30 分鐘內}}
- 情緒補充語：{{簡短鼓勵句}}`;
    const user = `任務名稱：${taskName}\n用戶回饋內容：${feedback}`;
    return { system, user };
}

function buildOutputSummaryPrompt(title, summary, challenge, next) {
    const system = `你是一個個人學習紀錄設計師，協助使用者將任務完成的歷程輸出為可用於 Notion 或 PDF 的成果摘要。\n\n請使用以下輸出格式：\n【本階段任務名稱】：{{任務標題}}\n【完成內容摘要】：{{任務中學習到的內容 or 產出的程式／觀點／範例}}\n【遇到的挑戰】：{{卡住的點、花最多時間的環節}}\n【下一步目標】：{{下一階段任務、欲達成的子目標}}\n\n使用者可選擇將此內容複製使用 LINE 傳給自己`;
    const user = `任務標題：${title}\n完成內容：${summary}\n挑戰：${challenge}\n下一步：${next}`;
    return { system, user };
}

function buildGoalQuestionPrompt() {
    const system = `你是關懷的助理，想更了解使用者想解決的問題或願望，請以聊天方式提出問題，不要直接給格式或條列。`;
    const user = '請以一句自然的提問來了解對方的主要目標';
    return { system, user };
}

function buildObligationQuestionPrompt() {
    const system = `你是線上學習助理，想知道使用者還需要兼顧哪些工作與生活任務，請用關懷語氣提出問題。`;
    const user = '產生一句詢問使用者其他待辦事項的話';
    return { system, user };
}

function buildTimeQuestionPrompt() {
    const system = `你是貼心的助理，需要了解使用者能投入多少時間在目標上，請以自然對話方式詢問，不要強迫。`;
    const user = '產生一句詢問可投入時間的問題';
    return { system, user };
}

function buildMoodCheckPrompt() {
    const system = `你是個能察覺情緒的助理，想關心使用者是否迷茫或焦慮，請用一句友善的提問了解他目前的心情。`;
    const user = '請給我一句關心對方心情的問題';
    return { system, user };
}

function buildGeneralChatPrompt(message) {
    const system = '你是一位親切的學習助理，請根據使用者訊息給予自然回覆。';
    const user = message;
    return { system, user };
}

module.exports = {
    buildGoalBreakdownPrompt,
    buildMicroTaskPrompt,
    buildEmotionAdjustPrompt,
    buildOutputSummaryPrompt,
    buildGoalQuestionPrompt,
    buildObligationQuestionPrompt,
    buildTimeQuestionPrompt,
    buildMoodCheckPrompt,
    buildGeneralChatPrompt,
};