import {build} from 'vite';
import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,extname,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
await build({root,configFile:false,build:{outDir:'.frontend',emptyOutDir:true}});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const assets={};
async function scan(dir,base=''){for(const f of await readdir(dir,{withFileTypes:true})){const name=base+'/'+f.name,p=join(dir,f.name);if(f.isDirectory())await scan(p,name);else assets[name]={type:mime[extname(f.name)]||'application/octet-stream',data:(await readFile(p)).toString('base64')};}}
await scan(join(root,'.frontend'));
await mkdir('.sites-runtime',{recursive:true});
await writeFile('.sites-runtime/worker-entry.mjs',"import{handleRequest}from'../server/worker.mjs';\nconst assets="+JSON.stringify(assets)+';\nexport default {fetch(request,env){return handleRequest(request,env,assets);}};\n');
await build({root,configFile:false,ssr:{target:'webworker',noExternal:true},build:{ssr:resolve('.sites-runtime/worker-entry.mjs'),outDir:'dist',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'server/index.js',format:'es'}}}});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker 已包含前端與 Supabase API，登入權限由 Supabase Auth／RLS 驗證。');
