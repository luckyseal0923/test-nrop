import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, transact, taiwanDate, bedsAt } from '../src/data-model.js';
import { allLoginUnits, operationalUnits } from '../src/catalog.js';
const d = taiwanDate(), payload = {staff:0,住院:0,出院:0,轉入:0,轉出:0,病危:0,死亡:0};
const save = (state, extra={}) => transact(state, 'nrop_save_record', {p_unit:'7A',p_date:d,p_shift:'N',p_status:'draft',p_payload:payload,p_version:0,...extra});
const opening = () => transact(newState(), 'nrop_set_opening', {p_unit:'7A',p_date:d,p_shift:'N',p_patients:10}).state;
test('28 個單位的初始床數與前端目錄相同', () => { const state=newState(); assert.equal(state.capacities.length,28); for(const u of allLoginUnits) assert.equal(bedsAt(state,u.id,d),u.beds); });
test('零值是有效填報，空白與缺值拒絕', () => { assert.equal(save(opening(),{p_status:'submitted'}).data.staff,0); for(const staff of ['',null,undefined]) assert.throws(()=>save(opening(),{p_payload:{...payload,staff}})); });
test('人力接受三位小數，其餘欄位只接受非負整數', () => { assert.equal(save(opening(),{p_payload:{...payload,staff:2.125}}).data.staff,2.125); for(const staff of [-1,Infinity,NaN,1.0001])assert.throws(()=>save(opening(),{p_payload:{...payload,staff}})); assert.throws(()=>save(opening(),{p_payload:{...payload,住院:1.5}})); });
test('正式送出必須有期初或已完成的前班', () => { assert.throws(()=>save(newState(),{p_status:'submitted'}),/期初/); assert.equal(save(newState()).data.baselineReady,false); });
test('先暫存仍可補設第一班期初人數', () => { let state=save(newState()).state; state=transact(state,'nrop_set_opening',{p_unit:'7A',p_date:d,p_shift:'N',p_patients:12}).state; assert.equal(state.records[0].record.patients,12); assert.equal(state.records[0].record.baselineReady,true); assert.throws(()=>transact(state,'nrop_set_opening',{p_unit:'7A',p_date:d,p_shift:'N',p_patients:4})); });
test('過期版本拒絕覆寫', () => { const first=save(opening()); assert.throws(()=>save(first.state),e=>e.code==='40001'); });
test('修改 N 班會重算 D、E 班，並改變後班版本', () => {
 let state=opening(); for(const s of ['N','D','E']) state=save(state,{p_shift:s,p_status:'submitted',p_payload:{...payload,住院:2}}).state;
 const before=state.records[2].record.version;
 state=save(state,{p_status:'submitted',p_version:state.records[0].record.version,p_payload:{...payload,住院:4}}).state;
 assert.deepEqual(state.records.map(r=>r.record.patients),[14,16,18]); assert.ok(state.records[2].record.version>before);
 assert.throws(()=>save(state,{p_status:'draft',p_version:state.records[0].record.version}));
});
test('跨日期 E → N 承接期末住院人數', () => {
 const yesterday=new Date(new Date(d+'T12:00:00Z').getTime()-86400000).toISOString().slice(0,10);
 let state=transact(newState(),'nrop_set_opening',{p_unit:'7A',p_date:yesterday,p_shift:'E',p_patients:7}).state;
 state=save(state,{p_date:yesterday,p_shift:'E',p_status:'submitted',p_payload:{...payload,住院:1}}).state;
 assert.equal(save(state,{p_status:'submitted',p_payload:{...payload,出院:2}}).data.patients,6);
});
test('驗證失敗不修改原始狀態', () => { const state=opening(),before=JSON.stringify(state); assert.throws(()=>save(state,{p_payload:{...payload,出院:11}})); assert.equal(JSON.stringify(state),before); });
test('分項住院由服務端合計，不採用前端偽造的合計', () => { const r=save(newState(),{p_unit:'6A',p_payload:{...payload,住院:999,住院本科:2,住院非本科:3}}).data; assert.equal(r.住院,5); assert.throws(()=>save(newState(),{p_unit:'6A'})); });
test('五種特殊單位都能儲存，護理之家人力重新合計', () => {
 for(const u of operationalUnits){ const v=Object.fromEntries(u.fields.map(([f])=>[f,0])); if(u.type==='nursingHome'){v.nurseStaff=1.125;v.aideStaff=2.125;v.staff=999;}
 const r=save(newState(),{p_unit:u.id,p_status:'submitted',p_payload:v}).data; assert.equal(r.staff,u.type==='nursingHome'?3.25:0); }
});
test('不可寫入未知單位、不合法日期與未來日期', () => { for(const extra of [{p_unit:'不存在'},{p_date:'2026-02-30'},{p_shift:'X'},{p_date:'2099-01-01'}])assert.throws(()=>save(newState(),extra)); });
test('床數生效日保留歷史母數，確認只能用一次', () => { let state=newState(); const r=transact(state,'nrop_prepare_bed_change',{p_unit:'7A',p_date:d,p_beds:30,p_version:1,p_reason:'練習',p_requestId:'request-1'}); state=r.state;
 state=transact(state,'nrop_confirm_bed_change',{p_request:'request-1'}).state; assert.equal(bedsAt(state,'7A',d),30); assert.equal(bedsAt(state,'7A','2000-01-01'),45); assert.throws(()=>transact(state,'nrop_confirm_bed_change',{p_request:'request-1'}));
 assert.equal(state.audit[0].action,'調整床數');
});
test('床數兩次確認之間有新版本時拒絕', () => { let state=newState(); for(const id of ['a','b']) state=transact(state,'nrop_prepare_bed_change',{p_unit:'7A',p_date:d,p_beds:30,p_version:1,p_reason:'',p_requestId:id}).state;
 state=transact(state,'nrop_confirm_bed_change',{p_request:'a'}).state; assert.throws(()=>transact(state,'nrop_confirm_bed_change',{p_request:'b'}),e=>e.code==='40001'); });
test('未知操作與非法床數拒絕', () => { assert.throws(()=>transact(newState(),'delete_everything')); assert.throws(()=>transact(newState(),'nrop_prepare_bed_change',{p_unit:'7A',p_date:d,p_beds:10000,p_version:1,p_reason:'',p_requestId:'a'})); });
