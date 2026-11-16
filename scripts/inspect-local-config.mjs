import {readFile,access} from 'node:fs/promises';
import {parseEnv} from 'node:util';
for (const file of ['.env.local','env.local','.env']) {
  try { await access(file); } catch { continue; }
  const env=parseEnv(await readFile(file,'utf8'));
  console.log(JSON.stringify({file,entries:Object.entries(env).map(([key,value])=>{
    const kind=value.startsWith('sb_secret_')?'secret':value.startsWith('sb_publishable_')?'publishable':value.startsWith('eyJ')?'jwt':/^https?:/.test(value)?'url':value?'configured':'empty';
    let role; if(kind==='jwt')try{role=JSON.parse(Buffer.from(value.split('.')[1],'base64url')).role;}catch{}
    return {key,kind,...(role?{role}:{}),...(/SUPABASE.*URL/.test(key)&&kind==='url'?{url:value}:{})};
  })}));
}
