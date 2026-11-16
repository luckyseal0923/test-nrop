import { readFileSync, writeFileSync } from 'node:fs';
const catalog = readFileSync('src/catalog.js', 'utf8').replace(/^export \{[^\n]+\};?\r?$/gm, '').replace(/\bexport /g, '');
const model = readFileSync('src/data-model.js', 'utf8').replace(/^import[^\n]+\n/gm, '').replace(/\bexport /g, '');
const adapter = readFileSync('apps-script/adapter.gs', 'utf8');
writeFileSync('apps-script/Code.gs', '// NROP 個人練習模板；共用資料模型自動產生。\n' + catalog + '\n' + model + '\n' + adapter);
console.log('已產生 apps-script/Code.gs');
