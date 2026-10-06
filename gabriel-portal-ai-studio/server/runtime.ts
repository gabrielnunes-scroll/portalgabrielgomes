import {database} from './database';
import {storage} from './firebase';
export const env={DB:database,BUCKET:{async put(key:string,bytes:ArrayBuffer,_options?:unknown){await storage().file(key).save(Buffer.from(bytes),{resumable:false,contentType:'application/octet-stream'});},async get(key:string){const file=storage().file(key);const [exists]=await file.exists();if(!exists)return null;const [bytes]=await file.download();return {body:new Uint8Array(bytes)};},async delete(key:string){await storage().file(key).delete({ignoreNotFound:true});}}};
