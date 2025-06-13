// src/services/prompts.js
function buildGoalBreakdownPrompt(goal, time, obligations = '') {
    const system = `你是一位具備心理諮商專業又擅長 TRIZ 任務拆解的教練。請用自然聊天語氣確認目標，再簡短說明 5 到 8 個執行階段，不需使用條列或符號。`;
    const user = `目標：${goal}\n每週可投入時間：約 ${time}\n同時需要兼顧：${obligations}`;
    return { system, user };
}

function buildMicroTaskPrompt(task) {
    const system = `請將以下任務：「{{某一階段任務描述}}」分成 3 到 5 個可以在 10 至 30 分鐘內完成的小步驟，以一句話描述每個步驟即可，避免使用編號或括號。`;
    const user = `任務描述：${task}`;
    return { system, user };
}

function buildEmotionAdjustPrompt(feedback, taskName) {
    const system = `你是具備心理諮商背景的教練，協助使用者調整心情並找到替代任務。請用口語化的方式提出建議，不要使用清單格式。`;
    const user = `任務名稱：${taskName}\n用戶回饋內容：${feedback}`;
    return { system, user };
}

function buildOutputSummaryPrompt(title, summary, challenge, next) {
    const system = `你是一個個人學習紀錄設計師，協助使用者整理任務完成的重點。請以四小段文字描述：任務名稱、完成內容、遇到的挑戰以及下一步目標，不需要中括號或項目符號。`;
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
function buildConfirmationPrompt(message) {
    const system = '你是一位善於理解對話的助理，請用一句自然話語轉述並確認以下內容，避免直接重複。';
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
    buildConfirmationPrompt,
};