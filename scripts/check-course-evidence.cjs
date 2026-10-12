const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const moduleData={exports:{}};
const output=ts.transpileModule(fs.readFileSync('supabase/functions/_shared/courseEvidence.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(output,{exports:moduleData.exports,module:moduleData,URL,Date,AbortSignal,TextDecoder,fetch},{filename:'courseEvidence.ts'});
const {verifyCourseEvidence,isCourseCandidate}=moduleData.exports;
const url='https://www.coursera.org/learn/java-programming';
function html(schema){return new Response('<html><script type="application/ld+json">'+JSON.stringify(schema)+'</script></html>',{headers:{'Content-Type':'text/html'}})}
(async()=>{
  for(const bad of ['https://java.com/','http://www.coursera.org/learn/java','https://www.udemy.com/course/draft/7361879/','https://www.coursera.org@127.0.0.1/learn/java','https://localhost/learn/java','https://www.coursera.org:8080/learn/java'])assert.equal(isCourseCandidate(bad),false);
  const real=await verifyCourseEvidence(url,async()=>html({'@type':'Course',name:'Provider Java Course',url,educationalLevel:'Beginner',description:'Java programming fundamentals',offers:{price:'0'}}));
  assert.equal(real.verified,true);assert.equal(real.title,'Provider Java Course');assert.equal(real.difficulty,'beginner');assert.equal(real.price,'unknown','Zero schema offer may not describe certification/payment terms');
  const product=await verifyCourseEvidence(url,async()=>html({'@type':'Product',name:'Java'}));assert.equal(product.verified,false);
  assert.equal((await verifyCourseEvidence(url,async()=>html({'@type':'Course',name:'Different course',url:'https://www.coursera.org/learn/unrelated'}))).verified,false);
  assert.equal((await verifyCourseEvidence(url,async()=>new Response('blocked',{status:403}))).verified,false);
  assert.equal((await verifyCourseEvidence(url,async()=>{throw new Error('offline')})).verified,false);
  assert.equal((await verifyCourseEvidence(url,async()=>new Response('',{status:302,headers:{location:'http://127.0.0.1/secret'}}))).verified,false);
  let called=false;await verifyCourseEvidence('https://java.com/',async()=>{called=true;return html({})});assert.equal(called,false);
  const frontend={exports:{}};
  const frontendOutput=ts.transpileModule(fs.readFileSync('src/lib/courseValidation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(frontendOutput,{exports:frontend.exports,module:frontend,URL,require:name=>name.includes('_shared')?moduleData.exports:{supabase:{functions:{invoke:async(name,{body})=>{
    assert.equal(name,'verify-courses');assert.equal(body.urls[0],url);
    return {data:{resources:[real]},error:null};
  }}}}});
  const checked=await frontend.exports.verifyCourseCandidates([{url,title:'AI guessed title',description:'AI guessed description',price:'free',rating:5,verified:true}]);
  assert.equal(checked[0].title,'Provider Java Course');assert.equal(checked[0].verified,true);assert.equal(checked[0].price,'unknown');assert.equal(checked[0].rating,undefined);
  let owner='11111111-1111-1111-1111-111111111111',calls=[];
  const mock={
    auth:{getUser:async()=>({data:{user:owner?{id:owner}:null},error:null})},
    storage:{from(bucket){
      assert.equal(bucket,'cvs');
      return {createSignedUrl:async(path,ttl)=>{
        calls.push({path,ttl});
        return {data:{signedUrl:'https://synthetic.invalid/signed'},error:null};
      }};
    }},
  };
  const compiled=ts.transpileModule(fs.readFileSync('src/lib/cvStorage.ts','utf8').replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://synthetic.supabase.co'"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const cv={exports:{}};vm.runInNewContext(compiled,{exports:cv.exports,module:cv,require:()=>({supabase:mock}),URL});
  const path=owner+'/synthetic.pdf';await cv.exports.getCVSignedUrl(path);assert.equal(calls[0].ttl,60);assert.equal(calls[0].path,path);
  await cv.exports.getCVSignedUrl('https://synthetic.supabase.co/storage/v1/object/public/cvs/'+path);assert.equal(calls[1].path,path);
  await assert.rejects(cv.exports.getCVSignedUrl('22222222-2222-2222-2222-222222222222/other.pdf'),/do not have access/);
  await assert.rejects(cv.exports.getCVSignedUrl('https://attacker.invalid/storage/v1/object/public/cvs/'+path),/Invalid CV/);
  owner=null;await assert.rejects(cv.exports.getCVSignedUrl(path),/do not have access/);assert.equal(calls.length,2);
  console.log('PASS: provider Course evidence, product/mismatched course/blocked/offline unknown states, restricted URLs/redirects, fresh 60-second owner signing, legacy reference conversion and unauthorized signing denial. Mock evidence only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
