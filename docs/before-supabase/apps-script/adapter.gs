// 由 scripts/build-apps-script.mjs 與共用資料模型合成 Code.gs。
// 先設定指令碼屬性 SPREADSHEET_ID、API_TOKEN（至少 32 字元）。
const RECORD_DETAIL_FIELDS = [
  ['visits','來診人數'],['referralIn','轉診入'],['referralOut','轉診出'],['observation','留觀人數'],['surgeries','手術人次'],
  ['waiting','待產人數'],['cesarean','剖腹產'],['naturalBirth','自然產'],['drSurgery','DR 手術'],['inCount','手術室 IN'],['outCount','手術室 OUT'],
  ['nurseStaff','護理師人力'],['aideStaff','護佐人力'],['residents','機構內住民人數'],['occupiedBeds','實際使用床數'],['reserved','保留床位'],
  ['hemodialysisOutpatient','血液透析－門診'],['hemodialysisInpatient','血液透析－住院'],['hemodialysisCritical','血液透析－重症'],['peritonealDialysis','腹膜透析病人數'],
  ['住院本科','住院（本科）'],['住院非本科','住院（非本科）'],['住院一般病房','住院（一般病房）'],['住院負壓隔離','住院（負壓隔離）']
];
const SHEET_HEADERS = {
  Records: ['日期','班別','單位','狀態','上班人力','病房住院病人數','當班住院','出院','機構內轉入','機構內轉出','病危','死亡','填報內容 JSON','版本','更新時間'].concat(RECORD_DETAIL_FIELDS.map(f => f[1])),
  Openings: ['單位','日期','班別','期初住院人數'],
  Capacities: ['單位','生效日期','床數','版本','更新時間','調整原因'],
  Audit: ['時間','操作','對象','操作者','調整前 JSON','調整後 JSON']
};
function settings_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID'), token = props.getProperty('API_TOKEN');
  if (!id || !token || token.length < 32) throw new Error('請設定 SPREADSHEET_ID 與至少 32 字元的 API_TOKEN');
  return { id: id, token: token };
}
function setup() {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const cfg = settings_(), book = SpreadsheetApp.openById(cfg.id);
    for (const name in SHEET_HEADERS) {
      const sheet = book.getSheetByName(name) || book.insertSheet(name);
      if (sheet.getMaxColumns() < SHEET_HEADERS[name].length) sheet.insertColumnsAfter(sheet.getMaxColumns(), SHEET_HEADERS[name].length - sheet.getMaxColumns());
      sheet.getRange(1, 1, 1, SHEET_HEADERS[name].length).setValues([SHEET_HEADERS[name]]).setBackground('#eeeeee').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    let internal = book.getSheetByName('_State');
    if (!internal) internal = book.insertSheet('_State');
    if (internal.getMaxColumns() < 32) internal.insertColumnsAfter(internal.getMaxColumns(), 32 - internal.getMaxColumns());
    internal.getRange('A1').setValue('程式內部狀態，請勿編輯');
    const state = readState_(book) || newState();
    writeState_(book, state); refreshViews_(book, state); internal.hideSheet();
    SpreadsheetApp.flush();
    console.log('初始化完成。請部署為網頁應用程式，再把 /exec 網址填到本機 .env.local。');
  } finally { lock.releaseLock(); }
}
function readState_(book) {
  const sheet = book.getSheetByName('_State');
  if (!sheet || sheet.getMaxColumns() < 32) return null;
  const value = sheet.getRange(2, 1, 1, 32).getValues()[0].join('');
  return value ? JSON.parse(value) : null;
}
function writeState_(book, state) {
  const serialized = JSON.stringify(state);
  if (serialized.length > 32 * 40000) throw new Error('已超過練習版容量，請封存資料後再繼續');
  const chunks = Array.from({length:32}, (_, i) => serialized.slice(i * 40000, (i + 1) * 40000));
  // 同一範圍單次寫入完整狀態；投影表可重新建立。
  book.getSheetByName('_State').getRange(2, 1, 1, 32).setValues([chunks]);
  SpreadsheetApp.flush();
}
function literal_(value) { return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value; }
function writeView_(book, name, values) {
  const sheet = book.getSheetByName(name), width = SHEET_HEADERS[name].length;
  if (sheet.getMaxColumns() < width) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  sheet.getRange(1, 1, 1, width).setValues([SHEET_HEADERS[name]]).setBackground('#eeeeee').setFontWeight('bold');
  const oldRows = Math.max(sheet.getLastRow() - 1, 0), count = Math.max(oldRows, values.length);
  if (!count) return;
  if (sheet.getMaxRows() < count + 1) sheet.insertRowsAfter(sheet.getMaxRows(), count + 1 - sheet.getMaxRows());
  const rows = Array.from({length:count}, (_, i) => values[i] ? values[i].map(literal_) : Array(width).fill(''));
  sheet.getRange(2, 1, count, width).setValues(rows);
}
function refreshViews_(book, state) {
  writeView_(book, 'Records', state.records.map(row => { const r = row.record; return [row.date,row.shift,row.unit,r.status,r.staff,r.patients??'',r.住院??r.admitted??'',r.出院??r.discharged??'',r.轉入??'',r.轉出??'',r.病危??'',r.死亡??r.deaths??'',JSON.stringify(r),r.version,r.updatedAt].concat(RECORD_DETAIL_FIELDS.map(f => r[f[0]]??'')); }));
  writeView_(book, 'Openings', state.openings.map(r => [r.unit_id,r.report_date,r.shift,r.patients]));
  writeView_(book, 'Capacities', state.capacities.map(r => [r.unit,r.effectiveDate,r.beds,r.version,r.updatedAt||'',r.reason||'']));
  writeView_(book, 'Audit', state.audit.map(r => [r.created_at,r.action,r.target,'練習使用者',JSON.stringify(r.before),JSON.stringify(r.after)]));
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json_({ service: 'NROP Google Sheets practice', version: '0.1.0' }); }
function doPost(e) {
  let lock;
  try {
    const cfg = settings_();
    if (!e || !e.postData || e.postData.contents.length > 40000) throw new Error('請求內容不正確');
    const input = JSON.parse(e.postData.contents);
    if (typeof input.token !== 'string' || input.token !== cfg.token) return json_({ error: { message: '讀寫服務憑證不正確', code: '42501' } });
    lock = LockService.getScriptLock(); lock.waitLock(20000);
    const book = SpreadsheetApp.openById(cfg.id), state = readState_(book);
    if (!state) throw new Error('請先在編輯器執行 setup');
    const params = Object.assign({}, input.params || {}, {p_requestId:Utilities.getUuid()});
    const result = transact(state, input.method, params);
    const mutation = ['nrop_save_record','nrop_set_opening','nrop_prepare_bed_change','nrop_confirm_bed_change'].includes(input.method);
    if (mutation) {
      writeState_(book, result.state);
      try { refreshViews_(book, result.state); SpreadsheetApp.flush(); }
      catch (viewError) { return json_({error:{message:'資料已儲存，但顯示分頁更新失敗。請在 Apps Script 重新執行 setup，勿直接重送。',code:'STORED'}}); }
    }
    return json_({data:result.data});
  } catch (error) { return json_({ error: { message: error.message || 'Google 試算表讀寫失敗', code: error.code || 'SHEETS_ERROR' } }); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
