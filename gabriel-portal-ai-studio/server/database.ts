import {randomUUID} from 'node:crypto';
import {store} from './firebase';
import {requestContext} from './auth';
const snapshots=new WeakMap<Request,Map<string,Row>>();
export class StaleSnapshot extends Error{status=409;}

import {changedProject,recipients,jobID,Row} from './events';
const collection=()=>store().collection('portal_records');
// Compatibility bridge for the application's finite, audited query vocabulary.
// Unknown SQL fails closed; Firestore remains the durable database.
export class Prepared{
 constructor(public sql:string,public args:any[]=[],public getStore=store){ }
 bind(...args:any[]){return new Prepared(this.sql,args,this.getStore);}
 async all<T=Record<string,any>>():Promise<{results:T[]}>{const s=this.sql;if(s==='SELECT * FROM records ORDER BY created DESC'||s==='SELECT * FROM records'){const snapshot=await this.getStore().collection('portal_records').get();const rows=snapshot.docs.map(d=>d.data()).sort((a,b)=>b.created.localeCompare(a.created));const request=requestContext.getStore();if(request)snapshots.set(request,new Map(rows.map(r=>[r.id,r as Row])));return {results:rows as T[]};}if(s==='SELECT * FROM workspace')return {results:[{id:'main',owner:process.env.FIREBASE_OWNER_UID}] as T[]};if(s==='SELECT * FROM identity_aliases'){const snap=await this.getStore().collection('portal_identity_aliases').get();return {results:snap.docs.map(d=>d.data()) as T[]};}throw Error('Unsupported query');}
 async first<T>():Promise<T|null>{if(this.sql==='SELECT owner FROM workspace WHERE id=?')return {owner:process.env.FIREBASE_OWNER_UID} as T;throw Error('Unsupported query');}
 async run(){return (await createDatabase(this.getStore).batch([this]))[0];}
}
export function createDatabase(getStore=store){const collection=()=>getStore().collection('portal_records');return {prepare:(sql:string)=>new Prepared(sql,[],getStore),async batch(statements:Prepared[]){const event=randomUUID(),now=new Date().toISOString();return getStore().runTransaction(async tx=>{
 // Read before writes, also watching membership for transactional recipient selection.
 const snap=await tx.get(collection());const before=new Map<string,Row>(snap.docs.map(d=>[d.id,d.data() as Row])),after=new Map(before),results=[];const request=requestContext.getStore(),expected=request&&snapshots.get(request);if(expected&&(expected.size!==before.size||[...expected].some(([id,r])=>JSON.stringify(r)!==JSON.stringify(before.get(id)))))throw new StaleSnapshot('Os dados mudaram em outra sessão. Atualize e tente novamente.');
 for(const q of statements){const [a,b,c,d,e]=q.args;let changes=0;
 if(q.sql==='INSERT INTO records(id,kind,project,data,created) VALUES(?,?,?,?,?)'){if(after.has(a))throw Error('Duplicate record');after.set(a,{id:a,kind:b,project:c,data:d,created:e});changes=1;}
 else if(q.sql.startsWith("INSERT INTO records(id,kind,project,data,created) SELECT ?,?,?,?,? WHERE ? <= ")){const amount=q.args[5],receipt=after.get(q.args[6]);const refunded=[...after.values()].filter(r=>r.kind==='refund'&&JSON.parse(r.data).receipt===q.args[7]).reduce((sum,r)=>sum+JSON.parse(r.data).amount,0);if(receipt?.kind==='receipt'&&amount<=JSON.parse(receipt.data).amount-refunded){if(after.has(a))throw Error('Duplicate record');after.set(a,{id:a,kind:b,project:c,data:d,created:e});changes=1;}}
 else if(q.sql==='INSERT INTO records(id,kind,project,data,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=?)'){if(after.has(q.args[5])){if(after.has(a))throw Error('Duplicate record');after.set(a,{id:a,kind:b,project:c,data:d,created:e});changes=1;}}
 else if(q.sql==='UPDATE records SET data=? WHERE id=? AND EXISTS(SELECT 1 FROM records WHERE id=?)'){const old=after.get(b);if(old&&after.has(c)){after.set(b,{...old,data:a});changes=1;}}
 else if(q.sql==='UPDATE records SET data=? WHERE id=?'){const old=after.get(b);if(old){after.set(b,{...old,data:a});changes=1;}}
 else if(q.sql==="UPDATE records SET data=json_set(data,'$.firstAccessAt',?) WHERE id=? AND json_extract(data,'$.firstAccessAt') IS NULL"){const old=after.get(b);if(old){const data=JSON.parse(old.data);if(!data.firstAccessAt){data.firstAccessAt=a;after.set(b,{...old,data:JSON.stringify(data)});changes=1;}}}
 else if(q.sql==='DELETE FROM records WHERE id=?'){changes=after.delete(a)?1:0;}
 else if(q.sql==='DELETE FROM records WHERE project=? OR id=?'){for(const [id,r] of after)if(r.project===a||id===b){after.delete(id);changes++;}}
 else throw Error('Unsupported mutation');results.push({meta:{changes}});
 }
 const projects=new Set<string>();for(const [id,r] of after){const project=changedProject(before.get(id),r);if(project)projects.add(project);}
 const jobs=[];if(process.env.NOTIFICATIONS_ENABLED==='true')for(const project of projects){const p=after.get(project);if(!p||JSON.parse(p.data).archived)continue;for(const recipient of recipients([...after.values()],project)){const id=jobID(event,project+'\0'+recipient.email);jobs.push({id,project,recipient:recipient.email,member:recipient.member,event,link:process.env.PORTAL_URL!,status:'pending',attempts:0,created:now,nextAttemptAt:Date.now()});}}
 const mutations=[...after].filter(([id,r])=>before.get(id)!==r),deleted=[...before.keys()].filter(id=>!after.has(id));if(mutations.length+deleted.length+jobs.length>450)throw Error('Operation exceeds transaction limit; split project or contact support');
 for(const [id,r] of mutations){const ref=collection().doc(id);if(before.has(id))tx.set(ref,r);else tx.create(ref,r);}for(const id of deleted)tx.delete(collection().doc(id));for(const job of jobs)tx.create(getStore().collection('portal_mail_jobs').doc(job.id),job);return results;
 }).then(result=>{const request=requestContext.getStore();if(request)snapshots.delete(request);return result;});}};}
export const database=createDatabase();
