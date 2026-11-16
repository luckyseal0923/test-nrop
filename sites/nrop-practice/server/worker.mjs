const methods = new Set(['nrop_public_config','nrop_list_records','nrop_list_openings','nrop_save_record','nrop_set_opening','nrop_list_bed_capacities','nrop_admin_bed_settings','nrop_prepare_bed_change','nrop_confirm_bed_change','nrop_admin_audit']);
const baseHeaders = {'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store'};
function json(status, value) { return new Response(JSON.stringify(value),{status,headers:{...baseHeaders,'Content-Type':'application/json; charset=utf-8'}}); }
async function inputText(request) {
  if (Number(request.headers.get('content-length')) > 32000) throw new RangeError('資料超過大小限制');
  const reader = request.body?.getReader(); if (!reader) return '';
  const chunks = []; let total=0;
  while (true) { const {done,value}=await reader.read(); if(done)break; total+=value.byteLength; if(total>32000){await reader.cancel();throw new RangeError('資料超過大小限制');}chunks.push(value); }
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return new TextDecoder().decode(bytes);
}
export async function handleRequest(request, env, assets, remoteFetch=fetch) {
  const url=new URL(request.url), path=url.pathname;
  // Sites supplies this identity after its owner-only access check. Never accept an identity from the request body.
  if (!request.headers.get('oai-authenticated-user-id')) {
    if (path.startsWith('/api/')) return json(401,{error:{message:'請先使用網站擁有者的 ChatGPT 帳號登入。'}});
    return new Response('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>請登入</title><p>請登入以開啟私人練習工作區。</p><a href="/signin-with-chatgpt?return_to=/" target="_top">使用 ChatGPT 登入</a></html>',{status:401,headers:{...baseHeaders,'Content-Type':'text/html; charset=utf-8'}});
  }
  if (path.startsWith('/api/')) {
    if (request.headers.get('origin') && request.headers.get('origin')!==url.origin) return json(403,{error:{message:'僅允許本站操作'}});
    const configured=!!env.SHEETS_API_URL && typeof env.SHEETS_API_TOKEN==='string' && env.SHEETS_API_TOKEN.length>=32;
    if(path==='/api/connection' && request.method==='GET') return json(200,{configured,hosted:true,spreadsheetUrl:env.SHEETS_DOCUMENT_URL||''});
    if(path!=='/api/nrop') return json(404,{error:{message:'找不到資料服務'}});
    if(request.method!=='POST') return json(405,{error:{message:'不支援的請求方法'}});
    if(request.headers.get('origin')!==url.origin) return json(403,{error:{message:'僅允許本站操作'}});
    if(!configured || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.SHEETS_API_URL)) return json(503,{error:{message:'Google 讀寫服務尚未完成設定。'}});
    let input;
    try { input=JSON.parse(await inputText(request)); } catch(e) {return json(e instanceof RangeError?413:400,{error:{message:e instanceof RangeError?e.message:'請求內容不正確'}});}
    if(!input || !methods.has(input.method) || (input.params!=null && (typeof input.params!=='object' || Array.isArray(input.params)))) return json(400,{error:{message:'不支援的資料操作'}});
    try {
      const response=await remoteFetch(env.SHEETS_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:env.SHEETS_API_TOKEN,method:input.method,params:input.params||{}}),redirect:'follow',signal:AbortSignal.timeout(45000)});
      if(!response.ok) throw new Error('upstream');
      const result=await response.json();
      if(!result || (result.error && typeof result.error.message!=='string') || (!Object.hasOwn(result,'data')&&!result.error)) throw new Error('format');
      return json(200,result);
    }catch{return json(502,{error:{message:'Google 試算表連線中斷或回應異常，請重新整理確認儲存結果；系統不會自動重送。'}});}
  }
  if(!['GET','HEAD'].includes(request.method)) return new Response('不支援的請求方法',{status:405,headers:baseHeaders});
  const asset=assets[path==='/'?'/index.html':path];
  if(!asset)return new Response('找不到頁面',{status:404,headers:baseHeaders});
  const headers={...baseHeaders,'Content-Type':asset.type,'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"};
  return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{status:200,headers});
}
