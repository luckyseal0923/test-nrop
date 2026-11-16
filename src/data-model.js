import { allLoginUnits, operationalUnits, shifts, events, admissionFieldsByUnit, specialStaffFields } from './catalog.js';

export function fault(message, code = '22023') { throw Object.assign(new Error(message), { code }); }
export function taiwanDate() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }
export function newState() {
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
export function bedsAt(state, id, d) { return state.capacities.filter(r => r.unit === id && r.effectiveDate <= d).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0]?.beds ?? unit(id).beds; }
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
export function dispatch(state, method, p = {}) {
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
export function transact(state, method, params) {
  const next = JSON.parse(JSON.stringify(state));
  const data = dispatch(next, method, params);
  return { state: next, data: JSON.parse(JSON.stringify(data)) };
}
