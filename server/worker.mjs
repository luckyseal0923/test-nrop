import{handleApiRequest,supabaseConfig}from'./supabase-api.mjs';
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store'};
export async function handleRequest(request,env,assets,remoteFetch=fetch){
 const path=new URL(request.url).pathname;
 if(path.startsWith('/api/'))return handleApiRequest(request,env,remoteFetch);
 if(!['GET','HEAD'].includes(request.method))return new Response('不支援的請求方法',{status:405,headers});
 const asset=assets[path==='/'?'/index.html':path];if(!asset)return new Response('找不到頁面',{status:404,headers});
 const backend=supabaseConfig(env).supabaseUrl||'';
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{status:200,headers:{...headers,'Content-Type':asset.type,'Content-Security-Policy':`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${backend}; object-src 'none'; base-uri 'none'; form-action 'self'`}});
}
