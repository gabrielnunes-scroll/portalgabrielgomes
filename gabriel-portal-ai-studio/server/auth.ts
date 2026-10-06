import {AsyncLocalStorage} from 'node:async_hooks';
import {auth} from './firebase';
export const requestContext=new AsyncLocalStorage<Request>();
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export async function authenticate(request:Request|undefined,verify:(token:string)=>Promise<any>):Promise<ChatGPTUser|null>{const header=request?.headers.get('authorization');if(!header?.startsWith('Bearer '))return null;try{const token=await verify(header.slice(7));if(!token.email_verified||!token.email)return null;return {userId:token.uid,email:token.email.trim().toLowerCase(),displayName:token.name||token.email,fullName:token.name||null};}catch{return null;}}

export async function getChatGPTUser(){return authenticate(requestContext.getStore(),token=>auth().verifyIdToken(token,true));}
