# NROP 練習工作區：Google 試算表版

由原本 `NROP護理資訊平台` 的網頁程式複製，改為暖白、森林綠的個人練習模板。保留 28 個單位、N／D／E 班填報、管理儀表板、CSV 匯出、歷史床數與操作紀錄。原專案與正式資料沒有變動。

練習試算表：https://docs.google.com/spreadsheets/d/1LjhAJbjXU3PYkNw511ciSqmhQxQXUfdybqQyKddnlRM/edit

線上私人練習版：https://nrop-sheets-practice.chih-wei-chang.chatgpt.site （使用擁有者的 ChatGPT 帳號登入）。已發布至 ChatGPT Sites，前端為靜態資產，後端由 Worker 轉送 Google Apps Script；不必開著本機電腦。線上來源位於 `sites/nrop-practice`；本機版本仍可依下列方式執行。

程式碼倉庫：https://github.com/luckyseal0923/test-nrop 。倉庫不含 Google 密鑰或 `.env.local`；重新下載時需要自行建立本機設定，線上執行設定則保存在 Sites。

## 立即開啟

Node.js 20.19 以上，建議 22 LTS。

```powershell
npm install
npm run dev
```

開啟 http://127.0.0.1:5178 ，按「連接我的 Google 試算表」即可進入已設定的 Google 模式。本次已完成 Cloud／OAuth、初始化與第 1 版部署，並由網頁送出一筆急診 E 班合成資料，經試算表讀取核對成功。詳細結果見 [驗證紀錄](docs/驗證紀錄.md)。

若只想離線練習，可按「先用合成範例練習」。合成範例只保存在此瀏覽器，按入口的「重設本機示範資料」可重新產生今天的範例。此模式不會寫入 Google。

## 接上 Google 試算表

若 Google 顯示「系統已封鎖這個應用程式」，請先處理 [標準 Cloud 專案與 OAuth 設定](docs/Google_Cloud_OAuth設定指南.md)。本次依使用者選擇維持獨立網頁，不採試算表內嵌方式。

### 1. 準備讀寫程式

目前 [Google 端的讀寫程式](https://script.google.com/home/projects/1ppR9sAj_Q5FG6LaF8r60mPQlXcEjiAxk0Yo4pYzLJ3rkOCuo49ik4Hjd/edit) 已設定 `SPREADSHEET_ID` 與 `API_TOKEN`、完成本人授權、執行 `setup` 並部署成功；本機 `.env.local` 也已接上 `/exec` 網址。**本機目前可直接使用，不必重做以下設定。** 下方保留從頭重建的完整步驟。

1. 開啟上方的練習表，選「擴充功能 → Apps Script」。新建的專案可命名為「NROP 練習模板－試算表讀寫」。
2. 將 [apps-script/Code.gs](apps-script/Code.gs) 全部貼到 `程式碼.gs`，取代空白的 `myFunction` 並儲存。這份檔案已包含所有單位、計算、驗證與讀寫功能，不必逐一加入其他 JS 檔。
3. 選左側「專案設定」，在「指令碼屬性」加入：

| 屬性 | 值 |
| --- | --- |
| SPREADSHEET_ID | `1LjhAJbjXU3PYkNw511ciSqmhQxQXUfdybqQyKddnlRM` |
| API_TOKEN | 本機 `.env.local` 的 `SHEETS_API_TOKEN` 值，整串複製；不要包含欄位名稱或等號 |

`.env.local` 已在本機準備好並被 Git 排除。若之後從乾淨的程式碼開始，執行 `node scripts/create-local-env.mjs` 產生新的隨機密鑰。密鑰僅放本機設定與 Apps Script 指令碼屬性，不要放網頁 JS 或 Google 試算表儲存格。

### 2. 初始化與部署

1. 回到編輯器，在函式選單選 `setup`，按「執行」。依 Google 提示，使用自己的帳號授權這支程式讀寫試算表。
2. `setup` 會建立／核對欄位、建立初始床數並隱藏 `_State`。初次沒有任何填報資料；**不會匯入瀏覽器的範例**。重跑 `setup` 會由既有狀態重建顯示分頁，保留已儲存的填報。
3. 按右上「部署 → 新增部署作業」，類型選「網頁應用程式」。執行身分選自己，存取者選「所有人」。試算表本身維持私人；讀寫端每次仍檢查伺服器密鑰。若 Workspace 管理者不允許此部署方式，此模板的本機代理無法直接使用該部署，需要另調整驗證方式。
4. 複製部署後以 `/exec` 結尾的網址。將它填入本機 `.env.local` 的 `SHEETS_API_URL`。保留既有 `SHEETS_API_TOKEN`。
5. 停止並重新執行 `npm run dev`。入口的「連接我的 Google 試算表」會啟用。先進入、設定一般病房第一班的期初人數，再填報及儲存。

只看到入口按鈕啟用代表設定有填，不代表 Google 已驗證；進入後讀取成功才會顯示「Google 試算表連線可用」。

新建環境時，Google 的初始化授權、部署與真實讀寫都需要個別驗證。本次已在本人帳號完成；仍請以 Google 模式及試算表實際內容判斷儲存結果。

### 3. 驗證有存進去

1. 在 Google 模式選一個單位，輸入一筆合成資料，按「暫存」或「正式送出」。
2. 確認畫面顯示儲存到 Google 試算表，並在練習表的 `Records` 找到相同日期、班別、單位及數字。
3. 重新整理網站，確認內容仍相同。修改同一筆後，確認試算表不新增重複日期／班別／單位，版本會增加。
4. 可在 `Audit` 查看操作紀錄。需要測試失敗流程時，暫時把本機部署網址填錯，重新啟動後應明確失敗，不會切換本機示範。

## 儲存架構

```text
網頁 → 本機 Node.js /api/nrop → Google Apps Script → 私人的 Google 試算表
```

Supabase 套件、環境變數、登入與遠端資料寫入已從執行中的網頁移除。`docs/before` 僅保留原始碼供學習對照，不參與建置。

本機版入口不驗證身分、沒有原版的註冊審核與多人角色隔離，床數調整採內容再次確認。本機服務只綁 `127.0.0.1`，讀寫代理檢查本機同來源。若要提供同仁共同使用，需另外設計登入與各單位的權限。

線上版另由 Sites 擁有者私人存取政策保護；後端也會檢查平台提供的登入身份與同來源請求。它仍是單一擁有者練習工作區，不提供多人單位權限。Google 連線設定與密鑰存於 Sites 執行環境，不會打包到網頁或來源倉庫。

`_State` 是程式完整狀態，分段儲存在同一列；一次寫入，單一指令碼鎖防止兩個程式請求同時覆寫。`Records`、`Openings`、`Capacities` 與 `Audit` 為可閱讀的投影，**請在網頁編輯資料，不要直接修改投影或 `_State`**。這些分頁不設任意改值的匯入功能。若顯示分頁更新失敗，程式會提示資料已儲存，重新執行 `setup` 即可由完整狀態重建。Google 試算表不是 PostgreSQL；此實作不提供原版資料庫的交易／RLS 保證。

`Records` 的 A:O 保留原欄位順序；P:AM 展開急診、產房、手術室、護理之家、洗腎室及分項住院的數字。急診／護理之家住院與出院、急診死亡會映射到共通欄位；留觀與轉診另列，不能混算為病房住院或機構內轉入／出。空白表示不適用或未提供，0 表示已填寫的零值。

練習版完整狀態上限為約 128 萬個字元，操作紀錄保留最近 500 筆。所有數字與日期在服務端重新檢查；前班修改會重新計算後班、更新版本；版本不同會拒絕覆寫。連線中斷不自動重送寫入，請先重新整理確認結果。

請使用合成資料練習。網頁沒有建立員工或病人名單的欄位。

## 修改模板

| 檔案 | 練習內容 |
| --- | --- |
| `assets/practice.css` | 主要色票、卡片、按鈕、響應式排版 |
| `index.html` | 頁面文字、入口、各區塊結構 |
| `src/catalog.js` | 單位名稱、床數、特殊單位欄位 |
| `src/report-renderers.js` | 填報表格、統計顯示、CSV 匯出 |
| `src/practice-main.js` | 切換畫面與儲存流程 |
| `src/practice-api.js` | 本機示範／Google 模式 |
| `src/data-model.js` | 兩種模式共用的計算與驗證 |
| `apps-script/adapter.gs` | Google 端的讀寫與鎖定 |

`Code.gs` 由共用的目錄、資料模型與 `adapter.gs` 合成。改動後執行 `npm run build`，再將新 `Code.gs` 貼回 Apps Script 並更新部署版本；不要只改產生出的 `Code.gs`。

完整修改前後段落見 [docs/修改前後完整對照.md](docs/修改前後完整對照.md)。

## 建置與檢查

```powershell
npm test
npm run build
npm start
```

建置後的本機服務在 http://127.0.0.1:4178 。需要本機 Node.js 的讀寫代理，不能只雙擊 `index.html` 或只把 `dist` 放到純靜態空間便期待 Google 模式可用。

技術流程依 [Apps Script 網頁應用程式](https://developers.google.com/apps-script/guides/web) 與 [LockService](https://developers.google.com/apps-script/reference/lock/lock-service) 官方文件設計。

來源：原專案程式版本 `3e43eb5ff490e83ec5d75594a3f3aa11e5e2beb3`。這次沒有複製 `.git`、`.env.local`、Supabase 資料、正式帳號或部署設定。
