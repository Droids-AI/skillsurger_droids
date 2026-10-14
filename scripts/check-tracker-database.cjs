const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create schema storage;
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
      create table storage.buckets(id text primary key,public boolean);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      create policy "legacy broad access" on storage.objects for all to public using(true) with check(true);
      grant usage on schema auth,storage,public to anon,authenticated,service_role;
      grant all on storage.objects to anon,authenticated,service_role;
      create table public.profiles(id uuid primary key,cv_url text);
      insert into storage.buckets values('cvs',true),('other',true);
      insert into storage.objects(bucket_id,name) values('cvs','11111111-1111-1111-1111-111111111111/test.pdf'),('other','public.txt');
      insert into public.profiles values('11111111-1111-1111-1111-111111111111','https://example.supabase.co/storage/v1/object/public/cvs/11111111-1111-1111-1111-111111111111/test.pdf');
    `);
    await db.exec(fs.readFileSync('supabase/migrations/20260706071747_add_leads_table.sql','utf8'));
    const registrationSQL = fs.readFileSync('supabase/migrations/20261012000000_webinar_registration_and_outbox.sql','utf8');
    const rescheduleSQL = fs.readFileSync('supabase/migrations/20261014000000_reschedule_webinar_october_24.sql','utf8');
    // Keep this local regression repeatable after the actual webinar expires.
    await db.exec(registrationSQL.replace("'2026-10-17 15:00:00+05:30'", "'2099-10-17 15:00:00+05:30'"));
    const existingPayload = {name:'Existing registrant',email:'existing@example.com',sessionId:'job-switch-2026-10-17',startsAt:'2026-10-17T15:00:00+05:30'};
    const existing = (await db.query('select register_webinar($1,$2::jsonb) as result',['job-switch-2026-10-17',JSON.stringify(existingPayload)])).rows[0].result;
    await db.exec(rescheduleSQL.replace("'2026-10-24 15:00:00+05:30'", "'2099-10-24 15:00:00+05:30'"));
    const moved = (await db.query('select register_webinar($1,$2::jsonb) as result',['job-switch-2026-10-24',JSON.stringify(existingPayload)])).rows[0].result;
    assert.equal(moved.registrationId,existing.registrationId);
    assert.equal(moved.alreadyRegistered,true);
    const movedLead = (await db.query("select payload from leads where payload->>'email'='existing@example.com'")).rows[0].payload;
    assert.equal(movedLead.sessionId,'job-switch-2026-10-24');
    assert.equal(movedLead.startsAt,'2026-10-24T15:00:00+05:30');
    await assert.rejects(db.query('select register_webinar($1,$2::jsonb)',['job-switch-2026-10-17',JSON.stringify(existingPayload)]),/Registration closed/);
    await db.exec('delete from webinar_notifications; delete from webinar_registrations; delete from leads');
    await db.exec(fs.readFileSync('supabase/migrations/20261012010000_private_cv_storage.sql','utf8'));
    assert.equal((await db.query("select public from storage.buckets where id='cvs'")).rows[0].public,false);
    assert.equal((await db.query('select cv_url from public.profiles')).rows[0].cv_url,'11111111-1111-1111-1111-111111111111/test.pdf');

    await db.exec('set role anon');
    assert.equal((await db.query("select * from storage.objects where bucket_id='cvs'")).rows.length,0);
    assert.equal((await db.query("select * from storage.objects where bucket_id='other'")).rows.length,1,'Other buckets retain their policies');
    await assert.rejects(db.query("select register_webinar('job-switch-2026-10-24','{}'::jsonb)"),/permission denied/);
    await assert.rejects(db.query('select * from webinar_registrations'),/permission denied/);
    await db.exec('reset role');

    await db.exec("set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false)");
    assert.equal((await db.query("select * from storage.objects where bucket_id='cvs'")).rows.length,1);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('cvs','22222222-2222-2222-2222-222222222222/steal.pdf')"),/row-level security/);
    await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false)");
    assert.equal((await db.query("select * from storage.objects where bucket_id='cvs'")).rows.length,0);
    assert.equal((await db.query("delete from storage.objects where bucket_id='cvs' returning id")).rows.length,0);
    await db.exec('reset role');

    const payload = {name:'Synthetic QA', email:' Test@example.com ', phoneNumber:'+919876543210'};
    const register = input => db.query('select register_webinar($1,$2::jsonb) as result',['job-switch-2026-10-24',JSON.stringify(input)]).then(r=>r.rows[0].result);
    const first = await register(payload);
    assert.equal(first.alreadyRegistered,false);
    const results = await Promise.all(Array.from({length:8},()=>register({...payload,email:'test@example.com'})));
    assert.ok(results.every(r=>r.alreadyRegistered && r.registrationId===first.registrationId));
    assert.equal((await db.query('select count(*)::integer as count from leads')).rows[0].count,1);
    assert.equal((await db.query('select count(*)::integer as count from webinar_notifications')).rows[0].count,1);
    assert.equal((await db.query("select payload->>'name' as name from leads")).rows[0].name,'Synthetic QA');
    for(let i=0;i<10;i++) assert.equal((await db.query("select webinar_rate_limit('synthetic-ip') as allowed")).rows[0].allowed,true);
    assert.equal((await db.query("select webinar_rate_limit('synthetic-ip') as allowed")).rows[0].allowed,false);
    await db.exec("update webinar_rate_limits set window_start=now()-interval '11 minutes'");
    assert.equal((await db.query("select webinar_rate_limit('synthetic-ip') as allowed")).rows[0].allowed,true);
    // Verify the real close condition in an expired-session variant.
    await db.exec(rescheduleSQL.slice(rescheduleSQL.indexOf('create or replace function public.register_webinar')).replace("'2026-10-24 15:00:00+05:30'","'2000-10-24 15:00:00+05:30'"));
    await assert.rejects(register({...payload,email:'new@example.com'}),/Registration closed/);
    assert.equal((await db.query('select count(*)::integer as count from leads')).rows[0].count,1);
    console.log('PASS: PostgreSQL registration uniqueness, original record preservation, outbox uniqueness, anonymous RPC/read denial, rate limits, expiry, private bucket, owner/non-owner RLS and legacy broad-policy fence. Synthetic in-memory database only.');
  } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
