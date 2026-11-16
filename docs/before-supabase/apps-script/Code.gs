// NROP 個人練習模板；共用資料模型自動產生。
const units=[
  {id:'6A',beds:39,type:'ward'},{id:'6B',beds:43,type:'ward'},{id:'7A',beds:45,type:'ward'},{id:'7B',beds:45,type:'ward'},{id:'8A',beds:32,type:'ward'},{id:'安寧病房',beds:10,type:'ward'},{id:'8B',beds:33,type:'ward'},{id:'9A',beds:45,type:'ward'},{id:'9B',beds:45,type:'ward'},{id:'10A',beds:45,type:'ward'},{id:'10B',beds:45,type:'ward'},{id:'11A',beds:40,type:'ward'},{id:'11B',beds:45,type:'ward'},{id:'12B',beds:10,type:'ward'},{id:'精神科急性病房',beds:30,type:'ward'},
  {id:'ICU-1',beds:12,type:'special'},{id:'ICU-2',beds:24,type:'special'},{id:'ICU-3',beds:9,type:'special'},{id:'NICU',beds:3,type:'special'},{id:'PICU',beds:2,type:'special'},{id:'BR',beds:10,type:'special'},{id:'NBC',beds:10,type:'special'},{id:'燙傷中心',beds:4,type:'special'}
];
const operationalUnits=[
  {id:'急診',beds:33,type:'emergency',fields:[['staff','實際上班人力'],['visits','來診人數'],['referralIn','轉診入'],['referralOut','轉診出'],['admitted','住院'],['observation','留觀'],['deaths','死亡'],['surgeries','手術']]},
  {id:'產房',beds:6,type:'delivery',fields:[['staff','實際上班人力'],['visits','來診人數'],['observation','留觀'],['waiting','待產'],['cesarean','剖腹產'],['naturalBirth','自然產'],['drSurgery','DR 手術']]},
  {id:'手術室',beds:11,type:'operatingRoom',fields:[['staff','實際上班人力'],['inCount','IN'],['outCount','OUT']]},
  {id:'護理之家',beds:39,type:'nursingHome',fields:[['nurseStaff','護理師'],['aideStaff','護佐'],['staff','上班人力（自動合計）'],['residents','機構內住民人數'],['occupiedBeds','實際使用床數'],['reserved','保留床位'],['admitted','住院'],['discharged','出院']]},
  {id:'洗腎室',beds:61,type:'dialysis',fields:[['staff','實際上班人力'],['hemodialysisOutpatient','血液透析－門診'],['hemodialysisInpatient','血液透析－住院'],['hemodialysisCritical','血液透析－重症'],['peritonealDialysis','腹膜透析病人數']]}
];
const allLoginUnits=[...units,...operationalUnits];
const nursingHomeStaffFields=['nurseStaff','aideStaff'],specialStaffFields=['staff',...nursingHomeStaffFields];
const shifts=['N','D','E'], events=['住院','出院','轉入','轉出','病危','死亡'];
const specialtyAdmissions=[['住院本科','住院（本科）'],['住院非本科','住院（非本科）']],isolationAdmissions=[['住院一般病房','住院（一般病房）'],['住院負壓隔離','住院（負壓隔離）']];
const admissionFieldsByUnit={'6A':specialtyAdmissions,'6B':specialtyAdmissions,'12B':isolationAdmissions,'ICU-3':isolationAdmissions};
const admissionExportFields=[...specialtyAdmissions,...isolationAdmissions];




function fault(message, code = '22023') { throw Object.assign(new Error(message), { code }); }
function taiwanDate() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }
function newState() {
  return { records: [], openings: [], capacities: allLoginUnits.map(u => ({ unit: u.id, effectiveDate: '2000-01-01', beds: u.beds, version: 1 })), audit: [], pending: [], recordStartDate: taiwanDate() };
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2000-01-01' || value > '2100-12-31' || new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) !== value) fault('日期格式不正確');
  return value;
}
function numeric(value, field, decimal = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99999 || (!decimal && !Number.isInteger(value)) || (decimal && Math.abs(value * 1000 - Math.round(value * 1000)) > 0.00001)) fault(field + ' 必須是非負數字，人力最多三位小數，其餘為整數');
  return value;
}
function unit(id) { return allLoginUnits.find(u => u.id === id) || fault('單位不存在'); }
function coords(p) { unit(p.p_unit); date(p.p_date); if (!shifts.includes(p.p_shift)) fault('班別不正確'); if (p.p_date > taiwanDate()) fault('不可填報未來日期'); }
function match(row, d, s, u) { return row.date === d && row.shift === s && row.unit === u; }
function previous(d, s) { const n = shifts.indexOf(s); return n ? [d, shifts[n - 1]] : [new Date(new Date(d + 'T12:00:00Z').getTime() - 86400000).toISOString().slice(0, 10), 'E']; }
function audit(state, action, target, before, after) {
  state.audit.unshift({ created_at: new Date().toISOString(), action, target, actor_id: 'practice', before: before || {}, after: after || {} });
  state.audit = state.audit.slice(0, 500);
}
function bedsAt(state, id, d) { return state.capacities.filter(r => r.unit === id && r.effectiveDate <= d).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0]?.beds ?? unit(id).beds; }
function recalculate(state, id, changed) {
  const list = state.records.filter(r => r.unit === id).sort((a, b) => a.date.localeCompare(b.date) || shifts.indexOf(a.shift) - shifts.indexOf(b.shift));
  for (const row of list) {
    if (row.date < changed) continue;
    const r = row.record, [d, s] = previous(row.date, row.shift), prior = list.find(x => match(x, d, s, id));
    const opening = state.openings.find(x => x.unit_id === id && x.report_date === row.date && x.shift === row.shift);
    const before = JSON.stringify(r);
    r.opening = prior?.record.patients ?? opening?.patients ?? 0;
    r.baselineReady = prior ? prior.record.status === 'submitted' && prior.record.baselineReady : !!opening;
    r.patients = r.opening + r.住院 - r.出院 + r.轉入 - r.轉出 - r.死亡;
    if (r.patients < 0) fault('此異動會造成 ' + row.date + ' ' + row.shift + ' 班住院人數小於 0');
    if (r.status === 'submitted' && !r.baselineReady) fault('前班尚未完成或缺少期初人數，請先暫存');
    if (before !== JSON.stringify(r)) { r.version++; r.updatedAt = new Date().toISOString(); }
  }
}
function dispatch(state, method, p = {}) {
  const now = new Date().toISOString();
  switch (method) {
    case 'nrop_public_config': return { dataArea: 'shared', registrationOpen: false, bedCapacityManagement: true, recordStartDate: state.recordStartDate, units: allLoginUnits.map(u => ({ ...u, beds: bedsAt(state, u.id, taiwanDate()) })) };
    case 'nrop_list_records': date(p.p_from); date(p.p_to); if (p.p_from > p.p_to) fault('查詢起訖日期不正確'); return state.records.filter(r => r.date >= p.p_from && r.date <= p.p_to);
    case 'nrop_list_openings': return state.openings;
    case 'nrop_list_bed_capacities': return state.capacities;
    case 'nrop_save_record': {
      coords(p); if (!['draft', 'submitted'].includes(p.p_status)) fault('儲存狀態不正確');
      const existing = state.records.find(r => match(r, p.p_date, p.p_shift, p.p_unit));
      if ((existing?.record.version || 0) !== p.p_version) fault('資料已被其他視窗修改，請重新整理後再儲存', '40001');
      const u = unit(p.p_unit), operational = operationalUnits.some(x => x.id === u.id), split = admissionFieldsByUnit[u.id];
      if (!p.p_payload || typeof p.p_payload !== 'object' || Array.isArray(p.p_payload)) fault('填報內容不正確');
      const fields = operational ? u.fields.map(([f]) => f).filter(f => !(u.type === 'nursingHome' && f === 'staff')) : ['staff', ...events.flatMap(f => f === '住院' && split ? split.map(([k]) => k) : [f])];
      const payload = {};
      for (const f of fields) payload[f] = numeric(p.p_payload[f], f, specialStaffFields.includes(f));
      if (split) payload.住院 = split.reduce((n, [f]) => n + payload[f], 0);
      if (u.type === 'nursingHome') payload.staff = Math.round((payload.nurseStaff + payload.aideStaff) * 1000) / 1000;
      const record = { ...payload, status: p.p_status, version: (existing?.record.version || 0) + 1, updatedAt: now };
      if (existing) existing.record = record; else state.records.push({ date: p.p_date, shift: p.p_shift, unit: u.id, record });
      if (!operational) recalculate(state, u.id, p.p_date);
      audit(state, '儲存填報', p.p_date + '|' + p.p_shift + '|' + u.id, null, record);
      return record;
    }
    case 'nrop_set_opening': {
      coords(p); if (operationalUnits.some(u => u.id === p.p_unit)) fault('此單位不使用期初住院人數');
      numeric(p.p_patients, '期初人數');
      const existing = state.records.filter(r => r.unit === p.p_unit);
      if (existing.some(r => r.record.status === 'submitted') || state.openings.some(r => r.unit_id === p.p_unit)) fault('已有期初設定或正式紀錄，不能重設期初人數');
      if (existing.some(r => r.date < p.p_date || (r.date === p.p_date && shifts.indexOf(r.shift) < shifts.indexOf(p.p_shift)))) fault('期初設定必須在第一筆暫存的班別或更早');
      state.openings.push({ unit_id: p.p_unit, report_date: p.p_date, shift: p.p_shift, patients: p.p_patients });
      recalculate(state, p.p_unit, p.p_date);
      audit(state, '設定期初', p.p_unit, null, { patients: p.p_patients }); return true;
    }
    case 'nrop_admin_bed_settings': return { today: taiwanDate(), units: allLoginUnits.map(u => ({ ...u, beds: bedsAt(state, u.id, taiwanDate()), version: Math.max(...state.capacities.filter(c => c.unit === u.id).map(c => c.version)), periods: state.capacities.filter(c => c.unit === u.id) })), history: state.audit.filter(a => a.action === '調整床數').slice(0, 100).map(a => ({ unit: a.target, before: a.before, after: a.after, createdAt: a.created_at, actor: '練習使用者' })) };
    case 'nrop_prepare_bed_change': {
      unit(p.p_unit); date(p.p_date); numeric(p.p_beds, '床數');
      if (p.p_beds > 9999 || p.p_date < taiwanDate()) fault('只能調整今天起的床數，最多 9999 床');
      if (typeof p.p_reason !== 'string' || p.p_reason.length > 400) fault('調整原因最多 400 字');
      const version = Math.max(...state.capacities.filter(c => c.unit === p.p_unit).map(c => c.version));
      if (version !== p.p_version) fault('床數設定已變更，請重新整理', '40001');
      state.pending = state.pending.filter(x => x.expires > Date.now());
      if (state.pending.length >= 50) fault('待確認操作過多，請稍後再試');
      const pending = { requestId: p.p_requestId, unit: p.p_unit, oldBeds: bedsAt(state, p.p_unit, p.p_date), newBeds: p.p_beds, effectiveDate: p.p_date, reason: p.p_reason, version, expires: Date.now() + 300000 };
      if (!pending.requestId) fault('缺少操作識別碼'); state.pending.push(pending); return pending;
    }
    case 'nrop_confirm_bed_change': {
      const pending = state.pending.find(x => x.requestId === p.p_request && x.expires > Date.now());
      if (!pending) fault('確認已過期，請重新調整');
      const version = Math.max(...state.capacities.filter(c => c.unit === pending.unit).map(c => c.version));
      if (version !== pending.version) fault('床數已由其他視窗修改，請重新整理', '40001');
      const after = { beds: pending.newBeds, effectiveDate: pending.effectiveDate, reason: pending.reason };
      state.capacities = state.capacities.filter(c => !(c.unit === pending.unit && c.effectiveDate === pending.effectiveDate));
      state.capacities.push({ unit: pending.unit, ...after, version: version + 1, updatedAt: now });
      state.pending = state.pending.filter(x => x.requestId !== pending.requestId);
      audit(state, '調整床數', pending.unit, { beds: pending.oldBeds }, after); return true;
    }
    case 'nrop_admin_audit': return state.audit.slice(0, 100);
    default: fault('不支援的操作');
  }
}
// 驗證失敗時丟棄整份副本，避免部分寫入。
function transact(state, method, params) {
  const next = JSON.parse(JSON.stringify(state));
  const data = dispatch(next, method, params);
  return { state: next, data: JSON.parse(JSON.stringify(data)) };
}

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
