import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code = ['src/catalog.js','src/data-model.js','apps-script/adapter.gs'].map(path=>readFileSync(path,'utf8').replace(/^import[^\n]+\n/gm,'').replace(/^export \{[^\n]+\};?\r?$/gm,'').replace(/\bexport /g,'')).join('\n');
function runtime(){
 const sheets=new Map(),properties={SPREADSHEET_ID:'test-sheet',API_TOKEN:'x'.repeat(48)};let writes=0;
 function makeSheet(){const cells=new Map(); return {getMaxColumns:()=>32,getMaxRows:()=>1000,insertColumnsAfter(){},insertRowsAfter(){},setFrozenRows(){},hideSheet(){},getLastRow(){return Math.max(0,...[...cells.keys()].map(k=>Number(k.split(',')[0])));},getRange(row,col=1,height=1,width=1){if(row==='A1')row=1;return{getValues(){return Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>cells.get([row+i,col+j].join(','))??''));},setValues(values){writes++;values.forEach((r,i)=>r.forEach((v,j)=>cells.set([row+i,col+j].join(','),v)));return this;},setValue(value){cells.set([row,col].join(','),value);return this;},setBackground(){return this;},setFontWeight(){return this;}};}};}
 const book={getSheetByName:n=>sheets.get(n),insertSheet(n){const s=makeSheet();sheets.set(n,s);return s;}};
 const ctx={console:{log(){}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k]})},SpreadsheetApp:{openById:()=>book,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){},hasLock:()=>true})},Utilities:{getUuid:()=> 'test-request'},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return{ctx,book,get writes(){return writes;},call(method,params={},token=properties.API_TOKEN){return ctx.doPost({postData:{contents:JSON.stringify({token,method,params})}});}};
}
test('Apps Script 無效憑證完全不寫入',()=>{const r=runtime();assert.equal(r.call('nrop_public_config',{},'bad').error.code,'42501');assert.equal(r.writes,0);});
test('setup 可重複執行，保留已存在的填報',()=>{const r=runtime();r.ctx.setup();const d=new Date(Date.now()+8*3600000).toISOString().slice(0,10);const result=r.call('nrop_save_record',{p_unit:'急診',p_date:d,p_shift:'N',p_status:'submitted',p_version:0,p_payload:{staff:2,visits:5,referralIn:0,referralOut:0,admitted:1,observation:3,deaths:0,surgeries:0}});assert.ok(!result.error,JSON.stringify(result));r.ctx.setup();assert.equal(r.call('nrop_list_records',{p_from:d,p_to:d}).data.length,1);assert.equal(r.book.getSheetByName('Records').getRange(2,3).getValues()[0][0],'急診');});
test('Apps Script 驗證失敗不改 canonical 狀態或投影表',()=>{const r=runtime();r.ctx.setup();const count=r.writes;assert.ok(r.call('nrop_save_record',{p_unit:'未知'}).error);assert.equal(r.writes,count);});
test('急診欄位展開、保留零值，留觀不混入病房住院或機構內轉入',()=>{
 const r=runtime();r.ctx.setup();const d=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 const result=r.call('nrop_save_record',{p_unit:'急診',p_date:d,p_shift:'E',p_status:'submitted',p_version:0,p_payload:{staff:2.125,visits:7,referralIn:2,referralOut:0,admitted:1,observation:3,deaths:0,surgeries:0}});assert.ok(!result.error,JSON.stringify(result));
 const values=r.book.getSheetByName('Records').getRange(1,1,2,39).getValues(), row=Object.fromEntries(values[0].map((h,i)=>[h,values[1][i]]));
 assert.equal(row['當班住院'],1);assert.equal(row['死亡'],0);assert.equal(row['來診人數'],7);assert.equal(row['轉診入'],2);assert.equal(row['轉診出'],0);assert.equal(row['留觀人數'],3);assert.equal(row['手術人次'],0);assert.equal(row['病房住院病人數'],'');assert.equal(row['機構內轉入'],'');
 const before=r.call('nrop_list_records',{p_from:d,p_to:d}).data;r.ctx.setup();assert.equal(JSON.stringify(r.call('nrop_list_records',{p_from:d,p_to:d}).data),JSON.stringify(before));
});
test('所有特殊單位填報欄位皆有明確數字欄位',()=>{
 const r=runtime();r.ctx.setup();const d=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
 const entries=[['產房',{staff:1,visits:2,observation:3,waiting:4,cesarean:5,naturalBirth:6,drSurgery:7},'自然產',6],['手術室',{staff:1,inCount:2,outCount:3},'手術室 OUT',3],['護理之家',{nurseStaff:1,aideStaff:2,staff:3,residents:4,occupiedBeds:5,reserved:0,admitted:1,discharged:2},'出院',2],['洗腎室',{staff:1,hemodialysisOutpatient:2,hemodialysisInpatient:3,hemodialysisCritical:4,peritonealDialysis:5},'腹膜透析病人數',5]];
 for(const [unit,payload]of entries){const result=r.call('nrop_save_record',{p_unit:unit,p_date:d,p_shift:'N',p_status:'submitted',p_version:0,p_payload:payload});assert.ok(!result.error,JSON.stringify(result));}
 const values=r.book.getSheetByName('Records').getRange(1,1,5,39).getValues();for(const[unit,,header,expected]of entries){const row=values.slice(1).find(x=>x[2]===unit);assert.equal(row[values[0].indexOf(header)],expected,unit);}
});
test('Google 投影表防止原因文字被當作公式',()=>{const r=runtime();r.ctx.setup();const d=new Date(Date.now()+8*3600000).toISOString().slice(0,10);const pending=r.call('nrop_prepare_bed_change',{p_unit:'7A',p_date:d,p_beds:30,p_version:1,p_reason:'=IMPORTXML("example")'}).data;r.call('nrop_confirm_bed_change',{p_request:pending.requestId});const values=r.book.getSheetByName('Capacities').getRange(2,1,29,6).getValues();assert.equal(values.find(row=>row[0]==='7A'&&row[1]===d)[5],'\'=IMPORTXML("example")');});
