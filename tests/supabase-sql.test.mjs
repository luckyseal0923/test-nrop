import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{PGlite}from'@electric-sql/pglite';import{transact}from'../src/data-model.js';
test('真實 PostgreSQL 引擎驗證建表、RLS、數字欄位、版本衝突及重跑保留資料',async()=>{
 const db=new PGlite();const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;`);
  const sql=readFileSync('supabase/INSTALL.sql','utf8');await db.exec(sql);
  async function role(name,uid=''){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role '+name);}
  await role('anon');await assert.rejects(db.query('select public.nrop_practice_read()'),e=>e.code==='42501');await assert.rejects(db.query('select * from public.nrop_practice_records'),e=>e.code==='42501');
  await role('authenticated',a);let snapshot=(await db.query('select public.nrop_practice_read() value')).rows[0].value;assert.equal(snapshot.state.capacities.length,28);assert.equal(snapshot.state.records.length,0);
  const next=transact(snapshot.state,'nrop_save_record',{p_date:snapshot.state.recordStartDate,p_shift:'E',p_unit:'急診',p_status:'submitted',p_version:0,p_payload:{staff:2.125,visits:7,referralIn:2,referralOut:0,admitted:1,observation:3,deaths:0,surgeries:0}}).state;
  await db.query('select public.nrop_practice_commit($1,$2)',[1,next]);
  const row=(await db.query('select staff,admitted,deaths,visits,observation,referral_in,referral_out,patients,transfer_in from public.nrop_practice_records')).rows[0];
  assert.equal(Number(row.staff),2.125);assert.equal(row.admitted,1);assert.equal(row.deaths,0);assert.equal(Number(row.visits),7);assert.equal(Number(row.observation),3);assert.equal(Number(row.referral_in),2);assert.equal(Number(row.referral_out),0);assert.equal(row.patients,null);assert.equal(row.transfer_in,null);
  await assert.rejects(db.query('select public.nrop_practice_commit($1,$2)',[1,next]),e=>e.code==='40001');
  await assert.rejects(db.query('select public.nrop_practice_commit($1,$2)',[2,{}]),e=>e.code==='22023');
  snapshot=(await db.query('select public.nrop_practice_read() value')).rows[0].value;assert.equal(snapshot.revision,2);assert.equal(snapshot.state.records.length,1);
  await role('authenticated',b);assert.equal((await db.query('select * from public.nrop_practice_records')).rows.length,0);await db.query('select public.nrop_practice_read()');
  assert.equal((await db.query('select * from public.nrop_practice_capacities')).rows.length,28);
  assert.equal((await db.query('update public.nrop_practice_workspaces set revision=999 where owner_id=$1 returning revision',[a])).rows.length,0);
  await assert.rejects(db.query('insert into public.nrop_practice_workspaces(owner_id,state) values($1,$2)',[a,next]),e=>e.code==='42501');
  await role('postgres');await db.exec(sql);await role('authenticated',a);const after=(await db.query('select public.nrop_practice_read() value')).rows[0].value;assert.equal(after.revision,2);assert.deepEqual(after.state,snapshot.state);
 }finally{await db.close();}
});
