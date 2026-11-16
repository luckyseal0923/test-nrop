# NROP Supabase 練習網站

HTML／CSS／JavaScript 前端與 Worker API。以 Supabase Auth 的登入 JWT 讀寫自己的練習工作區；PostgreSQL RLS 隔離各帳號。匿名可開啟入口與本機示範，不能讀寫雲端資料。

執行環境：`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`。不使用管理員密鑰，也不使用 Google Apps Script 或 ChatGPT 身份標頭。

Node.js 22.12 以上，建議 24。執行 `npm ci`、`npm test`、`npm run build`；產物 `dist/server/index.js` 包含前端及 Worker，不能當純靜態檔案部署。來源與發布使用現有 Sites `project_id`，保留網站目前的存取設定。

資料庫先執行 `supabase/INSTALL.sql`。所有 `nrop_practice_*` 檢視表受底層 RLS 保護，數字欄位分開可讀。這是每個帳號獨立的個人練習版，不是病房共同填報平台。

本機預覽用未追蹤的 `.env.local`，建置後 `npm run dev` 開啟 127.0.0.1:5180。註冊確認連結仍依 Supabase 設定返回正式網站；不要使用真實臨床資料測試。
