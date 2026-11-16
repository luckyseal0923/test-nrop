# NROP 練習工作區：Supabase 版

暖白、森林綠的個人護理資訊平台練習模板。保留 28 個單位、N／D／E 班、單位填報、管理儀表板、CSV、期初人數與歷史床數；本次不更動原正式 NROP 專案。

- 網站：https://nrop-sheets-practice.chih-wei-chang.chatgpt.site
- GitHub：https://github.com/luckyseal0923/test-nrop
- Supabase 專案：`gvyxlgunphusxxruvytn`

目前資料來源已改為 Supabase，執行中的網頁與 API 不再呼叫 Google Apps Script。舊 Google 試算表保留原資料，沒有刪除，也沒有自動搬入新帳號。

## 開始練習

開啟網站，以自己的信箱註冊／登入。新註冊帳號需先確認信箱；這個 Supabase 帳號與 Supabase 管理後台、ChatGPT 帳號分開。

每個帳號有獨立的練習資料，不會看見其他帳號的填報。首次登入建立空白工作區及 28 單位床數。一般病房先設定第一班期初人數，再正式送出。只想試畫面可選本機示範，資料只存目前瀏覽器。

## 本機執行

使用 Node.js 22.12 以上，建議 Node.js 24。

```powershell
npm ci
node scripts/create-local-env.mjs
```

在未追蹤的 `.env.local` 填入：

```dotenv
SUPABASE_URL=https://你的專案.supabase.co
SUPABASE_PUBLISHABLE_KEY=你的sb_publishable金鑰
PORT=4178
```

也接受現有 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。只使用公開的 publishable key；不需要也不要填入管理員 secret／service_role key。

```powershell
npm run dev
```

開啟 http://127.0.0.1:5178 。建置後的本機版以 `npm start` 開啟 http://127.0.0.1:4178 。目前本機服務仍限制 127.0.0.1；若搬到一般主機，需另外調整監聽位址與公開來源設定。

## Supabase 初始化

在指定練習專案的 SQL Editor 執行完整 [supabase/INSTALL.sql](supabase/INSTALL.sql)。本次已在使用者指定的 `test-nrop` 專案執行成功。不要對原正式 NROP 專案執行本份 SQL。

只建立 `nrop_practice_*` 物件，可重跑而不清空資料。底層 `nrop_practice_workspaces` 以登入者 UUID 保存工作區，啟用 RLS；匿名不能讀取，登入者也只能讀寫自己。

| 物件 | 用途 |
| --- | --- |
| `nrop_practice_workspaces` | 每個帳號的完整狀態、整體版本與更新時間 |
| `nrop_practice_records` | 可讀的填報檢視表，急診、產房、手術室、護理之家與透析數字各自展開 |
| `nrop_practice_openings` | 期初住院人數 |
| `nrop_practice_capacities` | 床數生效期間與版本 |
| `nrop_practice_audit` | 最近操作紀錄 |

檢視表採 `security_invoker`，沿用底層 RLS。請在網頁修改資料；檢視表供查詢。空白／NULL 表示該單位不適用或未提供，0 是有效零值。急診留觀不混入病房住院，轉診不混入機構內轉入／出。

這是個人練習用的狀態保存方式，沒有完整正式平台的共用病房、帳號審核或主管角色。資料操作由後端共用模型驗證，資料庫以 revision 比對在單一交易提交，衝突時拒絕覆寫、不自動重送；操作紀錄最近 500 筆，工作區上限 8 MiB。

## 發布網站

`sites/nrop-practice` 是同一網站的 Sites 來源。前端為靜態資產，Worker 提供受保護的 Supabase API：

```text
瀏覽器 → Supabase Auth 登入
瀏覽器帶登入 JWT → 網站 API → Supabase RPC／RLS → 自己的資料
```

Sites 執行環境只有 `SUPABASE_URL` 與 `SUPABASE_PUBLISHABLE_KEY`。Google 的三個 SHEETS 設定已移除並套用。網站保留目前的公開存取設定，匿名只能使用入口及本機示範；雲端資料以 Supabase 登入保護，不依賴 ChatGPT 身份標頭。

註冊確認信的 Site URL 已設定為上方網站網址。搬到其他網域時，須同步修改 Supabase Authentication → URL Configuration；不要加入不受自己控制的網址。

```powershell
npm test
npm run build
node scripts/prepare-hosted-site.mjs
cd sites/nrop-practice
npm run build
```

經 Sites skill 的來源推送、打包、儲存版本與發布流程更新同一 `project_id`。GitHub push 不代表 Sites 已更新。發布驗收需確認真正網站的登入、寫入及重新讀取。

## 學習與修改對照

- [Google 改為 Supabase 的完整修改前後程式](docs/Google改為Supabase_完整對照.md)
- [Supabase 切換與實際網站讀寫驗證](docs/Supabase切換與驗證.md)
- [驗證紀錄](docs/驗證紀錄.md)
- `docs/before-supabase` 保存本次修改前版本；其他舊文件屬歷史紀錄，不是目前部署步驟。

SQL 由 `scripts/build-supabase-sql.mjs` 產生；改動目錄或 SQL 生成器後，執行 `npm run build` 再更新資料庫。`npm test` 使用明確檔案清單，含 PostgreSQL 引擎的 RLS、跨帳號與版本衝突測試。

依據：[Supabase API keys](https://supabase.com/docs/guides/api/api-keys)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Database functions](https://supabase.com/docs/guides/database/functions)。請僅使用合成資料。
