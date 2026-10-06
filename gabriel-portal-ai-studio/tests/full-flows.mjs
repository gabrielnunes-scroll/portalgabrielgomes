import {readFileSync} from 'node:fs';
import {FakeStore} from './fake-store.ts';
import {createDatabase} from '../server/database.ts';
const fake=new FakeStore();
const portableDB=createDatabase(()=>fake);
process.env.FIREBASE_OWNER_UID='owner@example.com';
process.env.NOTIFICATIONS_ENABLED='false';
globalThis.portableFixture={fake,portableDB};
let source=readFileSync('tests/shared-flows.mjs','utf8');
source=source.replaceAll("'drizzle/","'shared/drizzle/").replaceAll("'lib/","'shared/lib/").replaceAll("'app/","'shared/app/");
source=source.replace("const all=()=>database.prepare('SELECT * FROM records').all().map(r=>({...r,data:JSON.parse(r.data)}));", "const {fake,portableDB}=globalThis.portableFixture;const all=()=>[...(fake.tables.get('portal_records')?.values()||[])].map(r=>({...r,data:JSON.parse(r.data)}));");
const old="const server=compile('shared/lib/server.ts',{'cloudflare:workers':{env:{DB:databaseBinding,BUCKET:bucket}},'@/app/chatgpt-auth':{async getChatGPTUser(){return user?{...user,userId:user.email,displayName:user.displayName}:null}},'./model':model});";
const replacement="for(const a of database.prepare('SELECT * FROM identity_aliases').all())await fake.collection('portal_identity_aliases').doc(a.email).set(a);const server=compile('server/domain.ts',{'./runtime':{env:{DB:portableDB,BUCKET:bucket}},'./firebase':{store:()=>fake},'./database':{StaleSnapshot:class extends Error{}},'./auth':{async getChatGPTUser(){return user?{...user,userId:user.email,displayName:user.displayName}:null}},'@/lib/model':model});";
if(!source.includes(old))throw Error('Shared test harness changed');source=source.replace(old,replacement);
source=source.replaceAll("headers:{'Content-Type':'application/json'}", "headers:{'Content-Type':'application/json',Origin:'https://site.test'}");
source=source.replaceAll("method:'POST',body:","method:'POST',headers:{Origin:'https://site.test'},body:");
process.env.PORTAL_URL='https://site.test';
// SQLite is used only for legacy identity fixture. Portable routes persist via Firestore bridge.
source=source.replace("const auth=compile('shared/app/chatgpt-auth.ts'", "const auth=compile('tests/sites-auth.fixture.ts'");
const {writeFileSync,mkdtempSync,rmSync}=await import('node:fs');
// Store the generated test beside this harness so module resolution uses its locked dependencies.
const path=new URL('./.generated-flow.mjs',import.meta.url);writeFileSync(path,source);
try{await import(path.href+'?run='+Date.now());}finally{rmSync(path);}
