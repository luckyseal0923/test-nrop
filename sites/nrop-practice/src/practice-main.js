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
