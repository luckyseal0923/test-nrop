import {existsSync,writeFileSync,readFileSync} from 'node:fs';
if(existsSync('.env.local')){console.log('.env.local 已存在，未覆寫');}
else{writeFileSync('.env.local',readFileSync('.env.example','utf8'),{mode:0o600});console.log('已建立空白 Supabase 設定，請填入專案網址與 publishable key。');}
