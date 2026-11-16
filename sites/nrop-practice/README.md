# NROP 私人練習網站

前端為 HTML／CSS／JavaScript 靜態資產；Cloudflare Worker 提供受保護的動態 API，經 Apps Script 讀寫擁有者的 Google 試算表。Sites 存取政策限定擁有者，所有請求另檢查平台提供的登入身份。

## 建置

```powershell
npm ci
npm test
npm run build
```

`dist/server/index.js` 含前端資產與 Worker，不含環境密鑰。透過 Sites 來源與發布工作流程部署；勿將此產物當成純靜態目錄。

## 執行環境

以下名稱由 Sites 執行環境設定提供，不能寫入原始碼或 hosting.json：

- SHEETS_API_URL
- SHEETS_API_TOKEN（秘密）
- SHEETS_DOCUMENT_URL

本機可建立未追蹤的 `.env.local`，建置後執行 `npm run dev`。預覽限 127.0.0.1:5180，使用合成身份；正式站只能信任 Sites 注入的身份標頭。本機預覽的假身份不參與正式 Worker 程式。

## 試算表

Records 保留原 A:O 欄位，P:AM 展開特殊單位及分項住院數字。空白表示該筆未提供或該單位不適用，0 是已填寫的零值。急診留觀不計入病房住院，轉診入／出不計入機構內轉入／出。請透過網頁編輯，勿直接改動投影表或 _State。

目前只供個人使用合成資料，沒有多人單位權限。不得為了測試 API 將網站改成公開。
