import {build} from 'vite';
import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
const root=resolve('.');
await build({root,configFile:false,build:{outDir:'.frontend',emptyOutDir:true}});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const assets={};
async function scan(dir,base=''){for(const f of await readdir(dir,{withFileTypes:true})){const name=base+'/'+f.name,p=join(dir,f.name);if(f.isDirectory())await scan(p,name);else assets[name]={type:mime[extname(f.name)]||'application/octet-stream',data:(await readFile(p)).toString('base64')};}}
await scan(join(root,'.frontend'));
const code=await readFile('server/worker.mjs','utf8');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',code+'\nconst assets='+JSON.stringify(assets)+';\nexport default {fetch(request,env){return handleRequest(request,env,assets);}};\n');
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker 已包含前端與受保護的 Google 讀寫服務，未嵌入環境變數。');
