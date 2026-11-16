import{readFileSync,writeFileSync}from'node:fs';
let content='# Google 改為 Supabase：完整修改前後對照\n\n本次只修改練習專案，不更動正式 NROP。舊 Google 連線已移除；歷史程式留在 docs/before-supabase 供學習，不參與建置。\n\n';
for(const path of['index.html','src/practice-api.js','src/practice-main.js','server/start.mjs','vite.config.js','package.json','sites/nrop-practice/scripts/build-worker.mjs'])content+='## '+path+'\n\n### 修改前（完整）\n\n```\n'+readFileSync('docs/before-supabase/'+path,'utf8')+'\n```\n\n### 修改後（完整）\n\n```\n'+readFileSync(path,'utf8')+'\n```\n\n';
for(const path of['src/supabase-auth.js','server/supabase-api.mjs','server/api.mjs','server/worker.mjs','supabase/INSTALL.sql','.env.example'])content+='## 新增 '+path+'（完整）\n\n```\n'+readFileSync(path,'utf8')+'\n```\n\n';
content+='## 資料保存方式\n\n每個 Supabase 帳號有自己的練習工作區。PostgreSQL 保存完整狀態並以 revision 防止同時覆寫；records、openings、capacities、audit 檢視表使用 security_invoker，受底層 RLS 保護，提供可直接讀取的數字欄位。舊 Google 試算表保留原資料，本次不自動搬入新帳號。\n';
writeFileSync('docs/Google改為Supabase_完整對照.md',content);console.log('已產生完整修改前後對照。');
