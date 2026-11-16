import {readFileSync,writeFileSync} from 'node:fs';
let text='# 2026-11-16：ChatGPT Sites 發布與數字欄位修正\n\n網站：https://nrop-sheets-practice.chih-wei-chang.chatgpt.site\n\n前端是靜態 HTML／CSS／JavaScript；後端 Worker 接收受保護的請求，再透過 Apps Script 讀寫 Google 試算表。此頁為完整程式碼對照，沒有密鑰；密鑰只放在 Sites 執行環境與本機未追蹤設定。\n\n';
for(const path of ['apps-script/adapter.gs','src/practice-api.js']){
 text+='## '+path+'\n\n### 修改前（完整）\n\n```\n'+readFileSync('docs/before-permission-fix/'+path,'utf8')+'\n```\n\n### 修改後（完整）\n\n```\n'+readFileSync(path,'utf8')+'\n```\n\n';
}
for(const path of ['sites/nrop-practice/server/worker.mjs','sites/nrop-practice/scripts/build-worker.mjs','sites/nrop-practice/scripts/preview-worker.mjs','scripts/prepare-hosted-site.mjs','sites/nrop-practice/.openai/hosting.json'])text+='## 新增 '+path+'（完整）\n\n```\n'+readFileSync(path,'utf8')+'\n```\n\n';
text+='## Google 端更新方式\n\n修改 adapter.gs 後，先在根目錄執行 npm test 與 npm run build，將產生的 apps-script/Code.gs 完整貼回原 Apps Script 專案。儲存、選 setup 並執行，再到管理部署作業選新版本，保留既有網址與權限。setup 會由 _State 重建顯示欄位，不需要重填既有資料。本次已更新至第 2 版。\n\n## 網站更新方式\n\n先同步及建置 Sites 來源，再透過 Sites skill 指定的來源上傳、打包與私人發布工具更新同一 project_id。不能只更新本機程式便當成線上已更新；也不能為了測試而改成公開。\n';
writeFileSync('docs/2026-11-16_發布與欄位修正完整對照.md',text);
console.log('已寫出本次完整修改前後對照與新增程式。');
