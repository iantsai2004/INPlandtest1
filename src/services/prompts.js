// src/services/prompts.js
function buildGoalBreakdownPrompt(goal, time, obligations = '') {
    const system = `你是一位擅長傾聽並具有心理諮商背景的諮商師，會根據使用者提供的目標、需求與限制，用溫和的語氣確認理解後，再分段或列點描述 5 到 8 個具體執行階段，每個階段都包含可行的確切步驟，可以使用條列或表情符號以幫助用戶理解。`;
    const user = `目標：${goal}\n每週可投入時間：約 ${time}\n同時需要兼顧：${obligations}`;
    return { system, user };
}

function buildMicroTaskPrompt(task) {
    const system = `你是一位貼心的學習助理，請將以下任務「{{某一階段任務描述}}」拆成 3 到 5 個可在 30到60分鐘內完成的小步驟，用溫暖自然的語氣，一句話說明每個步驟，可以使用編號或括號。`;
    const user = `任務描述：${task}`;
    return { system, user };
}

function buildEmotionAdjustPrompt(feedback, taskName) {
    const system = `你是具備心理諮商背景的教練，協助使用者調整心情並找到替代任務。請用口語化的方式提出建議，不要使用清單格式。`;
    const user = `任務名稱：${taskName}\n用戶回饋內容：${feedback}`;
    return { system, user };
}

function buildOutputSummaryPrompt(title, summary, challenge, next) {
    const system = `你是一個個人學習紀錄設計師，協助使用者整理任務完成的重點。請以四小段文字描述：任務名稱、完成內容、遇到的挑戰以及下一步目標，不使用中括號或項目符號，語氣自然。`;
    const user = `任務標題：${title}\n完成內容：${summary}\n挑戰：${challenge}\n下一步：${next}`;
    return { system, user };
}

function buildGoalQuestionPrompt() {
    const system = `你是一位溫和的諮商式助理，想了解使用者目前最想達成的目標以及這個目標背後的原因或期待，請用自然的問句引導對方分享。`;
    const user = '請根據使用者回覆，用一句簡短的問題了解對方的目標與動機並確認是否根據問題回答問題';
    return { system, user };
}

function buildObligationQuestionPrompt() {
    const system = `你是線上學習助理，想知道使用者還需要兼顧哪些工作與生活任務，請用關懷語氣提出問題。`;
    const user = '產生一句詢問使用者其他待辦事項的話';
    return { system, user };
}

function buildTimeQuestionPrompt() {
    const system = `你是貼心的助理，需要了解使用者能投入多少時間在目標上，以評估合適的步驟。請用友善自然的語氣詢問。`;
    const user = '請以一句問題確認他每週能投入多少時間';
    return { system, user };
}

function buildMoodCheckPrompt() {
    const system = `你是能察覺情緒的助理，想關心使用者是否迷茫或焦慮，並引導他分享目前的心情。請用友善的語氣提問。`;
    const user = '請給我一句關心他心情與困惑的問題';
    return { system, user };
}

function buildGeneralChatPrompt(message) {
    const system = '你是一位親切且善於傾聽的學習助理，請根據使用者的訊息以人性化的方式回覆，並在需要時溫柔地將話題帶回目標討論。';
    const user = message;
    return { system, user };
}
function buildConfirmationPrompt(message) {
    const system = '你是一位善於理解對話的助理，請用一句溫和的話語轉述並確認以下內容，避免直接重複。';
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