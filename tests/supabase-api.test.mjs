import test from'node:test';import assert from'node:assert/strict';
import{handleApiRequest,supabaseConfig}from'../server/supabase-api.mjs';
import{newState}from'../src/data-model.js';
import{createServer,request as httpRequest}from'node:http';import{nropMiddleware}from'../server/api.mjs';
const origin='https://nrop.example',env={SUPABASE_URL:'https://gvyxlgunphusxxruvytn.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},token='test.user.signature';
const request=(body,headers={})=>new Request(origin+'/api/nrop',{method:'POST',headers:{origin,Authorization:'Bearer '+token,...headers},body:JSON.stringify(body)});
test('設定只接受 Supabase 公開金鑰，不會使用 Google 或暴露管理員密鑰',async()=>{
 assert.equal(supabaseConfig({SHEETS_API_URL:'https://script.google.com/example',SHEETS_API_TOKEN:'secret'}).configured,false);
 assert.equal(supabaseConfig({...env,SUPABASE_PUBLISHABLE_KEY:'sb_secret_private'}).configured,false);
 const res=await handleApiRequest(new Request(origin+'/api/connection'),{...env,SUPABASE_SECRET_KEY:'do-not-expose',SHEETS_API_TOKEN:'old-secret'});const text=await res.text();assert.equal(JSON.parse(text).provider,'supabase');assert.ok(!text.includes('do-not-expose'));assert.ok(!text.includes('old-secret'));assert.ok(!text.includes('script.google.com'));
});
test('匿名請求、跨來源與未知操作不會接觸資料庫',async()=>{for(const[req,status]of[[request({}, {Authorization:''}),401],[request({}, {origin:'https://other.example'}),403],[request({method:'delete_all'}),400]]){assert.equal((await handleApiRequest(req,env,()=>assert.fail('不應呼叫資料庫'))).status,status);}});
test('讀取傳送登入者 JWT 與公開金鑰，只連指定 Supabase',async()=>{
 let calls=0;const response=await handleApiRequest(request({method:'nrop_public_config'}),env,async(url,init)=>{calls++;assert.equal(init.redirect,'manual');assert.equal(url,env.SUPABASE_URL+'/rest/v1/rpc/nrop_practice_read');assert.equal(init.headers.Authorization,'Bearer '+token);assert.equal(init.headers.apikey,env.SUPABASE_PUBLISHABLE_KEY);assert.deepEqual(JSON.parse(init.body),{});return Response.json({revision:1,state:newState()});});assert.equal(response.status,200);assert.equal((await response.json()).data.units.length,28);assert.equal(calls,1);
});
test('寫入前重新驗證數值，並以資料庫 revision 一次提交',async()=>{
 const calls=[],state=newState();const date=state.recordStartDate;
 const remote=async(url,init)=>{const body=JSON.parse(init.body);calls.push({url,body});if(url.endsWith('_read'))return Response.json({revision:8,state});return Response.json({revision:9});};
 const result=await handleApiRequest(request({method:'nrop_save_record',params:{p_date:date,p_shift:'E',p_unit:'急診',p_status:'submitted',p_version:0,p_payload:{staff:2.125,visits:7,referralIn:0,referralOut:0,admitted:1,observation:3,deaths:0,surgeries:0}}}),env,remote);
 assert.equal(result.status,200);assert.equal(calls.length,2);assert.equal(calls[1].body.p_expected_revision,8);assert.equal(calls[1].body.p_state.records[0].record.staff,2.125);assert.equal(calls[1].body.p_state.records[0].record.observation,3);
});
test('版本衝突不會自動重新寫入',async()=>{let commits=0;const state=newState();const response=await handleApiRequest(request({method:'nrop_prepare_bed_change',params:{p_unit:'6A',p_date:state.recordStartDate,p_beds:30,p_reason:'合成練習',p_version:1}}),env,async url=>url.endsWith('_read')?Response.json({revision:1,state}):(commits++,Response.json({code:'40001',message:'conflict'},{status:400})));assert.equal(response.status,409);assert.equal((await response.json()).error.code,'40001');assert.equal(commits,1);});
test('Supabase 未建表、JWT 過期與非 JSON 回覆都有明確錯誤',async()=>{for(const[remote,status]of[[async()=>Response.json({code:'PGRST202'},{status:404}),503],[async()=>Response.json({code:'PGRST301'},{status:401}),401],[async()=>new Response('<html>error</html>'),502]]){const res=await handleApiRequest(request({method:'nrop_public_config'}),env,remote);assert.equal(res.status,status);}});
test('超大請求拒絕處理',async()=>{assert.equal((await handleApiRequest(request({method:'nrop_public_config',params:{text:'x'.repeat(33000)}}),env,()=>assert.fail())).status,413);});
test('本機 Node 代理正確回報設定，拒絕匿名與外部 Host',async()=>{
 const server=createServer(nropMiddleware(env,()=>assert.fail('不應呼叫資料庫')));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{assert.equal((await(await fetch(base+'/api/connection')).json()).provider,'supabase');assert.equal((await fetch(base+'/api/nrop',{method:'POST',headers:{Origin:base},body:'{}'})).status,401);const status=await new Promise((resolve,reject)=>{const req=httpRequest(base+'/api/connection',{headers:{Host:'other.example'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end();});assert.equal(status,403);}finally{await new Promise(r=>server.close(r));}
});
test('拒絕上游重新導向，不跟隨也不洩漏登入 JWT 到其他網域',async()=>{let calls=0;const response=await handleApiRequest(request({method:'nrop_public_config'}),env,async(_,init)=>{calls++;assert.equal(init.redirect,'manual');return new Response(null,{status:302,headers:{location:'https://other.example'}});});assert.equal(response.status,502);assert.equal((await response.json()).error.code,'UPSTREAM_REDIRECT');assert.equal(calls,1);});
