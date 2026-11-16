# Google 授權封鎖：保留獨立網頁的設定方式

2026-11-16，使用者選擇維持獨立網頁，繼續設定標準 Google Cloud 專案與 OAuth。網頁與 Apps Script 仍採原本的 `/exec` 讀寫架構；不改成試算表內嵌介面。

## 原先的現象與處理結果

原先執行 `setup` 時，Google OAuth 視窗顯示「系統已封鎖這個應用程式」，沒有完成授權。這與一般「尚未驗證」的警告不同，不能根據該畫面判定唯一原因。本次改用專用標準 Cloud 專案、設定 OAuth 同意畫面與本人測試使用者後，已成功授權、初始化及部署；實際網頁寫入也已成功，見 [驗證紀錄](驗證紀錄.md)。

程式使用 `SpreadsheetApp.openById` 讀寫指定的練習表，對應的權限為 `https://www.googleapis.com/auth/spreadsheets`。此權限在 Google 的分類屬於敏感權限，授權範圍涵蓋試算表；程式本身仍固定只打開 `SPREADSHEET_ID` 指定的練習表。

## 準備標準 Cloud 專案

本次已建立並核對的專案：

| 項目 | 實際值 |
| --- | --- |
| 專案名稱 | NROP Practice |
| 專案 ID | `nrop-practice-20261116-g4p2` |
| 專案編號 | `984848234448` |
| 專案狀態 | `ACTIVE` |
| 帳單狀態 | `billingEnabled=false`，未連結帳單 |

Cloud Shell 已依使用者本次明確同意完成授權。下方建立命令僅保留作為操作紀錄，**不必再建立專案**。

1. 建立專用的 `NROP Practice` 標準專案，不更動其他應用程式的 OAuth 設定。
2. Google Cloud 建立專案畫面可能預選帳單帳戶。此練習只使用 Apps Script 的內建試算表服務，先使用不連結帳單的建立方式。
3. 若使用 Cloud Shell，可執行以下命令建立專案；專案 ID 應使用本次實際建立的值，請勿重複建立多份：

```bash
gcloud projects create nrop-practice-20261116-g4p2 --name="NROP Practice"
```

建立後取得專案編號，供 Apps Script 連結。不要把專案 ID 與全數字的專案編號混用。

## 設定 OAuth

本次已完成應用程式基本設定，名稱為「NROP 練習模板」，使用外部測試模式。本人帳號已列在測試使用者清單，資料存取清單只有 `https://www.googleapis.com/auth/spreadsheets`。

1. 在新專案開啟 Google Auth Platform／OAuth 同意畫面。
2. 應用程式名稱填 `NROP 練習模板`，支援及聯絡信箱使用專案擁有者本人。
3. 個人 Gmail 選外部使用者，先維持測試狀態；將實際執行 `setup` 的本人帳號加入測試使用者。
4. 資料存取只加入程式所需的 `https://www.googleapis.com/auth/spreadsheets`。不加入 Gmail、完整 Drive、Google Cloud 管理等額外權限。
5. 不需要為了這支 Apps Script 手動建立新的 OAuth 用戶端密鑰；Apps Script 會管理其 OAuth 流程。

## 將 Apps Script 連到新專案

本次已確認 Apps Script 顯示 `GCP 標準`、專案編號 `984848234448`，並從編輯器重新執行 `setup`，完成授權與初始化。

重新執行 `setup` 後，本次實際畫面已由「系統已封鎖這個應用程式」改成測試版授權提示。使用者明確同意代按最後「繼續」後，已完成 Google 試算表授權。

22:52:05～22:52:10 的 `setup` 執行紀錄顯示「初始化完成」與「執行完畢」。另外透過 Google Sheets 讀取 `_State!A2`，已確認完整狀態包含 28 個單位床數、0 筆填報，沒有匯入本機範例。

後續已完成第 1 版網頁讀寫服務部署（22:56），接回本機網站，並成功由網頁寫入一筆合成資料；Google 試算表的 `Records` 內容已核對一致。

下列保留重新設定的步驟，現有專案不必重做：

1. 回到 NROP Apps Script，開啟「專案設定」。
2. 在 GCP 專案處選「變更專案」，輸入新建標準專案的全數字編號。
3. 變更後需要重新授權。標準專案連結不能切回原本的預設專案，但日後可改連其他標準專案。
4. 函式選單選 `setup` 後執行。Google 帳號的最後授權由使用者本人確認。

如果仍顯示「系統已封鎖」，保留錯誤畫面並檢查 Google 顯示的具體原因、帳號保護設定或組織政策，再判斷是否需送 OAuth 驗證。不要將尚未授權當成初始化完成。

## 後續驗收

`setup` 成功後，部署網頁應用程式、把 `/exec` 網址填回本機設定，再以一筆合成資料驗證網頁儲存、Google 表列與重新載入三者一致。這是日後重建環境時仍需完成的步驟。

目前使用的部署網址（已於 23:20 更新至第 2 版，補齊特殊單位數字欄位）：

```text
https://script.google.com/macros/s/AKfycbyLLNOHQ8BO_1AJxtSjnVvR7mEFT9NYjMCc9lxCf2jjdlTHFp5362UPQncXbA6jfgWJ/exec
```

網址本身不是密鑰。`API_TOKEN` 只留在 Apps Script 指令碼屬性與本機 `.env.local`，不得填入試算表或前端程式碼。

## 官方依據

- [Apps Script 與標準 Cloud 專案](https://developers.google.com/apps-script/guides/cloud-platform-projects)
- [OAuth 用戶端驗證](https://developers.google.com/apps-script/guides/client-verification)
- [Google Sheets API 權限分類](https://developers.google.com/workspace/sheets/api/scopes)
- [建立 Cloud 專案](https://docs.cloud.google.com/resource-manager/docs/creating-managing-projects)

此文件記錄設定流程；本次已完成的項目與實際測試證據，以 [驗證紀錄](驗證紀錄.md) 為準。
