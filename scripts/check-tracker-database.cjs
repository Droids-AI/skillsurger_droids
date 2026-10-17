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
      create table public.profiles(id uuid primary key,cv_url text, city text, preferred_locations text[]);
      insert into storage.buckets values('cvs',true),('other',true);
      insert into storage.objects(bucket_id,name) values('cvs','11111111-1111-1111-1111-111111111111/test.pdf'),('other','public.txt');
      insert into public.profiles(id,cv_url) values('11111111-1111-1111-1111-111111111111','https://example.supabase.co/storage/v1/object/public/cvs/11111111-1111-1111-1111-111111111111/test.pdf');
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

    const confirmationSQL = fs.readFileSync('supabase/migrations/20261014010000_lead_confirmations_and_audit_validation.sql','utf8');
    await db.exec("update profiles set preferred_locations=array['Bangalore']");
    await db.exec(confirmationSQL.replace("'2026-10-24 15:00:00+05:30'","'2099-10-24 15:00:00+05:30'"));
    assert.equal((await db.query('select city from profiles')).rows[0].city,'Bangalore');
    await db.exec('grant insert on leads to anon; set role anon');
    await assert.rejects(db.query("select register_resume_audit('11111111-1111-4111-8111-111111111111','{}'::jsonb)"),/permission denied/);
    await assert.rejects(db.query("insert into leads(form_type,payload) values('resume_audit','{}'::jsonb)"),/row-level security/);
    await assert.rejects(db.query('select * from lead_email_notifications'),/permission denied/);
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
    const auditPayload={fullName:'Synthetic Audit',email:'audit@example.com',resumeStoragePath:'11111111-1111-4111-8111-111111111111/resume.pdf'};
    const audit=()=>db.query('select register_resume_audit($1,$2::jsonb) as result',['11111111-1111-4111-8111-111111111111',JSON.stringify(auditPayload)]).then(result=>result.rows[0].result);
    const receipt=await audit();
    assert.equal(receipt.alreadyRegistered,false);
    const repeated=await Promise.all(Array.from({length:5},audit));
    assert.ok(repeated.every(result=>result.alreadyRegistered&&result.leadId===receipt.leadId));
    assert.equal((await db.query("select count(*)::integer as count from leads where form_type='resume_audit'")).rows[0].count,1);

    // Payments, attendance, CRM stages, reminders and Google Ads export.
    await db.exec(fs.readFileSync('supabase/migrations/20261017000000_job_switch_payments_and_funnel.sql','utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261017010000_webinar_reminders_attendance_ads.sql','utf8'));
    await db.exec(`update leads set payload = payload || '{"gclid":"gclid-test","stage":"Registered"}' where payload->>'email'='test@example.com'`);
    const attended=(await db.query("select mark_webinar_attended('job-switch-2026-10-24', array[' TEST@example.com','nobody@example.com']) as r")).rows[0].r;
    assert.equal(attended.matched,1);assert.deepEqual(attended.unmatched,['nobody@example.com']);
    let webinarLead=(await db.query("select payload from leads where payload->>'email'='test@example.com'")).rows[0].payload;
    assert.equal(webinarLead.stage,'Attended');assert.equal(webinarLead.attended,'yes');
    assert.equal((await db.query("select set_lead_stage('test@example.com','Sales Follow-up','Saurav') as n")).rows[0].n,1);
    await assert.rejects(db.query("select set_lead_stage('test@example.com','Won')"),/Unknown stage/);
    await db.query("select mark_webinar_attended('job-switch-2026-10-24', array['test@example.com'])");
    assert.equal((await db.query("select payload->>'stage' as s from leads where payload->>'email'='test@example.com'")).rows[0].s,'Sales Follow-up','Attendance never moves a lead backwards');
    const pay=(id,type,extra)=>db.query('select record_payment_event($1::jsonb) as r',[JSON.stringify({event_id:id,event_type:type,payment_id:'pay_1',raw:{},...extra})]).then(r=>r.rows[0].r);
    await pay('evt_1','payment.succeeded',{customer_email:'Test@example.com',amount_minor:500000,currency:'INR'});
    assert.equal((await pay('evt_1','payment.succeeded',{customer_email:'test@example.com'})).duplicate,true);
    webinarLead=(await db.query("select payload from leads where payload->>'email'='test@example.com'")).rows[0].payload;
    assert.equal(webinarLead.stage,'Paid');assert.equal(webinarLead.paymentStatus,'paid');
    const ads=(await db.query('select * from google_ads_offline_conversions')).rows;
    assert.equal(ads.length,1);assert.equal(ads[0]['Google Click ID'],'gclid-test');assert.equal(Number(ads[0]['Conversion Value']),5000);
    assert.equal(ads[0]['Email'],require('node:crypto').createHash('sha256').update('test@example.com').digest('hex'));
    assert.match(ads[0]['Conversion Time'],/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\+05:30$/);
    const funnel=(await db.query('select sum(webinar_registrations)::int as reg, sum(webinar_attended)::int as att, sum(purchases)::int as buys, sum(net_revenue_inr)::numeric as net from funnel_daily')).rows[0];
    assert.deepEqual([funnel.reg,funnel.att,funnel.buys,Number(funnel.net)],[1,1,1,5000]);
    await pay('evt_2','refund.succeeded',{amount_minor:500000});
    assert.equal((await db.query('select count(*)::int as n from google_ads_offline_conversions')).rows[0].n,0,'Refunded purchases are not uploaded');
    assert.equal((await db.query("select payload->>'stage' as s from leads where payload->>'email'='test@example.com'")).rows[0].s,'Refunded');
    await db.query("insert into webinar_reminders(registration_id,stage,channel) values($1,'reminder_24h','email')",[first.registrationId]);
    await assert.rejects(db.query("insert into webinar_reminders(registration_id,stage,channel) values($1,'reminder_24h','email')",[first.registrationId]),/duplicate key/);
    await db.exec('set role anon');
    for (const sql of ["select * from webinar_reminders","select * from messaging_opt_outs","select * from google_ads_offline_conversions","select * from funnel_daily","select * from payments","select set_lead_stage('test@example.com','Paid')","select mark_webinar_attended('job-switch-2026-10-24','{}')"]) {
      await assert.rejects(db.query(sql),/permission denied/,sql);
    }
    await db.exec('reset role');
    console.log('PASS: PostgreSQL registration uniqueness, original record preservation, outbox uniqueness, anonymous RPC/read denial, rate limits, expiry, private bucket, owner/non-owner RLS, legacy broad-policy fence, payments, attendance, CRM stages, reminder send-once, Google Ads export and funnel view. Synthetic in-memory database only.');
  } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
