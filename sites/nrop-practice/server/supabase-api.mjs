import {transact} from '../src/data-model.js';
export const methods=new Set(['nrop_public_config','nrop_list_records','nrop_list_openings','nrop_save_record','nrop_set_opening','nrop_list_bed_capacities','nrop_admin_bed_settings','nrop_prepare_bed_change','nrop_confirm_bed_change','nrop_admin_audit']);
const mutations=new Set(['nrop_save_record','nrop_set_opening','nrop_prepare_bed_change','nrop_confirm_bed_change']);
export function supabaseConfig(env){
 const url=(env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL||env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
 const key=env.SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)&&key.startsWith('sb_publishable_');
 return{configured,provider:'supabase',...(configured?{supabaseUrl:url,supabasePublishableKey:key}:{})};
}
export function json(status,value){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function readInput(request){
 if(Number(request.headers.get('content-length'))>32000)throw new RangeError('資料超過大小限制');
 const reader=request.body?.getReader();if(!reader)return{};const chunks=[];let total=0;
 while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>32000){await reader.cancel();throw new RangeError('資料超過大小限制');}chunks.push(value);}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleApiRequest(request,env,remoteFetch=fetch){
 const url=new URL(request.url),path=url.pathname,cfg=supabaseConfig(env);
 if(path==='/api/connection'&&request.method==='GET')return json(200,cfg);
 if(path!=='/api/nrop')return json(404,{error:{message:'找不到資料服務'}});
 if(request.method!=='POST')return json(405,{error:{message:'不支援的請求方法'}});
 if(request.headers.get('origin')!==url.origin)return json(403,{error:{message:'僅允許本站操作'}});
 if(!cfg.configured)return json(503,{error:{message:'Supabase 尚未完成連線設定。'}});
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization))return json(401,{error:{message:'請先登入 Supabase 練習帳號。',code:'AUTH_REQUIRED'}});
 let input;try{input=await readInput(request);}catch(e){return json(e instanceof RangeError?413:400,{error:{message:e instanceof RangeError?e.message:'請求內容不正確'}});}
 if(!input||!methods.has(input.method)||(input.params!=null&&(typeof input.params!=='object'||Array.isArray(input.params))))return json(400,{error:{message:'不支援的資料操作'}});
 async function db(name,body){
  // Workers implements follow/manual; "error" throws before any network request.
  const response=await remoteFetch(cfg.supabaseUrl+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:cfg.supabasePublishableKey,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000),redirect:'manual'});
  if(response.status>=300&&response.status<400)throw Object.assign(new Error('Supabase 服務網址回應重新導向，請確認連線設定。'),{status:502,code:'UPSTREAM_REDIRECT'});
  const value=await response.json();
  if(!response.ok){
   if(response.status===401||value.code==='PGRST301')throw Object.assign(new Error('登入已失效，請重新登入後再操作。'),{status:401,code:'AUTH_REQUIRED'});
   if(value.code==='PGRST202'||value.code==='42P01')throw Object.assign(new Error('Supabase 資料表尚未初始化，請先執行 supabase/INSTALL.sql。'),{status:503,code:'NOT_INITIALIZED'});
   if(value.code==='40001')throw Object.assign(new Error('練習資料已由其他視窗更新，請重新整理後再儲存。'),{status:409,code:'40001'});
   throw Object.assign(new Error('Supabase 讀寫失敗，請確認資料表與帳號權限。'),{status:502,code:value.code||'SUPABASE_ERROR'});
  }return value;
 }
 try{
  const snapshot=await db('nrop_practice_read',{});
  if(!Number.isSafeInteger(snapshot?.revision)||!snapshot?.state)throw new Error('snapshot');
  const result=transact(snapshot.state,input.method,{...(input.params||{}),p_requestId:crypto.randomUUID()});
  if(mutations.has(input.method))await db('nrop_practice_commit',{p_expected_revision:snapshot.revision,p_state:result.state});
  return json(200,{data:result.data});
 }catch(e){
  if(e.code==='22023'||e.code==='40001')return json(e.status||400,{error:{message:e.message,code:e.code}});
  if(e.status)return json(e.status,{error:{message:e.message,code:e.code}});
  return json(502,{error:{message:'Supabase 連線中斷或回應異常，請重新整理確認儲存結果；系統不會自動重送。',code:'SUPABASE_ERROR'}});
 }
}
