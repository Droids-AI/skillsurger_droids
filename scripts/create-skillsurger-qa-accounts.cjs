const fs=require('node:fs');
const crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js');

(async()=>{
  const url=process.env.SKILLSURGER_STAGING_SUPABASE_URL;
  const key=process.env.SKILLSURGER_STAGING_SERVICE_ROLE_KEY;
  const expectedRef=process.env.SKILLSURGER_STAGING_PROJECT_REF;
  if(!url||!key||!expectedRef)throw new Error('Set SKILLSURGER_STAGING_SUPABASE_URL, SKILLSURGER_STAGING_SERVICE_ROLE_KEY and SKILLSURGER_STAGING_PROJECT_REF locally.');
  if(expectedRef==='jpnunlbnthcfvstyymdl'||new URL(url).hostname!==`${expectedRef}.supabase.co`)throw new Error('Refusing production or a mismatched staging project.');
  if(!process.argv.includes('--create'))throw new Error('Supply --create after verifying the staging project.');
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const accounts=[];
  for(const kind of ['fresh','existing']){
    const email=`skillsurger.qa.${kind}.${Date.now()}@example.invalid`;
    const password=crypto.randomBytes(24).toString('base64url')+'aA1!';
    const result=await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{qa_account:true}});
    if(result.error)throw new Error(`Could not create ${kind} staging account.`);
    const id=result.data.user.id;
    if(kind==='existing'){
      const profile=await client.from('profiles').upsert({id,full_name:'Synthetic QA Candidate',email,summary:'Synthetic software engineer profile for staging tests only.',years_of_experience:2,experience:[],projects:[],education:[]});
      if(profile.error)throw new Error('Could not provision synthetic existing profile.');
    }
    accounts.push({kind,id,email,password});
  }
  fs.mkdirSync('artifacts',{recursive:true});
  fs.writeFileSync('artifacts/staging-accounts.local',JSON.stringify({project:expectedRef,accounts},null,2),{mode:0o600});
  console.log('Created synthetic staging accounts. Credentials saved only in ignored artifacts/staging-accounts.local; no credentials printed.');
})().catch(()=>{console.error('QA account setup failed. Verify the explicit staging environment and service-role permissions. No credentials logged.');process.exitCode=1;});
