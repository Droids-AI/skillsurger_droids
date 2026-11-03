import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import * as AI from '../_shared/skillsurger/ai.js';
import { learningResources, fresherLearningPlan } from '../_shared/skillsurger/resources.js';
import { findJobs } from '../_shared/skillsurger/jobs.ts';
import { startLearningTask, learningTaskStatus } from '../_shared/skillsurger/tasks.ts';
import { submitMasterclass } from '../_shared/skillsurger/masterclass.ts';
import { buildFresherCV } from '../_shared/skillsurger/fresherCV.ts';
import { formatFactualCV } from '../../../src/lib/factualCVFormatter.ts';

const origins = (Deno.env.get('SKILLSURGER_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com,http://127.0.0.1:5188,http://localhost:5188').split(',').map(value => value.trim());
const actionNames = ['generateCareerOptions','generateCVSuggestions','analyzeCVText','scoreCVText','enhanceCVText','generateVerifiedLearningResources','generateVerifiedCareerPathLearningResources','generatePersonalizedLearningResources','updateLearningPathFromFeedback','initiateLearningPathUpdate','getLearningPathUpdateStatus','generateFresherCV','generateFresherLearningPlan','startAIMentorshipSession','sendMessageToAIMentor','generateInterviewResponse','endInterview','findJobsBasedOnProfile','findHiringManager','revealHiringManagerEmail'];
type Body = Record<string, any>;
function validate(body: Body) {
  const text = (name: string, max = 100000) => { if (typeof body[name] !== 'string' || !body[name].trim() || body[name].length > max) throw new Error(`Provide a valid ${name}`); };
  const object = (name: string) => { if (!body[name] || typeof body[name] !== 'object' || Array.isArray(body[name])) throw new Error(`Provide a valid ${name}`); };
  const type = body.type;
  if (['analyzeCVText','scoreCVText','enhanceCVText'].includes(type)) text('text');
  if (type === 'generateCareerOptions') object('contextData');
  if (type === 'generateCVSuggestions') { object('targetJob'); object('cvData'); }
  if (['startAIMentorshipSession','sendMessageToAIMentor'].includes(type)) text('topic', 2000);
  if (type === 'sendMessageToAIMentor') text('message', 20000);
  if (['generateInterviewResponse','endInterview'].includes(type)) text('jobRole', 1000);
  if (type === 'generateInterviewResponse') text('userMessage', 20000);
  if (['generateInterviewResponse','sendMessageToAIMentor','endInterview'].includes(type) && body.conversationHistory !== undefined) {
    if (!Array.isArray(body.conversationHistory) || body.conversationHistory.length > 150 || body.conversationHistory.some((message: Body) => !['user','assistant','interviewer'].includes(message?.role) || typeof message?.content !== 'string' || message.content.length > 20000)) throw new Error('Provide a valid conversationHistory');
  }
  if (type === 'endInterview' && (!Array.isArray(body.conversationHistory) || !body.conversationHistory.some((message: Body) => message.role === 'user' && message.content.trim()))) throw new Error('Answer at least one interview question before requesting feedback');
  if (body.videoFrames !== undefined && (!Array.isArray(body.videoFrames) || body.videoFrames.length > 120 || body.videoFrames.some((frame: unknown) => typeof frame !== 'string' || frame.length > 750000 || !/^(data:image\/(jpeg|png);base64,)?[A-Za-z0-9+/=\r\n]+$/.test(frame)))) throw new Error('Provide valid interview video frames');
  if (type === 'generateFresherCV' && !body.profileData && !body.educationData) throw new Error('Provide profileData or educationData');
  if (type === 'generateVerifiedLearningResources') text('jobTitle', 1000);
  if (type === 'generateVerifiedCareerPathLearningResources') text('careerPath', 1000);
  if (type === 'generatePersonalizedLearningResources') object('profile');
  if (['updateLearningPathFromFeedback','initiateLearningPathUpdate'].includes(type)) { object('currentPath'); text('userFeedback', 10000); }
  if (type === 'getLearningPathUpdateStatus') text('taskId', 100);
  if (type === 'findJobsBasedOnProfile') object('profileData');
  if (type === 'findHiringManager') { object('jobData'); if (typeof body.jobData.jobDescription !== 'string' || !body.jobData.profileData) throw new Error('Provide a job description and candidate profile'); }
  if (type === 'revealHiringManagerEmail' && body.linkedInProfileUrl && !/^https:\/\/(?:[\w-]+\.)?linkedin\.com\/in\/[^/?#]+\/?(?:[?#].*)?$/i.test(body.linkedInProfileUrl)) throw new Error('Provide a LinkedIn profile URL');
}
async function dispatch(body: Body, admin: SupabaseClient, userId: string, progress?: (message: string, data?: unknown) => void): Promise<unknown> {
  switch (body.type) {
    case 'generateCareerOptions': return await AI.generateCareerOptions(body.contextData);
    case 'generateCVSuggestions': return await AI.generateCVSuggestions(body.targetJob, body.cvData);
    case 'analyzeCVText': return await AI.analyzeCVText(body.text);
    case 'scoreCVText': return await AI.scoreCVText(body.text, progress || null, body.targetRole);
    case 'enhanceCVText': progress?.('Formatting your supplied resume without changing facts...', {step:20}); return formatFactualCV(body.text);
    case 'generateVerifiedLearningResources': return { resources: await learningResources(body) };
    case 'generateVerifiedCareerPathLearningResources':
    case 'generatePersonalizedLearningResources': return await learningResources(body);
    case 'updateLearningPathFromFeedback': return { resources: await learningResources(body) };
    case 'initiateLearningPathUpdate': return await startLearningTask(admin, userId, body);
    case 'getLearningPathUpdateStatus': return await learningTaskStatus(admin, userId, body.taskId);
    case 'generateFresherLearningPlan': return await fresherLearningPlan(body);
    case 'generateFresherCV': return buildFresherCV(body.profileData || { ...body.educationData, skills: body.skills || [], education: [{ degree: body.educationData.degree, institution: body.educationData.institution, year: body.educationData.graduationYear }] }, body.additionalInterests || (body.careerInterests || []).join(', '));
    case 'startAIMentorshipSession': return await AI.startAIMentorshipSession(body.topic, userId);
    case 'sendMessageToAIMentor': return await AI.sendMessageToAIMentor(body.topic, body.message, body.conversationHistory || []);
    case 'generateInterviewResponse': return await AI.generateInterviewResponse(body.jobRole, body.userMessage, body.conversationHistory || []);
    case 'endInterview': return await AI.endInterview(body.jobRole, body.conversationHistory, body.videoFrames);
    case 'findJobsBasedOnProfile': return await AI.findJobsBasedOnProfile(body.profileData);
    case 'findHiringManager': return await AI.findHiringManager(body.jobData);
    case 'revealHiringManagerEmail': return await AI.revealHiringManagerEmail(body.linkedInProfileUrl);
    default: throw new Error('Unsupported Skillsurger action');
  }
}
function logFailure(error: unknown, requestId: string, operation: string) {
  const value = error as { code?: string; status?: number; request_id?: string };
  console.error(JSON.stringify({ area: 'skillsurger-api', code: value?.code || 'operation_failed', httpStatus: value?.status || null, providerRequestId: value?.request_id || null, requestId, operation }));
}
Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0], 'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type, x-use-streaming', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin', 'Cache-Control': 'no-store' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.includes(origin)) return json({ success:false,message:'Origin is not allowed' },403);
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers });
  if (request.method !== 'POST') return json({ success:false,message:'Method not allowed' },405);
  const path = new URL(request.url).pathname.split('/skillsurger-api')[1] || '/openai/skillsurger';
  if (!['','/','/openai/skillsurger','/candidate/jobs','/masterclass/submit'].includes(path)) return json({ success:false,message:'Route not found' },404);
  const requestId = crypto.randomUUID();
  let operation = path;
  try {
    if (Number(request.headers.get('content-length') || 0) > 6000000) return json({success:false,message:'Request too large'},413);
    // Bound the stream even when content-length is absent or incorrect.
    const reader = request.body?.getReader();
    if (!reader) return json({success:false,message:'A JSON body is required'},400);
    let raw = '', bytes = 0; const decoder = new TextDecoder();
    while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 6000000) { await reader.cancel(); return json({success:false,message:'Request too large'},413); } raw += decoder.decode(part.value,{stream:true}); }
    raw += decoder.decode();
    let body: Body;
    try { body = JSON.parse(raw); } catch { return json({ success:false,message:'Invalid JSON' },400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({success:false,message:'A JSON object is required'},400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
    if (path === '/masterclass/submit') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`)));
      const limit = await admin.rpc('skillsurger_api_rate_limit',{p_key:'masterclass:'+Array.from(hash,v=>v.toString(16).padStart(2,'0')).join(''),p_limit:10});
      if (limit.error || !limit.data) return json({success:false,message:'Please try again later'},429);
      return json({success:true,code:200,data:await submitMasterclass(body)});
    }
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i,'') || '';
    if (!bearer || bearer === Deno.env.get('SUPABASE_ANON_KEY')) return json({success:false,message:'Please sign in to use this feature'},401);
    const auth = await admin.auth.getUser(bearer);
    if (auth.error || !auth.data.user) return json({success:false,message:'Please sign in again'},401);
    const userId = auth.data.user.id;
    const subscription = await admin.from('subscriptions').select('subscription_status,subscription_tier,trial_end,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(1).maybeSingle();
    const plan = subscription.data;
    if (subscription.error) throw new Error('Could not verify access');
    if (!plan || plan.subscription_status !== 'active' || !plan.subscription_tier || plan.subscription_tier.toLowerCase() === 'free' || (plan.subscription_tier.toLowerCase().includes('trial') && Date.now() >= Date.parse(plan.trial_end || new Date(Date.parse(plan.created_at) + 7*86400000).toISOString()))) return json({success:false,message:'An active trial or plan is required'},403);
    operation = path === '/candidate/jobs' ? 'candidateJobs' : body.type;
    if (path !== '/candidate/jobs' && !actionNames.includes(body.type)) return json({success:false,message:'Unsupported Skillsurger action'},400);
    if (body.type !== 'getLearningPathUpdateStatus') {
      const limit = await admin.rpc('skillsurger_api_rate_limit',{p_key:`${path === '/candidate/jobs' ? 'jobs' : 'ai'}:${userId}`,p_limit:60});
      if (limit.error || !limit.data) return json({success:false,message:'Please wait before making more requests'},429);
    }
    if (path === '/candidate/jobs') return json({success:true,code:200,data:await findJobs(body,admin)});
    try { validate(body); } catch (error) { return json({success:false,message:(error as Error).message},400); }
    const stream = (new URL(request.url).searchParams.get('stream') === 'true' || request.headers.get('x-use-streaming') === 'true') && ['scoreCVText','enhanceCVText'].includes(body.type);
    if (stream) {
      const encoder = new TextEncoder(); let closed = false;
      const output = new ReadableStream({ start(controller) {
        const send = (event: string, data: unknown) => { if (!closed) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); };
        controller.enqueue(encoder.encode(': connected\n\n'));
        const timer = setInterval(()=>{if(!closed)controller.enqueue(encoder.encode(': keep-alive\n\n'));},15000);
        dispatch(body,admin,userId,(message,data)=>send('progress',{message,...(data as object || {})})).then(data=>send('complete',{success:true,data})).catch(error=>{logFailure(error,requestId,operation);send('error',{success:false,error:'The AI service could not complete this request. Please try again.'});}).finally(()=>{clearInterval(timer);if(!closed){closed=true;controller.close();}});
      }, cancel(){closed=true;} });
      return new Response(output,{headers:{...headers,'Content-Type':'text/event-stream','X-Accel-Buffering':'no'}});
    }
    return json({success:true,code:200,data:await dispatch(body,admin,userId)});
  } catch(error) {
    logFailure(error,requestId,operation);
    return json({success:false,message:'The service could not complete this request. Please try again.'});
  }
});
