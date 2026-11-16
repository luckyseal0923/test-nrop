import {readFileSync,writeFileSync} from 'node:fs';
const source='docs/before/';
const mappings=[['index.html','index.html'],['src/main.js','src/practice-main.js'],['src/api.js','src/practice-api.js'],['src/bed-management.js','src/bed-management.js'],['src/report-renderers.js','src/report-renderers.js'],['vite.config.js','vite.config.js'],['package.json','package.json']];
let content='# NROP 練習模板：完整修改前後對照\n\n每節提供完整檔案，可直接複製。新增檔案沒有修改前版本。所有程式都在練習資料夾內；原專案未改動。\n\n';
for(const [before,after]of mappings){const original=readFileSync(source+before,'utf8');content+=`## ${before} → ${after}\n\n### 修改前（完整）\n\n\`\`\`\n${original}\n\`\`\`\n\n### 修改後（完整）\n\n\`\`\`\n${readFileSync(after,'utf8')}\n\`\`\`\n\n`;}
for(const path of ['assets/practice.css','src/data-model.js','server/sheets-api.mjs','server/start.mjs','apps-script/Code.gs','apps-script/appsscript.json','.env.example']){content+=`## 新增：${path}（完整）\n\n\`\`\`\n${readFileSync(path,'utf8')}\n\`\`\`\n\n`;}
content+='## 原始配色與刪除的舊認證\n\n原版完整 CSS 見 `docs/before/assets/theme.css`。修改後保留基礎 CSS，再載入 `assets/practice.css` 覆寫視覺。舊 `src/auth-recovery.js` 完整保存在 `docs/before/src/auth-recovery.js`，練習網頁不再使用。\n';
writeFileSync('docs/修改前後完整對照.md',content);console.log('已寫出完整修改前後對照');
