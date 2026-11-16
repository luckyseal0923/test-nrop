import{handleApiRequest}from'./supabase-api.mjs';
export function nropMiddleware(env,remoteFetch=fetch){return async(req,res,next=()=>{res.writeHead(404);res.end();})=>{
 const path=req.url?.split('?')[0];if(!['/api/connection','/api/nrop'].includes(path))return next();
 if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')){res.writeHead(403);return res.end();}
 try{
  const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>32000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'資料超過大小限制'}}));return;}chunks.push(c);}
  const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  const response=await handleApiRequest(request,env,remoteFetch);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'資料服務目前無法使用'}}));}
};}
