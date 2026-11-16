import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(existsSync('.env.local')){console.log('.env.local 已存在，未覆寫');}
else{writeFileSync('.env.local',`# 僅供本機 Node.js 使用，請勿上傳或改成 VITE_ 變數\nSHEETS_API_URL=\nSHEETS_API_TOKEN=${randomBytes(32).toString('hex')}\nSHEETS_DOCUMENT_URL=https://docs.google.com/spreadsheets/d/1LjhAJbjXU3PYkNw511ciSqmhQxQXUfdybqQyKddnlRM/edit\nPORT=4178\n`,{mode:0o600});console.log('已建立 .env.local，密鑰只存本機檔案，未輸出到畫面');}
