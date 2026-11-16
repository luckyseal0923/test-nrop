import {createServer} from 'node:http';
import {loadEnvFile} from 'node:process';
import worker from '../dist/server/index.js';
for(const file of ['.env.local','../../.env.local']){try{loadEnvFile(file);break;}catch(e){if(e.code!=='ENOENT')throw e;}}
createServer(async(req,res)=>{
  try{
    const chunks=[];for await(const c of req)chunks.push(c);
    const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-preview-owner');
    const request=new Request('http://127.0.0.1:5180'+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await worker.fetch(request,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('預覽服務無法使用');}
}).listen(5180,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5180/ (本機預覽使用合成身份；正式站由 Sites 驗證登入)'));
