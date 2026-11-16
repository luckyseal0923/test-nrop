import {cp,mkdir,readFile,readdir,lstat,writeFile,realpath,unlink,access} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {execFileSync} from 'node:child_process';
import {resolve,relative,join,sep} from 'node:path';
const source=resolve('.'),target=resolve('outputs/github-test-nrop');
if(!target.startsWith(resolve('outputs')+sep))throw new Error('匯出位置必須在 outputs 內');
await realpath(join(target,'.git'));
const safePreviews=new Set(['新版首頁.jpg','Google讀寫重載驗證.jpg','ChatGPT私人網站發布與重讀.jpg','試算表數字欄位修正.jpg','Supabase登入入口.jpg']);
const excluded=new Set(['.git','node_modules','dist','.frontend','outputs','coverage','.sites-runtime','.sites-checkout']);
async function include(path){
 const parts=relative(source,path).replaceAll('\\','/').split('/'),name=parts.at(-1);
 if(parts.some(p=>excluded.has(p)))return false;
 if((name.startsWith('.env')&&name!=='.env.example')||name==='env.local')return false;
 if(name==='.clasp.json'||name.endsWith('.log'))return false;
 if(parts.includes('previews')&&!safePreviews.has(name)&&!(await lstat(path)).isDirectory())return false;
 if((await lstat(path)).isSymbolicLink())throw new Error('請先檢查來源的符號連結：'+parts.join('/'));
 return true;
}
for(const name of ['.env.example','.gitignore','README.md','index.html','package.json','package-lock.json','vite.config.js','src','assets','supabase','server','tests','scripts','docs'])await cp(join(source,name),join(target,name),{recursive:true,filter:include});
await mkdir(join(target,'sites'),{recursive:true});
await cp(join(source,'sites/nrop-practice'),join(target,'sites/nrop-practice'),{recursive:true,filter:include});
// Mirror removed tracked source files only; never recursively delete a directory.
const tracked=execFileSync('git',['ls-files','-z'],{cwd:target,encoding:'utf8'}).split('\0').filter(Boolean);
for(const path of tracked){
 try{await access(join(source,path));}catch(e){if(e.code!=='ENOENT')throw e;const destination=resolve(target,path);if(!destination.startsWith(target+sep))throw new Error('移除位置超出工作副本');try{await unlink(destination);}catch(err){if(err.code!=='ENOENT')throw err;}}
}
// Exact local key check, plus common credential patterns. Report file paths only.
const local=parseEnv(await readFile('.env.local','utf8'));
const keys=Object.entries(local).filter(([name,value])=>/KEY|TOKEN|PASSWORD|SECRET/.test(name)&&value.length>=16).map(([,value])=>value);
const paths=[];
async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(excluded.has(e.name))continue;const path=join(dir,e.name);if(e.isDirectory())await scan(path);else{
 const rel=relative(target,path).replaceAll('\\','/'),data=await readFile(path);
 if(keys.some(key=>data.includes(Buffer.from(key))))throw new Error('連線金鑰檢查未通過：'+rel);
 if((e.name.startsWith('.env')&&e.name!=='.env.example')||e.name==='env.local')throw new Error('不應匯出的設定：'+rel);
 if(rel.startsWith('docs/previews/')&&!safePreviews.has(e.name))throw new Error('不應匯出的授權截圖：'+rel);
 if(/\.(mjs|js|gs|md|json|html|css|yml|yaml|txt)$/.test(e.name)&&/(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(data.toString('utf8')))throw new Error('憑證格式檢查未通過：'+rel);
 paths.push(rel);
}}}
await scan(target);
await writeFile(resolve('outputs/github-export-manifest.json'),JSON.stringify({target,files:paths.sort(),secretScan:'passed'},null,2));
console.log(JSON.stringify({target,files:paths.length,secretScan:'passed',authScreenshots:'excluded',nestedGitMetadata:'excluded'}));
