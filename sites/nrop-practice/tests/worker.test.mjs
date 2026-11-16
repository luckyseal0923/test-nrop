import test from'node:test';import assert from'node:assert/strict';import{handleRequest}from'../server/worker.mjs';
const url='https://nrop.example',env={SUPABASE_URL:'https://gvyxlgunphusxxruvytn.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
test('公開入口與示範不需要 ChatGPT 身份，雲端資料 API 必須登入 Supabase',async()=>{
 const assets={'/index.html':{type:'text/html',data:Buffer.from('<h1>NROP</h1>').toString('base64')}};
 const page=await handleRequest(new Request(url),env,assets);assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/gvyxlgunphusxxruvytn/);
 const api=await handleRequest(new Request(url+'/api/nrop',{method:'POST',headers:{origin:url},body:'{}'}),env,assets,()=>assert.fail('匿名不可接觸資料庫'));assert.equal(api.status,401);
 assert.equal((await handleRequest(new Request(url+'/.env.local'),env,assets)).status,404);
});
