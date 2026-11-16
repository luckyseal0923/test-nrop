import{readdirSync}from'node:fs';import{execFileSync}from'node:child_process';
const files=['tests','sites/nrop-practice/tests'].flatMap(dir=>readdirSync(dir).filter(f=>f.endsWith('.test.mjs')).map(f=>dir+'/'+f));
execFileSync(process.execPath,['--test',...files],{stdio:'inherit'});
