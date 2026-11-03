// Real-provider contract checks. Requires a signed-in synthetic QA account.
// Never sends email, changes subscriptions or invokes a payment endpoint.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.SKILLSURGER_EDGE_TEST_URL;
const token = process.env.SKILLSURGER_EDGE_TEST_TOKEN;
const anon = process.env.SKILLSURGER_EDGE_TEST_ANON;
if (!base || !token || !anon) throw new Error('Supply the Edge URL, QA session token and public API key.');
const headers = { Authorization: `Bearer ${token}`, apikey: anon, 'Content-Type': 'application/json', Origin: 'https://skillsurger.com' };
const cv = 'SYNTHETIC QA PROFILE. QA Python Candidate, candidate@example.invalid, Bengaluru, India. Backend Engineer with four years experience. Fictional Demo Labs, November 2022 to November 2026. Built Python FastAPI REST APIs with PostgreSQL transactions, pytest checks and Docker packaging. Skills: Python, FastAPI, PostgreSQL, SQL, pytest, Git, Docker. Project: fictional inventory API with pagination and authenticated routes. Education: BTech Computer Science, Fictional Demo College, 2022. No measured performance outcomes or certifications supplied.';
const profile = { fullName:'Synthetic QA Candidate', current_role:'Python Backend Engineer', currentRole:'Python Backend Engineer', years_of_experience:4, yearsOfExperience:4, skills:['Python','FastAPI','PostgreSQL','pytest','Docker'], education:[{degree:'BTech Computer Science',institution:'Fictional Demo College',year:'2022'}], summary:'Synthetic QA profile for contract verification.', projects:[], experience:[] };
const job = { title:'Python Backend Engineer', company:'Fictional QA Labs', location:'Bengaluru, India', requirements:['Python','FastAPI','PostgreSQL'], description:'Fictional test description: maintain Python FastAPI REST services and PostgreSQL transactions. This is not a real vacancy.' };
const history = [{role:'interviewer',content:'Explain how you would implement inventory updates.'},{role:'user',content:'For this fictional exercise, I would validate requests using Pydantic, use a transaction for related writes, consider row locks to avoid lost updates, and test rollback and concurrent updates using pytest. I would measure queries with EXPLAIN before changing indexes.'}];
const currentPath={jobTitle:job.title,careerPath:'Python backend',skillsToLearn:['Python','FastAPI'],resources:[],progress:0};
const evidence={checkedAt:new Date().toISOString(),base,scope:'Real deployed Edge Function, synthetic fixtures, no payment changes.',checks:[]};
const object=x=>assert.ok(x && typeof x==='object'&&!Array.isArray(x));
const string=x=>assert.equal(typeof x,'string');
const list=x=>assert.ok(Array.isArray(x));
function fields(x,names){object(x);for(const name of names)assert.ok(name in x,`Missing ${name}`);}
function resources(x){list(x);assert.ok(x.length,'No usable learning resources returned'); for(const r of x){fields(r,['title','url','description','type','provider','verified','price','difficulty','duration']); assert.equal(typeof r.verified,'boolean'); assert.match(r.url,/^https:\/\//);}}
async function call(body,path='/openai/skillsurger',extra={}) {
 const start=Date.now();
 const response=await fetch(base+path,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body),signal:AbortSignal.timeout(110000)});
 const text=await response.text(); let value;try{value=JSON.parse(text);}catch{value=text;}
 return {http:response.status,value,seconds:+((Date.now()-start)/1000).toFixed(2)};
}
async function check(name,body,verify,path){
 try{const result=await call(body,path);assert.equal(result.http,200);assert.equal(result.value.success,true,JSON.stringify(result.value));assert.equal(result.value.code,200);verify(result.value.data);const item={name,passed:true,...result};evidence.checks.push(item);console.log('PASS '+name+' '+result.seconds+'s');return result.value.data;}
 catch(error){evidence.checks.push({name,passed:false,error:error.message});console.log('FAIL '+name+' '+error.message);}
}
let cases=[
 ['generateCareerOptions',{contextData:{...profile,currentRole:profile.current_role,skills:profile.skills,interests:['Python backend'],experience:4,location:{city:'Bengaluru',country:'India'}}},x=>{list(x);assert.ok(x.length);for(const v of x)fields(v,['title','description','requiredSkills','potentialCompanies','growthPotential']);}],
 ['generateCVSuggestions',{targetJob:job,cvData:{personalInfo:{fullName:profile.fullName},professional:{currentRole:profile.current_role,yearsOfExperience:4},skills:profile.skills,experience:[],education:profile.education,projects:[]}},x=>fields(x,['summary','highlightedSkills','experienceImprovements','additionalSections'])],
 ['analyzeCVText',{text:cv},x=>{fields(x,['full_name','email','phone','city','state','country','current_role','years_of_experience','summary','experience','projects','skills','education','languages','certifications']);assert.equal(typeof x.years_of_experience,'number');}],
 ['scoreCVText',{text:cv,targetRole:job.title},x=>{fields(x,['overallScore','scores','strengths','weaknesses','recommendations','missingElements']);for(const v of [x.overallScore,...Object.values(x.scores)])assert.ok(Number.isInteger(v)&&v>=0&&v<=100);}],
 ['enhanceCVText',{text:cv,targetRole:job.title},x=>{fields(x,['enhancedCV','parsedData','changesSummary','keyImprovements']);assert.equal(x.enhancedCV,cv);assert.equal(x.canApplyToProfile,false);}],
 ['generateVerifiedLearningResources',{jobTitle:job.title,jobDescription:job.description,requirements:['Python','FastAPI']},x=>{fields(x,['resources']);resources(x.resources);}],
 ['generateVerifiedCareerPathLearningResources',{careerPath:'Python backend developer'},resources],
 ['generatePersonalizedLearningResources',{profile},resources],
 ['updateLearningPathFromFeedback',{currentPath,userFeedback:'Focus on beginner Python API testing with pytest.'},x=>{fields(x,['resources']);resources(x.resources);}],
 ['generateFresherCV',{profileData:{...profile,fullName:'Synthetic QA Graduate',years_of_experience:0,education:profile.education,projects:[],certifications:[]},additionalInterests:'Python backend'},x=>{fields(x,['summary','experience','projects','education','skills','languages','certifications']);assert.deepEqual(x.projects,[]);assert.deepEqual(x.certifications,[]);assert.deepEqual(x.experience,[]);}],
 ['generateFresherCV educationData',{type:'generateFresherCV',educationData:{degree:'BTech',institution:'Fictional Demo College',graduationYear:'2026',fieldOfStudy:'Computer Science'},careerInterests:['Python'],skills:['Python'],interests:['Backend']},x=>{fields(x,['summary','experience','projects','education','skills']);assert.deepEqual(x.projects,[]);assert.deepEqual(x.certifications,[]);assert.deepEqual(x.education,[{degree:'BTech',institution:'Fictional Demo College',year:'2026'}]);}],
 ['generateFresherLearningPlan',{fieldOfStudy:'Computer Science',careerInterests:['Python backend'],skills:['Python']},string],
 ['startAIMentorshipSession',{topic:'Synthetic QA Python backend preparation',userId:'not-trusted'},x=>{fields(x,['message','topic','userId']);string(x.message);assert.notEqual(x.userId,'not-trusted');}],
 ['sendMessageToAIMentor',{topic:'Synthetic QA Python backend preparation',message:'Fictional profile: four years Python, FastAPI, PostgreSQL and pytest. Give a concise one-week preparation plan.',conversationHistory:[]},x=>{fields(x,['message']);string(x.message);assert.ok(x.message.length);}],
 ['generateInterviewResponse',{jobRole:job.title+' at Fictional QA Labs',userMessage:history[1].content,conversationHistory:[history[0]]},x=>{fields(x,['message']);string(x.message);}],
 ['endInterview',{jobRole:job.title,conversationHistory:history},x=>{fields(x,['feedback','technicalScore','communicationScore','overallScore','detailedFeedback']);for(const v of [x.technicalScore,x.communicationScore,x.overallScore])assert.ok(Number.isInteger(v)&&v>=1&&v<=5);fields(x.detailedFeedback,['strengths','improvements','recommendations']);}],
 ['findJobsBasedOnProfile',{profileData:{jobTitle:job.title,location:{city:'Bengaluru',country:'India'},skills:profile.skills,experience:4,summary:profile.summary}},x=>fields(x,['suggestedJobTitles','searchKeywords','locationStrategy','skillHighlights','experienceLevel','industryFocus','searchTips'])],
 ['findHiringManager',{jobData:{jobTitle:job.title,company:job.company,jobDescription:'Fictional QA posting; supplied contact qa@example.invalid. Do not send mail.',location:job.location,requirements:job.requirements,profileData:profile}},x=>{fields(x,['emailFound','foundEmail','linkedInProfileUrl','emailVerification','emailDraft','company','jobTitle','location']);string(x.emailDraft);assert.equal(x.foundEmail,'qa@example.invalid');}],
 ['revealHiringManagerEmail',{linkedInProfileUrl:'https://www.linkedin.com/in/skillsurger-synthetic-qa-does-not-exist/'},x=>{fields(x,['emailFound','foundEmail','emailVerification']);assert.equal(typeof x.emailFound,'boolean');}],
];
if(process.env.SKILLSURGER_TEST_ACTIONS) { const selected = process.env.SKILLSURGER_TEST_ACTIONS.split(','); cases = cases.filter(([name]) => selected.includes(name)); }
(async()=>{
 try{
  let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<cases.length){const [name,data,verify]=cases[next++];await check(name,{type:name,...data},verify);}}));
  await check('candidateJobs',{query:'Python Backend Engineer',location:'Bengaluru, India',countryCode:'in',limit:20},x=>{list(x);assert.ok(x.length,'Provider returned no demo listings');for(const j of x)fields(j,['title','company_name','location','description']);},'/candidate/jobs');
  const task=await check('initiateLearningPathUpdate',{type:'initiateLearningPathUpdate',currentPath,userFeedback:'Focus on Python FastAPI and pytest tutorials.'},x=>{fields(x,['taskId','status','message']);assert.equal(x.status,'processing');});
  if(task){let status;for(let i=0;i<30;i++){let r;try{r=await call({type:'getLearningPathUpdateStatus',taskId:task.taskId});}catch(error){if(i===29)throw error;await new Promise(resolve=>setTimeout(resolve,2000));continue;}assert.equal(r.value.success,true);status=r.value.data;fields(status,['taskId','status','progress','startTime']);if(status.status!=='processing')break;await new Promise(r=>setTimeout(r,2000));}assert.equal(status.status,'completed');resources(status.resources);evidence.checks.push({name:'getLearningPathUpdateStatus',passed:true,status});console.log('PASS getLearningPathUpdateStatus persisted task');}
  for(const type of ['scoreCVText','enhanceCVText']){const r=await call({type,text:cv,targetRole:job.title},'/openai/skillsurger?stream=true',{'X-Use-Streaming':'true'});assert.equal(r.http,200);assert.match(r.value,/event: complete/);assert.doesNotMatch(r.value,/event: error/);const block=r.value.split(/\r?\n\r?\n/).find(v=>v.includes('event: complete'));const parsed=JSON.parse(block.split(/\r?\n/).find(v=>v.startsWith('data:')).slice(5));assert.equal(parsed.success,true);evidence.checks.push({name:type+' SSE',passed:true,seconds:r.seconds,response:r.value});console.log('PASS '+type+' SSE');}
  const noauth=await call({type:'scoreCVText',text:cv},'/openai/skillsurger',{Authorization:''});assert.equal(noauth.http,401);assert.equal(noauth.value.success,false);
  const anonOnly=await call({type:'scoreCVText',text:cv},'/openai/skillsurger',{Authorization:`Bearer ${anon}`});assert.equal(anonOnly.http,401);
  const cors=await call({type:'scoreCVText',text:cv},'/openai/skillsurger',{Origin:'https://untrusted.invalid'});assert.equal(cors.http,403);
  const invalid=await call({type:'not-a-real-action'});assert.equal(invalid.http,400);assert.equal(invalid.value.success,false);
  const missing=await call({type:'scoreCVText',text:''});assert.equal(missing.http,400);
  const payment=await call({},'/dodo/webhook');assert.equal(payment.http,404);
  const wrongTask=await call({type:'getLearningPathUpdateStatus',taskId:'task_nonexistent'});assert.equal(wrongTask.value.success,false);
  evidence.checks.push({name:'auth, CORS, validation, unknown task and payment-route isolation',passed:true});console.log('PASS auth, CORS, validation and payment isolation');
  const invalidMasterclass=await call({},'/masterclass/submit',{Authorization:''});assert.equal(invalidMasterclass.value.success,false);evidence.checks.push({name:'masterclass validation',passed:true});
  if(process.env.SKILLSURGER_TEST_MASTERCLASS==='1') await check('masterclass submission',{name:'SYNTHETIC QA — Supabase migration',email:'skillsurger-migration-qa@example.invalid',phoneNumber:'QA-NO-CONTACT',timestamp:new Date().toISOString()},x=>{fields(x,['message']);assert.equal(x.message,'Submitted successfully');},'/masterclass/submit');
 }catch(error){evidence.checks.push({name:'contract run',passed:false,error:error.message});console.log('FAIL contract run '+error.message);}
 finally{evidence.passed=evidence.checks.every(x=>x.passed);fs.mkdirSync('artifacts/supabase-api-migration',{recursive:true});fs.writeFileSync('artifacts/supabase-api-migration/contracts-live.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify({passed:evidence.passed,checks:evidence.checks.length}));process.exitCode=evidence.passed?0:1;}
})();
