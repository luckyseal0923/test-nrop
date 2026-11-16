# Google 改為 Supabase：完整修改前後對照

本次只修改練習專案，不更動正式 NROP。舊 Google 連線已移除；歷史程式留在 docs/before-supabase 供學習，不參與建置。

## index.html

### 修改前（完整）

```
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NROP 練習工作區｜Google 試算表版</title>
  <link rel="stylesheet" href="./assets/theme.css">
  <link rel="stylesheet" href="./assets/practice.css">
</head>
<body>
  <header class="topbar">
    <div class="brand"><div class="brand-copy"><div class="brand-title">NROP <span class="brand-tag">練習工作區</span></div><div class="brand-subtitle">NURSING OPERATIONS / PRACTICE</div></div></div>
    <div class="top-actions" id="sessionArea" hidden><span class="user-chip" id="userChip"></span><button class="btn btn-ghost" id="logoutBtn">返回入口</button></div>
  </header>

<main id="loginView" class="login-wrap">
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
</main>
  <main id="appView" class="wrap hidden">
    <div class="page-head"><div><h1 id="pageTitle">單位每日填報</h1><p id="pageSubtitle"></p></div><div class="tabs"><button class="tab active" data-view="entry">單位填報</button><button class="tab" data-view="dashboard">管理儀表板</button><button class="tab" data-view="connection">資料連線</button><button class="tab" data-view="beds">床數管理</button></div></div>

    <div id="modeBanner" class="notice mode-banner" role="status"></div>
    <div class="platform-tools"><button type="button" class="btn btn-soft" id="refreshData">重新整理</button><span id="syncStatus" role="status"></span></div>
    <div id="appError" class="notice error hidden" role="alert"></div>
    <section id="entryView">
      <div class="grid-2" id="entryLayout">
      <div class="entry-forms">
      <div id="standardEntryGrid">
        <article class="card"><div class="card-head"><h2>當班動態資料</h2><span id="recordStatus" class="status empty">尚未填寫</span></div><div class="card-body">
          <div class="form-context"><div class="context-box"><small id="entryUnitLabel">填報單位</small><div class="unit-context" id="entryUnitControl"></div></div><div class="context-box"><small>日期</small><input type="date" id="entryDate" style="border:0;background:transparent;width:100%;font-weight:700"></div><div class="context-box"><small>班別</small><select id="entryShift" style="border:0;background:transparent;width:100%;font-weight:700"><option value="N">N｜00–08</option><option value="D">D｜08–16</option><option value="E">E｜16–24</option></select></div><div class="context-box"><small>有效床數</small><strong><span id="bedCount">0</span> 床</strong></div></div>
          <div id="previousNotice" class="notice hidden"></div>
          <div class="notice hidden" id="openingControls"><p>首次啟用的單位，由管理者確認期初住院人數。</p><label>期初住院人數 <input id="openingPatients" type="number" min="0" step="1" value="0"></label> <button type="button" class="btn btn-soft" id="setOpening">設定期初人數</button></div>
          <div class="input-section"><h3>人力與前班基準</h3><div class="entry-grid"><div class="number-field"><label>實際上班人力 <span class="required">*</span></label><input id="staff" type="number" min="0" step="0.001" inputmode="decimal" required value="0"></div><div class="number-field"><label>前一班住院人數</label><input id="previous" type="number" readonly value="0"></div></div></div>
          <div class="input-section"><h3>當班異動（非累計）</h3><div id="admissionNotice" class="notice hidden"></div><div class="entry-grid" id="eventFields"></div><div id="admissionSummary" class="formula hidden" style="margin-top:14px"></div></div>
          <div class="input-section"><h3>系統自動計算</h3><div class="calc-strip"><div class="calc"><small>當班住院病人數</small><strong id="patientCount">0</strong></div><div class="calc"><small>空床數</small><strong id="emptyBeds">0</strong></div><div class="calc over"><small>超床數</small><strong id="overBeds">0</strong></div></div></div>
          <div class="actions"><button class="btn btn-soft" id="saveDraft">暫存</button><button class="btn btn-primary" id="submitRecord">正式送出</button></div>
        </div></article>
      </div>
      <div id="specialEntryView" class="hidden">
        <article class="card"><div class="card-head"><div><h2 id="specialFormTitle">特殊單位填報</h2><small style="color:var(--muted)">本區除合計外均為人工輸入</small></div><span id="specialRecordStatus" class="status empty">尚未填寫</span></div><div class="card-body">
          <div class="form-context"><div class="context-box"><small id="specialUnitLabel">填報單位</small><div class="unit-context" id="specialUnitControl"></div></div><div class="context-box"><small>日期</small><input type="date" id="specialDate" style="border:0;background:transparent;width:100%;font-weight:700"></div><div class="context-box"><small>班別</small><select id="specialShift" style="border:0;background:transparent;width:100%;font-weight:700"><option value="N">N｜00–08</option><option value="D">D｜08–16</option><option value="E">E｜16–24</option></select></div><div class="context-box"><small>參考床數</small><strong id="specialBeds">—</strong></div></div>
          <div class="input-section"><h3>當班填報內容</h3><div id="staffBreakdownNotice" class="notice hidden"></div><div class="entry-grid" id="specialFields"></div></div>
          <div class="actions"><button class="btn btn-soft" id="saveSpecialDraft">暫存</button><button class="btn btn-primary" id="submitSpecialRecord">正式送出</button></div>
        </div></article>
      </div>
      </div>
      <aside class="card" id="calculationGuide" aria-labelledby="calculationGuideTitle"><div class="card-head"><h2 id="calculationGuideTitle">計算說明</h2></div><div class="card-body"><div class="formula calculation-guide" id="calculationRules"></div><h3 style="font-size:15px;margin:22px 0 12px">今日班別進度</h3><div class="side-list" id="shiftProgress"></div></div></aside>
      </div>
    </section>

    <section id="dashboardView" class="hidden">
      <div class="filterbar" style="margin-bottom:16px"><input type="date" id="dashboardDate"><select id="dashboardShift"><option value="N">N 班｜00–08</option><option value="D">D 班｜08–16</option><option value="E">E 班｜16–24</option></select></div>
      <div class="subtabs"><button class="subtab active" data-panel="shiftPanel">班別即時</button><button class="subtab" data-panel="dailyPanel">全日彙整</button><button class="subtab" data-panel="alertsPanel">異常 Log</button></div>
      <div id="shiftPanel"></div><div id="dailyPanel" class="hidden"><article class="card dashboard-section" id="specialOpsCard"><div class="card-head"><div><h2>特殊單位每日營運統整</h2><small style="color:var(--muted)">急診、產房、手術室、護理之家與洗腎室</small></div></div><div class="table-wrap"><table><thead><tr><th>單位</th><th>當日主要數值</th><th>N 班</th><th>D 班</th><th>E 班</th></tr></thead><tbody id="specialOpsTable"></tbody></table></div></article></div><div id="alertsPanel" class="hidden"></div>
      <article class="card" style="margin-bottom:20px"><div class="card-head"><div><h2>全日統整（N＋D＋E）</h2><small style="color:var(--muted)">彙整所選日期三個班別的當日動態</small></div><span class="status done" id="dailyStatus">0/0 班完成</span></div><div class="card-body"><div class="summary-grid" style="margin-bottom:0"><div class="metric"><div class="label">E 班期末住院</div><span class="value" id="dClosing">0</span><span class="unit">人</span></div><div class="metric"><div class="label">當日住院</div><span class="value" id="dAdmissions">0</span><span class="unit">人次</span></div><div class="metric"><div class="label">當日出院</div><span class="value" id="dDischarges">0</span><span class="unit">人次</span></div><div class="metric"><div class="label">機構內轉入／轉出</div><span class="value" id="dTransfers">0／0</span><span class="unit">人次</span></div><div class="metric"><div class="label">病危／死亡</div><span class="value" id="dCriticalDeaths">0／0</span><span class="unit">人次</span></div><div class="metric"><div class="label">三班上班人力合計</div><span class="value" id="dStaff">0</span><span class="unit">人次</span></div></div></div></article>
      <div style="font-weight:800;color:var(--navy);margin:2px 0 12px">所選班別統計</div>
      <div class="summary-grid"><div class="metric"><div class="label">有效床數</div><span class="value" id="mBeds">0</span><span class="unit">床</span></div><div class="metric"><div class="label">住院病人</div><span class="value" id="mPatients">0</span><span class="unit">人</span></div><div class="metric"><div class="label">空床</div><span class="value" id="mEmpty">0</span><span class="unit">床</span></div><div class="metric warning"><div class="label">超床</div><span class="value" id="mOver">0</span><span class="unit">床</span></div><div class="metric"><div class="label">實際上班人力</div><span class="value" id="mStaff">0</span><span class="unit">人</span></div><div class="metric"><div class="label">全院護病比</div><span class="value" id="mRatio">—</span></div><div class="metric"><div class="label">填報進度</div><span class="value" id="mProgress">0/0</span><span class="unit">單位</span></div></div>
      <div class="dashboard-grid" style="margin-bottom:20px">
        <article class="card"><div class="card-head"><h2>全院住院摘要（當日 E 班）</h2></div><div class="table-wrap"><table><thead><tr><th>全院總病床數</th><th>全院總病人數</th><th>全院總空床數</th></tr></thead><tbody><tr><td class="num"><b id="hospitalBeds">626</b></td><td class="num"><b id="closingPatients">0</b></td><td class="num"><b id="hospitalEmpty">626</b></td></tr></tbody></table></div><div style="padding:10px 20px;color:var(--muted);font-size:12px">總病人數＝一般病房＋特殊單位住院病人數；總空床數＝有效病床數－總病人數</div></article>
        <article class="card"><div class="card-head"><h2>護理之家（獨立統計）</h2></div><div class="table-wrap"><table><thead><tr><th>總病床數</th><th>機構內住民</th><th>保留床位</th><th>實際空床</th></tr></thead><tbody><tr><td class="num" id="nhBeds">39</td><td class="num"><b id="nhResidents">—</b></td><td class="num"><b id="nhReserved">—</b></td><td class="num"><b id="nhEmpty">—</b></td></tr></tbody></table></div></article>
      </div>
      <article class="card"><div class="card-head"><h2>各單位即時統計</h2><button class="btn btn-soft" id="exportBtn">匯出 CSV</button></div><div class="table-wrap"><table><thead><tr><th>單位</th><th>床數</th><th>住院</th><th>空床</th><th>超床</th><th>占床率</th><th>上班人力</th><th>護病比</th><th>病危</th><th>狀態</th></tr></thead><tbody id="unitTable"></tbody></table></div></article>
      <div class="dashboard-grid dashboard-section"><article class="card"><div class="card-head"><h2>各單位占床率</h2></div><div class="card-body"><div class="chart" id="occupancyChart"></div></div></article><article class="card"><div class="card-head"><h2>待完成填報</h2></div><div class="card-body"><div class="side-list" id="pendingList"></div></div></article></div>
      <article class="card dashboard-section"><div class="card-head"><div><h2>異常與漏填紀錄</h2><small style="color:var(--muted)">優先顯示過去未填寫、僅暫存及缺少必要欄位的資料</small></div><span class="status draft" id="alertCount">0 筆待處理</span></div><div class="table-wrap"><table><thead><tr><th>日期</th><th>班別</th><th>單位</th><th>異常類型</th><th>異常內容</th><th>處理狀態</th></tr></thead><tbody id="alertTable"></tbody></table></div></article>
      <article class="card dashboard-section"><div class="card-head"><h2>異常通報判定規則</h2></div><div class="card-body"><div class="formula">漏填異常：過去班別沒有紀錄、只有暫存、實際上班人力或必填事件欄位缺值。營運提醒：住院人數超過有效床數。住院人數與空床數由系統自動計算，不列為人工填報異常；數字 0 是有效資料，也不視為漏填。</div></div></article>
    </section>
<section id="connectionView" class="hidden"><article class="card"><div class="card-head"><h2>目前的資料來源</h2></div><div class="card-body"><div class="connection-grid"><div><small>現在的儲存位置</small><h3 id="currentStorage"></h3></div><div><small>Google 讀寫服務</small><h3 id="sheetConnectionLabel"></h3></div></div><a class="btn btn-soft sheet-link" id="sheetLink" target="_blank" rel="noopener" hidden>開啟我的練習試算表 ↗</a><p>兩種模式的資料各自獨立。Google 連線中斷時會提示錯誤，請重新整理確認結果。</p><p>練習表透過 Apps Script 讀寫。設定步驟見專案 README；此版未提供正式平台的帳號審核與多人權限。</p></div></article><article class="card dashboard-section"><div class="card-head"><h2>最近操作紀錄</h2></div><div class="table-wrap"><table><thead><tr><th>時間</th><th>操作</th><th>對象</th></tr></thead><tbody id="practiceAudit"></tbody></table></div></article></section>
    <section id="bedsView" class="hidden">
      <article class="card"><div class="card-head"><h2>有效病床數管理</h2><button type="button" class="btn btn-soft" id="reloadBedSettings">重新整理床數</button></div><div class="card-body">
        <p>指定生效日期，N／D／E 三班一併套用；生效日期以前的報表母數維持不變。可選今天或未來日期。</p>
        <div id="bedSettingsFeedback" class="notice hidden" role="status"></div>
        <div id="bedSettingsContent" class="hidden">
          <div class="formula">目前全院有效病床數：<strong id="bedHospitalTotal">—</strong>（一般病房及特殊住院單位）。其他單位維持原有的參考床數或獨立統計用途。</div>
          <div id="bedUnitCards"></div>
        </div>
      </div></article>
    </section>
    <div class="footnote" id="storageFootnote"></div>
  </main>
  <dialog id="bedEditDialog" class="bed-edit-dialog" aria-labelledby="bedEditTitle">
    <div class="bed-edit-head"><div><h2 id="bedEditTitle">調整病床數</h2><p id="bedEditType"></p></div><button type="button" class="btn btn-soft" id="closeBedEdit" aria-label="關閉床數調整">關閉</button></div>
    <div class="bed-edit-layout">
      <form id="bedSettingsForm">
        <div class="bed-edit-context"><div><small>填報單位</small><strong id="bedUnitName">—</strong></div><div><small>目前床數</small><strong id="bedEditCurrent">—</strong></div></div>
        <div class="bed-edit-fields"><div class="field"><label for="bedEffectiveDate">生效日期</label><input id="bedEffectiveDate" type="date" max="2100-12-31" required></div><div class="field"><label>該日期原床數</label><strong id="bedOriginal">—</strong></div><div class="field"><label for="newBeds">調整後床數</label><input id="newBeds" type="number" min="0" max="9999" step="1" required></div></div>
        <div class="field"><label for="bedReason">調整原因（選填）</label><input id="bedReason" maxlength="400"></div>
        <p class="notice bed-warning">更改病床數將影響計算母數，請確認調整內容是否正確。生效日 N／D／E 三班共同套用，之前日期維持原母數；若有後續排定設定，依其日期接續套用。</p>
        <div id="bedEditFeedback" class="notice hidden" role="alert"></div>
        <div class="actions"><button type="button" class="btn btn-soft" id="cancelBedEdit">取消調整</button><button type="submit" class="btn btn-primary">核對調整內容</button></div>
      </form>
      <aside class="bed-edit-history" aria-label="本單位床數調整歷史">
        <h3>過去調整紀錄</h3><p id="bedHistoryNote" class="bed-history-note"></p><div id="bedUnitHistory" class="bed-history-list"></div>
        <h3>床數設定沿革</h3><p class="bed-history-note">依生效日期排列，包含原始基準及已排定設定。</p><div id="bedUnitTimeline" class="bed-history-list"></div>
      </aside>
    </div>
  </dialog>
  <dialog id="bedConfirmDialog" aria-labelledby="bedConfirmTitle"><form id="bedConfirmForm">
    <h2 id="bedConfirmTitle">確認調整病床數</h2>
    <p class="notice bed-warning"><strong>更改病床數將影響計算母數，請確認調整內容是否正確。</strong></p>
    <div id="bedConfirmSummary" class="formula bed-confirm-summary"></div>
    <p>請再次核對單位、床數與生效日期。確認內容有效時間為五分鐘。</p>
    <label class="bed-reviewed"><input id="bedReviewed" type="checkbox" required> 我已確認單位、生效日期及調整內容正確。</label>
    <div id="bedConfirmFeedback" class="notice hidden" role="alert"></div>
    <div class="actions"><button type="button" class="btn btn-soft" id="cancelBedConfirm">取消</button><button type="submit" class="btn btn-primary">確認並儲存床數</button></div>
  </form></dialog>
  <footer class="site-footer" aria-label="系統資訊與網站版本">
    <div class="footer-meta">
      <span id="appVersion"></span>
      <span class="footer-separator" aria-hidden="true">｜</span>
      <span id="connectionStatus" role="status" data-state="loading">連線中…</span>

    </div>
    <span id="versionStatus" role="status" aria-live="polite"></span>
  </footer>

  <div id="toast" class="toast hidden"></div>

  <dialog id="resetDemoDialog"><h2>重設本機示範資料？</h2><p>這會清除這個瀏覽器的示範修改，重新建立今天的合成範例。Google 試算表不受影響。</p><div class="actions"><button id="cancelResetDemo" class="btn btn-soft">取消</button><button id="confirmResetDemo" class="btn btn-primary">重設示範</button></div></dialog>
<dialog id="leaveDialog"><h2>還有尚未儲存的內容</h2><p>返回入口會捨棄尚未儲存的修改。</p><div class="actions"><button id="cancelLeave" class="btn btn-soft">繼續編輯</button><button id="confirmLeave" class="btn btn-primary">返回入口</button></div></dialog>
<script type="module" src="/src/practice-main.js"></script>
</body>
</html>

```

### 修改後（完整）

```
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NROP 練習工作區｜Supabase 版</title>
  <link rel="stylesheet" href="./assets/theme.css">
  <link rel="stylesheet" href="./assets/practice.css">
</head>
<body>
  <header class="topbar">
    <div class="brand"><div class="brand-copy"><div class="brand-title">NROP <span class="brand-tag">練習工作區</span></div><div class="brand-subtitle">NURSING OPERATIONS / PRACTICE</div></div></div>
    <div class="top-actions" id="sessionArea" hidden><span class="user-chip" id="userChip"></span><button class="btn btn-ghost" id="logoutBtn">返回入口</button></div>
  </header>

<main id="loginView" class="login-wrap">
  <section class="login-card">
    <div class="practice-intro"><span class="eyebrow">NURSING OPERATIONS</span><h1>讓每一班的動態，<br>清楚有序。</h1><p>從熟悉的護理流程出發，<br>練習打造自己的資訊工作區。</p>
      <div class="practice-illustration" aria-hidden="true"><div class="illustration-top"><span>每日照護動態</span><i></i><i></i><i></i></div><div class="illustration-cards"><div>單位填報<strong>01</strong></div><div>床位動態<strong>02</strong></div><div>人力統計<strong>03</strong></div></div><div class="illustration-chart"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div><div class="illustration-bottom">N 班<span></span>D 班<span></span>E 班</div></div>
      <small class="intro-note">暖白 × 森林綠 / SUPABASE EDITION</small>
    </div>
    <div class="login-form"><span class="section-kicker">你的練習，從這裡開始</span><h2>NROP 練習模板</h2><p class="welcome-description">保留單位填報與管理儀表板，<br>使用 Supabase 保存你的練習資料。</p>
      <div class="connection-summary"><span class="connection-dot"></span><div><strong>Supabase</strong><p id="setupStatus">正在確認連線設定…</p></div></div>
      <form id="supabaseLoginForm" class="supabase-login" hidden>
        <label for="authEmail">登入信箱</label><input id="authEmail" type="email" autocomplete="username" required placeholder="你的電子郵件">
        <label for="authPassword">密碼</label><input id="authPassword" type="password" autocomplete="current-password" required minlength="8" placeholder="至少 8 個字元">
        <button class="btn btn-primary welcome-button" id="signIn" type="submit">登入並開始填報 <span>↗</span></button>
        <button class="btn btn-soft welcome-button" id="signUp" type="button">建立練習帳號</button>
      </form>
      <button class="btn btn-primary welcome-button" id="resumeSupabase" hidden>繼續使用已登入帳號 <span>↗</span></button>
      <button class="btn btn-link" id="signOutAccount" hidden>切換帳號</button>
      <button class="btn btn-soft welcome-button" id="enterDemo">先用合成範例練習 <span>→</span></button>
      <p class="welcome-hint">登入後，每個帳號各自保存練習資料。<br>示範模式只儲存在目前瀏覽器。</p>
      <details class="setup-details"><summary>關於練習帳號</summary><p>第一次註冊後，請到信箱完成確認，再返回登入。此工作區使用 Supabase 保存資料。請使用合成資料。</p></details>
      <button class="btn btn-link reset-demo" id="resetDemo">重設本機示範資料</button><div id="authMessage" class="notice hidden" role="status" aria-live="polite"></div>
    </div>
  </section>
</main>
  <main id="appView" class="wrap hidden">
    <div class="page-head"><div><h1 id="pageTitle">單位每日填報</h1><p id="pageSubtitle"></p></div><div class="tabs"><button class="tab active" data-view="entry">單位填報</button><button class="tab" data-view="dashboard">管理儀表板</button><button class="tab" data-view="connection">資料連線</button><button class="tab" data-view="beds">床數管理</button></div></div>

    <div id="modeBanner" class="notice mode-banner" role="status"></div>
    <div class="platform-tools"><button type="button" class="btn btn-soft" id="refreshData">重新整理</button><span id="syncStatus" role="status"></span></div>
    <div id="appError" class="notice error hidden" role="alert"></div>
    <section id="entryView">
      <div class="grid-2" id="entryLayout">
      <div class="entry-forms">
      <div id="standardEntryGrid">
        <article class="card"><div class="card-head"><h2>當班動態資料</h2><span id="recordStatus" class="status empty">尚未填寫</span></div><div class="card-body">
          <div class="form-context"><div class="context-box"><small id="entryUnitLabel">填報單位</small><div class="unit-context" id="entryUnitControl"></div></div><div class="context-box"><small>日期</small><input type="date" id="entryDate" style="border:0;background:transparent;width:100%;font-weight:700"></div><div class="context-box"><small>班別</small><select id="entryShift" style="border:0;background:transparent;width:100%;font-weight:700"><option value="N">N｜00–08</option><option value="D">D｜08–16</option><option value="E">E｜16–24</option></select></div><div class="context-box"><small>有效床數</small><strong><span id="bedCount">0</span> 床</strong></div></div>
          <div id="previousNotice" class="notice hidden"></div>
          <div class="notice hidden" id="openingControls"><p>首次啟用的單位，由管理者確認期初住院人數。</p><label>期初住院人數 <input id="openingPatients" type="number" min="0" step="1" value="0"></label> <button type="button" class="btn btn-soft" id="setOpening">設定期初人數</button></div>
          <div class="input-section"><h3>人力與前班基準</h3><div class="entry-grid"><div class="number-field"><label>實際上班人力 <span class="required">*</span></label><input id="staff" type="number" min="0" step="0.001" inputmode="decimal" required value="0"></div><div class="number-field"><label>前一班住院人數</label><input id="previous" type="number" readonly value="0"></div></div></div>
          <div class="input-section"><h3>當班異動（非累計）</h3><div id="admissionNotice" class="notice hidden"></div><div class="entry-grid" id="eventFields"></div><div id="admissionSummary" class="formula hidden" style="margin-top:14px"></div></div>
          <div class="input-section"><h3>系統自動計算</h3><div class="calc-strip"><div class="calc"><small>當班住院病人數</small><strong id="patientCount">0</strong></div><div class="calc"><small>空床數</small><strong id="emptyBeds">0</strong></div><div class="calc over"><small>超床數</small><strong id="overBeds">0</strong></div></div></div>
          <div class="actions"><button class="btn btn-soft" id="saveDraft">暫存</button><button class="btn btn-primary" id="submitRecord">正式送出</button></div>
        </div></article>
      </div>
      <div id="specialEntryView" class="hidden">
        <article class="card"><div class="card-head"><div><h2 id="specialFormTitle">特殊單位填報</h2><small style="color:var(--muted)">本區除合計外均為人工輸入</small></div><span id="specialRecordStatus" class="status empty">尚未填寫</span></div><div class="card-body">
          <div class="form-context"><div class="context-box"><small id="specialUnitLabel">填報單位</small><div class="unit-context" id="specialUnitControl"></div></div><div class="context-box"><small>日期</small><input type="date" id="specialDate" style="border:0;background:transparent;width:100%;font-weight:700"></div><div class="context-box"><small>班別</small><select id="specialShift" style="border:0;background:transparent;width:100%;font-weight:700"><option value="N">N｜00–08</option><option value="D">D｜08–16</option><option value="E">E｜16–24</option></select></div><div class="context-box"><small>參考床數</small><strong id="specialBeds">—</strong></div></div>
          <div class="input-section"><h3>當班填報內容</h3><div id="staffBreakdownNotice" class="notice hidden"></div><div class="entry-grid" id="specialFields"></div></div>
          <div class="actions"><button class="btn btn-soft" id="saveSpecialDraft">暫存</button><button class="btn btn-primary" id="submitSpecialRecord">正式送出</button></div>
        </div></article>
      </div>
      </div>
      <aside class="card" id="calculationGuide" aria-labelledby="calculationGuideTitle"><div class="card-head"><h2 id="calculationGuideTitle">計算說明</h2></div><div class="card-body"><div class="formula calculation-guide" id="calculationRules"></div><h3 style="font-size:15px;margin:22px 0 12px">今日班別進度</h3><div class="side-list" id="shiftProgress"></div></div></aside>
      </div>
    </section>

    <section id="dashboardView" class="hidden">
      <div class="filterbar" style="margin-bottom:16px"><input type="date" id="dashboardDate"><select id="dashboardShift"><option value="N">N 班｜00–08</option><option value="D">D 班｜08–16</option><option value="E">E 班｜16–24</option></select></div>
      <div class="subtabs"><button class="subtab active" data-panel="shiftPanel">班別即時</button><button class="subtab" data-panel="dailyPanel">全日彙整</button><button class="subtab" data-panel="alertsPanel">異常 Log</button></div>
      <div id="shiftPanel"></div><div id="dailyPanel" class="hidden"><article class="card dashboard-section" id="specialOpsCard"><div class="card-head"><div><h2>特殊單位每日營運統整</h2><small style="color:var(--muted)">急診、產房、手術室、護理之家與洗腎室</small></div></div><div class="table-wrap"><table><thead><tr><th>單位</th><th>當日主要數值</th><th>N 班</th><th>D 班</th><th>E 班</th></tr></thead><tbody id="specialOpsTable"></tbody></table></div></article></div><div id="alertsPanel" class="hidden"></div>
      <article class="card" style="margin-bottom:20px"><div class="card-head"><div><h2>全日統整（N＋D＋E）</h2><small style="color:var(--muted)">彙整所選日期三個班別的當日動態</small></div><span class="status done" id="dailyStatus">0/0 班完成</span></div><div class="card-body"><div class="summary-grid" style="margin-bottom:0"><div class="metric"><div class="label">E 班期末住院</div><span class="value" id="dClosing">0</span><span class="unit">人</span></div><div class="metric"><div class="label">當日住院</div><span class="value" id="dAdmissions">0</span><span class="unit">人次</span></div><div class="metric"><div class="label">當日出院</div><span class="value" id="dDischarges">0</span><span class="unit">人次</span></div><div class="metric"><div class="label">機構內轉入／轉出</div><span class="value" id="dTransfers">0／0</span><span class="unit">人次</span></div><div class="metric"><div class="label">病危／死亡</div><span class="value" id="dCriticalDeaths">0／0</span><span class="unit">人次</span></div><div class="metric"><div class="label">三班上班人力合計</div><span class="value" id="dStaff">0</span><span class="unit">人次</span></div></div></div></article>
      <div style="font-weight:800;color:var(--navy);margin:2px 0 12px">所選班別統計</div>
      <div class="summary-grid"><div class="metric"><div class="label">有效床數</div><span class="value" id="mBeds">0</span><span class="unit">床</span></div><div class="metric"><div class="label">住院病人</div><span class="value" id="mPatients">0</span><span class="unit">人</span></div><div class="metric"><div class="label">空床</div><span class="value" id="mEmpty">0</span><span class="unit">床</span></div><div class="metric warning"><div class="label">超床</div><span class="value" id="mOver">0</span><span class="unit">床</span></div><div class="metric"><div class="label">實際上班人力</div><span class="value" id="mStaff">0</span><span class="unit">人</span></div><div class="metric"><div class="label">全院護病比</div><span class="value" id="mRatio">—</span></div><div class="metric"><div class="label">填報進度</div><span class="value" id="mProgress">0/0</span><span class="unit">單位</span></div></div>
      <div class="dashboard-grid" style="margin-bottom:20px">
        <article class="card"><div class="card-head"><h2>全院住院摘要（當日 E 班）</h2></div><div class="table-wrap"><table><thead><tr><th>全院總病床數</th><th>全院總病人數</th><th>全院總空床數</th></tr></thead><tbody><tr><td class="num"><b id="hospitalBeds">626</b></td><td class="num"><b id="closingPatients">0</b></td><td class="num"><b id="hospitalEmpty">626</b></td></tr></tbody></table></div><div style="padding:10px 20px;color:var(--muted);font-size:12px">總病人數＝一般病房＋特殊單位住院病人數；總空床數＝有效病床數－總病人數</div></article>
        <article class="card"><div class="card-head"><h2>護理之家（獨立統計）</h2></div><div class="table-wrap"><table><thead><tr><th>總病床數</th><th>機構內住民</th><th>保留床位</th><th>實際空床</th></tr></thead><tbody><tr><td class="num" id="nhBeds">39</td><td class="num"><b id="nhResidents">—</b></td><td class="num"><b id="nhReserved">—</b></td><td class="num"><b id="nhEmpty">—</b></td></tr></tbody></table></div></article>
      </div>
      <article class="card"><div class="card-head"><h2>各單位即時統計</h2><button class="btn btn-soft" id="exportBtn">匯出 CSV</button></div><div class="table-wrap"><table><thead><tr><th>單位</th><th>床數</th><th>住院</th><th>空床</th><th>超床</th><th>占床率</th><th>上班人力</th><th>護病比</th><th>病危</th><th>狀態</th></tr></thead><tbody id="unitTable"></tbody></table></div></article>
      <div class="dashboard-grid dashboard-section"><article class="card"><div class="card-head"><h2>各單位占床率</h2></div><div class="card-body"><div class="chart" id="occupancyChart"></div></div></article><article class="card"><div class="card-head"><h2>待完成填報</h2></div><div class="card-body"><div class="side-list" id="pendingList"></div></div></article></div>
      <article class="card dashboard-section"><div class="card-head"><div><h2>異常與漏填紀錄</h2><small style="color:var(--muted)">優先顯示過去未填寫、僅暫存及缺少必要欄位的資料</small></div><span class="status draft" id="alertCount">0 筆待處理</span></div><div class="table-wrap"><table><thead><tr><th>日期</th><th>班別</th><th>單位</th><th>異常類型</th><th>異常內容</th><th>處理狀態</th></tr></thead><tbody id="alertTable"></tbody></table></div></article>
      <article class="card dashboard-section"><div class="card-head"><h2>異常通報判定規則</h2></div><div class="card-body"><div class="formula">漏填異常：過去班別沒有紀錄、只有暫存、實際上班人力或必填事件欄位缺值。營運提醒：住院人數超過有效床數。住院人數與空床數由系統自動計算，不列為人工填報異常；數字 0 是有效資料，也不視為漏填。</div></div></article>
    </section>
<section id="connectionView" class="hidden"><article class="card"><div class="card-head"><h2>目前的資料來源</h2></div><div class="card-body"><div class="connection-grid"><div><small>現在的儲存位置</small><h3 id="currentStorage"></h3></div><div><small>資料連線</small><h3 id="backendConnectionLabel"></h3></div></div><p>目前帳號：<strong id="currentAccount"></strong></p><p>每個帳號有自己的練習工作區。示範模式只保存在目前瀏覽器，不會寫入 Supabase。</p><p>這是個人練習版，不提供病房共用填報與多人審核流程。請使用合成資料。</p></div></article><article class="card dashboard-section"><div class="card-head"><h2>最近操作紀錄</h2></div><div class="table-wrap"><table><thead><tr><th>時間</th><th>操作</th><th>對象</th></tr></thead><tbody id="practiceAudit"></tbody></table></div></article></section>
    <section id="bedsView" class="hidden">
      <article class="card"><div class="card-head"><h2>有效病床數管理</h2><button type="button" class="btn btn-soft" id="reloadBedSettings">重新整理床數</button></div><div class="card-body">
        <p>指定生效日期，N／D／E 三班一併套用；生效日期以前的報表母數維持不變。可選今天或未來日期。</p>
        <div id="bedSettingsFeedback" class="notice hidden" role="status"></div>
        <div id="bedSettingsContent" class="hidden">
          <div class="formula">目前全院有效病床數：<strong id="bedHospitalTotal">—</strong>（一般病房及特殊住院單位）。其他單位維持原有的參考床數或獨立統計用途。</div>
          <div id="bedUnitCards"></div>
        </div>
      </div></article>
    </section>
    <div class="footnote" id="storageFootnote"></div>
  </main>
  <dialog id="bedEditDialog" class="bed-edit-dialog" aria-labelledby="bedEditTitle">
    <div class="bed-edit-head"><div><h2 id="bedEditTitle">調整病床數</h2><p id="bedEditType"></p></div><button type="button" class="btn btn-soft" id="closeBedEdit" aria-label="關閉床數調整">關閉</button></div>
    <div class="bed-edit-layout">
      <form id="bedSettingsForm">
        <div class="bed-edit-context"><div><small>填報單位</small><strong id="bedUnitName">—</strong></div><div><small>目前床數</small><strong id="bedEditCurrent">—</strong></div></div>
        <div class="bed-edit-fields"><div class="field"><label for="bedEffectiveDate">生效日期</label><input id="bedEffectiveDate" type="date" max="2100-12-31" required></div><div class="field"><label>該日期原床數</label><strong id="bedOriginal">—</strong></div><div class="field"><label for="newBeds">調整後床數</label><input id="newBeds" type="number" min="0" max="9999" step="1" required></div></div>
        <div class="field"><label for="bedReason">調整原因（選填）</label><input id="bedReason" maxlength="400"></div>
        <p class="notice bed-warning">更改病床數將影響計算母數，請確認調整內容是否正確。生效日 N／D／E 三班共同套用，之前日期維持原母數；若有後續排定設定，依其日期接續套用。</p>
        <div id="bedEditFeedback" class="notice hidden" role="alert"></div>
        <div class="actions"><button type="button" class="btn btn-soft" id="cancelBedEdit">取消調整</button><button type="submit" class="btn btn-primary">核對調整內容</button></div>
      </form>
      <aside class="bed-edit-history" aria-label="本單位床數調整歷史">
        <h3>過去調整紀錄</h3><p id="bedHistoryNote" class="bed-history-note"></p><div id="bedUnitHistory" class="bed-history-list"></div>
        <h3>床數設定沿革</h3><p class="bed-history-note">依生效日期排列，包含原始基準及已排定設定。</p><div id="bedUnitTimeline" class="bed-history-list"></div>
      </aside>
    </div>
  </dialog>
  <dialog id="bedConfirmDialog" aria-labelledby="bedConfirmTitle"><form id="bedConfirmForm">
    <h2 id="bedConfirmTitle">確認調整病床數</h2>
    <p class="notice bed-warning"><strong>更改病床數將影響計算母數，請確認調整內容是否正確。</strong></p>
    <div id="bedConfirmSummary" class="formula bed-confirm-summary"></div>
    <p>請再次核對單位、床數與生效日期。確認內容有效時間為五分鐘。</p>
    <label class="bed-reviewed"><input id="bedReviewed" type="checkbox" required> 我已確認單位、生效日期及調整內容正確。</label>
    <div id="bedConfirmFeedback" class="notice hidden" role="alert"></div>
    <div class="actions"><button type="button" class="btn btn-soft" id="cancelBedConfirm">取消</button><button type="submit" class="btn btn-primary">確認並儲存床數</button></div>
  </form></dialog>
  <footer class="site-footer" aria-label="系統資訊與網站版本">
    <div class="footer-meta">
      <span id="appVersion"></span>
      <span class="footer-separator" aria-hidden="true">｜</span>
      <span id="connectionStatus" role="status" data-state="loading">連線中…</span>

    </div>
    <span id="versionStatus" role="status" aria-live="polite"></span>
  </footer>

  <div id="toast" class="toast hidden"></div>

  <dialog id="resetDemoDialog"><h2>重設本機示範資料？</h2><p>這會清除這個瀏覽器的示範修改，重新建立今天的合成範例。Supabase 資料不受影響。</p><div class="actions"><button id="cancelResetDemo" class="btn btn-soft">取消</button><button id="confirmResetDemo" class="btn btn-primary">重設示範</button></div></dialog>
<dialog id="leaveDialog"><h2>還有尚未儲存的內容</h2><p>返回入口會捨棄尚未儲存的修改。</p><div class="actions"><button id="cancelLeave" class="btn btn-soft">繼續編輯</button><button id="confirmLeave" class="btn btn-primary">返回入口</button></div></dialog>
<script type="module" src="/src/practice-main.js"></script>
</body>
</html>

```

## src/practice-api.js

### 修改前（完整）

```
import { newState, transact, taiwanDate } from './data-model.js';
import { units, operationalUnits, shifts, admissionFieldsByUnit } from './catalog.js';
const DEMO_KEY = 'nrop-practice-demo-v1';
let mode = null;
export function selectMode(value) { if (!['demo', 'sheets'].includes(value)) throw new Error('模式不正確'); mode = value; }
export function currentMode() { return mode; }
export const storageLabel = () => mode === 'sheets' ? 'Google 試算表' : '本機示範（不會寫入 Google）';
export async function connectionInfo() {
  const response = await fetch('/api/connection', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('資料服務目前無法使用，請稍後重試或確認網站設定。');
  return response.json();
}
function seed() {
  let state = newState(); const d = taiwanDate();
  units.forEach((u, i) => {
    state = transact(state, 'nrop_set_opening', { p_unit: u.id, p_date: d, p_shift: 'N', p_patients: Math.floor(u.beds * 0.65) }).state;
    shifts.forEach((s, j) => {
      const payload = { staff: 4 + i % 5, 住院: j === 1 ? 2 : 0, 出院: j === 2 ? 1 : 0, 轉入: 0, 轉出: 0, 病危: i % 3, 死亡: 0 };
      const split = admissionFieldsByUnit[u.id]; if (split) { payload[split[0][0]] = payload.住院; payload[split[1][0]] = 0; }
      state = transact(state, 'nrop_save_record', { p_unit: u.id, p_date: d, p_shift: s, p_payload: payload, p_status: 'submitted', p_version: 0 }).state;
    });
  });
  operationalUnits.forEach(u => shifts.forEach(s => {
    const payload = Object.fromEntries(u.fields.map(([f]) => [f, 0])); payload.staff = 5;
    if (u.type === 'nursingHome') { payload.nurseStaff = 3; payload.aideStaff = 4; payload.residents = 22; }
    state = transact(state, 'nrop_save_record', { p_unit: u.id, p_date: d, p_shift: s, p_payload: payload, p_status: 'submitted', p_version: 0 }).state;
  })); state.audit = []; return state;
}
export async function rpc(method, params = {}) {
  if (!mode) throw new Error('請先選擇練習模式');
  if (mode === 'demo') {
    if (!navigator.locks) throw new Error('請使用支援 Web Locks 的新版瀏覽器');
    return navigator.locks.request(DEMO_KEY, () => {
      const raw = localStorage.getItem(DEMO_KEY); let state;
      try { state = raw ? JSON.parse(raw) : seed(); } catch { throw new Error('示範資料無法讀取，請從入口重設示範資料。'); }
      const result = transact(state, method, { ...params, p_requestId: crypto.randomUUID() });
      localStorage.setItem(DEMO_KEY, JSON.stringify(result.state)); return result.data;
    });
  }
  const response = await fetch('/api/nrop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, params }), signal: AbortSignal.timeout(50000) });
  const result = await response.json();
  if (result.error) throw Object.assign(new Error(result.error.message), { code: result.error.code });
  if (!response.ok) throw new Error('Google 試算表讀寫失敗'); return result.data;
}
export async function resetDemo() { await navigator.locks.request(DEMO_KEY, () => localStorage.removeItem(DEMO_KEY)); }
export function errorMessage(error) {
  if (/fetch|NetworkError|timeout|aborted/i.test(error?.message || '')) return '連線逾時或中斷，請重新整理確認儲存結果；系統不會自動切換資料來源。';
  return error?.message || '操作失敗，請稍後重試';
}

```

### 修改後（完整）

```
import { newState, transact, taiwanDate } from './data-model.js';
import { units, operationalUnits, shifts, admissionFieldsByUnit } from './catalog.js';
import {accessToken} from './supabase-auth.js';
const DEMO_KEY = 'nrop-practice-demo-v1';
let mode = null;
export function selectMode(value) { if (!['demo', 'supabase'].includes(value)) throw new Error('模式不正確'); mode = value; }
export function currentMode() { return mode; }
export const storageLabel = () => mode === 'supabase' ? 'Supabase' : '本機示範（不會寫入雲端）';
export async function connectionInfo() {
  const response = await fetch('/api/connection', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('資料服務目前無法使用，請稍後重試或確認網站設定。');
  return response.json();
}
function seed() {
  let state = newState(); const d = taiwanDate();
  units.forEach((u, i) => {
    state = transact(state, 'nrop_set_opening', { p_unit: u.id, p_date: d, p_shift: 'N', p_patients: Math.floor(u.beds * 0.65) }).state;
    shifts.forEach((s, j) => {
      const payload = { staff: 4 + i % 5, 住院: j === 1 ? 2 : 0, 出院: j === 2 ? 1 : 0, 轉入: 0, 轉出: 0, 病危: i % 3, 死亡: 0 };
      const split = admissionFieldsByUnit[u.id]; if (split) { payload[split[0][0]] = payload.住院; payload[split[1][0]] = 0; }
      state = transact(state, 'nrop_save_record', { p_unit: u.id, p_date: d, p_shift: s, p_payload: payload, p_status: 'submitted', p_version: 0 }).state;
    });
  });
  operationalUnits.forEach(u => shifts.forEach(s => {
    const payload = Object.fromEntries(u.fields.map(([f]) => [f, 0])); payload.staff = 5;
    if (u.type === 'nursingHome') { payload.nurseStaff = 3; payload.aideStaff = 4; payload.residents = 22; }
    state = transact(state, 'nrop_save_record', { p_unit: u.id, p_date: d, p_shift: s, p_payload: payload, p_status: 'submitted', p_version: 0 }).state;
  })); state.audit = []; return state;
}
export async function rpc(method, params = {}) {
  if (!mode) throw new Error('請先選擇練習模式');
  if (mode === 'demo') {
    if (!navigator.locks) throw new Error('請使用支援 Web Locks 的新版瀏覽器');
    return navigator.locks.request(DEMO_KEY, () => {
      const raw = localStorage.getItem(DEMO_KEY); let state;
      try { state = raw ? JSON.parse(raw) : seed(); } catch { throw new Error('示範資料無法讀取，請從入口重設示範資料。'); }
      const result = transact(state, method, { ...params, p_requestId: crypto.randomUUID() });
      localStorage.setItem(DEMO_KEY, JSON.stringify(result.state)); return result.data;
    });
  }
  const response = await fetch('/api/nrop', { method: 'POST', headers: { 'Content-Type': 'application/json',Authorization:'Bearer '+await accessToken() }, body: JSON.stringify({ method, params }), signal: AbortSignal.timeout(50000) });
  const result = await response.json();
  if (result.error) throw Object.assign(new Error(result.error.message), { code: result.error.code });
  if (!response.ok) throw new Error('Supabase 讀寫失敗'); return result.data;
}
export async function resetDemo() { await navigator.locks.request(DEMO_KEY, () => localStorage.removeItem(DEMO_KEY)); }
export function errorMessage(error) {
  if (/Invalid login credentials/i.test(error?.message||'')) return '信箱或密碼不正確，請確認後再登入。';
  if (/Email not confirmed/i.test(error?.message||'')) return '信箱尚未確認，請先開啟註冊確認信。';
  if (/rate limit/i.test(error?.message||'')) return '寄信或登入次數已達暫時限制，請稍後再試。';
  if (/fetch|NetworkError|timeout|aborted/i.test(error?.message || '')) return '連線逾時或中斷，請重新整理確認儲存結果；系統不會自動切換資料來源。';
  return error?.message || '操作失敗，請稍後重試';
}

```

## src/practice-main.js

### 修改前（完整）

```
import { rpc, selectMode, currentMode, storageLabel, connectionInfo, resetDemo, errorMessage } from './practice-api.js';
import { units, operationalUnits, allLoginUnits } from './catalog.js';
import { RecordStore, dateOffset, escapeHtml as esc } from './record-store.js';
import { $, $$, today } from './dom.js';
import { createReporting } from './report-renderers.js';
import { createEditGuard } from './app-version.js';
import { createBedManagement } from './bed-management.js';
let session = null, config = null, busy = false, loading = false, info = null;
const reportFields = '#staff,#openingPatients,.event-input,.special-input';
const store = new RecordStore(rpc, new Set(operationalUnits.map(u => u.id)));
const reporting = createReporting({ store, persistRecord, alertFrom });
const edits = createEditGuard(document);
const beds = createBedManagement({ getSession: () => session, isEnabled: () => !!config?.bedCapacityManagement, rpc,
  confirmChange: ({ requestId }) => rpc('nrop_confirm_bed_change', { p_request: requestId }), errorMessage,
  onBusy: syncControls, onRendered: () => edits.capture('beds', '#bedSettingsForm input,#bedSettingsForm select'),
  onSaved: async () => { await loadConfig(); await refreshData(); } });
const feedback = (selector, message, error = false) => { const el = $(selector); el.textContent = message; el.classList.toggle('hidden', !message); el.classList.toggle('error', error); };
function toast(message) { feedback('#toast', message); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 4500); }
function renderReporting() { reporting.render(session); edits.capture('report', reportFields); }
function setDates(d) { ['#entryDate', '#specialDate', '#dashboardDate'].forEach(id => $(id).value = d); }
function alertFrom() { const d = $('#dashboardDate').value, start = [dateOffset(d, -30), config?.recordStartDate || d].sort().at(-1); return start > d ? d : start; }
function syncControls() {
  const disabled = busy || loading || beds.isBusy();
  ['#saveDraft', '#submitRecord', '#saveSpecialDraft', '#submitSpecialRecord', '#setOpening', '#entryDate', '#entryShift', '#specialDate', '#specialShift', '#dashboardDate', '#dashboardShift', '#refreshData', '#logoutBtn'].forEach(id => $(id).disabled = disabled);
  $$('[data-unit-picker],' + reportFields).forEach(input => input.disabled = disabled);
}
function renderUnitControls() {
  for (const type of ['entry', 'special']) {
    const container = $('#' + type + 'UnitControl'); container.replaceChildren();
    const select = document.createElement('select'); select.dataset.unitPicker = ''; select.setAttribute('aria-labelledby', type + 'UnitLabel');
    for (const u of config.units) { const option = document.createElement('option'); option.value = u.id; option.textContent = u.id; select.append(option); }
    select.value = session.unit; select.onchange = () => { if (busy || loading) return; session.unit = select.value; renderUnitControls(); renderReporting(); }; container.append(select);
  }
}
async function loadConfig() {
  config = await rpc('nrop_public_config'); if (!config?.units?.length) throw new Error('試算表尚未初始化，請先執行 Apps Script 的 setup。');
  store.capacitiesEnabled = !!config.bedCapacityManagement;
  for (const u of config.units) { const local = allLoginUnits.find(x => x.id === u.id); if (local) local.beds = u.beds; }
}
function showView(view) {
  ['entry', 'dashboard', 'connection', 'beds'].forEach(name => $('#' + name + 'View').classList.toggle('hidden', view !== name));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  $('#pageTitle').textContent = { entry: '單位每日填報', dashboard: '管理儀表板', connection: '資料連線', beds: '有效病床數管理' }[view];
  $('#pageSubtitle').textContent = view === 'connection' ? '查看目前的儲存位置與設定步驟。' : 'NROP 練習工作區・依單位與班別整理每一天的動態';
  if (view === 'beds') void beds.load(); if (view === 'connection') void showConnection();
}
async function refreshData() {
  if (!session || loading) return false;
  const view = $('.tab.active')?.dataset.view || 'entry'; loading = true; syncControls(); feedback('#appError', '');
  $('#syncStatus').textContent = '讀取中…'; $('#entryView').classList.add('hidden'); $('#dashboardView').classList.add('hidden');
  try {
    const d = $('#dashboardDate').value; if (!await store.load([alertFrom(), dateOffset(d, -1)].sort()[0], d)) return false;
    renderReporting(); showView(view); $('#syncStatus').textContent = storageLabel() + '・更新於 ' + new Date().toLocaleTimeString('zh-TW');
    $('#connectionStatus').textContent = currentMode() === 'sheets' ? 'Google 試算表連線可用' : '本機示範模式'; $('#connectionStatus').dataset.state = 'ready'; return true;
  } catch (e) {
    feedback('#appError', errorMessage(e), true); $('#syncStatus').textContent = '讀取失敗，請重新整理'; $('#connectionStatus').textContent = '讀取異常'; $('#connectionStatus').dataset.state = 'error';
    $('#entryView').classList.add('hidden'); $('#dashboardView').classList.add('hidden'); return false;
  } finally { loading = false; syncControls(); }
}
async function persistRecord(status, payload, special) {
  if (busy || loading || !session) return false; busy = true; syncControls(); feedback('#appError', '');
  const d = $(special ? '#specialDate' : '#entryDate').value, shift = $(special ? '#specialShift' : '#entryShift').value;
  const version = store.get()[`${special ? 'OPS|' : ''}${d}|${shift}|${session.unit}`]?.version || 0;
  try {
    await rpc('nrop_save_record', { p_date: d, p_shift: shift, p_unit: session.unit, p_payload: payload, p_status: status, p_version: version }); edits.capture('report', reportFields);
    toast(await refreshData() ? (status === 'draft' ? '已暫存至 ' : '已送出至 ') + storageLabel() : '資料已儲存，請重新整理確認'); return true;
  } catch (e) { feedback('#appError', errorMessage(e), true); return false; } finally { busy = false; syncControls(); }
}
async function enter(mode) {
  const buttons = $$('#enterSheets,#enterDemo'); buttons.forEach(b => b.disabled = true); feedback('#authMessage', '');
  try {
    selectMode(mode); await loadConfig(); session = { userId: 'practice', name: '練習使用者', role: 'sysadmin', unit: units[0].id };
    renderUnitControls(); setDates(today()); if (!await refreshData()) throw new Error($('#appError').textContent);
    $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); $('#sessionArea').hidden = false;
    $('#userChip').textContent = mode === 'sheets' ? 'Google 試算表練習' : '本機示範';
    $('#modeBanner').textContent = mode === 'sheets' ? 'Google 試算表模式・儲存會寫入你的練習表。' : '本機示範模式・合成範例與修改僅保存在這個瀏覽器，不會寫入 Google 試算表。';
    $('#storageFootnote').textContent = '儲存位置：' + storageLabel() + ' · 人力可填至小數點第三位';
  } catch (e) { session = null; store.clear(); feedback('#authMessage', errorMessage(e), true); }
  finally { buttons.forEach(b => b.disabled = b.id === 'enterSheets' && !info?.configured); }
}
async function showConnection() {
  try { info = await connectionInfo(); $('#sheetConnectionLabel').textContent = info.configured ? '已設定讀寫服務' : '尚未設定 Apps Script'; } catch (e) { $('#sheetConnectionLabel').textContent = errorMessage(e); }
  $('#currentStorage').textContent = storageLabel(); const link = $('#sheetLink'); link.hidden = !/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(info?.spreadsheetUrl || ''); if (!link.hidden) link.href = info.spreadsheetUrl;
  try {
    const rows = await rpc('nrop_admin_audit'); $('#practiceAudit').innerHTML = rows.length ? rows.map(a => `<tr><td>${esc(new Date(a.created_at).toLocaleString('zh-TW'))}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td></tr>`).join('') : '<tr><td colspan="3">目前沒有操作紀錄</td></tr>';
  } catch (e) { $('#practiceAudit').textContent = errorMessage(e); }
}
$('#enterDemo').onclick = () => void enter('demo'); $('#enterSheets').onclick = () => void enter('sheets');
$('#resetDemo').onclick = () => $('#resetDemoDialog').showModal(); $('#cancelResetDemo').onclick = () => $('#resetDemoDialog').close();
$('#confirmResetDemo').onclick = async () => { try { await resetDemo(); $('#resetDemoDialog').close(); feedback('#authMessage', '本機示範已重設，再次進入即可載入今天的合成範例。'); } catch (e) { feedback('#authMessage', errorMessage(e), true); } };
$('#logoutBtn').onclick = () => { if (edits.hasChanges()) { $('#leaveDialog').showModal(); return; } leave(); };
function leave() { session = null; store.clear(); beds.clear(); edits.reset(); reporting.clear(); $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); $('#sessionArea').hidden = true; $('#connectionStatus').textContent = '練習入口'; }
$('#cancelLeave').onclick = () => $('#leaveDialog').close(); $('#confirmLeave').onclick = () => { $('#leaveDialog').close(); leave(); };
$$('.tab').forEach(b => b.onclick = () => { if (!busy && !loading && !beds.isBusy()) showView(b.dataset.view); });
['#entryDate', '#specialDate', '#dashboardDate'].forEach(id => { $(id).value = today(); $(id).max = today(); $(id).onchange = async () => { if (!$(id).value || !$(id).reportValidity()) return; setDates($(id).value); await refreshData(); }; });
['#entryShift', '#specialShift', '#dashboardShift'].forEach(id => $(id).onchange = () => { $('#entryShift').value = $(id).value; $('#specialShift').value = $(id).value; renderReporting(); });
$('#refreshData').onclick = () => void refreshData();
$('#setOpening').onclick = async () => {
  if (!$('#openingPatients').reportValidity() || busy || loading) return; busy = true; syncControls();
  try { await rpc('nrop_set_opening', { p_unit: session.unit, p_date: $('#entryDate').value, p_shift: $('#entryShift').value, p_patients: Number($('#openingPatients').value) }); await refreshData(); toast('期初住院人數已儲存'); }
  catch (e) { feedback('#appError', errorMessage(e), true); } finally { busy = false; syncControls(); }
};
window.addEventListener('beforeunload', e => { if (session && edits.hasChanges()) { e.preventDefault(); e.returnValue = ''; } });
$('#appVersion').textContent = 'NROP 練習模板 0.1';
(async () => {
  try { info = await connectionInfo(); $('#enterSheets').disabled = !info.configured; $('#setupStatus').textContent = info.configured ? '已設定 Google 讀寫服務，可開始連線練習。' : '完成 Apps Script 設定後，就能在這裡連線儲存。'; } catch (e) { $('#setupStatus').textContent = errorMessage(e); }
  $('#connectionStatus').textContent = '練習入口';
})();

```

### 修改後（完整）

```
import { rpc, selectMode, currentMode, storageLabel, connectionInfo, resetDemo, errorMessage } from './practice-api.js';
import { units, operationalUnits, allLoginUnits } from './catalog.js';
import { RecordStore, dateOffset, escapeHtml as esc } from './record-store.js';
import { $, $$, today } from './dom.js';
import { createReporting } from './report-renderers.js';
import { createEditGuard } from './app-version.js';
import { createBedManagement } from './bed-management.js';
import {configureAuth,authClient,currentUser} from './supabase-auth.js';
let session = null, config = null, busy = false, loading = false, info = null;
const reportFields = '#staff,#openingPatients,.event-input,.special-input';
const store = new RecordStore(rpc, new Set(operationalUnits.map(u => u.id)));
const reporting = createReporting({ store, persistRecord, alertFrom });
const edits = createEditGuard(document);
const beds = createBedManagement({ getSession: () => session, isEnabled: () => !!config?.bedCapacityManagement, rpc,
  confirmChange: ({ requestId }) => rpc('nrop_confirm_bed_change', { p_request: requestId }), errorMessage,
  onBusy: syncControls, onRendered: () => edits.capture('beds', '#bedSettingsForm input,#bedSettingsForm select'),
  onSaved: async () => { await loadConfig(); await refreshData(); } });
const feedback = (selector, message, error = false) => { const el = $(selector); el.textContent = message; el.classList.toggle('hidden', !message); el.classList.toggle('error', error); };
function toast(message) { feedback('#toast', message); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => $('#toast').classList.add('hidden'), 4500); }
function renderReporting() { reporting.render(session); edits.capture('report', reportFields); }
function setDates(d) { ['#entryDate', '#specialDate', '#dashboardDate'].forEach(id => $(id).value = d); }
function alertFrom() { const d = $('#dashboardDate').value, start = [dateOffset(d, -30), config?.recordStartDate || d].sort().at(-1); return start > d ? d : start; }
function syncControls() {
  const disabled = busy || loading || beds.isBusy();
  ['#saveDraft', '#submitRecord', '#saveSpecialDraft', '#submitSpecialRecord', '#setOpening', '#entryDate', '#entryShift', '#specialDate', '#specialShift', '#dashboardDate', '#dashboardShift', '#refreshData', '#logoutBtn'].forEach(id => $(id).disabled = disabled);
  $$('[data-unit-picker],' + reportFields).forEach(input => input.disabled = disabled);
}
function renderUnitControls() {
  for (const type of ['entry', 'special']) {
    const container = $('#' + type + 'UnitControl'); container.replaceChildren();
    const select = document.createElement('select'); select.dataset.unitPicker = ''; select.setAttribute('aria-labelledby', type + 'UnitLabel');
    for (const u of config.units) { const option = document.createElement('option'); option.value = u.id; option.textContent = u.id; select.append(option); }
    select.value = session.unit; select.onchange = () => { if (busy || loading) return; session.unit = select.value; renderUnitControls(); renderReporting(); }; container.append(select);
  }
}
async function loadConfig() {
  config = await rpc('nrop_public_config'); if (!config?.units?.length) throw new Error('Supabase 尚未初始化，請確認資料庫設定。');
  store.capacitiesEnabled = !!config.bedCapacityManagement;
  for (const u of config.units) { const local = allLoginUnits.find(x => x.id === u.id); if (local) local.beds = u.beds; }
}
function showView(view) {
  ['entry', 'dashboard', 'connection', 'beds'].forEach(name => $('#' + name + 'View').classList.toggle('hidden', view !== name));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  $('#pageTitle').textContent = { entry: '單位每日填報', dashboard: '管理儀表板', connection: '資料連線', beds: '有效病床數管理' }[view];
  $('#pageSubtitle').textContent = view === 'connection' ? '查看目前的儲存位置與設定步驟。' : 'NROP 練習工作區・依單位與班別整理每一天的動態';
  if (view === 'beds') void beds.load(); if (view === 'connection') void showConnection();
}
async function refreshData() {
  if (!session || loading) return false;
  const view = $('.tab.active')?.dataset.view || 'entry'; loading = true; syncControls(); feedback('#appError', '');
  $('#syncStatus').textContent = '讀取中…'; $('#entryView').classList.add('hidden'); $('#dashboardView').classList.add('hidden');
  try {
    const d = $('#dashboardDate').value; if (!await store.load([alertFrom(), dateOffset(d, -1)].sort()[0], d)) return false;
    renderReporting(); showView(view); $('#syncStatus').textContent = storageLabel() + '・更新於 ' + new Date().toLocaleTimeString('zh-TW');
    $('#connectionStatus').textContent = currentMode() === 'supabase' ? 'Supabase 連線可用' : '本機示範模式'; $('#connectionStatus').dataset.state = 'ready'; return true;
  } catch (e) {
    feedback('#appError', errorMessage(e), true); $('#syncStatus').textContent = '讀取失敗，請重新整理'; $('#connectionStatus').textContent = '讀取異常'; $('#connectionStatus').dataset.state = 'error';
    $('#entryView').classList.add('hidden'); $('#dashboardView').classList.add('hidden'); return false;
  } finally { loading = false; syncControls(); }
}
async function persistRecord(status, payload, special) {
  if (busy || loading || !session) return false; busy = true; syncControls(); feedback('#appError', '');
  const d = $(special ? '#specialDate' : '#entryDate').value, shift = $(special ? '#specialShift' : '#entryShift').value;
  const version = store.get()[`${special ? 'OPS|' : ''}${d}|${shift}|${session.unit}`]?.version || 0;
  try {
    await rpc('nrop_save_record', { p_date: d, p_shift: shift, p_unit: session.unit, p_payload: payload, p_status: status, p_version: version }); edits.capture('report', reportFields);
    toast(await refreshData() ? (status === 'draft' ? '已暫存至 ' : '已送出至 ') + storageLabel() : '資料已儲存，請重新整理確認'); return true;
  } catch (e) { feedback('#appError', errorMessage(e), true); return false; } finally { busy = false; syncControls(); }
}
async function enter(mode) {
  const buttons = $$('#signIn,#signUp,#resumeSupabase,#enterDemo'); buttons.forEach(b => b.disabled = true); feedback('#authMessage', '');
  try {
    const user=mode==='supabase'?await currentUser():null;if(mode==='supabase'&&!user)throw new Error('請先登入 Supabase 練習帳號。');
    selectMode(mode); await loadConfig(); session = { userId: user?.id||'practice', name: user?.email||'練習使用者', role: 'sysadmin', unit: units[0].id };
    renderUnitControls(); setDates(today()); if (!await refreshData()) throw new Error($('#appError').textContent);
    $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); $('#sessionArea').hidden = false;
    $('#userChip').textContent = mode === 'supabase' ? session.name : '本機示範';
    $('#modeBanner').textContent = mode === 'supabase' ? 'Supabase 模式・資料保存在目前登入帳號的練習工作區。' : '本機示範模式・合成範例與修改僅保存在這個瀏覽器，不會寫入雲端。';
    $('#logoutBtn').textContent=mode==='supabase'?'登出':'返回入口';
    $('#storageFootnote').textContent = '儲存位置：' + storageLabel() + ' · 人力可填至小數點第三位';
  } catch (e) { session = null; store.clear(); feedback('#authMessage', errorMessage(e), true); }
  finally { buttons.forEach(b => b.disabled = b.id!=='enterDemo' && !info?.configured); }
}
async function showConnection() {
  try { info = await connectionInfo(); $('#backendConnectionLabel').textContent = info.configured ? 'Supabase 已設定' : 'Supabase 尚未設定'; } catch (e) { $('#backendConnectionLabel').textContent = errorMessage(e); }
  $('#currentStorage').textContent = storageLabel();$('#currentAccount').textContent=currentMode()==='supabase'?session.name:'本機示範';
  try {
    const rows = await rpc('nrop_admin_audit'); $('#practiceAudit').innerHTML = rows.length ? rows.map(a => `<tr><td>${esc(new Date(a.created_at).toLocaleString('zh-TW'))}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td></tr>`).join('') : '<tr><td colspan="3">目前沒有操作紀錄</td></tr>';
  } catch (e) { $('#practiceAudit').textContent = errorMessage(e); }
}
$('#enterDemo').onclick = () => void enter('demo'); $('#resumeSupabase').onclick = () => void enter('supabase');
async function syncAuthUi(){const user=info?.configured?await currentUser():null;$('#supabaseLoginForm').hidden=!info?.configured||!!user;$('#resumeSupabase').hidden=!user;$('#signOutAccount').hidden=!user;if(user)$('#resumeSupabase').textContent='繼續使用 '+user.email;}
$('#supabaseLoginForm').onsubmit=async event=>{event.preventDefault();$('#signIn').disabled=true;feedback('#authMessage','登入中…');try{const{error}=await authClient().auth.signInWithPassword({email:$('#authEmail').value.trim(),password:$('#authPassword').value});if(error)throw error;$('#authPassword').value='';await syncAuthUi();await enter('supabase');}catch(e){feedback('#authMessage',errorMessage(e),true);}finally{$('#signIn').disabled=false;}};
$('#signUp').onclick=async()=>{if(!$('#supabaseLoginForm').reportValidity())return;$('#signUp').disabled=true;feedback('#authMessage','建立帳號中…');try{const{data,error}=await authClient().auth.signUp({email:$('#authEmail').value.trim(),password:$('#authPassword').value,options:{emailRedirectTo:location.origin+'/'}});if(error)throw error;$('#authPassword').value='';if(data.session){await syncAuthUi();await enter('supabase');}else feedback('#authMessage','已送出註冊申請。請到信箱完成確認，再返回登入；若已有帳號，請直接登入。');}catch(e){feedback('#authMessage',errorMessage(e),true);}finally{$('#signUp').disabled=false;}};
async function signOut(){const{error}=await authClient().auth.signOut({scope:'local'});if(error)throw error;leave();await syncAuthUi();}
$('#signOutAccount').onclick=()=>void signOut().catch(e=>feedback('#authMessage',errorMessage(e),true));
$('#resetDemo').onclick = () => $('#resetDemoDialog').showModal(); $('#cancelResetDemo').onclick = () => $('#resetDemoDialog').close();
$('#confirmResetDemo').onclick = async () => { try { await resetDemo(); $('#resetDemoDialog').close(); feedback('#authMessage', '本機示範已重設，再次進入即可載入今天的合成範例。'); } catch (e) { feedback('#authMessage', errorMessage(e), true); } };
$('#logoutBtn').onclick = () => { if (edits.hasChanges()) { $('#leaveDialog').showModal(); return; } if(currentMode()==='supabase')void signOut().catch(e=>feedback('#appError',errorMessage(e),true));else leave(); };
function leave() { session = null; store.clear(); beds.clear(); edits.reset(); reporting.clear(); $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden'); $('#sessionArea').hidden = true; $('#connectionStatus').textContent = '練習入口'; }
$('#cancelLeave').onclick = () => $('#leaveDialog').close(); $('#confirmLeave').onclick = () => { $('#leaveDialog').close(); if(currentMode()==='supabase')void signOut().catch(e=>feedback('#appError',errorMessage(e),true));else leave(); };
$$('.tab').forEach(b => b.onclick = () => { if (!busy && !loading && !beds.isBusy()) showView(b.dataset.view); });
['#entryDate', '#specialDate', '#dashboardDate'].forEach(id => { $(id).value = today(); $(id).max = today(); $(id).onchange = async () => { if (!$(id).value || !$(id).reportValidity()) return; setDates($(id).value); await refreshData(); }; });
['#entryShift', '#specialShift', '#dashboardShift'].forEach(id => $(id).onchange = () => { $('#entryShift').value = $(id).value; $('#specialShift').value = $(id).value; renderReporting(); });
$('#refreshData').onclick = () => void refreshData();
$('#setOpening').onclick = async () => {
  if (!$('#openingPatients').reportValidity() || busy || loading) return; busy = true; syncControls();
  try { await rpc('nrop_set_opening', { p_unit: session.unit, p_date: $('#entryDate').value, p_shift: $('#entryShift').value, p_patients: Number($('#openingPatients').value) }); await refreshData(); toast('期初住院人數已儲存'); }
  catch (e) { feedback('#appError', errorMessage(e), true); } finally { busy = false; syncControls(); }
};
window.addEventListener('beforeunload', e => { if (session && edits.hasChanges()) { e.preventDefault(); e.returnValue = ''; } });
$('#appVersion').textContent = 'NROP 練習模板 0.2・Supabase';
(async () => {
  try { info = await connectionInfo();configureAuth(info);$('#setupStatus').textContent = info.configured ? '登入後即可儲存到自己的 Supabase 練習工作區。' : 'Supabase 尚未設定，仍可使用本機示範。';await syncAuthUi();if(info.configured)authClient().auth.onAuthStateChange(event=>{setTimeout(()=>{if(event==='SIGNED_OUT')leave();if(event==='SIGNED_OUT'||event==='SIGNED_IN')void syncAuthUi();},0);}); } catch (e) { $('#setupStatus').textContent = errorMessage(e); }
  $('#connectionStatus').textContent = '練習入口';
})();

```

## server/start.mjs

### 修改前（完整）

```
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { loadEnvFile } from 'node:process';
import { nropMiddleware } from './sheets-api.mjs';
try { loadEnvFile('.env.local'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const root = resolve('dist'), port = Number(process.env.PORT || 4178);
const api = nropMiddleware(process.env);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer((req, res) => api(req, res, async () => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname === '/' ? '/index.html' : new URL(req.url, 'http://local').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); res.end(content);
  } catch { res.writeHead(404); res.end('找不到檔案，請先執行 npm run build'); }
})).listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + port));

```

### 修改後（完整）

```
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { loadEnvFile } from 'node:process';
import { nropMiddleware } from './api.mjs';
try { loadEnvFile('.env.local'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const root = resolve('dist'), port = Number(process.env.PORT || 4178);
const api = nropMiddleware(process.env);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer((req, res) => api(req, res, async () => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname === '/' ? '/index.html' : new URL(req.url, 'http://local').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); res.end(content);
  } catch { res.writeHead(404); res.end('找不到檔案，請先執行 npm run build'); }
})).listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + port));

```

## vite.config.js

### 修改前（完整）

```
import { defineConfig, loadEnv } from 'vite';
import { nropMiddleware } from './server/sheets-api.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [{
    name: 'nrop-sheets-local-api',
    configureServer(server) { server.middlewares.use(nropMiddleware(loadEnv(mode, process.cwd(), ''))); }
  }],
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  build: { outDir: 'dist' }
}));

```

### 修改後（完整）

```
import { defineConfig, loadEnv } from 'vite';
import { nropMiddleware } from './server/api.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [{
    name: 'nrop-supabase-api',
    configureServer(server) { server.middlewares.use(nropMiddleware(loadEnv(mode, process.cwd(), ''))); }
  }],
  server: { host: '127.0.0.1', port: 5178, strictPort: true },
  build: { outDir: 'dist' }
}));

```

## package.json

### 修改前（完整）

```
{
  "name": "nrop-sheets-practice",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.19"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "node scripts/build-apps-script.mjs && vite build",
    "start": "node server/start.mjs",
    "test": "node --test",
    "changes": "node scripts/write-change-guide.mjs"
  },
  "devDependencies": {
    "vite": "7.3.7"
  }
}

```

### 修改後（完整）

```
{
  "name": "nrop-supabase-practice",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "node scripts/build-supabase-sql.mjs && vite build",
    "start": "node server/start.mjs",
    "test": "node scripts/run-tests.mjs",
    "changes": "node scripts/write-supabase-guide.mjs"
  },
  "devDependencies": {
    "@electric-sql/pglite": "0.5.16",
    "vite": "7.3.7"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.119.0"
  }
}

```

## sites/nrop-practice/scripts/build-worker.mjs

### 修改前（完整）

```
import {build} from 'vite';
import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
const root=resolve('.');
await build({root,configFile:false,build:{outDir:'.frontend',emptyOutDir:true}});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const assets={};
async function scan(dir,base=''){for(const f of await readdir(dir,{withFileTypes:true})){const name=base+'/'+f.name,p=join(dir,f.name);if(f.isDirectory())await scan(p,name);else assets[name]={type:mime[extname(f.name)]||'application/octet-stream',data:(await readFile(p)).toString('base64')};}}
await scan(join(root,'.frontend'));
const code=await readFile('server/worker.mjs','utf8');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',code+'\nconst assets='+JSON.stringify(assets)+';\nexport default {fetch(request,env){return handleRequest(request,env,assets);}};\n');
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker 已包含前端與受保護的 Google 讀寫服務，未嵌入環境變數。');

```

### 修改後（完整）

```
import {build} from 'vite';
import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,extname,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
await build({root,configFile:false,build:{outDir:'.frontend',emptyOutDir:true}});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const assets={};
async function scan(dir,base=''){for(const f of await readdir(dir,{withFileTypes:true})){const name=base+'/'+f.name,p=join(dir,f.name);if(f.isDirectory())await scan(p,name);else assets[name]={type:mime[extname(f.name)]||'application/octet-stream',data:(await readFile(p)).toString('base64')};}}
await scan(join(root,'.frontend'));
await mkdir('.sites-runtime',{recursive:true});
await writeFile('.sites-runtime/worker-entry.mjs',"import{handleRequest}from'../server/worker.mjs';\nconst assets="+JSON.stringify(assets)+';\nexport default {fetch(request,env){return handleRequest(request,env,assets);}};\n');
await build({root,configFile:false,ssr:{target:'webworker',noExternal:true},build:{ssr:resolve('.sites-runtime/worker-entry.mjs'),outDir:'dist',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'server/index.js',format:'es'}}}});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker 已包含前端與 Supabase API，登入權限由 Supabase Auth／RLS 驗證。');

```

## 新增 src/supabase-auth.js（完整）

```
import{createClient}from'@supabase/supabase-js';
let client,clientConfig;
export function configureAuth(info){
 if(!info.configured)return null;
 const key=info.supabaseUrl+'|'+info.supabasePublishableKey;
 if(client&&clientConfig===key)return client;
 clientConfig=key;client=createClient(info.supabaseUrl,info.supabasePublishableKey,{auth:{persistSession:true,storage:window.sessionStorage,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
 return client;
}
export function authClient(){if(!client)throw new Error('Supabase 尚未設定');return client;}
export async function currentUser(){const{data,error}=await authClient().auth.getSession();if(error)throw error;return data.session?.user||null;}
export async function accessToken(){const{data,error}=await authClient().auth.getSession();if(error||!data.session)throw new Error('請先登入 Supabase 練習帳號。');return data.session.access_token;}

```

## 新增 server/supabase-api.mjs（完整）

```
import {transact} from '../src/data-model.js';
export const methods=new Set(['nrop_public_config','nrop_list_records','nrop_list_openings','nrop_save_record','nrop_set_opening','nrop_list_bed_capacities','nrop_admin_bed_settings','nrop_prepare_bed_change','nrop_confirm_bed_change','nrop_admin_audit']);
const mutations=new Set(['nrop_save_record','nrop_set_opening','nrop_prepare_bed_change','nrop_confirm_bed_change']);
export function supabaseConfig(env){
 const url=(env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL||env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
 const key=env.SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)&&key.startsWith('sb_publishable_');
 return{configured,provider:'supabase',...(configured?{supabaseUrl:url,supabasePublishableKey:key}:{})};
}
export function json(status,value){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function readInput(request){
 if(Number(request.headers.get('content-length'))>32000)throw new RangeError('資料超過大小限制');
 const reader=request.body?.getReader();if(!reader)return{};const chunks=[];let total=0;
 while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>32000){await reader.cancel();throw new RangeError('資料超過大小限制');}chunks.push(value);}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleApiRequest(request,env,remoteFetch=fetch){
 const url=new URL(request.url),path=url.pathname,cfg=supabaseConfig(env);
 if(path==='/api/connection'&&request.method==='GET')return json(200,cfg);
 if(path!=='/api/nrop')return json(404,{error:{message:'找不到資料服務'}});
 if(request.method!=='POST')return json(405,{error:{message:'不支援的請求方法'}});
 if(request.headers.get('origin')!==url.origin)return json(403,{error:{message:'僅允許本站操作'}});
 if(!cfg.configured)return json(503,{error:{message:'Supabase 尚未完成連線設定。'}});
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization))return json(401,{error:{message:'請先登入 Supabase 練習帳號。',code:'AUTH_REQUIRED'}});
 let input;try{input=await readInput(request);}catch(e){return json(e instanceof RangeError?413:400,{error:{message:e instanceof RangeError?e.message:'請求內容不正確'}});}
 if(!input||!methods.has(input.method)||(input.params!=null&&(typeof input.params!=='object'||Array.isArray(input.params))))return json(400,{error:{message:'不支援的資料操作'}});
 async function db(name,body){
  // Workers implements follow/manual; "error" throws before any network request.
  const response=await remoteFetch(cfg.supabaseUrl+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:cfg.supabasePublishableKey,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000),redirect:'manual'});
  if(response.status>=300&&response.status<400)throw Object.assign(new Error('Supabase 服務網址回應重新導向，請確認連線設定。'),{status:502,code:'UPSTREAM_REDIRECT'});
  const value=await response.json();
  if(!response.ok){
   if(response.status===401||value.code==='PGRST301')throw Object.assign(new Error('登入已失效，請重新登入後再操作。'),{status:401,code:'AUTH_REQUIRED'});
   if(value.code==='PGRST202'||value.code==='42P01')throw Object.assign(new Error('Supabase 資料表尚未初始化，請先執行 supabase/INSTALL.sql。'),{status:503,code:'NOT_INITIALIZED'});
   if(value.code==='40001')throw Object.assign(new Error('練習資料已由其他視窗更新，請重新整理後再儲存。'),{status:409,code:'40001'});
   throw Object.assign(new Error('Supabase 讀寫失敗，請確認資料表與帳號權限。'),{status:502,code:value.code||'SUPABASE_ERROR'});
  }return value;
 }
 try{
  const snapshot=await db('nrop_practice_read',{});
  if(!Number.isSafeInteger(snapshot?.revision)||!snapshot?.state)throw new Error('snapshot');
  const result=transact(snapshot.state,input.method,{...(input.params||{}),p_requestId:crypto.randomUUID()});
  if(mutations.has(input.method))await db('nrop_practice_commit',{p_expected_revision:snapshot.revision,p_state:result.state});
  return json(200,{data:result.data});
 }catch(e){
  if(e.code==='22023'||e.code==='40001')return json(e.status||400,{error:{message:e.message,code:e.code}});
  if(e.status)return json(e.status,{error:{message:e.message,code:e.code}});
  return json(502,{error:{message:'Supabase 連線中斷或回應異常，請重新整理確認儲存結果；系統不會自動重送。',code:'SUPABASE_ERROR'}});
 }
}

```

## 新增 server/api.mjs（完整）

```
import{handleApiRequest}from'./supabase-api.mjs';
export function nropMiddleware(env,remoteFetch=fetch){return async(req,res,next=()=>{res.writeHead(404);res.end();})=>{
 const path=req.url?.split('?')[0];if(!['/api/connection','/api/nrop'].includes(path))return next();
 if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')){res.writeHead(403);return res.end();}
 try{
  const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>32000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'資料超過大小限制'}}));return;}chunks.push(c);}
  const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  const response=await handleApiRequest(request,env,remoteFetch);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'資料服務目前無法使用'}}));}
};}

```

## 新增 server/worker.mjs（完整）

```
import{handleApiRequest,supabaseConfig}from'./supabase-api.mjs';
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store'};
export async function handleRequest(request,env,assets,remoteFetch=fetch){
 const path=new URL(request.url).pathname;
 if(path.startsWith('/api/'))return handleApiRequest(request,env,remoteFetch);
 if(!['GET','HEAD'].includes(request.method))return new Response('不支援的請求方法',{status:405,headers});
 const asset=assets[path==='/'?'/index.html':path];if(!asset)return new Response('找不到頁面',{status:404,headers});
 const backend=supabaseConfig(env).supabaseUrl||'';
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{status:200,headers:{...headers,'Content-Type':asset.type,'Content-Security-Policy':`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${backend}; object-src 'none'; base-uri 'none'; form-action 'self'`}});
}

```

## 新增 supabase/INSTALL.sql（完整）

```
-- NROP 個人 Supabase 練習版。僅建立 nrop_practice_* 物件，不使用原正式 NROP 資料表。
-- 在指定練習專案 SQL Editor 執行整份。可重跑，不會清空已存在的練習資料。
begin;
create table if not exists public.nrop_practice_workspaces (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check(revision > 0),
 state jsonb not null check(jsonb_typeof(state)='object'),
 updated_at timestamptz not null default now()
);
alter table public.nrop_practice_workspaces enable row level security;
revoke all on public.nrop_practice_workspaces from anon, authenticated;
grant select,insert,update on public.nrop_practice_workspaces to authenticated;
do $policy$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nrop_practice_workspaces' and policyname='nrop_practice_owner') then
  create policy nrop_practice_owner on public.nrop_practice_workspaces for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
 end if;
end $policy$;
create or replace function public.nrop_practice_read() returns jsonb
language plpgsql security invoker set search_path='' as $fn$
declare result jsonb;
begin
 if auth.uid() is null then raise exception '請先登入' using errcode='42501'; end if;
 insert into public.nrop_practice_workspaces(owner_id,state)
 values(auth.uid(), '{"records":[],"openings":[],"capacities":[{"unit":"6A","effectiveDate":"2000-01-01","beds":39,"version":1},{"unit":"6B","effectiveDate":"2000-01-01","beds":43,"version":1},{"unit":"7A","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"7B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"8A","effectiveDate":"2000-01-01","beds":32,"version":1},{"unit":"安寧病房","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"8B","effectiveDate":"2000-01-01","beds":33,"version":1},{"unit":"9A","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"9B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"10A","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"10B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"11A","effectiveDate":"2000-01-01","beds":40,"version":1},{"unit":"11B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"12B","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"精神科急性病房","effectiveDate":"2000-01-01","beds":30,"version":1},{"unit":"ICU-1","effectiveDate":"2000-01-01","beds":12,"version":1},{"unit":"ICU-2","effectiveDate":"2000-01-01","beds":24,"version":1},{"unit":"ICU-3","effectiveDate":"2000-01-01","beds":9,"version":1},{"unit":"NICU","effectiveDate":"2000-01-01","beds":3,"version":1},{"unit":"PICU","effectiveDate":"2000-01-01","beds":2,"version":1},{"unit":"BR","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"NBC","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"燙傷中心","effectiveDate":"2000-01-01","beds":4,"version":1},{"unit":"急診","effectiveDate":"2000-01-01","beds":33,"version":1},{"unit":"產房","effectiveDate":"2000-01-01","beds":6,"version":1},{"unit":"手術室","effectiveDate":"2000-01-01","beds":11,"version":1},{"unit":"護理之家","effectiveDate":"2000-01-01","beds":39,"version":1},{"unit":"洗腎室","effectiveDate":"2000-01-01","beds":61,"version":1}],"audit":[],"pending":[]}'::jsonb || jsonb_build_object('recordStartDate',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD')))
 on conflict(owner_id) do nothing;
 select jsonb_build_object('revision',revision,'state',state) into result from public.nrop_practice_workspaces where owner_id=auth.uid();
 return result;
end $fn$;
create or replace function public.nrop_practice_commit(p_expected_revision bigint,p_state jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $fn$
declare new_revision bigint; part text;
begin
 if auth.uid() is null then raise exception '請先登入' using errcode='42501'; end if;
 if jsonb_typeof(p_state) is distinct from 'object' then raise exception '資料格式不正確' using errcode='22023'; end if;
 foreach part in array array['records','openings','capacities','audit','pending'] loop
  if jsonb_typeof(p_state->part) is distinct from 'array' then raise exception '資料格式不正確' using errcode='22023'; end if;
 end loop;
 if jsonb_array_length(p_state->'audit')>500 or jsonb_array_length(p_state->'pending')>50 or octet_length(p_state::text)>8388608 then raise exception '已超過個人練習版容量' using errcode='22023'; end if;
 if not coalesce(p_state->>'recordStartDate','') ~ '^\d{4}-\d{2}-\d{2}$' then raise exception '起始日期不正確' using errcode='22023'; end if;
 update public.nrop_practice_workspaces set state=p_state,revision=revision+1,updated_at=now() where owner_id=auth.uid() and revision=p_expected_revision returning revision into new_revision;
 if new_revision is null then raise exception '資料版本衝突，請重新整理' using errcode='40001'; end if;
 return jsonb_build_object('revision',new_revision);
end $fn$;
revoke all on function public.nrop_practice_read() from public,anon;
revoke all on function public.nrop_practice_commit(bigint,jsonb) from public,anon;
grant execute on function public.nrop_practice_read() to authenticated;
grant execute on function public.nrop_practice_commit(bigint,jsonb) to authenticated;
create or replace view public.nrop_practice_records with(security_invoker=true) as
select w.owner_id,(r->>'date')::date report_date,r->>'shift' shift,r->>'unit' unit,
 r->'record'->>'status' status,(r->'record'->>'staff')::numeric staff,
 (r->'record'->>'patients')::integer patients,(r->'record'->>'opening')::integer opening,
 coalesce((r->'record'->>'住院')::integer,(r->'record'->>'admitted')::integer) admitted,
 coalesce((r->'record'->>'出院')::integer,(r->'record'->>'discharged')::integer) discharged,
 (r->'record'->>'轉入')::integer transfer_in,(r->'record'->>'轉出')::integer transfer_out,
 (r->'record'->>'病危')::integer critical,
 coalesce((r->'record'->>'死亡')::integer,(r->'record'->>'deaths')::integer) deaths,
 (r->'record'->>'visits')::numeric visits,
 (r->'record'->>'referralIn')::numeric referral_in,
 (r->'record'->>'referralOut')::numeric referral_out,
 (r->'record'->>'observation')::numeric observation,
 (r->'record'->>'surgeries')::numeric surgeries,
 (r->'record'->>'waiting')::numeric waiting,
 (r->'record'->>'cesarean')::numeric cesarean,
 (r->'record'->>'naturalBirth')::numeric natural_birth,
 (r->'record'->>'drSurgery')::numeric dr_surgery,
 (r->'record'->>'inCount')::numeric in_count,
 (r->'record'->>'outCount')::numeric out_count,
 (r->'record'->>'nurseStaff')::numeric nurse_staff,
 (r->'record'->>'aideStaff')::numeric aide_staff,
 (r->'record'->>'residents')::numeric residents,
 (r->'record'->>'occupiedBeds')::numeric occupied_beds,
 (r->'record'->>'reserved')::numeric reserved,
 (r->'record'->>'hemodialysisOutpatient')::numeric hemodialysis_outpatient,
 (r->'record'->>'hemodialysisInpatient')::numeric hemodialysis_inpatient,
 (r->'record'->>'hemodialysisCritical')::numeric hemodialysis_critical,
 (r->'record'->>'peritonealDialysis')::numeric peritoneal_dialysis,
 (r->'record'->>'住院本科')::numeric admitted_specialty,
 (r->'record'->>'住院非本科')::numeric admitted_other_specialty,
 (r->'record'->>'住院一般病房')::numeric admitted_general_ward,
 (r->'record'->>'住院負壓隔離')::numeric admitted_isolation,
 (r->'record'->>'version')::integer version,(r->'record'->>'updatedAt')::timestamptz updated_at,r->'record' payload
from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'records') r;
create or replace view public.nrop_practice_openings with(security_invoker=true) as
 select w.owner_id,r->>'unit_id' unit,(r->>'report_date')::date report_date,r->>'shift' shift,(r->>'patients')::integer patients
 from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'openings') r;
create or replace view public.nrop_practice_capacities with(security_invoker=true) as
 select w.owner_id,r->>'unit' unit,(r->>'effectiveDate')::date effective_date,(r->>'beds')::integer beds,(r->>'version')::integer version,r->>'reason' reason
 from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'capacities') r;
create or replace view public.nrop_practice_audit with(security_invoker=true) as
 select w.owner_id,(r->>'created_at')::timestamptz created_at,r->>'action' action,r->>'target' target,r->'before' before,r->'after' after
 from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'audit') r;
revoke all on public.nrop_practice_records,public.nrop_practice_openings,public.nrop_practice_capacities,public.nrop_practice_audit from public,anon;
grant select on public.nrop_practice_records,public.nrop_practice_openings,public.nrop_practice_capacities,public.nrop_practice_audit to authenticated;
notify pgrst,'reload schema';
commit;

```

## 新增 .env.example（完整）

```
# Supabase 公開設定；請勿填入 sb_secret 或 service_role 管理員密鑰。
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
# 也支援 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY。
PORT=4178

```

## 資料保存方式

每個 Supabase 帳號有自己的練習工作區。PostgreSQL 保存完整狀態並以 revision 防止同時覆寫；records、openings、capacities、audit 檢視表使用 security_invoker，受底層 RLS 保護，提供可直接讀取的數字欄位。舊 Google 試算表保留原資料，本次不自動搬入新帳號。
