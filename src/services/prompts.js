// src/services/prompts.js

function buildGoalBreakdownPrompt(goal, time, obligations = '') {
    const system = `你是一位親切又擅長 TRIZ 任務拆解的個人教練，協助使用者在兼顧生活需求的前提下學習與實踐。\n\n請根據下列資訊產生 5～8 個階段任務，每個階段約 1～2 句並包含可預期的產出：\n- 簡明扼要，適合工程背景並希望投入 AI 領域的使用者\n- 需考量使用者的其他生活與工作事項，讓規劃更貼近實際情況\n\n輸出格式：\n【你的目標】：{{目標}}\n【任務階段拆解】：\n1. ［任務名稱］：內容與學習產出\n2. ...\n\n【時間建議】：\n- 每階段建議時間：{{依據使用者可投入時間估算}}`;
    const user = `目標：${goal}\n每週可投入時間：約 ${time}\n同時需要兼顧：${obligations}`;
    return { system, user };
}

function buildMicroTaskPrompt(task) {
    const system = `請將以下任務：「{{某一階段任務描述}}」  \n分解成 3～5 個可分段執行的「微任務」，每個任務應能在 10～30 分鐘內完成。\n\n請考慮以下條件：\n- 使用者為工程背景，時間破碎，可能在通勤、晚上、實驗室空檔學習\n- 每項微任務要包含具體行為與輸出（例如：「閱讀範例程式碼並標記3個重點」）\n- 請附上建議時段與所需工具\n\n請用以下格式輸出：\n\n【微任務建議】：\n1. 任務內容 – 建議時間段 – 需使用工具\n2. ...`;
    const user = `任務描述：${task}`;
    return { system, user };
}

function buildEmotionAdjustPrompt(feedback, taskName) {
    const system = `使用者在任務進行中感到壓力或卡關，他們表示：\n\n「{{用戶回饋內容}}」\n\n請依據以下設計原則提出替代任務與調整建議：\n- 使用 TRIZ #35 原則（參數改變），降低強度或改變輸出方式\n- 提出「不放棄學習」但能轉換的任務方式，例如：「改為觀看相關影片」、「用紙筆畫出流程圖」等\n- 最後請補上一句輕微鼓勵語\n\n請用以下格式回答：\n\n【調整建議】：\n- 原任務：{{任務名稱／目標}}\n- 替代任務提案：{{新的任務方式，控制在 30 分鐘內}}\n- 情緒補充語：{{簡潔的支持性語句}}`;
    const user = `任務名稱：${taskName}\n用戶回饋內容：${feedback}`;
    return { system, user };
}

function buildOutputSummaryPrompt(title, summary, challenge, next) {
    const system = `你是一個個人學習紀錄設計師，協助使用者將任務完成的歷程輸出為可用於 Notion 或 PDF 的成果摘要。\n\n請使用以下輸出格式：\n【本階段任務名稱】：{{任務標題}}\n【完成內容摘要】：{{任務中學習到的內容 or 產出的程式／觀點／範例}}\n【遇到的挑戰】：{{卡住的點、花最多時間的環節}}\n【下一步目標】：{{下一階段任務、欲達成的子目標}}\n\n使用者可選擇將此內容複製使用 LINE 傳給自己`;
    const user = `任務標題：${title}\n完成內容：${summary}\n挑戰：${challenge}\n下一步：${next}`;
    return { system, user };
}

module.exports = {
    buildGoalBreakdownPrompt,
    buildMicroTaskPrompt,
    buildEmotionAdjustPrompt,
    buildOutputSummaryPrompt,
};