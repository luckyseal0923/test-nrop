-- NROP 個人 Supabase 練習版。僅建立 nrop_practice_* 物件，不使用原正式 NROP 資料表。
-- 在指定練習專案 SQL Editor 執行整份。可重跑，不會清空已存在的練習資料。
begin;
create table if not exists public.nrop_practice_workspaces (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check(revision > 0),
 state jsonb not null check(jsonb_typeof(state)='object'),
 updated_at timestamptz not null default now()
);
alter table public.nrop_practice_workspaces enable row level security;
revoke all on public.nrop_practice_workspaces from anon, authenticated;
grant select,insert,update on public.nrop_practice_workspaces to authenticated;
do $policy$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nrop_practice_workspaces' and policyname='nrop_practice_owner') then
  create policy nrop_practice_owner on public.nrop_practice_workspaces for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
 end if;
end $policy$;
create or replace function public.nrop_practice_read() returns jsonb
language plpgsql security invoker set search_path='' as $fn$
declare result jsonb;
begin
 if auth.uid() is null then raise exception '請先登入' using errcode='42501'; end if;
 insert into public.nrop_practice_workspaces(owner_id,state)
 values(auth.uid(), '{"records":[],"openings":[],"capacities":[{"unit":"6A","effectiveDate":"2000-01-01","beds":39,"version":1},{"unit":"6B","effectiveDate":"2000-01-01","beds":43,"version":1},{"unit":"7A","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"7B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"8A","effectiveDate":"2000-01-01","beds":32,"version":1},{"unit":"安寧病房","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"8B","effectiveDate":"2000-01-01","beds":33,"version":1},{"unit":"9A","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"9B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"10A","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"10B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"11A","effectiveDate":"2000-01-01","beds":40,"version":1},{"unit":"11B","effectiveDate":"2000-01-01","beds":45,"version":1},{"unit":"12B","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"精神科急性病房","effectiveDate":"2000-01-01","beds":30,"version":1},{"unit":"ICU-1","effectiveDate":"2000-01-01","beds":12,"version":1},{"unit":"ICU-2","effectiveDate":"2000-01-01","beds":24,"version":1},{"unit":"ICU-3","effectiveDate":"2000-01-01","beds":9,"version":1},{"unit":"NICU","effectiveDate":"2000-01-01","beds":3,"version":1},{"unit":"PICU","effectiveDate":"2000-01-01","beds":2,"version":1},{"unit":"BR","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"NBC","effectiveDate":"2000-01-01","beds":10,"version":1},{"unit":"燙傷中心","effectiveDate":"2000-01-01","beds":4,"version":1},{"unit":"急診","effectiveDate":"2000-01-01","beds":33,"version":1},{"unit":"產房","effectiveDate":"2000-01-01","beds":6,"version":1},{"unit":"手術室","effectiveDate":"2000-01-01","beds":11,"version":1},{"unit":"護理之家","effectiveDate":"2000-01-01","beds":39,"version":1},{"unit":"洗腎室","effectiveDate":"2000-01-01","beds":61,"version":1}],"audit":[],"pending":[]}'::jsonb || jsonb_build_object('recordStartDate',to_char(now() at time zone 'Asia/Taipei','YYYY-MM-DD')))
 on conflict(owner_id) do nothing;
 select jsonb_build_object('revision',revision,'state',state) into result from public.nrop_practice_workspaces where owner_id=auth.uid();
 return result;
end $fn$;
create or replace function public.nrop_practice_commit(p_expected_revision bigint,p_state jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $fn$
declare new_revision bigint; part text;
begin
 if auth.uid() is null then raise exception '請先登入' using errcode='42501'; end if;
 if jsonb_typeof(p_state) is distinct from 'object' then raise exception '資料格式不正確' using errcode='22023'; end if;
 foreach part in array array['records','openings','capacities','audit','pending'] loop
  if jsonb_typeof(p_state->part) is distinct from 'array' then raise exception '資料格式不正確' using errcode='22023'; end if;
 end loop;
 if jsonb_array_length(p_state->'audit')>500 or jsonb_array_length(p_state->'pending')>50 or octet_length(p_state::text)>8388608 then raise exception '已超過個人練習版容量' using errcode='22023'; end if;
 if not coalesce(p_state->>'recordStartDate','') ~ '^\d{4}-\d{2}-\d{2}$' then raise exception '起始日期不正確' using errcode='22023'; end if;
 update public.nrop_practice_workspaces set state=p_state,revision=revision+1,updated_at=now() where owner_id=auth.uid() and revision=p_expected_revision returning revision into new_revision;
 if new_revision is null then raise exception '資料版本衝突，請重新整理' using errcode='40001'; end if;
 return jsonb_build_object('revision',new_revision);
end $fn$;
revoke all on function public.nrop_practice_read() from public,anon;
revoke all on function public.nrop_practice_commit(bigint,jsonb) from public,anon;
grant execute on function public.nrop_practice_read() to authenticated;
grant execute on function public.nrop_practice_commit(bigint,jsonb) to authenticated;
create or replace view public.nrop_practice_records with(security_invoker=true) as
select w.owner_id,(r->>'date')::date report_date,r->>'shift' shift,r->>'unit' unit,
 r->'record'->>'status' status,(r->'record'->>'staff')::numeric staff,
 (r->'record'->>'patients')::integer patients,(r->'record'->>'opening')::integer opening,
 coalesce((r->'record'->>'住院')::integer,(r->'record'->>'admitted')::integer) admitted,
 coalesce((r->'record'->>'出院')::integer,(r->'record'->>'discharged')::integer) discharged,
 (r->'record'->>'轉入')::integer transfer_in,(r->'record'->>'轉出')::integer transfer_out,
 (r->'record'->>'病危')::integer critical,
 coalesce((r->'record'->>'死亡')::integer,(r->'record'->>'deaths')::integer) deaths,
 (r->'record'->>'visits')::numeric visits,
 (r->'record'->>'referralIn')::numeric referral_in,
 (r->'record'->>'referralOut')::numeric referral_out,
 (r->'record'->>'observation')::numeric observation,
 (r->'record'->>'surgeries')::numeric surgeries,
 (r->'record'->>'waiting')::numeric waiting,
 (r->'record'->>'cesarean')::numeric cesarean,
 (r->'record'->>'naturalBirth')::numeric natural_birth,
 (r->'record'->>'drSurgery')::numeric dr_surgery,
 (r->'record'->>'inCount')::numeric in_count,
 (r->'record'->>'outCount')::numeric out_count,
 (r->'record'->>'nurseStaff')::numeric nurse_staff,
 (r->'record'->>'aideStaff')::numeric aide_staff,
 (r->'record'->>'residents')::numeric residents,
 (r->'record'->>'occupiedBeds')::numeric occupied_beds,
 (r->'record'->>'reserved')::numeric reserved,
 (r->'record'->>'hemodialysisOutpatient')::numeric hemodialysis_outpatient,
 (r->'record'->>'hemodialysisInpatient')::numeric hemodialysis_inpatient,
 (r->'record'->>'hemodialysisCritical')::numeric hemodialysis_critical,
 (r->'record'->>'peritonealDialysis')::numeric peritoneal_dialysis,
 (r->'record'->>'住院本科')::numeric admitted_specialty,
 (r->'record'->>'住院非本科')::numeric admitted_other_specialty,
 (r->'record'->>'住院一般病房')::numeric admitted_general_ward,
 (r->'record'->>'住院負壓隔離')::numeric admitted_isolation,
 (r->'record'->>'version')::integer version,(r->'record'->>'updatedAt')::timestamptz updated_at,r->'record' payload
from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'records') r;
create or replace view public.nrop_practice_openings with(security_invoker=true) as
 select w.owner_id,r->>'unit_id' unit,(r->>'report_date')::date report_date,r->>'shift' shift,(r->>'patients')::integer patients
 from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'openings') r;
create or replace view public.nrop_practice_capacities with(security_invoker=true) as
 select w.owner_id,r->>'unit' unit,(r->>'effectiveDate')::date effective_date,(r->>'beds')::integer beds,(r->>'version')::integer version,r->>'reason' reason
 from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'capacities') r;
create or replace view public.nrop_practice_audit with(security_invoker=true) as
 select w.owner_id,(r->>'created_at')::timestamptz created_at,r->>'action' action,r->>'target' target,r->'before' before,r->'after' after
 from public.nrop_practice_workspaces w cross join lateral jsonb_array_elements(w.state->'audit') r;
revoke all on public.nrop_practice_records,public.nrop_practice_openings,public.nrop_practice_capacities,public.nrop_practice_audit from public,anon;
grant select on public.nrop_practice_records,public.nrop_practice_openings,public.nrop_practice_capacities,public.nrop_practice_audit to authenticated;
notify pgrst,'reload schema';
commit;
