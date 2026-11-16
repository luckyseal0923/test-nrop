# 2026-11-17：Google Apps Script 改為 Supabase

目標專案由使用者提供：`https://gvyxlgunphusxxruvytn.supabase.co`，Supabase 後台顯示專案 `test-nrop`。本次只操作該練習專案與既有練習網站，不修改原正式 NROP。

## 已完成

- Sites 與本機的 `SHEETS_API_URL`、`SHEETS_API_TOKEN`、`SHEETS_DOCUMENT_URL` 已移除。Sites 已套用執行環境第 2 版，先停用舊 Google 連線，再發布 Supabase 程式。
- Sites 儲存 `SUPABASE_URL` 與 `SUPABASE_PUBLISHABLE_KEY`；只有公開連線金鑰，未使用管理員 secret／service_role。網站程式只會呼叫指定 Supabase 專案，沒有 Google fallback。
- 在使用者已開啟的 Supabase SQL Editor 執行完整 `supabase/INSTALL.sql`，結果為 `Success. No rows returned`。建立獨立 `nrop_practice_*` 物件，不改動正式 NROP 物件。
- 以真實 Supabase HTTP API 驗證匿名請求：工作區、填報檢視表及 read RPC 均回覆 `401 / 42501`，拒絕讀取。
- 26 項測試全通過，包含 PostgreSQL 引擎實際執行 SQL 的跨帳號 RLS 隔離、版本衝突、零值保留、欄位展開、重跑 SQL 保留資料，以及病房公式、床數確認、本機 HTTP 代理和雲端連線參數回歸檢查。
- Supabase Auth 已啟用信箱註冊、需要確認信箱；Site URL 由預設 localhost:3000 改為目前網站網址，未加入其他回站網址。
- Sites 目前第 3 版於 2026-11-17 00:09:07（臺灣時間）發布成功；網站來源提交 `33b7e50a5fb7d69c400006c1bcc43584d19096d1`，部署 `appgdep_6afb2a96473c819186d92c004d29e1c0`。Chrome 正常顯示 Supabase 登入與 0.2 版。
- Sites 現有平台存取為公開，未擅自更改。匿名只能使用入口／本機示範；Supabase 資料需登入，每個帳號使用獨立工作區。
- 所有前端與 Worker 產物均檢查沒有 `script.google.com`、`SHEETS_API` 或管理員密鑰。舊程式只保存在歷史文件。

## 真正網站登入、寫入與重讀

使用者本人已建立帳號、確認信箱並登入。未代填密碼、未關閉信箱確認，也未使用管理員金鑰。驗證網站為 https://nrop-sheets-practice.chih-wei-chang.chatgpt.site ，指定資料庫為 `gvyxlgunphusxxruvytn`。

於 2026-11-17 00:10–00:13（臺灣時間）在實際網站填入合成資料並正式送出：

| 日期／班別 | 單位 | 驗證輸入 | 預期及實際結果 |
| --- | --- | --- | --- |
| 2026-11-17／N | 急診 | 人力 2.125、來診 7、住院 1、留觀 3，其餘 0 | 已完成；資料庫人力 2.125、來診 7、住院 1、留觀 3、死亡 0 |
| 2026-11-17／N | 6A | 期初 10、人力 4.125、本科住院 1，其餘 0 | 已完成；當班住院 11、空床 28；資料庫人力 4.125、住院病人 11、當班住院 1、死亡 0 |

完整重新載入網站後，以同一帳號按「繼續使用」，重新選取兩個單位，以上資料均正確讀回。再於 Supabase SQL Editor 查詢 `public.nrop_practice_records`，確認 2 筆已送出紀錄與網頁一致。6A 版本為 2（期初設定後正式送出），急診版本為 1。不適用欄位呈現 NULL，有效的零值保留為 0。

本機保存證據：`docs/previews/Supabase讀寫驗證.jpg`、`Supabase急診重讀驗證.jpg`、`Supabase資料庫數字核對.jpg`。登入後截圖含帳號或後台畫面，不匯出至公開 GitHub。

本次驗收完成登入帳號的急診與一般病房讀寫；尚未逐一進行其餘單位的真實雲端填報，也未以第二個真實帳號做線上隔離驗收。跨帳號隔離已由 PostgreSQL 引擎測試驗證，匿名拒絕已由真實 Supabase HTTP 請求驗證。本模板仍為個人練習工作區，不代表正式院內平台驗收。

## 本次連線錯誤與修正

第 2 版登入後出現連線錯誤，Sites 日誌顯示 `/api/nrop` 立即回覆 502。原因是 Cloudflare Worker 不支援 `fetch` 的 `redirect: 'error'`，請求在送出前即失敗。第 3 版改用 `redirect: 'manual'` 並明確拒絕上游重新導向，不轉送登入 JWT；新增回歸測試，發布後實際讀寫成功。依據：[Cloudflare Request 文件](https://developers.cloudflare.com/workers/runtime-apis/request/)。

舊 Google 試算表保留原有三筆練習資料；本次未刪除、未自動搬入 Supabase。

完整可複製程式段落見 [修改前後對照](Google改為Supabase_完整對照.md)。
