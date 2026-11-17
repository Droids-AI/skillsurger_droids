// User-owned execution and operator-only queue/reconciliation. Feature off by default.
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as anchor from '../_shared/anchor.ts';
import { publicApplicationUrl } from '../_shared/automation/contracts.ts';
import { work, type Run, type WorkerDeps } from '../_shared/automation/worker.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const enabled = () => Deno.env.get('FF_SKILLSURGER_AUTOMATION') === 'true';
const origins = (Deno.env.get('SKILLSURGER_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com').split(',').map(v=>v.trim());
const RUN_COLUMNS = 'id,action_id,user_id,site,state,reserved_credits,cost_credits,reason,result,created_at,updated_at';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODES = ['application_not_found','manual_application','approval_required','cv_or_job_changed','board_changed','destination_not_allowed',
  'verified_connection_required','consent_required','budget_required','weekly_budget_exhausted','job_already_dispatched'];
class RequestError extends Error { constructor(public status:number, public code:string) { super(code); } }
function check<T>(result:{data:T;error:any}):T {
  if (result.error) throw new RequestError(409,CODES.find(c=>String(result.error.message).includes(c)) || 'request_failed');
  return result.data;
}
async function activePlan(userId:string) {
  const p:any = check(await admin.from('subscriptions').select('subscription_status,subscription_tier,trial_end,created_at')
    .eq('user_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle());
  const tier = String(p?.subscription_tier || '').toLowerCase();
  const expires = Date.parse(p?.trial_end || new Date(Date.parse(p?.created_at || '')+7*86400000).toString());
  if (!p || p.subscription_status !== 'active' || !tier || tier==='free' || (tier.includes('trial') && (!Number.isFinite(expires) || Date.now() >= expires)))
    throw new RequestError(403,'active_plan_required');
}
async function ownAction(userId:string, actionId:unknown) {
  if (typeof actionId !== 'string' || !UUID.test(actionId)) throw new RequestError(400,'application_not_found');
  const a:any = check(await admin.from('agent_action_ledger').select('*').eq('id',actionId).eq('user_id',userId)
    .eq('product','skillsurger').eq('action_type','apply_job').maybeSingle());
  if (!a) throw new RequestError(404,'application_not_found');
  return a;
}
function workerDeps():WorkerDeps {
  return {
    enabled:enabled(),provider:anchor,submitAuthorizationUrl:`${url}/functions/v1/skillsurger-automation/authorize-submit`,
    async lease(runId,worker) {
      const rows = check(await admin.rpc('skillsurger_lease_application',{p_run_id:runId,p_worker:worker})) as Run[];
      return rows?.[0] || null;
    },
    async begin(run,worker,tokenHash) {
      await activePlan(run.user_id);
      return !!check(await admin.rpc('skillsurger_begin_application',{p_run_id:run.id,p_worker:worker,p_gen:run.lock_gen,p_submit_token_hash:tokenHash}));
    },
    async context(run) {
      const a = await ownAction(run.user_id,run.action_id);
      if (!publicApplicationUrl(a.payload.application_url) || new URL(a.payload.application_url).hostname !== run.site) throw new Error('invalid_destination');
      const identity:any = check(await admin.from('agent_external_identity').select('anchor_identity_id')
        .eq('user_id',run.user_id).eq('product','skillsurger').eq('site',run.site).eq('status','active').maybeSingle());
      const board:any = check(await admin.from('skillsurger_automation_boards').select('requires_login').eq('site',run.site).maybeSingle());
      if (run.state==='queued' && board?.requires_login!==false && !identity) throw new Error('verified_connection_required');
      return {payload:a.payload,payload_hash:a.payload_hash,identity_id:identity?.anchor_identity_id || ''};
    },
    async update(run,worker,state,anchorRunId,reason,result) {
      return !!check(await admin.rpc('skillsurger_update_application_run',{
        p_run_id:run.id,p_worker:worker,p_gen:run.lock_gen,p_state:state,p_anchor_run_id:anchorRunId,p_reason:reason,p_result:result,
      }));
    },
  };
}
async function processRun(runId:string) { return await work(runId,crypto.randomUUID(),workerDeps()); }
async function view(userId:string,actionId:string) {
  return check(await admin.from('skillsurger_application_runs').select(RUN_COLUMNS).eq('action_id',actionId).eq('user_id',userId).maybeSingle());
}

export async function handle(request:Request) {
  const origin = request.headers.get('origin') || '';
  const headers = {'Content-Type':'application/json','Cache-Control':'no-store',Vary:'Origin',
    'Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],
    'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const json = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if (origin && !origins.includes(origin)) return json({error:'origin_not_allowed'},403);
  if (request.method==='OPTIONS') return new Response(null,{status:204,headers});
  if (request.method!=='POST') return json({error:'method_not_allowed'},405);
  const route = new URL(request.url).pathname.replace(/^.*\/skillsurger-automation/,'');
  try {
    const raw = await request.text();
    if (raw.length>16000) return json({error:'request_too_large'},413);
    let body:any;
    try { body=JSON.parse(raw); if (!body || typeof body!=='object' || Array.isArray(body)) throw new Error(); }
    catch { return json({error:'invalid_json'},400); }
    if (route==='/authorize-submit') {
      if (!enabled() || typeof body.run_id!=='string' || !UUID.test(body.run_id) ||
        typeof body.token!=='string' || !/^[a-f0-9]{64}$/.test(body.token)) return json({authorized:false},403);
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.token))),b=>b.toString(16).padStart(2,'0')).join('');
      const allowed=check(await admin.rpc('skillsurger_authorize_submit',{p_run_id:body.run_id,p_token_hash:digest}));
      return json({authorized:!!allowed},allowed?200:403);
    }
    const auth = request.headers.get('authorization') || '';
    const operator = auth === `Bearer ${serviceKey}`;
    if (['/tick','/verify-connection','/record-cost','/resolve','/provision-code-task'].includes(route)) {
      if (!operator) return json({error:'not_authorized'},403);
      if (route==='/provision-code-task') {
        // Uploads a reviewed deterministic task and returns its pinned id for skillsurger_automation_boards.task_id.
        if (typeof body.name!=='string' || !/^[a-zA-Z0-9_-]{3,100}$/.test(body.name) || typeof body.codeBase64!=='string' ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(body.codeBase64) || body.codeBase64.length>400000 || !Array.isArray(body.domainAllowlist) ||
          !body.domainAllowlist.every((d:unknown)=>typeof d==='string' && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)))
          throw new RequestError(400,'invalid_task');
        return json({task_id:await anchor.provisionCodeTask(body.name,body.codeBase64,String(body.description||'').slice(0,1000),body.domainAllowlist)});
      }
      if (route==='/tick') {
        const rows:any[] = check(await admin.from('skillsurger_application_runs').select('id')
          .in('state',['queued','launching','running','reconciling']).lte('next_check_at',new Date().toISOString())
          .order('next_check_at').limit(5)) || [];
        const outcomes=[];
        for (const r of rows) {
          try { outcomes.push({id:r.id,state:await processRun(r.id)}); }
          catch { outcomes.push({id:r.id,state:'check_failed'}); }
        }
        return json({outcomes});
      }
      if (route==='/record-cost') {
        if (!UUID.test(body.runId) || typeof body.costCredits!=='number' || !Number.isFinite(body.costCredits) || body.costCredits<0 ||
          typeof body.usageReference!=='string' || body.usageReference.trim().length<10) throw new RequestError(400,'measured_usage_required');
        return json({recorded:check(await admin.rpc('skillsurger_record_application_cost',{p_run_id:body.runId,p_cost:body.costCredits,p_usage_reference:body.usageReference}))});
      }
      if (route==='/resolve') {
        if (!UUID.test(body.runId) || !['submitted','not_submitted'].includes(body.outcome) ||
          typeof body.evidenceReference!=='string' || body.evidenceReference.trim().length<10 ||
          typeof body.operator!=='string' || body.operator.trim().length<3) throw new RequestError(400,'independent_outcome_evidence_required');
        return json({resolved:check(await admin.rpc('skillsurger_resolve_application',{
          p_run_id:body.runId,p_outcome:body.outcome,p_evidence_ref:body.evidenceReference,p_operator:body.operator,
        }))});
      }
      if (![body.connectionId,body.userId].every(v=>typeof v==='string' && UUID.test(v)) ||
        typeof body.operator!=='string' || body.operator.trim().length<3 ||
        typeof body.authenticatedConfirmationReference!=='string' || body.authenticatedConfirmationReference.trim().length<10)
        throw new RequestError(400,'authenticated_ownership_evidence_required');
      const connection:any = check(await admin.from('agent_external_identity').select('*').eq('id',body.connectionId)
        .eq('user_id',body.userId).eq('product','skillsurger').eq('status','pending_verification').maybeSingle());
      if (!connection) throw new RequestError(404,'connection_not_found');
      const board:any = check(await admin.from('skillsurger_automation_boards').select('application_id').eq('site',connection.site).eq('enabled',true).maybeSingle());
      if (!board || anchor.configuredSites()[connection.site]!==board.application_id) throw new RequestError(409,'board_not_configured');
      const identity=await anchor.getIdentity(connection.anchor_identity_id);
      if (identity.status!=='validated' || !await anchor.applicationHasIdentity(board.application_id,identity.id)) throw new RequestError(409,'identity_not_validated');
      // The reference is the operator's independent authenticated confirmation with the user.
      // Same-app membership and validated status above are necessary, never sufficient, evidence.
      return json({verified:check(await admin.rpc('skillsurger_verify_connection',{
        p_connection_id:connection.id,p_user_id:body.userId,p_site:connection.site,p_operator:body.operator,
        p_evidence_ref:body.authenticatedConfirmationReference,
      }))});
    }
    const token=auth.replace(/^Bearer\s+/i,'');
    if (!token || token===Deno.env.get('SUPABASE_ANON_KEY') || operator) throw new RequestError(401,'sign_in_required');
    const user=await admin.auth.getUser(token);
    if (user.error || !user.data.user) throw new RequestError(401,'sign_in_required');
    const uid=user.data.user.id;
    if (route==='/consent') {
      if (typeof body.enabled!=='boolean' || body.policyVersion!=='2026-11-17') throw new RequestError(400,'invalid_consent');
      check(await admin.from('skillsurger_automation_consent').upsert({user_id:uid,policy_version:body.policyVersion,
        granted_at:new Date().toISOString(),revoked_at:body.enabled?null:new Date().toISOString()}));
      return json({consent:body.enabled});
    }
    const a=await ownAction(uid,body.actionId);
    if (route==='/context') {
      const consent:any=check(await admin.from('skillsurger_automation_consent').select('revoked_at,policy_version').eq('user_id',uid).maybeSingle());
      const policy:any=check(await admin.from('skillsurger_automation_policy').select('enabled,weekly_credits,max_run_credits').eq('user_id',uid).maybeSingle());
      const identity:any=check(await admin.from('agent_external_identity').select('status,ownership_verified_at').eq('user_id',uid)
        .eq('product','skillsurger').eq('site',a.payload.automation?.site || '').maybeSingle());
      return json({run:await view(uid,a.id),enabled:enabled(),consent:!!consent && !consent.revoked_at && consent.policy_version==='2026-11-17',
        connection_verified:(identity?.status==='active' && !!identity?.ownership_verified_at) ||
          (check(await admin.from('skillsurger_automation_boards').select('requires_login').eq('site',a.payload.automation?.site || '').maybeSingle()) as any)?.requires_login===false,
        budget_enabled:!!policy?.enabled && Number(policy.max_run_credits)>=Number(a.payload.automation?.max_run_credits || 0),
        weekly_budget_credits:policy?.weekly_credits ?? 0});
    }
    if (route==='/run') {
      if (!enabled()) throw new RequestError(404,'automation_paused');
      await activePlan(uid);
      const runId=check(await admin.rpc('skillsurger_enqueue_application',{p_action_id:a.id,p_user_id:uid})) as string;
      await processRun(runId);
      return json({run:await view(uid,a.id)});
    }
    if (route==='/refresh') {
      const run:any=check(await admin.from('skillsurger_application_runs').select('id').eq('action_id',a.id).eq('user_id',uid).maybeSingle());
      if (run) await processRun(run.id);
      return json({run:await view(uid,a.id)});
    }
    return json({error:'not_found'},404);
  } catch(error) {
    if (error instanceof RequestError) return json({error:error.code},error.status);
    console.error(JSON.stringify({area:'skillsurger-automation',route,code:error instanceof anchor.AnchorError?error.code:'request_failed'}));
    return json({error:'request_failed'},503);
  }
}
if (import.meta.main) Deno.serve(handle);
