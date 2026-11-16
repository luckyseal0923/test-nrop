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
