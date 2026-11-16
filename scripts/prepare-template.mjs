import { readFileSync, writeFileSync, rmSync } from 'node:fs';
let html = readFileSync('docs/before/index.html', 'utf8');
html = html.replace('<link rel="stylesheet" href="./assets/theme.css">', '<link rel="stylesheet" href="./assets/theme.css">\n  <link rel="stylesheet" href="./assets/practice.css">');
html = html.replace('<title>護理即時動態平台 NROP</title>', '<title>NROP 練習工作區｜Google 試算表版</title>')
  .replace('護理即時動態平台 NROP</div>', 'NROP <span class="brand-tag">練習工作區</span></div>')
  .replace('Nursing Real-Time Operations Platform', 'NURSING OPERATIONS / PRACTICE')
  .replace('<button class="btn btn-ghost" id="changePasswordBtn">變更密碼</button>', '')
  .replace('id="logoutBtn">登出', 'id="logoutBtn">返回入口');
const welcome = `<main id="loginView" class="login-wrap">
  <section class="login-card">
    <div class="practice-intro"><span class="eyebrow">NURSING OPERATIONS</span><h1>讓每一班的動態，<br>清楚有序。</h1><p>從熟悉的護理流程出發，<br>練習打造自己的資訊工作區。</p>
      <div class="practice-illustration" aria-hidden="true"><div class="illustration-top"><span>每日照護動態</span><i></i><i></i><i></i></div><div class="illustration-cards"><div>單位填報<strong>01</strong></div><div>床位動態<strong>02</strong></div><div>人力統計<strong>03</strong></div></div><div class="illustration-chart"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div><div class="illustration-bottom">N 班<span></span>D 班<span></span>E 班</div></div>
      <small class="intro-note">暖白 × 森林綠 / GOOGLE SHEETS EDITION</small>
    </div>
    <div class="login-form"><span class="section-kicker">你的練習，從這裡開始</span><h2>NROP 練習模板</h2><p class="welcome-description">保留單位填報與管理儀表板，<br>用自己的試算表練習資料讀寫。</p>
      <div class="connection-summary"><span class="connection-dot"></span><div><strong>Google 試算表</strong><p id="setupStatus">正在確認連線設定…</p></div></div>
      <button class="btn btn-primary welcome-button" id="enterSheets" disabled>連接我的 Google 試算表 <span>↗</span></button>
      <button class="btn btn-soft welcome-button" id="enterDemo">先用合成範例練習 <span>→</span></button>
      <p class="welcome-hint">示範模式只儲存在這個瀏覽器。<br>連接試算表後，填報資料才會寫入 Google。</p>
      <details class="setup-details"><summary>如何連接試算表？</summary><ol><li>開啟新建的練習試算表，選「擴充功能 → Apps Script」。</li><li>貼上專案 apps-script/Code.gs，執行 setup 並部署網頁應用程式。</li><li>依 README 填好 .env.local，重新啟動此網站。</li></ol><p>這是個人練習模板，請使用合成資料。</p></details>
      <button class="btn btn-link reset-demo" id="resetDemo">重設本機示範資料</button><div id="authMessage" class="notice hidden" role="status" aria-live="polite"></div>
    </div>
  </section>
</main>`;
html = html.replace(/  <main id="loginView"[\s\S]*?(?=  <main id="appView")/, welcome + '\n');
html = html.replace('<button class="tab hidden" data-view="accounts">帳號管理</button>', '<button class="tab" data-view="connection">資料連線</button>').replace('class="tab hidden" data-view="beds"', 'class="tab" data-view="beds"');
html = html.replace('    <div class="platform-tools">', '    <div id="modeBanner" class="notice mode-banner" role="status"></div>\n    <div class="platform-tools">');
const connection = `<section id="connectionView" class="hidden"><article class="card"><div class="card-head"><h2>目前的資料來源</h2></div><div class="card-body"><div class="connection-grid"><div><small>現在的儲存位置</small><h3 id="currentStorage"></h3></div><div><small>Google 讀寫服務</small><h3 id="sheetConnectionLabel"></h3></div></div><a class="btn btn-soft sheet-link" id="sheetLink" target="_blank" rel="noopener" hidden>開啟我的練習試算表 ↗</a><p>兩種模式的資料各自獨立。Google 連線中斷時會提示錯誤，請重新整理確認結果。</p><p>練習表透過 Apps Script 讀寫。設定步驟見專案 README；此版未提供正式平台的帳號審核與多人權限。</p></div></article><article class="card dashboard-section"><div class="card-head"><h2>最近操作紀錄</h2></div><div class="table-wrap"><table><thead><tr><th>時間</th><th>操作</th><th>對象</th></tr></thead><tbody id="practiceAudit"></tbody></table></div></article></section>`;
html = html.replace(/    <section id="accountsView"[\s\S]*?(?=    <section id="bedsView")/, connection + '\n');
html = html.replace('<div class="footnote">資料儲存於 Supabase · 人力可填至小數點第三位</div>', '<div class="footnote" id="storageFootnote"></div>');
html = html.replace(/  <dialog id="accountDialog"[\s\S]*?(?=  <dialog id="bedEditDialog")/, '');
html = html.replace('核對並驗證帳號密碼', '核對調整內容');
html = html.replace(/    <p>請重新輸入目前登入系統管理者本人的帳號與密碼。[\s\S]*?(?=    <label class="bed-reviewed")/, '    <p>請再次核對單位、床數與生效日期。確認內容有效時間為五分鐘。</p>\n');
html = html.replace('驗證並儲存床數', '確認並儲存床數');
html = html.replace(/      <span class="footer-separator" aria-hidden="true">｜<\/span>\s*<button[^>]+id="checkVersion"[^>]*>檢查更新<\/button>/, '');
html = html.replace(/  <section class="update-notice[\s\S]*?<\/section>/, '');
html = html.replace('<script type="module" src="/src/main.js"></script>', `<dialog id="resetDemoDialog"><h2>重設本機示範資料？</h2><p>這會清除這個瀏覽器的示範修改，重新建立今天的合成範例。Google 試算表不受影響。</p><div class="actions"><button id="cancelResetDemo" class="btn btn-soft">取消</button><button id="confirmResetDemo" class="btn btn-primary">重設示範</button></div></dialog>
<dialog id="leaveDialog"><h2>還有尚未儲存的內容</h2><p>返回入口會捨棄尚未儲存的修改。</p><div class="actions"><button id="cancelLeave" class="btn btn-soft">繼續編輯</button><button id="confirmLeave" class="btn btn-primary">返回入口</button></div></dialog>
<script type="module" src="/src/practice-main.js"></script>`);
writeFileSync('index.html', html);
for (const path of ['src/main.js', 'src/api.js', 'src/auth-recovery.js']) rmSync(path, { force: true });
let bed = readFileSync('docs/before/src/bed-management.js', 'utf8');
bed = bed.replace("  const email=$('#bedConfirmAccount').value.trim(),password=$('#bedConfirmPassword').value;\n  $('#bedConfirmPassword').value='';\n  if(email.toLowerCase()!==pending.email.toLowerCase()){message('#bedConfirmFeedback','請重新輸入目前登入系統管理者本人的帳號與密碼。',true);return;}\n", '');
// CRLF 與 LF 都能精確移除舊的本人密碼驗證。
bed = bed.replace(/  const email=\$\('#bedConfirmAccount'\)[\s\S]*?(?=  setBusy\(true\);message\('#bedConfirmFeedback')/, '');
bed = bed.replace('requestId:pending.requestId,email,password,expectedUserId:pending.userId', 'requestId:pending.requestId');
writeFileSync('src/bed-management.js', bed);
