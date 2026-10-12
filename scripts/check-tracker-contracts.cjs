const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

function load(file) {
  const module = {exports:{}};
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const requireModule=name=>name==='./supabase'?{supabase:{functions:{invoke:async()=>({error:true})}}}:name.includes('_shared/courseEvidence')?load('supabase/functions/_shared/courseEvidence.ts'):require(name);
  vm.runInNewContext(output,{exports:module.exports,module,require:requireModule,URL,console,Date,AbortSignal,TextDecoder,fetch},{filename:file});
  return module.exports;
}
const {assertFactPreservingCV}=load('src/lib/cvFactuality.ts');
const {formatFactualCV}=load('src/lib/factualCVFormatter.ts');
const backend=require('../backend-patches/skillsurger-factual-cv.cjs');
const source='Synthetic Candidate\n\nExperience\nDeveloped Python REST APIs with Java, SQL and Docker.\nEducation\nComputer Science';
const formatted=formatFactualCV(source);
assert.equal(formatted.enhancedCV,source);
assert.equal(formatted.canApplyToProfile,false);
assert.equal(JSON.stringify(formatted),JSON.stringify(backend.formatFactualCV(source)));
assert.doesNotThrow(()=>assertFactPreservingCV(source,formatted));
for(const added of ['Improved performance by 75%.','Built an AuditMesh project.','Used Kubernetes.','Led a team of 12.']) {
  assert.throws(()=>assertFactPreservingCV(source,{enhancedCV:source+'\n'+added,parsedData:{}}),/changed facts/);
}
assert.throws(()=>assertFactPreservingCV(source,{enhancedCV:source,parsedData:{skills:['Kubernetes']}}),/could not be verified/);
assert.throws(()=>assertFactPreservingCV(source,{enhancedCV:source,parsedData:{years_of_experience:10}}),/unverified number/);
assert.ok(formatted.changesSummary.some(s=>s.includes('verified outcomes or metrics')));
const {normalizeCourseMetadata}=load('src/lib/courseValidation.ts');
const java=normalizeCourseMetadata({url:'https://java.com/',type:'Course',verified:true,price:'free',difficulty:'beginner',rating:5});
assert.equal(java.type,'Resource');assert.equal(java.verified,false);assert.equal(java.price,'unknown');assert.equal(java.rating,undefined);
const course=normalizeCourseMetadata({url:'https://www.coursera.org/learn/java-programming',type:'Course',verified:true,price:'free'});
assert.equal(course.type,'Course (unverified)');assert.equal(course.price,'unknown');
const netlify=fs.readFileSync('netlify.toml','utf8');
assert.ok(netlify.indexOf('from = "/book-diagnosis"') < netlify.indexOf('from = "/*"'));
assert.match(netlify,/from = "\/book-diagnosis"\s+to = "\/book-a-call"\s+status = 301/);
const curriculum=JSON.parse(fs.readFileSync('src/data/fdeCurriculum.json','utf8'));
assert.equal(curriculum.sections.length,18);
const items=curriculum.sections.flatMap(s=>s.items);
assert.equal(items.length,156);assert.deepEqual(items.map(i=>i.number),Array.from({length:156},(_,i)=>i+1));
for(const title of ['Capstone 1: OmniGuard - Secure AI Integration','OmniGuard Build: RBAC, Hybrid RAG, Secure SQL and Guardrails','Capstone 2: AuditMesh - Multi-Agent Compliance System','AuditMesh Build: LangGraph Supervisor, MCP, Human Approval and Cost Tracing']) assert.ok(items.some(i=>i.title===title));
// Golden digest derived independently from the original workbook rows.
assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(items.map(i=>[i.number,i.title,i.type]))).digest('hex'),'3c1b71f891b25ea6e447a98f2c3cb3f722d7f0dd85178b32fb54f87dfce0fddc');
console.log('PASS: invented facts rejected, deterministic frontend/backend formatting parity, missing metrics requested, product page not mislabeled, unknown metadata preserved, 18 sections/156 curriculum items and exact workbook parity.');
