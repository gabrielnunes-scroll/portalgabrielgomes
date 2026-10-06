import {env} from './runtime';
import {store} from './firebase';
import {StaleSnapshot} from './database';
import {getChatGPTUser} from './auth';
import {clientSafe,Item} from '@/lib/model';
export class ApiError extends Error{constructor(public status:number,message:string){super(message)}}
export const db=()=>env.DB;
export async function all():Promise<Item[]>{const r=await db().prepare('SELECT * FROM records ORDER BY created DESC').all<any>();return r.results.map(r=>({...r,data:JSON.parse(r.data)}));}
export async function identity(_init=false){const user=await getChatGPTUser();if(!user)throw new ApiError(401,'Entre com sua conta e confirme seu e-mail para continuar.');const owner=process.env.FIREBASE_OWNER_UID;if(!owner)throw new ApiError(503,'O administrador ainda precisa configurar o Portal.');const migration=await store().collection('portal_config').doc('migration').get();if(migration.exists&&migration.data()!.status==='importing')throw new ApiError(503,'Transferência de dados em andamento. Aguarde a conclusão.');return {...user,admin:user.userId===owner};}
export async function context(init=false){const user=await identity(init),items=await all(),projects=new Set(items.filter(r=>r.kind==='member'&&r.data.email.toLowerCase()===user.email).map(r=>r.project!));if(!user.admin&&!projects.size)throw new ApiError(403,'Este e-mail ainda não tem acesso a um projeto. Confira o e-mail usado no login com Gabriel.');return {user,items,projects};}
export const allowed=(items:Item[],projects:Set<string>)=>clientSafe(items,projects);
export const statement=(r:Item)=>db().prepare('INSERT INTO records(id,kind,project,data,created) VALUES(?,?,?,?,?)').bind(r.id,r.kind,r.project,JSON.stringify(r.data),r.created);
export function record(kind:Item['kind'],project:string|null,data:Record<string,any>):Item{return {id:crypto.randomUUID(),kind,project,data,created:new Date().toISOString()};}
export const activity=(project:string|null,text:string,actor:string)=>record('activity',project,{text,actor});
export function respondError(e:unknown){if(e instanceof StaleSnapshot)return Response.json({error:e.message},{status:409});if(!(e instanceof ApiError))console.error('Portal operation failed:',e instanceof Error?e.name:'Error');return Response.json({error:e instanceof ApiError?e.message:'Não foi possível concluir a operação. Tente novamente.'},{status:e instanceof ApiError?e.status:500});}
export function mutationOrigin(req:Request){const origin=req.headers.get('origin');if(origin!==new URL(process.env.PORTAL_URL!).origin)throw new ApiError(403,'Origem não autorizada.');}
